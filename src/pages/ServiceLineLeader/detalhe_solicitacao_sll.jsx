import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBadge,
  BiBriefcase,
  BiCalendar,
  BiChevronDown,
  BiChevronUp,
  BiDownload,
  BiEnvelope,
  BiFile,
  BiLinkExternal,
  BiMedal,
  BiUserCircle,
} from "react-icons/bi";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api.js";

import Header from "../../components/header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";

/* =========================================================
   UTILIZADOR AUTENTICADO
========================================================= */

function obterUtilizadorGuardado() {
  const guardado =
    localStorage.getItem("user");

  if (!guardado) {
    return null;
  }

  try {
    return JSON.parse(guardado);
  } catch (err) {
    console.error(
      "Erro ao ler utilizador guardado:",
      err
    );

    return null;
  }
}

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function formatarData(data) {
  if (!data) {
    return "Data não disponível";
  }

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return "Data não disponível";
  }

  return date.toLocaleDateString(
    "pt-PT",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function normalizarLinks(links) {
  if (!Array.isArray(links)) {
    return [];
  }

  return links
    .map((link) => {
      if (typeof link === "string") {
        return {
          id_link: null,
          url: link,
        };
      }

      return {
        id_link:
          link?.id_link ||
          link?.id ||
          null,

        url:
          link?.url ||
          link?.link ||
          "",
      };
    })
    .filter((link) => link.url);
}

function normalizarDocumentos(documentos) {
  if (!Array.isArray(documentos)) {
    return [];
  }

  return documentos
    .map((documento, index) => ({
      id:
        documento.id_documento ||
        documento.id_evidencia ||
        documento.id ||
        index,

      nome:
        documento.nome_ficheiro ||
        documento.nome ||
        documento.filename ||
        documento.nome_original ||
        "Documento",

      url:
        documento.url ||
        documento.caminho ||
        documento.path ||
        documento.ficheiro_url ||
        "",

      tamanho:
        documento.tamanho ||
        documento.size ||
        null,

      formato:
        documento.formato ||
        documento.tipo ||
        documento.mimetype ||
        "",
    }));
}

function normalizarRequisito(
  requisito,
  index
) {
  const evidencia =
    requisito.evidencia ||
    requisito.evidencia_apresentada ||
    null;

  return {
    id:
      requisito.id_requisitos ||
      requisito.id_requisito ||
      requisito.id ||
      index + 1,

    codigo:
      requisito.nome_requisito ||
      requisito.codigo ||
      `R${index + 1}`,

    titulo:
      requisito.titulo ||
      requisito.nome_requisito ||
      "Requisito",

    descricao:
      requisito.descricao_requisito ||
      requisito.descricao ||
      "Sem descrição.",

    estado:
      requisito.estado_evidencia ||
      requisito.estado ||
      "AGUARDAR_TM",

    descricao_evidencia:
      evidencia?.descricao ||
      requisito.descricao_evidencia ||
      requisito.evidencia_descricao ||
      "",

    links: normalizarLinks(
      requisito.links
    ),

    documentos: normalizarDocumentos(
      evidencia?.documentos ||
      requisito.documentos ||
      requisito.ficheiros ||
      []
    ),
  };
}

function normalizarResposta(dados) {
  const candidatura =
    dados.candidatura ||
    dados.pedido ||
    {};

  const consultor =
    dados.consultor ||
    dados.utilizador ||
    {};

  const badge =
    dados.badge ||
    {};

  const requisitosRaw =
    dados.requisitos ||
    badge.requisitos ||
    [];

  return {
    candidatura: {
      id:
        candidatura.id_candidatura_pedido ||
        candidatura.id ||
        "",

      data_submissao:
        candidatura.data_submissao ||
        candidatura.data_submisao ||
        null,

      estado:
        candidatura.estado_candidatura_pedido ||
        candidatura.estado ||
        "PENDENTE",
    },

    consultor: {
      id_utilizador:
        consultor.id_utilizador ||
        candidatura.id_utilizador ||
        "",

      nome_completo:
        consultor.nome_completo ||
        consultor.nome ||
        "Consultor",

      email:
        consultor.email_softinsa ||
        consultor.email ||
        "Sem email",

      nome_area:
        consultor.nome_area ||
        consultor.area ||
        "Sem área associada",

      data_entrada_empresa:
        consultor.data_entrada_empresa ||
        consultor.data_contratacao ||
        null,

      total_badges: Number(
        consultor.total_badges || 0
      ),
    },

    badge: {
      id_badge_modelo:
        badge.id_badge_modelo ||
        candidatura.id_badge_modelo ||
        "",

      nome_badge:
        badge.nome_badge ||
        badge.nome ||
        "Badge sem nome",

      descricao_badge_modelo:
        badge.descricao_badge_modelo ||
        badge.descricao ||
        "Sem descrição.",

      nome_nivel:
        badge.nome_nivel ||
        "Sem nível",

      codigo_nivel:
        badge.codigo_nivel ||
        "",

      pontos: Number(
        badge.pontos || 0
      ),

      imagem:
        badge.imagem ||
        badge.imagem_url ||
        null,
    },

    requisitos: Array.isArray(
      requisitosRaw
    )
      ? requisitosRaw.map(
          normalizarRequisito
        )
      : [],
  };
}

function obterEstadoVisual(estado) {
  const valor = String(
    estado || ""
  ).toUpperCase();

  if (
    valor.includes("APROV") ||
    valor.includes("VALID")
  ) {
    return {
      label: "Aprovada pelo TM",
      background: "#dcfce7",
      color: "#166534",
      border: "#bbf7d0",
    };
  }

  if (
    valor.includes("REJEIT") ||
    valor.includes("RECUS")
  ) {
    return {
      label: "Rejeitada",
      background: "#fee2e2",
      color: "#991b1b",
      border: "#fecaca",
    };
  }

  return {
    label: "Aguardar validação do TM",
    background: "#fef3c7",
    color: "#92400e",
    border: "#fde68a",
  };
}

function formatarTamanho(bytes) {
  const valor = Number(bytes);

  if (!valor || Number.isNaN(valor)) {
    return "";
  }

  if (valor < 1024) {
    return `${valor} B`;
  }

  if (valor < 1024 * 1024) {
    return `${(
      valor / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    valor /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

/* =========================================================
   PÁGINA
========================================================= */

function DetalheSolicitacaoSll() {
  const navigate = useNavigate();

  const {
    idCandidatura,
  } = useParams();

  const [dados, setDados] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    carregarDetalhe();
  }, [idCandidatura]);

  async function carregarDetalhe() {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizadorSll =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    if (!idUtilizadorSll) {
      setErro(
        "Não foi possível identificar o Service Line Leader."
      );

      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      const response = await api.get(
        `/sll/${idUtilizadorSll}/solicitacoes/${idCandidatura}`
      );

      console.log(
        "DETALHE DA SOLICITAÇÃO:",
        response.data
      );

      setDados(
        normalizarResposta(
          response.data
        )
      );
    } catch (err) {
      console.error(
        "Erro ao carregar detalhe da solicitação:",
        err
      );

      console.error(
        "STATUS:",
        err.response?.status
      );

      console.error(
        "BODY:",
        err.response?.data
      );

      setDados(null);

      setErro(
        err.response?.data?.error ||
        "Não foi possível carregar os detalhes da solicitação."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const totalEvidencias =
    useMemo(() => {
      if (!dados) {
        return 0;
      }

      return dados.requisitos.filter(
        (requisito) =>
          requisito.descricao_evidencia ||
          requisito.documentos.length > 0
      ).length;
    }, [dados]);

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <SllLeftSidebar />

        <main style={conteudo}>
          <button
            type="button"
            onClick={() =>
              navigate(
                "/sll/solicitacoes"
              )
            }
            style={voltarButton}
          >
            <BiArrowBack size={18} />
            Voltar para as solicitações
          </button>

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
          )}

          {isLoading ? (
            <div style={mensagemBox}>
              A carregar detalhes da
              solicitação...
            </div>
          ) : dados ? (
            <>
              <PerfilConsultor
                consultor={
                  dados.consultor
                }
              />

              <BadgeSolicitado
                badge={dados.badge}
                candidatura={
                  dados.candidatura
                }
              />

              <div style={cabecalhoRequisitos}>
                <div>
                  <h2 style={tituloRequisitos}>
                    Requisitos e evidências
                  </h2>

                  <div style={subtituloRequisitos}>
                    {totalEvidencias} de{" "}
                    {
                      dados.requisitos
                        .length
                    } requisitos com
                    evidência submetida
                  </div>
                </div>

                <EstadoCandidatura
                  estado={
                    dados.candidatura
                      .estado
                  }
                />
              </div>

              {dados.requisitos.length >
              0 ? (
                dados.requisitos.map(
                  (
                    requisito,
                    index
                  ) => (
                    <RequisitoCard
                      key={
                        requisito.id
                      }
                      requisito={
                        requisito
                      }
                      abertoInicial={
                        index === 0
                      }
                    />
                  )
                )
              ) : (
                <div style={mensagemBox}>
                  Este badge não possui
                  requisitos registados.
                </div>
              )}
            </>
          ) : (
            !erro && (
              <div style={mensagemBox}>
                Solicitação não encontrada.
              </div>
            )
          )}
        </main>

        <SllRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   PERFIL DO CONSULTOR
========================================================= */

function PerfilConsultor({
  consultor,
}) {
  return (
    <section style={perfilCard}>
      <div style={cardTitulo}>
        Perfil do Consultor
      </div>

      <div style={perfilConteudo}>
        <div style={perfilPrincipal}>
          <div style={avatar}>
            <BiUserCircle
              size={66}
              color="#6092bf"
            />
          </div>

          <div>
            <div style={nomeConsultor}>
              {consultor.nome_completo}
            </div>

            <div style={cargoBadge}>
              Consultor
            </div>
          </div>
        </div>

        <div style={perfilDetalhes}>
          <InfoPerfil
            icon={
              <BiEnvelope size={18} />
            }
            label="Email"
            value={consultor.email}
          />

          <InfoPerfil
            icon={
              <BiBriefcase size={18} />
            }
            label="Área"
            value={
              consultor.nome_area
            }
          />

          <InfoPerfil
            icon={
              <BiCalendar size={18} />
            }
            label="Data de entrada"
            value={formatarData(
              consultor
                .data_entrada_empresa
            )}
          />

          <InfoPerfil
            icon={
              <BiMedal size={18} />
            }
            label="Badges conquistados"
            value={`${consultor.total_badges} badges`}
          />
        </div>
      </div>
    </section>
  );
}

function InfoPerfil({
  icon,
  label,
  value,
}) {
  return (
    <div style={infoPerfil}>
      <div style={infoPerfilIcon}>
        {icon}
      </div>

      <div>
        <div style={infoPerfilLabel}>
          {label}
        </div>

        <div style={infoPerfilValor}>
          {value}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   BADGE SOLICITADO
========================================================= */

function BadgeSolicitado({
  badge,
  candidatura,
}) {
  return (
    <section style={badgeCard}>
      <div style={badgeImagemBox}>
        {badge.imagem ? (
          <img
            src={badge.imagem}
            alt={badge.nome_badge}
            style={badgeImagem}
          />
        ) : (
          <BiBadge
            size={38}
            color="#2563eb"
          />
        )}
      </div>

      <div style={badgeInfo}>
        <h2 style={badgeNome}>
          {badge.nome_badge}
        </h2>

        <p style={badgeDescricao}>
          {
            badge
              .descricao_badge_modelo
          }
        </p>

        <div style={badgeMeta}>
          <span style={metaBadge}>
            Nível:{" "}
            <strong>
              {badge.codigo_nivel ||
                badge.nome_nivel}
            </strong>
          </span>

          <span style={metaBadge}>
            {badge.pontos} pontos
          </span>

          <span style={metaBadge}>
            Solicitado em{" "}
            {formatarData(
              candidatura
                .data_submissao
            )}
          </span>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   ESTADO
========================================================= */

function EstadoCandidatura({
  estado,
}) {
  const visual =
    obterEstadoVisual(estado);

  return (
    <span
      style={{
        ...estadoCandidatura,

        background:
          visual.background,

        color: visual.color,

        border: `1px solid ${visual.border}`,
      }}
    >
      {visual.label}
    </span>
  );
}

/* =========================================================
   REQUISITOS
========================================================= */

function RequisitoCard({
  requisito,
  abertoInicial,
}) {
  const [aberto, setAberto] =
    useState(abertoInicial);

  const estadoVisual =
    obterEstadoVisual(
      requisito.estado
    );

  return (
    <article style={requisitoCard}>
      <button
        type="button"
        onClick={() =>
          setAberto(
            (valor) => !valor
          )
        }
        style={requisitoHeader}
      >
        <div style={requisitoHeaderInfo}>
          <div>
            <span style={codigoRequisito}>
              {requisito.codigo}
            </span>

            <span style={separadorTitulo}>
              {" — "}
            </span>

            <span style={tituloRequisito}>
              {requisito.titulo}
            </span>
          </div>
        </div>

        <div style={headerDireita}>
          <span
            style={{
              ...estadoRequisito,

              background:
                estadoVisual.background,

              color:
                estadoVisual.color,
            }}
          >
            {estadoVisual.label}
          </span>

          {aberto ? (
            <BiChevronUp
              size={21}
              color="#64748b"
            />
          ) : (
            <BiChevronDown
              size={21}
              color="#64748b"
            />
          )}
        </div>
      </button>

      {aberto && (
        <div style={requisitoBody}>
          <BlocoInformacao
            titulo="Descrição do requisito"
          >
            <p style={textoNormal}>
              {requisito.descricao}
            </p>

            {requisito.links.length >
              0 && (
              <div style={linksWrapper}>
                {requisito.links.map(
                  (link, index) => (
                    <a
                      key={
                        link.id_link ||
                        `${link.url}-${index}`
                      }
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      style={linkExterno}
                    >
                      <BiLinkExternal
                        size={15}
                      />

                      {link.url}
                    </a>
                  )
                )}
              </div>
            )}
          </BlocoInformacao>

          <BlocoInformacao
            titulo="Evidência apresentada"
          >
            {requisito
              .descricao_evidencia ? (
              <p style={textoNormal}>
                {
                  requisito
                    .descricao_evidencia
                }
              </p>
            ) : (
              <p style={textoVazio}>
                Ainda não existe uma
                descrição de evidência
                associada a este
                requisito.
              </p>
            )}
          </BlocoInformacao>

          <BlocoInformacao
            titulo="Documentos"
          >
            {requisito.documentos
              .length > 0 ? (
              <div style={documentosLista}>
                {requisito.documentos.map(
                  (documento) => (
                    <DocumentoCard
                      key={
                        documento.id
                      }
                      documento={
                        documento
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <p style={textoVazio}>
                Não existem documentos
                associados a este
                requisito.
              </p>
            )}
          </BlocoInformacao>
        </div>
      )}
    </article>
  );
}

function BlocoInformacao({
  titulo,
  children,
}) {
  return (
    <div style={blocoInformacao}>
      <h3 style={blocoTitulo}>
        {titulo}
      </h3>

      {children}
    </div>
  );
}

/* =========================================================
   DOCUMENTOS
========================================================= */

function DocumentoCard({
  documento,
}) {
  function abrirDocumento() {
    if (!documento.url) {
      return;
    }

    window.open(
      documento.url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div style={documentoCard}>
      <div style={documentoInfo}>
        <div style={documentoIcon}>
          <BiFile size={20} />
        </div>

        <div>
          <div style={documentoNome}>
            {documento.nome}
          </div>

          {(documento.tamanho ||
            documento.formato) && (
            <div style={documentoMeta}>
              {formatarTamanho(
                documento.tamanho
              )}

              {documento.tamanho &&
                documento.formato &&
                " · "}

              {documento.formato}
            </div>
          )}
        </div>
      </div>

      {documento.url && (
        <button
          type="button"
          onClick={abrirDocumento}
          style={visualizarButton}
        >
          <BiDownload size={16} />
          Visualizar
        </button>
      )}
    </div>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const pagina = {
  minHeight: "100vh",
  background: "#f3f4f6",
  display: "flex",
  flexDirection: "column",
};

const corpo = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const conteudo = {
  flex: 1,
  minWidth: 0,
  overflowY: "auto",
  padding: "22px 30px 60px",
};

const voltarButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: 0,
  marginBottom: 22,
  fontSize: 14,
  cursor: "pointer",
};

/* Perfil */

const perfilCard = {
  background: "white",
  border: "1px solid #bfdbfe",
  borderRadius: 13,
  padding: "18px 22px",
  marginBottom: 18,
};

const cardTitulo = {
  fontSize: 14,
  fontWeight: 700,
  color: "#334155",
  marginBottom: 16,
};

const perfilConteudo = {
  display: "grid",
  gridTemplateColumns:
    "minmax(230px, 0.7fr) minmax(350px, 1.3fr)",
  gap: 34,
  alignItems: "center",
};

const perfilPrincipal = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
};

const avatar = {
  width: 80,
  height: 80,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const nomeConsultor = {
  fontSize: 17,
  fontWeight: 700,
  color: "#111827",
};

const cargoBadge = {
  display: "inline-flex",
  marginTop: 7,
  background: "#eff6ff",
  color: "#2563eb",
  borderRadius: 999,
  padding: "5px 14px",
  fontSize: 11,
};

const perfilDetalhes = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 18,
};

const infoPerfil = {
  display: "flex",
  alignItems: "flex-start",
  gap: 9,
};

const infoPerfilIcon = {
  color: "#64748b",
  marginTop: 2,
};

const infoPerfilLabel = {
  fontSize: 10,
  color: "#94a3b8",
};

const infoPerfilValor = {
  marginTop: 2,
  fontSize: 12,
  fontWeight: 600,
  color: "#334155",
};

/* Badge */

const badgeCard = {
  background: "white",
  border: "1px solid #bfdbfe",
  borderRadius: 13,
  padding: "18px 22px",
  marginBottom: 20,
  display: "grid",
  gridTemplateColumns:
    "76px minmax(0, 1fr)",
  gap: 18,
  alignItems: "center",
};

const badgeImagemBox = {
  width: 72,
  height: 72,
  borderRadius: "50%",
  background: "#eff6ff",
  border: "2px solid #dbeafe",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const badgeImagem = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: "50%",
};

const badgeInfo = {
  minWidth: 0,
};

const badgeNome = {
  margin: 0,
  color: "#111827",
  fontSize: 17,
  fontWeight: 800,
};

const badgeDescricao = {
  margin: "7px 0 0",
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.55,
};

const badgeMeta = {
  marginTop: 12,
  display: "flex",
  alignItems: "center",
  gap: 9,
  flexWrap: "wrap",
};

const metaBadge = {
  background: "#f1f5f9",
  color: "#475569",
  borderRadius: 999,
  padding: "5px 11px",
  fontSize: 10,
};

/* Requisitos */

const cabecalhoRequisitos = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 13,
};

const tituloRequisitos = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
  color: "#111827",
};

const subtituloRequisitos = {
  marginTop: 3,
  fontSize: 11,
  color: "#64748b",
};

const estadoCandidatura = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "7px 13px",
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const requisitoCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  overflow: "hidden",
  marginBottom: 13,
};

const requisitoHeader = {
  width: "100%",
  border: "none",
  background: "white",
  padding: "15px 18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  textAlign: "left",
  cursor: "pointer",
};

const requisitoHeaderInfo = {
  minWidth: 0,
};

const codigoRequisito = {
  fontSize: 13,
  fontWeight: 800,
  color: "#111827",
};

const separadorTitulo = {
  color: "#94a3b8",
};

const tituloRequisito = {
  fontSize: 13,
  fontWeight: 600,
  color: "#475569",
};

const headerDireita = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexShrink: 0,
};

const estadoRequisito = {
  borderRadius: 999,
  padding: "5px 11px",
  fontSize: 10,
  fontWeight: 600,
};

const requisitoBody = {
  borderTop: "1px solid #e5e7eb",
  background: "#fafbfc",
  padding: "16px 18px",
};

const blocoInformacao = {
  marginBottom: 17,
};

const blocoTitulo = {
  margin: "0 0 7px",
  color: "#111827",
  fontSize: 12,
  fontWeight: 800,
};

const textoNormal = {
  margin: 0,
  color: "#475569",
  fontSize: 12,
  lineHeight: 1.6,
};

const textoVazio = {
  margin: 0,
  color: "#94a3b8",
  fontSize: 12,
};

const linksWrapper = {
  marginTop: 8,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 6,
};

const linkExterno = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  color: "#2563eb",
  fontSize: 11,
  textDecoration: "underline",
  wordBreak: "break-all",
};

/* Documentos */

const documentosLista = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const documentoCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 9,
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
};

const documentoInfo = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 0,
};

const documentoIcon = {
  color: "#64748b",
  display: "flex",
};

const documentoNome = {
  color: "#334155",
  fontSize: 12,
  fontWeight: 600,
  wordBreak: "break-word",
};

const documentoMeta = {
  marginTop: 2,
  color: "#94a3b8",
  fontSize: 10,
};

const visualizarButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 11,
  cursor: "pointer",
  flexShrink: 0,
};

/* Mensagens */

const mensagemBox = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#64748b",
};

const erroBox = {
  background: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: 12,
  color: "#991b1b",
  marginBottom: 18,
  fontSize: 13,
};

export default DetalheSolicitacaoSll;