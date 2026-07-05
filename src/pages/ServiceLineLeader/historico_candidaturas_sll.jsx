import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBadge,
  BiCheck,
  BiEnvelope,
  BiFilterAlt,
  BiSearch,
  BiShow,
  BiSortAlt2,
  BiTimeFive,
  BiUserCircle,
  BiX,
} from "react-icons/bi";

import { useNavigate } from "react-router-dom";

import api from "../../services/api.js";

import Header from "../../components/Header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";
import logoImg from '../../assets/logo.png';

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
   NORMALIZAÇÃO
========================================================= */

function normalizarCandidatura(
  candidatura
) {
  return {
    id_candidatura_pedido:
      candidatura
        .id_candidatura_pedido ||
      candidatura.id ||
      "",

    id_badge_modelo:
      candidatura.id_badge_modelo ||
      "",

    id_utilizador:
      candidatura.id_utilizador ||
      "",

    nome_completo:
      candidatura.nome_completo ||
      "Consultor",

    email:
      candidatura.email ||
      "Sem email",

    nome_badge:
      candidatura.nome_badge ||
      "Badge sem nome",

    descricao_badge_modelo:
      candidatura
        .descricao_badge_modelo ||
      "Sem descrição.",

    nome_area:
      candidatura.nome_area ||
      "Sem área associada",

    nome_serviceline:
      candidatura.nome_serviceline ||
      "Service Line",

    nome_nivel:
      candidatura.nome_nivel ||
      "Sem nível",

    codigo_nivel:
      candidatura.codigo_nivel ||
      "",

    pontos: Number(
      candidatura.pontos || 0
    ),

    imagem:
      candidatura.imagem ||
      null,

    data_submissao:
      candidatura.data_submissao ||
      null,

    data_entrada_historico:
      candidatura
        .data_entrada_historico ||
      null,

    estado_pedido:
      candidatura
        .estado_candidatura_pedido ||
      "PENDENTE",

    estado_atual:
      candidatura.estado_atual ||
      candidatura.estado_final ||
      candidatura
        .estado_candidaturasll ||
      candidatura
        .estado_candidaturatm ||
      candidatura
        .estado_candidatura_pedido ||
      "PENDENTE",

    fase_atual:
      candidatura.fase_atual ||
      "PEDIDO SUBMETIDO",

    motivo_estado_final:
      candidatura
        .motivo_estado_final ||
      "",

    numero_requisitos_completos:
      Number(
        candidatura
          .numero_requisitos_completos ||
          0
      ),

    numero_requisitos_faltantes:
      Number(
        candidatura
          .numero_requisitos_faltantes ||
          0
      ),
  };
}

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

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toUpperCase();
}

/* =========================================================
   ESTADOS
========================================================= */

function obterEstadoVisual(estado) {
  const valor =
    normalizarTexto(estado);

  if (
    valor.includes("APROV") ||
    valor.includes("VALID")
  ) {
    return {
      tipo: "APROVADO",
      label: "Aprovado",
      background: "#dcfce7",
      color: "#15803d",
      border: "#bbf7d0",
      icon: <BiCheck size={18} />,
    };
  }

  if (
    valor.includes("REJEIT") ||
    valor.includes("RECUS")
  ) {
    return {
      tipo: "RECUSADO",
      label: "Recusado",
      background: "#fee2e2",
      color: "#dc2626",
      border: "#fecaca",
      icon: <BiX size={18} />,
    };
  }

  if (
    valor.includes("CANCEL")
  ) {
    return {
      tipo: "CANCELADO",
      label: "Cancelado",
      background: "#e5e7eb",
      color: "#475569",
      border: "#cbd5e1",
      icon: <BiX size={18} />,
    };
  }

  return {
    tipo: "AVALIACAO",
    label: "Em Avaliação",
    background: "#fef3c7",
    color: "#d97706",
    border: "#fde68a",
    icon: <BiTimeFive size={17} />,
  };
}

/* =========================================================
   PÁGINA
========================================================= */

