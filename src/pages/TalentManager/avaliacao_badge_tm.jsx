import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBadgeCheck,
  BiBriefcase,
  BiCalendar,
  BiCheck,
  BiChevronDown,
  BiChevronUp,
  BiDownload,
  BiEnvelope,
  BiFile,
  BiMedal,
  BiSearch,
  BiUserCircle,
  BiX,
} from "react-icons/bi";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api.js";
import DebugBadgePanel from "../../components/DebugBadgePanel.jsx";

import Header from "../../components/Header.jsx";
import TmLeftSidebar from "../../components/tm_left_sidebar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";

/* =========================================================
   UTILIZADOR
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
      "Erro ao ler utilizador:",
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
    return "Não disponível";
  }

  const date = new Date(data);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Não disponível";
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

function obterUrlFicheiro(caminho) {
  if (!caminho) {
    return "";
  }

  if (
    /^https?:\/\//i.test(caminho)
  ) {
    return caminho;
  }

  const baseUrl = String(
    api.defaults.baseURL || ""
  ).replace(/\/api\/?$/, "");

  return `${baseUrl}${
    caminho.startsWith("/")
      ? ""
      : "/"
  }${caminho}`;
}

function obterEstadoVisual(estado) {
  const valor = String(
    estado || "PENDENTE"
  ).toUpperCase();

  if (valor === "APROVADO") {
    return {
      texto: "Aprovado",
      background: "#dcfce7",
      color: "#15803d",
    };
  }

  if (valor === "REJEITADO") {
    return {
      texto: "Rejeitado",
      background: "#fee2e2",
      color: "#b91c1c",
    };
  }

  return {
    texto: "Pendente",
    background: "#fef3c7",
    color: "#a16207",
  };
}

/* =========================================================
   PÁGINA
========================================================= */

