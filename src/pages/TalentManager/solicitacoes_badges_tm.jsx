import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBookOpen,
  BiFilterAlt,
  BiHistory,
  BiSearch,
  BiSortAlt2,
  BiTimeFive,
  BiUserCircle,
} from "react-icons/bi";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "../../services/api.js";

import Header from "../../components/header.jsx";
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
   NORMALIZAÇÃO
========================================================= */

function normalizarSolicitacao(
  solicitacao,
  index
) {
  return {
    id_candidatura_pedido:
      solicitacao.id_candidatura_pedido ||
      solicitacao.id ||
      index,

    id_candidatura_tm:
      solicitacao.id_candidatura_tm ||
      null,

    id_utilizador:
      solicitacao.id_utilizador ||
      "",

    nome_completo:
      solicitacao.nome_completo ||
      solicitacao.nome ||
      "Consultor",

    email:
      solicitacao.email ||
      solicitacao.email_softinsa ||
      "Sem email",

    nome_badge:
      solicitacao.nome_badge ||
      "Badge sem nome",

    nome_nivel:
      solicitacao.nome_nivel ||
      "Sem nível",

    nome_area:
      solicitacao.nome_area ||
      "Sem área",

    nome_serviceline:
      solicitacao.nome_serviceline ||
      "Sem Service Line",

    data_submisao:
      solicitacao.data_submisao ||
      null,

    total_requisitos: Number(
      solicitacao.total_requisitos ||
        0
    ),

    requisitos_avaliados: Number(
      solicitacao
        .requisitos_avaliados ||
        0
    ),

    percentagem_progresso:
      Number(
        solicitacao
          .percentagem_progresso ||
          0
      ),

    estado_lista:
      solicitacao.estado_lista ||
      "POR_AVALIAR",

    texto_botao:
      solicitacao.texto_botao ||
      "Avaliar",

    renovacao_expirada:
      Boolean(
        solicitacao
          .renovacao_expirada
      ),
  };
}

/* =========================================================
   DATA RELATIVA
========================================================= */

function formatarDataRelativa(data) {
  if (!data) {
    return "Data não disponível";
  }

  const dataSubmissao =
    new Date(data);

  if (
    Number.isNaN(
      dataSubmissao.getTime()
    )
  ) {
    return "Data não disponível";
  }

  const agora =
    new Date();

  const diferenca =
    agora - dataSubmissao;

  const minutos =
    Math.floor(
      diferenca / 60000
    );

  const horas =
    Math.floor(
      minutos / 60
    );

  const dias =
    Math.floor(
      horas / 24
    );

  if (minutos < 1) {
    return "Submetido agora";
  }

  if (minutos < 60) {
    return `Submetido há ${minutos} minuto(s)`;
  }

  if (horas < 24) {
    return `Submetido há ${horas} hora(s)`;
  }

  if (dias < 30) {
    return `Submetido há ${dias} dia(s)`;
  }

  return `Submetido em ${dataSubmissao.toLocaleDateString(
    "pt-PT"
  )}`;
}

/* =========================================================
   PÁGINA
========================================================= */