function HistoricoCandidaturasSll() {
  const navigate = useNavigate();

  const [
    candidaturas,
    setCandidaturas,
  ] = useState([]);

  const [
    serviceLine,
    setServiceLine,
  ] = useState(null);

  const [pesquisa, setPesquisa] =
    useState("");

  const [
    pesquisaConsultor,
    setPesquisaConsultor,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("TODOS");

  const [
    ordenacao,
    setOrdenacao,
  ] = useState("RECENTES");

  const [isLoading, setIsLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    carregarHistorico();
  }, []);

  async function carregarHistorico() {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    if (!idUtilizador) {
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
        `/sll/${idUtilizador}/historico-candidaturas`
      );

      const dados = response.data;

      setServiceLine(
        dados.serviceLine || null
      );

      const lista = Array.isArray(
        dados.candidaturas
      )
        ? dados.candidaturas.map(
            normalizarCandidatura
          )
        : [];

      setCandidaturas(lista);
    } catch (err) {
      console.error(
        "Erro ao carregar histórico:",
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

      setCandidaturas([]);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar o histórico de candidaturas."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const candidaturasFiltradas =
    useMemo(() => {
      let resultado = [
        ...candidaturas,
      ];

      const termo = pesquisa
        .trim()
        .toLowerCase();

      if (termo) {
        resultado =
          resultado.filter(
            (candidatura) =>
              candidatura.nome_badge
                .toLowerCase()
                .includes(termo) ||
              candidatura.nome_area
                .toLowerCase()
                .includes(termo) ||
              candidatura
                .nome_serviceline
                .toLowerCase()
                .includes(termo) ||
              candidatura.nome_nivel
                .toLowerCase()
                .includes(termo)
          );
      }

      const consultor =
        pesquisaConsultor
          .trim()
          .toLowerCase();

      if (consultor) {
        resultado =
          resultado.filter(
            (candidatura) =>
              candidatura
                .nome_completo
                .toLowerCase()
                .includes(consultor) ||
              candidatura.email
                .toLowerCase()
                .includes(consultor)
          );
      }

      if (
        filtroEstado !== "TODOS"
      ) {
        resultado =
          resultado.filter(
            (candidatura) =>
              obterEstadoVisual(
                candidatura.estado_atual
              ).tipo === filtroEstado
          );
      }

      resultado.sort((a, b) => {
        if (
          ordenacao === "ANTIGAS"
        ) {
          return (
            new Date(
              a.data_submissao
            ) -
            new Date(
              b.data_submissao
            )
          );
        }

        if (
          ordenacao === "NOME_ASC"
        ) {
          return a.nome_completo
            .localeCompare(
              b.nome_completo,
              "pt"
            );
        }

        if (
          ordenacao === "NOME_DESC"
        ) {
          return b.nome_completo
            .localeCompare(
              a.nome_completo,
              "pt"
            );
        }

        return (
          new Date(
            b.data_entrada_historico ||
              b.data_submissao
          ) -
          new Date(
            a.data_entrada_historico ||
              a.data_submissao
          )
        );
      });

      return resultado;
    }, [
      candidaturas,
      pesquisa,
      pesquisaConsultor,
      filtroEstado,
      ordenacao,
    ]);

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
            Voltar
          </button>

          <div style={separador} />

          <div style={cabecalhoPagina}>
            <h1 style={titulo}>
              Histórico de Candidaturas
            </h1>

            <div style={subtitulo}>
              Service Line:{" "}
              <strong>
                {serviceLine
                  ?.nome_serviceline ||
                  "Service Line"}
              </strong>
            </div>

            <div style={totalTexto}>
              Total de{" "}
              {
                candidaturasFiltradas
                  .length
              }{" "}
              {candidaturasFiltradas
                .length === 1
                ? "candidatura"
                : "candidaturas"}
            </div>
          </div>

          <div style={filtrosArea}>
            <div style={pesquisaBox}>
              <BiSearch
                size={18}
                color="#94a3b8"
              />

              <input
                type="text"
                value={pesquisa}
                onChange={(event) =>
                  setPesquisa(
                    event.target.value
                  )
                }
                placeholder="Buscar badge, área ou nível..."
                style={pesquisaInput}
              />
            </div>

            <div style={filtrosContainer}>
              <div style={filtroCampo}>
                <label style={filtroLabel}>
                  <BiFilterAlt
                    size={16}
                  />
                  Filtrar por
                </label>

                <select
                  value={filtroEstado}
                  onChange={(event) =>
                    setFiltroEstado(
                      event.target.value
                    )
                  }
                  style={inputFiltro}
                >
                  <option value="TODOS">
                    Todos
                  </option>

                  <option value="APROVADO">
                    Aprovados
                  </option>

                  <option value="RECUSADO">
                    Recusados
                  </option>

                  <option value="AVALIACAO">
                    Em avaliação
                  </option>

                  <option value="CANCELADO">
                    Cancelados
                  </option>
                </select>
              </div>

              <div style={filtroCampo}>
                <label style={filtroLabel}>
                  <BiSearch size={16} />
                  Buscar consultor
                </label>

                <input
                  type="text"
                  value={
                    pesquisaConsultor
                  }
                  onChange={(event) =>
                    setPesquisaConsultor(
                      event.target.value
                    )
                  }
                  placeholder="Nome ou email..."
                  style={inputFiltro}
                />
              </div>

              <div style={filtroCampo}>
                <label style={filtroLabel}>
                  <BiSortAlt2
                    size={16}
                  />
                  Ordenar por
                </label>

                <select
                  value={ordenacao}
                  onChange={(event) =>
                    setOrdenacao(
                      event.target.value
                    )
                  }
                  style={inputFiltro}
                >
                  <option value="RECENTES">
                    Mais recentes
                  </option>

                  <option value="ANTIGAS">
                    Mais antigas
                  </option>

                  <option value="NOME_ASC">
                    Nome A-Z
                  </option>

                  <option value="NOME_DESC">
                    Nome Z-A
                  </option>
                </select>
              </div>
            </div>
          </div>

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
          )}

          {isLoading ? (
            <div style={mensagemBox}>
              A carregar histórico...
            </div>
          ) : candidaturasFiltradas
              .length > 0 ? (
            <div style={lista}>
              {candidaturasFiltradas.map(
                (candidatura) => (
                  <HistoricoCard
                    key={
                      candidatura
                        .id_candidatura_pedido
                    }
                    candidatura={
                      candidatura
                    }
                    onDetalhes={() =>
                      navigate(
                        `/sll/solicitacoes/${candidatura.id_candidatura_pedido}`
                      )
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div style={mensagemBox}>
              Não foram encontradas
              candidaturas.
            </div>
          )}
        </main>

        <SllRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   CARD
========================================================= */

function HistoricoCard({
  candidatura,
  onDetalhes,
}) {
  const estado =
    obterEstadoVisual(
      candidatura.estado_atual
    );

  return (
    <article style={card}>
      <div style={consultorArea}>
        <div style={avatar}>
          <BiUserCircle
            size={50}
            color="#6092bf"
          />
        </div>

        <div>
          <div style={nomeConsultor}>
            {candidatura.nome_completo}
          </div>

          <div style={cargoTexto}>
            Consultor
          </div>

          <div style={emailTexto}>
            <BiEnvelope size={14} />
            {candidatura.email}
          </div>
        </div>
      </div>

      <div style={cardConteudo}>
        <div style={badgeResumo}>
          <div style={badgeImagemBox}>
            {candidatura.imagem ? (
              <img
                src={
                  candidatura.imagem
                }
                alt={
                  candidatura.nome_badge
                }
                style={badgeImagem}
              />
            ) : (
              <BiBadge
                size={29}
                color="#2563eb"
              />
            )}
          </div>

          <div style={badgeInfo}>
            <div style={badgeNome}>
              {
                candidatura
                  .nome_serviceline
              }{" "}
              —{" "}
              {candidatura.nome_badge}

              {candidatura
                .codigo_nivel && (
                <>
                  {" "}
                  — Nível{" "}
                  {
                    candidatura
                      .codigo_nivel
                  }
                </>
              )}
            </div>

            <div style={badgeDescricao}>
              {
                candidatura
                  .descricao_badge_modelo
              }
            </div>

            <span style={areaBadge}>
              {candidatura.nome_area}
            </span>
          </div>
        </div>

        <div style={acoesCard}>
          <div
            style={{
              ...estadoBox,
              background:
                estado.background,
              color: estado.color,
              border: `1px solid ${estado.border}`,
            }}
          >
            {estado.icon}
            {estado.label}
          </div>

          <button
            type="button"
            onClick={onDetalhes}
            style={detalhesButton}
          >
            <BiShow size={17} />
            Ver detalhes
          </button>
        </div>
      </div>

      <div style={cardRodape}>
        <span>
          Solicitado em:{" "}
          {formatarData(
            candidatura
              .data_submissao
          )}
        </span>

        <span>
          Fase:{" "}
          {candidatura.fase_atual}
        </span>

        {candidatura
          .motivo_estado_final && (
          <span>
            Motivo:{" "}
            {
              candidatura
                .motivo_estado_final
            }
          </span>
        )}
      </div>
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
  margin: "16px 0 10px",
};

const cabecalhoPagina = {
  marginBottom: 18,
};

const titulo = {
  margin: 0,
  fontSize: 19,
  fontWeight: 800,
  color: "#111827",
};

const subtitulo = {
  marginTop: 3,
  fontSize: 12,
  color: "#64748b",
};

const totalTexto = {
  marginTop: 3,
  color: "#374151",
  fontSize: 13,
};

const filtrosArea = {
  display: "grid",
  gridTemplateColumns:
    "minmax(220px, 0.7fr) minmax(520px, 1.3fr)",
  gap: 38,
  alignItems: "end",
  marginBottom: 28,
};

const pesquisaBox = {
  height: 46,
  display: "flex",
  alignItems: "center",
  gap: 9,
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  padding: "0 14px",
};

const pesquisaInput = {
  flex: 1,
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 13,
};

const filtrosContainer = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: 14,
  background: "white",
  borderRadius: 11,
  padding: "8px 0",
};

const filtroCampo = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const filtroLabel = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#475569",
  fontSize: 12,
  fontWeight: 600,
};

const inputFiltro = {
  width: "100%",
  height: 42,
  border: "1px solid #dbe3ef",
  borderRadius: 9,
  padding: "0 11px",
  outline: "none",
  background: "white",
  boxSizing: "border-box",
  fontSize: 13,
};

const lista = {
  maxWidth: 940,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 22,
};

const card = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "18px 20px 0",
  overflow: "hidden",
};

const consultorArea = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 18,
};

const avatar = {
  width: 58,
  height: 58,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const nomeConsultor = {
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
};

const cargoTexto = {
  marginTop: 2,
  fontSize: 11,
  color: "#64748b",
};

const emailTexto = {
  marginTop: 2,
  display: "flex",
  alignItems: "center",
  gap: 5,
  fontSize: 11,
  color: "#64748b",
};

const cardConteudo = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 145px",
  gap: 22,
  alignItems: "center",
};

const badgeResumo = {
  minHeight: 94,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 10,
  padding: "13px 16px",
  display: "grid",
  gridTemplateColumns:
    "54px minmax(0, 1fr)",
  gap: 14,
  alignItems: "center",
};

const badgeImagemBox = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  background: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const badgeImagem = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  borderRadius: "50%",
};

const badgeInfo = {
  minWidth: 0,
};

const badgeNome = {
  color: "#2563eb",
  fontSize: 13,
  fontWeight: 700,
};

const badgeDescricao = {
  marginTop: 5,
  color: "#64748b",
  fontSize: 11,
  lineHeight: 1.45,
};

const areaBadge = {
  display: "inline-flex",
  marginTop: 7,
  background: "#dbeafe",
  color: "#2563eb",
  borderRadius: 5,
  padding: "3px 8px",
  fontSize: 9,
};

const acoesCard = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const estadoBox = {
  minHeight: 42,
  borderRadius: 9,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 600,
};

const detalhesButton = {
  minHeight: 40,
  border: "none",
  borderRadius: 9,
  background: "#f1f5f9",
  color: "#334155",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontSize: 12,
  cursor: "pointer",
};

const cardRodape = {
  borderTop: "1px solid #e5e7eb",
  marginTop: 12,
  minHeight: 34,
  display: "flex",
  alignItems: "center",
  gap: 28,
  color: "#64748b",
  fontSize: 10,
  flexWrap: "wrap",
};

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
  marginBottom: 18,
  color: "#991b1b",
  fontSize: 13,
};

export default HistoricoCandidaturasSll;