function AvaliacaoBadgeTm() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    idCandidatura,
  } = useParams();

  const [dados, setDados] =
    useState(null);

  const [
    requisitoAberto,
    setRequisitoAberto,
  ] = useState(null);

  const [
    acaoEmCurso,
    setAcaoEmCurso,
  ] = useState("");

  const [
    mostrarModalRejeicao,
    setMostrarModalRejeicao,
  ] = useState(false);

  const [
    motivoRejeicao,
    setMotivoRejeicao,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [erro, setErro] =
    useState("");

  const [mensagem, setMensagem] =
    useState("");

  const voltarPara =
    location.state?.voltarPara ||
    "/tm/solicitacoes";

  const textoVoltar =
    location.state?.textoVoltar ||
    "Voltar para as solicitações";

  useEffect(() => {
    carregarDetalhe();
  }, [idCandidatura]);

  async function carregarDetalhe() {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    if (!idUtilizador) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      const response =
        await api.get(
          `/tm/${idUtilizador}/solicitacoes/${idCandidatura}`
        );

      const detalhe =
        response.data;

      setDados(detalhe);

      const primeiroPendente =
        detalhe.requisitos?.find(
          (requisito) =>
            requisito.estado_requisito !==
            "APROVADO"
        );

      setRequisitoAberto(
        primeiroPendente
          ?.id_requisitos ||
          detalhe.requisitos?.[0]
            ?.id_requisitos ||
          null
      );
    } catch (err) {
      console.error(
        "Erro ao carregar avaliação:",
        err
      );

      setDados(null);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar a candidatura."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function avaliarRequisito(
    idRequisito,
    decisao
  ) {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    try {
      setAcaoEmCurso(
        `${idRequisito}-${decisao}`
      );

      setErro("");
      setMensagem("");

      await api.put(
        `/tm/${idUtilizador}/solicitacoes/${idCandidatura}/requisitos/${idRequisito}`,
        {
          decisao,
        }
      );

      setMensagem(
        decisao === "APROVAR"
          ? "Requisito aprovado com sucesso."
          : "Requisito rejeitado."
      );

      await carregarDetalhe();
    } catch (err) {
      console.error(
        "Erro ao avaliar requisito:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível avaliar o requisito."
      );
    } finally {
      setAcaoEmCurso("");
    }
  }

  async function aprovarFinal() {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    try {
      setAcaoEmCurso(
        "APROVAR_FINAL"
      );

      setErro("");

      await api.post(
        `/tm/${idUtilizador}/solicitacoes/${idCandidatura}/aprovar-final`,
        {
          comentario:
            "Requisitos validados pelo Talent Manager.",
        }
      );

      navigate(
        "/tm/solicitacoes",
        {
          replace: true,

          state: {
            mensagem:
              "Candidatura aprovada e enviada ao Service Line Leader.",
          },
        }
      );
    } catch (err) {
      console.error(
        "Erro na aprovação final:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível aprovar a candidatura."
      );
    } finally {
      setAcaoEmCurso("");
    }
  }

  async function rejeitarFinal() {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    if (!motivoRejeicao.trim()) {
      setErro(
        "Indica o motivo da rejeição."
      );

      return;
    }

    try {
      setAcaoEmCurso(
        "REJEITAR_FINAL"
      );

      setErro("");

      await api.post(
        `/tm/${idUtilizador}/solicitacoes/${idCandidatura}/rejeitar-final`,
        {
          motivo:
            motivoRejeicao.trim(),
        }
      );

      navigate(
        "/tm/solicitacoes",
        {
          replace: true,

          state: {
            mensagem:
              "Candidatura rejeitada.",
          },
        }
      );
    } catch (err) {
      console.error(
        "Erro ao rejeitar candidatura:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível rejeitar a candidatura."
      );
    } finally {
      setAcaoEmCurso("");
      setMostrarModalRejeicao(
        false
      );
    }
  }

  const consultor =
    dados?.consultor;

  const badge =
    dados?.badge;

  const requisitos =
    Array.isArray(
      dados?.requisitos
    )
      ? dados.requisitos
      : [];

  const progresso =
    dados?.progresso || {
      total_requisitos: 0,
      requisitos_aprovados: 0,
      percentagem: 0,
      todos_aprovados: false,
    };

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <TmLeftSidebar />

        <main style={conteudo}>
          <button
            type="button"
            onClick={() =>
              navigate(voltarPara)
            }
            style={voltarButton}
          >
            <BiArrowBack size={18} />
            {textoVoltar}
          </button>

          <div style={separador} />

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
          )}

          {mensagem && (
            <div style={sucessoBox}>
              {mensagem}
            </div>
          )}

          {isLoading ? (
            <div style={mensagemBox}>
              A carregar candidatura...
            </div>
          ) : dados ? (
            <>
              {/* PERFIL */}

              <section style={cardBase}>
                <h2 style={tituloCard}>
                  Perfil do Consultor
                </h2>

                <div style={perfilGrid}>
                  <div style={identidade}>
                    <div style={avatar}>
                      <BiUserCircle
                        size={76}
                        color="#6092bf"
                      />
                    </div>

                    <div style={nomeConsultor}>
                      {
                        consultor
                          ?.nome_completo
                      }
                    </div>

                    <span style={cargoBadge}>
                      Consultor
                    </span>
                  </div>

                  <div style={detalhesPerfil}>
                    <InfoItem
                      icon={
                        <BiEnvelope
                          size={18}
                        />
                      }
                      label="Email"
                      valor={
                        consultor?.email
                      }
                    />

                    <InfoItem
                      icon={
                        <BiCalendar
                          size={18}
                        />
                      }
                      label="Data de entrada"
                      valor={formatarData(
                        consultor
                          ?.data_entrada_empresa
                      )}
                    />

                    <InfoItem
                      icon={
                        <BiBriefcase
                          size={18}
                        />
                      }
                      label="Área"
                      valor={
                        consultor?.nome_area
                      }
                    />

                    <InfoItem
                      icon={
                        <BiMedal
                          size={18}
                        />
                      }
                      label="Service Line"
                      valor={
                        consultor
                          ?.nome_serviceline
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/tm/consultores/${consultor?.id_utilizador}`,
                        {
                          state: {
                            voltarPara: location.pathname,
                            textoVoltar:
                              "Voltar à aprovação de badges",

                            idCandidaturaOrigem:
                              idCandidatura,
                          },
                        }
                      )
                    }
                    style={perfilButton}
                  >
                    Ver Perfil Completo
                  </button>
                </div>
              </section>

              {/* BADGE */}

              <section style={badgeCard}>
                <div style={badgeImagemBox}>
                  {badge?.imagem ? (
                    <img
                      src={badge.imagem}
                      alt={
                        badge.nome_badge
                      }
                      style={badgeImagem}
                    />
                  ) : (
                    <BiBadgeCheck
                      size={38}
                      color="#2563eb"
                    />
                  )}
                </div>

                <div style={badgeInfo}>
                  <div style={badgeNome}>
                    {badge?.nome_badge}
                    {badge?.nome_nivel
                      ? ` - ${badge.nome_nivel}`
                      : ""}
                  </div>

                  <div style={badgeDescricao}>
                    {
                      badge
                        ?.descricao_badge_modelo
                    }
                  </div>

                  <div style={badgeArea}>
                    {badge?.nome_area}
                  </div>

                  <div style={badgeData}>
                    Solicitado em{" "}
                    {formatarData(
                      dados.candidatura
                        ?.data_submisao
                    )}
                  </div>

                  <DebugBadgePanel badge={badge} />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/tm/badges/${badge?.id_badge_modelo}`,
                      {
                        state: {
                          voltarPara: location.pathname,

                          textoVoltar:
                            "Voltar à aprovação do badge",

                          idCandidaturaOrigem:
                            idCandidatura,
                        },
                      }
                    )
                  }
                  style={evidenciasButton}
                >
                  <BiSearch size={17} />
                  Consultar Evidências
                </button>
              </section>

              {/* REQUISITOS */}

              <section
                id="requisitos-avaliacao"
              >
                {requisitos.map(
                  (
                    requisito,
                    index
                  ) => (
                    <RequisitoAvaliacaoCard
                      key={
                        requisito.id_requisitos
                      }
                      requisito={
                        requisito
                      }
                      numero={index + 1}
                      aberto={
                        requisitoAberto ===
                        requisito.id_requisitos
                      }
                      onToggle={() =>
                        setRequisitoAberto(
                          requisitoAberto ===
                            requisito.id_requisitos
                            ? null
                            : requisito.id_requisitos
                        )
                      }
                      onAprovar={() =>
                        avaliarRequisito(
                          requisito.id_requisitos,
                          "APROVAR"
                        )
                      }
                      onRejeitar={() =>
                        avaliarRequisito(
                          requisito.id_requisitos,
                          "REJEITAR"
                        )
                      }
                      acaoEmCurso={
                        acaoEmCurso
                      }
                    />
                  )
                )}
              </section>

              {/* PROGRESSO */}

              <section style={progressoCard}>
                <h2 style={tituloProgresso}>
                  Progresso de Avaliação
                </h2>

                <div style={textoProgresso}>
                  {
                    progresso
                      .requisitos_aprovados
                  }{" "}
                  /{" "}
                  {
                    progresso
                      .total_requisitos
                  }{" "}
                  Requisitos Aprovados
                </div>

                <div style={barraFundo}>
                  <div
                    style={{
                      ...barraProgresso,

                      width: `${progresso.percentagem}%`,
                    }}
                  />
                </div>

                <div style={acoesFinais}>
                  <button
                    type="button"
                    onClick={aprovarFinal}
                    disabled={
                      !progresso.todos_aprovados ||
                      acaoEmCurso ===
                        "APROVAR_FINAL"
                    }
                    style={{
                      ...aprovarFinalButton,

                      opacity:
                        progresso.todos_aprovados
                          ? 1
                          : 0.55,

                      cursor:
                        progresso.todos_aprovados
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    <BiCheck size={20} />

                    {acaoEmCurso ===
                    "APROVAR_FINAL"
                      ? "A enviar..."
                      : "Aprovar Badge e enviar ao SLL"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMostrarModalRejeicao(
                        true
                      )
                    }
                    style={rejeitarFinalButton}
                  >
                    <BiX size={20} />
                    Rejeitar Candidatura
                  </button>
                </div>
              </section>
            </>
          ) : (
            <div style={mensagemBox}>
              Candidatura não encontrada.
            </div>
          )}
        </main>

        <TmRightSidebar />
      </div>

      {mostrarModalRejeicao && (
        <div
          style={modalOverlay}
          onClick={() =>
            setMostrarModalRejeicao(
              false
            )
          }
        >
          <div
            style={modalBox}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2 style={modalTitulo}>
              Rejeitar candidatura
            </h2>

            <p style={modalTexto}>
              Indica o motivo da rejeição.
              Esta candidatura não será
              enviada ao Service Line
              Leader.
            </p>

            <textarea
              value={motivoRejeicao}
              onChange={(event) =>
                setMotivoRejeicao(
                  event.target.value
                )
              }
              placeholder="Motivo da rejeição..."
              style={modalTextarea}
            />

            <div style={modalAcoes}>
              <button
                type="button"
                onClick={() =>
                  setMostrarModalRejeicao(
                    false
                  )
                }
                style={cancelarButton}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={rejeitarFinal}
                disabled={
                  acaoEmCurso ===
                  "REJEITAR_FINAL"
                }
                style={confirmarRejeicaoButton}
              >
                {acaoEmCurso ===
                "REJEITAR_FINAL"
                  ? "A rejeitar..."
                  : "Confirmar rejeição"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function InfoItem({
  icon,
  label,
  valor,
}) {
  return (
    <div style={infoItem}>
      <div style={infoIcon}>
        {icon}
      </div>

      <div>
        <div style={infoLabel}>
          {label}
        </div>

        <div style={infoValor}>
          {valor || "Não disponível"}
        </div>
      </div>
    </div>
  );
}

function RequisitoAvaliacaoCard({
  requisito,
  numero,
  aberto,
  onToggle,
  onAprovar,
  onRejeitar,
  acaoEmCurso,
}) {
  const estado =
    obterEstadoVisual(
      requisito.estado_requisito
    );

  const aprovando =
    acaoEmCurso ===
    `${requisito.id_requisitos}-APROVAR`;

  const rejeitando =
    acaoEmCurso ===
    `${requisito.id_requisitos}-REJEITAR`;

  return (
    <article style={requisitoCard}>
      <button
        type="button"
        onClick={onToggle}
        style={requisitoHeader}
      >
        <div style={requisitoTituloArea}>
          <strong>
            Requisito {numero}
          </strong>

          <span>
            -{" "}
            {requisito.titulo ||
              requisito.nome_requisito}
          </span>

          <span
            style={{
              ...estadoChip,
              background:
                estado.background,
              color: estado.color,
            }}
          >
            {estado.texto}
          </span>
        </div>

        {aberto ? (
          <BiChevronUp size={21} />
        ) : (
          <BiChevronDown size={21} />
        )}
      </button>

      {aberto && (
        <div style={requisitoBody}>
          <div style={blocoTexto}>
            <strong>Descrição</strong>

            <p>
              {requisito
                .descricao_requisito ||
                "Sem descrição."}
            </p>
          </div>

          {requisito.evidencias
            ?.length > 0 ? (
            requisito.evidencias.map(
              (evidencia) => (
                <div
                  key={
                    evidencia.id_evidencia
                  }
                  style={evidenciaBloco}
                >
                  <div style={blocoTexto}>
                    <strong>
                      Evidência apresentada
                    </strong>

                    <p>
                      {evidencia.descricao ||
                        "Sem descrição."}
                    </p>
                  </div>

                  <div style={documentoCard}>
                    <BiFile
                      size={20}
                      color="#64748b"
                    />

                    <div style={documentoInfo}>
                      <div
                        style={
                          documentoNome
                        }
                      >
                        {evidencia.nome_ficheiro ||
                          "Documento"}
                      </div>

                      <div
                        style={
                          documentoFormato
                        }
                      >
                        {evidencia.formato_ficheiro ||
                          "Ficheiro"}
                      </div>
                    </div>

                    {evidencia.caminho_ficheiro && (
                      <a
                        href={obterUrlFicheiro(
                          evidencia.caminho_ficheiro
                        )}
                        target="_blank"
                        rel="noreferrer"
                        style={visualizarLink}
                      >
                        <BiDownload
                          size={16}
                        />
                        Visualizar
                      </a>
                    )}
                  </div>
                </div>
              )
            )
          ) : (
            <div style={semEvidencias}>
              Este requisito não possui
              evidências submetidas.
            </div>
          )}

          <div style={acoesRequisito}>
            <button
              type="button"
              onClick={onAprovar}
              disabled={
                aprovando ||
                rejeitando ||
                requisito.evidencias
                  ?.length === 0
              }
              style={aprovarRequisitoButton}
            >
              <BiCheck size={19} />

              {aprovando
                ? "A aprovar..."
                : "Validar Evidência"}
            </button>

            <button
              type="button"
              onClick={onRejeitar}
              disabled={
                aprovando ||
                rejeitando ||
                requisito.evidencias
                  ?.length === 0
              }
              style={rejeitarRequisitoButton}
            >
              <BiX size={19} />

              {rejeitando
                ? "A rejeitar..."
                : "Rejeitar Evidência"}
            </button>
          </div>
        </div>
      )}
    </article>
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
  fontSize: 14,
  cursor: "pointer",
};

const separador = {
  height: 1,
  background: "#d1d5db",
  margin: "16px 0 20px",
};

const cardBase = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "20px 22px",
  marginBottom: 18,
};

const tituloCard = {
  margin: "0 0 16px",
  color: "#111827",
  fontSize: 16,
  fontWeight: 700,
};

const perfilGrid = {
  display: "grid",
  gridTemplateColumns:
    "190px minmax(0, 1fr) 230px",
  gap: 26,
  alignItems: "center",
};

const identidade = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const avatar = {
  width: 86,
  height: 86,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const nomeConsultor = {
  marginTop: 8,
  color: "#111827",
  fontSize: 14,
  fontWeight: 600,
};

const cargoBadge = {
  marginTop: 5,
  background: "#dbeafe",
  color: "#2563eb",
  borderRadius: 999,
  padding: "4px 16px",
  fontSize: 10,
};

const detalhesPerfil = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 18,
};

const infoItem = {
  display: "flex",
  alignItems: "flex-start",
  gap: 9,
};

const infoIcon = {
  color: "#6092bf",
  marginTop: 2,
};

const infoLabel = {
  color: "#94a3b8",
  fontSize: 10,
};

const infoValor = {
  marginTop: 2,
  color: "#334155",
  fontSize: 12,
  fontWeight: 500,
};

const perfilButton = {
  minHeight: 40,
  border: "1px solid #60a5fa",
  borderRadius: 8,
  background: "white",
  color: "#2563eb",
  fontSize: 12,
  cursor: "pointer",
};

const badgeCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "15px 20px",
  display: "grid",
  gridTemplateColumns:
    "62px minmax(0, 1fr) 190px",
  gap: 18,
  alignItems: "center",
  marginBottom: 22,
};

const badgeImagemBox = {
  width: 58,
  height: 58,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const badgeImagem = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
};

const badgeInfo = {
  minWidth: 0,
};

const badgeNome = {
  color: "#111827",
  fontSize: 15,
  fontWeight: 600,
};

const badgeDescricao = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 11,
};

const badgeArea = {
  display: "inline-flex",
  marginTop: 7,
  background: "#dbeafe",
  color: "#2563eb",
  padding: "4px 8px",
  fontSize: 9,
};

const badgeData = {
  marginTop: 7,
  color: "#64748b",
  fontSize: 10,
};

const evidenciasButton = {
  minHeight: 39,
  border: "1px solid #94a3b8",
  borderRadius: 8,
  background: "#cbd5e1",
  color: "#334155",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 14px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const requisitoCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  overflow: "hidden",
  marginBottom: 14,
};

const requisitoHeader = {
  width: "100%",
  border: "none",
  background: "white",
  padding: "16px 18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  textAlign: "left",
};

const requisitoTituloArea = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  flexWrap: "wrap",
  color: "#111827",
  fontSize: 13,
};

const estadoChip = {
  marginLeft: 12,
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 9,
  fontWeight: 600,
};

const requisitoBody = {
  borderTop: "1px solid #e5e7eb",
  padding: "16px 18px 18px",
};

const blocoTexto = {
  color: "#111827",
  fontSize: 12,
  lineHeight: 1.5,
};

const evidenciaBloco = {
  marginTop: 14,
};

const documentoCard = {
  marginTop: 8,
  minHeight: 53,
  border: "1px solid #dbe3ef",
  borderRadius: 9,
  background: "#f8fafc",
  padding: "9px 12px",
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const documentoInfo = {
  flex: 1,
  minWidth: 0,
};

const documentoNome = {
  color: "#334155",
  fontSize: 11,
  fontWeight: 600,
};

const documentoFormato = {
  color: "#94a3b8",
  fontSize: 9,
};

const visualizarLink = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  color: "#2563eb",
  fontSize: 11,
  textDecoration: "none",
};

const semEvidencias = {
  marginTop: 12,
  background: "#f8fafc",
  border: "1px dashed #cbd5e1",
  borderRadius: 8,
  padding: 14,
  color: "#64748b",
  fontSize: 11,
};

const acoesRequisito = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 20,
};