function SolicitacoesBadgesTm() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    solicitacoes,
    setSolicitacoes,
  ] = useState([]);

  const [
    especializacao,
    setEspecializacao,
  ] = useState("");

  const [niveis, setNiveis] =
    useState([]);

  const [
    filtroNivel,
    setFiltroNivel,
  ] = useState("TODOS");

  const [
    pesquisaConsultor,
    setPesquisaConsultor,
  ] = useState("");

  const [
    ordenacao,
    setOrdenacao,
  ] = useState("MAIS_ANTIGAS");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    carregarSolicitacoes();
  }, []);

  async function carregarSolicitacoes() {
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
          `/tm/${idUtilizador}/solicitacoes`
        );

      const dados =
        response.data || {};

      setEspecializacao(
        dados.talentManager
          ?.especializacao_tm ||
          ""
      );

      setNiveis(
        Array.isArray(dados.niveis)
          ? dados.niveis
          : []
      );

      const lista =
        Array.isArray(
          dados.solicitacoes
        )
          ? dados.solicitacoes.map(
              normalizarSolicitacao
            )
          : [];

      setSolicitacoes(lista);
    } catch (err) {
      console.error(
        "Erro ao carregar solicitações do TM:",
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

      setSolicitacoes([]);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar as solicitações."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const solicitacoesFiltradas =
    useMemo(() => {
      let resultado = [
        ...solicitacoes,
      ];

      if (
        filtroNivel !==
        "TODOS"
      ) {
        resultado =
          resultado.filter(
            (solicitacao) =>
              solicitacao.nome_nivel ===
              filtroNivel
          );
      }

      const pesquisa =
        pesquisaConsultor
          .trim()
          .toLowerCase();

      if (pesquisa) {
        resultado =
          resultado.filter(
            (solicitacao) =>
              solicitacao
                .nome_completo
                .toLowerCase()
                .includes(pesquisa) ||
              solicitacao.email
                .toLowerCase()
                .includes(pesquisa) ||
              solicitacao.nome_badge
                .toLowerCase()
                .includes(pesquisa)
          );
      }

      resultado.sort(
        (a, b) => {
          if (
            ordenacao ===
            "MAIS_RECENTES"
          ) {
            return (
              new Date(
                b.data_submisao
              ) -
              new Date(
                a.data_submisao
              )
            );
          }

          if (
            ordenacao ===
            "NOME_ASC"
          ) {
            return a.nome_completo.localeCompare(
              b.nome_completo,
              "pt"
            );
          }

          if (
            ordenacao ===
            "PROGRESSO_DESC"
          ) {
            return (
              b.percentagem_progresso -
              a.percentagem_progresso
            );
          }

          return (
            new Date(
              a.data_submisao
            ) -
            new Date(
              b.data_submisao
            )
          );
        }
      );

      return resultado;
    }, [
      solicitacoes,
      filtroNivel,
      pesquisaConsultor,
      ordenacao,
    ]);

  function abrirAvaliacao(
    solicitacao
  ) {
    navigate(
      `/tm/solicitacoes/${solicitacao.id_candidatura_pedido}`,
      {
        state: {
          voltarPara:
            location.pathname,

          textoVoltar:
            "Voltar às solicitações",
        },
      }
    );
  }

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <TmLeftSidebar />

        <main style={conteudo}>
          <button
            type="button"
            onClick={() =>
              navigate("/tm")
            }
            style={voltarButton}
          >
            <BiArrowBack size={18} />
            Voltar
          </button>

          <div style={separador} />

          <div style={cabecalhoPagina}>
            <div>
                <h1 style={titulo}>
                Solicitação de Badges
                </h1>

                <div style={subtitulo}>
                Tem{" "}
                {solicitacoesFiltradas.length}{" "}
                {solicitacoesFiltradas.length === 1
                    ? "badge por validar"
                    : "badges por validar"}
                </div>

                {especializacao && (
                <div style={especializacaoTexto}>
                    Especialização:{" "}
                    <strong>
                    {especializacao}
                    </strong>
                </div>
                )}
            </div>
            </div>

            <div style={filtrosContainer}>
            <div style={filtroCampo}>
                <label style={filtroLabel}>
                <BiFilterAlt size={16} />
                Filtrar por nível
                </label>

                <select
                value={filtroNivel}
                onChange={(event) =>
                    setFiltroNivel(
                    event.target.value
                    )
                }
                style={inputFiltro}
                >
                <option value="TODOS">
                    Todos os níveis
                </option>

                {niveis.map((nivel) => (
                    <option
                    key={nivel}
                    value={nivel}
                    >
                    {nivel}
                    </option>
                ))}
                </select>
            </div>

            <div style={filtroCampo}>
                <label style={filtroLabel}>
                <BiSearch size={16} />
                Buscar consultor
                </label>

                <input
                type="text"
                value={pesquisaConsultor}
                onChange={(event) =>
                    setPesquisaConsultor(
                    event.target.value
                    )
                }
                placeholder="Nome do consultor..."
                style={inputFiltro}
                />
            </div>

            <div style={filtroCampo}>
                <label style={filtroLabel}>
                <BiSortAlt2 size={16} />
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
                <option value="MAIS_ANTIGAS">
                    Mais antigas
                </option>

                <option value="MAIS_RECENTES">
                    Mais recentes
                </option>

                <option value="NOME_ASC">
                    Nome A-Z
                </option>

                <option value="PROGRESSO_DESC">
                    Maior progresso
                </option>
                </select>
            </div>
            </div>

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
          )}

          {isLoading ? (
            <div style={mensagemBox}>
              A carregar solicitações...
            </div>
          ) : solicitacoesFiltradas.length >
            0 ? (
            <div style={lista}>
              {solicitacoesFiltradas.map(
                (solicitacao) => (
                  <SolicitacaoCard
                    key={
                      solicitacao.id_candidatura_pedido
                    }
                    solicitacao={
                      solicitacao
                    }
                    onAvaliar={() =>
                      abrirAvaliacao(
                        solicitacao
                      )
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div style={mensagemBox}>
              Não existem solicitações
              pendentes para esta
              especialização.
            </div>
          )}

          <div style={acoesRodape}>
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/tm/expiracao"
                )
              }
              style={acaoRodapeButton}
            >
              <BiTimeFive size={17} />

              Ver badges com expiração
              próxima
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/tm/historico"
                )
              }
              style={acaoRodapeButton}
            >
              <BiHistory size={17} />

              Ver histórico de
              candidaturas
            </button>
          </div>
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   CARD
========================================================= */