const aprovarRequisitoButton = {
  minHeight: 44,
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const rejeitarRequisitoButton = {
  minHeight: 44,
  border: "1px solid #94a3b8",
  borderRadius: 8,
  background: "#cbd5e1",
  color: "#334155",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const progressoCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "18px 20px",
  marginTop: 22,
};

const tituloProgresso = {
  margin: 0,
  color: "#111827",
  fontSize: 17,
  fontWeight: 700,
};

const textoProgresso = {
  marginTop: 2,
  color: "#334155",
  fontSize: 12,
};

const barraFundo = {
  width: "100%",
  height: 11,
  marginTop: 7,
  borderRadius: 999,
  background: "#e5e7eb",
  overflow: "hidden",
};

const barraProgresso = {
  height: "100%",
  borderRadius: 999,
  background: "#2563eb",
  transition: "width 0.25s",
};

const acoesFinais = {
  marginTop: 22,
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 250px",
  gap: 16,
};

const aprovarFinalButton = {
  minHeight: 48,
  border: "none",
  borderRadius: 9,
  background: "#2563eb",
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 600,
};

const rejeitarFinalButton = {
  minHeight: 48,
  border: "1px solid #dc2626",
  borderRadius: 9,
  background: "#fee2e2",
  color: "#b91c1c",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
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

const sucessoBox = {
  background: "#dcfce7",
  border: "1px solid #bbf7d0",
  borderRadius: 10,
  padding: 12,
  color: "#166534",
  marginBottom: 18,
  fontSize: 13,
};

const mensagemBox = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#64748b",
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background:
    "rgba(15, 23, 42, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modalBox = {
  width: "100%",
  maxWidth: 470,
  background: "white",
  borderRadius: 14,
  padding: "25px 28px",
  boxShadow:
    "0 18px 45px rgba(15,23,42,0.24)",
};

const modalTitulo = {
  margin: 0,
  color: "#111827",
  fontSize: 18,
  fontWeight: 700,
};

const modalTexto = {
  margin: "10px 0 14px",
  color: "#64748b",
  fontSize: 13,
  lineHeight: 1.5,
};

const modalTextarea = {
  width: "100%",
  minHeight: 110,
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 9,
  padding: 12,
  resize: "vertical",
  outline: "none",
  fontSize: 13,
};

const modalAcoes = {
  marginTop: 17,
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const cancelarButton = {
  minHeight: 40,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "white",
  color: "#334155",
  padding: "8px 17px",
  cursor: "pointer",
};

const confirmarRejeicaoButton = {
  minHeight: 40,
  border: "none",
  borderRadius: 8,
  background: "#dc2626",
  color: "white",
  padding: "8px 17px",
  fontWeight: 600,
  cursor: "pointer",
};

export default AvaliacaoBadgeTm;