function SolicitacaoCard({
  solicitacao,
  onAvaliar,
}) {
  const emAvaliacao =
    solicitacao.estado_lista ===
    "EM_AVALIACAO";

  const progresso =
    Math.min(
      Math.max(
        solicitacao
          .percentagem_progresso,
        0
      ),
      100
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

        <div style={nomeConsultor}>
          {
            solicitacao
              .nome_completo
          }
        </div>

        <div style={emailConsultor}>
          {solicitacao.email}
        </div>
      </div>

      <div style={candidaturaArea}>
        <div style={linhaSuperior}>
          <div>
            <div style={nomeBadge}>
              <BiBookOpen size={17} />

              {solicitacao.nome_badge}

              {solicitacao.nome_nivel &&
                solicitacao.nome_nivel !==
                  "Sem nível" &&
                ` - ${solicitacao.nome_nivel}`}
            </div>

            <div style={areaBadge}>
              {
                solicitacao
                  .nome_area
              }
            </div>
          </div>

          <div style={acoesCard}>
            <span
              style={{
                ...estadoBadge,

                background:
                  emAvaliacao
                    ? "#fef3c7"
                    : "#fecdd3",

                color:
                  emAvaliacao
                    ? "#92400e"
                    : "#be123c",
              }}
            >
              {emAvaliacao
                ? "Em avaliação"
                : "Por avaliar"}
            </span>

            <button
              type="button"
              onClick={onAvaliar}
              style={avaliarButton}
            >
              <BiSearch size={16} />

              {
                solicitacao
                  .texto_botao
              }
            </button>
          </div>
        </div>

        <div style={progressoTitulo}>
          Progresso de Avaliação
        </div>

        <div style={progressoValores}>
          {
            solicitacao
              .requisitos_avaliados
          }{" "}
          /{" "}
          {
            solicitacao
              .total_requisitos
          }{" "}
          Requisitos Avaliados
        </div>

        <div style={barraFundo}>
          <div
            style={{
              ...barraProgresso,
              width: `${progresso}%`,
            }}
          />
        </div>

        <div style={dataSubmissao}>
          {formatarDataRelativa(
            solicitacao
              .data_submisao
          )}
        </div>
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

const titulo = {
  margin: 0,
  fontSize: 19,
  fontWeight: 800,
  color: "#111827",
};

const subtitulo = {
  marginTop: 2,
  fontSize: 12,
  color: "#111827",
};

const especializacaoTexto = {
  marginTop: 5,
  color: "#64748b",
  fontSize: 11,
};

const cabecalhoPagina = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 24,
  marginBottom: 24,
};

const filtrosContainer = {
  width: "100%",
  boxSizing: "border-box",
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: 16,
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 32,
  boxShadow:
    "0 2px 5px rgba(15, 23, 42, 0.05)",
};

const filtroCampo = {
  display: "flex",
  flexDirection: "column",
  gap: 7,
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
  background: "white",
  outline: "none",
  boxSizing: "border-box",
  fontSize: 12,
};

const lista = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 22,
  margin: 0,
};

const card = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 160,
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "18px 22px",
  display: "grid",
  gridTemplateColumns:
    "190px minmax(0, 1fr)",
  gap: 24,
  boxShadow:
    "0 2px 7px rgba(15, 23, 42, 0.06)",
};

const consultorArea = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
};

const avatar = {
  width: 58,
  height: 58,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const nomeConsultor = {
  marginTop: 7,
  color: "#111827",
  fontSize: 13,
  fontWeight: 500,
  textAlign: "center",
};

const emailConsultor = {
  marginTop: 1,
  color: "#64748b",
  fontSize: 10,
  textAlign: "center",
  overflowWrap: "anywhere",
};

const candidaturaArea = {
  position: "relative",
  minWidth: 0,
  minHeight: 120,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 10,
  padding: "14px 16px 28px",
  boxSizing: "border-box",
};

const linhaSuperior = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
};

const nomeBadge = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#2563eb",
  fontSize: 13,
  fontWeight: 500,
};

const areaBadge = {
  display: "inline-flex",
  marginTop: 4,
  padding: "3px 6px",
  background: "#dbeafe",
  color: "#2563eb",
  fontSize: 9,
};

const acoesCard = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 8,
  flexShrink: 0,
};

const estadoBadge = {
  borderRadius: 999,
  padding: "3px 10px",
  fontSize: 10,
  fontWeight: 500,
};

const avaliarButton = {
  minWidth: 120,
  minHeight: 38,
  border: "1px solid #94a3b8",
  borderRadius: 8,
  background: "#cbd5e1",
  color: "#1e293b",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 15px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow:
    "0 2px 4px rgba(15, 23, 42, 0.10)",
};

const progressoTitulo = {
  marginTop: 12,
  color: "#111827",
  fontSize: 11,
  fontWeight: 700,
};

const progressoValores = {
  color: "#475569",
  fontSize: 8,
};

const barraFundo = {
  width: "70%",
  height: 6,
  background: "#e5e7eb",
  borderRadius: 999,
  overflow: "hidden",
  marginTop: 3,
};

const barraProgresso = {
  height: "100%",
  background: "#2563eb",
  borderRadius: 999,
  transition: "width 0.25s",
};

const dataSubmissao = {
  position: "absolute",
  right: 13,
  bottom: 8,
  color: "#64748b",
  fontSize: 9,
};

const acoesRodape = {
  marginTop: 40,
  display: "flex",
  justifyContent: "center",
  gap: 18,
  flexWrap: "wrap",
};

const acaoRodapeButton = {
  minWidth: 245,
  minHeight: 44,
  border: "1px solid #94a3b8",
  borderRadius: 9,
  background: "#cbd5e1",
  color: "#1e293b",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "10px 18px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow:
    "0 2px 5px rgba(15, 23, 42, 0.10)",
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

const mensagemBox = {
  width: "100%",
  boxSizing: "border-box",
  margin: 0,
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#64748b",
};

export default SolicitacoesBadgesTm;