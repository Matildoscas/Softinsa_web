import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBadgeCheck,
  BiCalendar,
  BiCheck,
  BiChevronDown,
  BiChevronUp,
  BiFilterAlt,
  BiMedal,
  BiSearch,
  BiShow,
  BiSortAlt2,
  BiTimeFive,
  BiUserCircle,
  BiX,
} from "react-icons/bi";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "../../services/api.js";

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
   NORMALIZAÇÃO
========================================================= */

function normalizarHistorico(
  item,
  index
) {
  return {
    id_candidatura_historico:
      item.id_candidatura_historico ||
      item.id ||
      index,

    id_candidatura_pedido:
      item.id_candidatura_pedido ||
      null,

    id_utilizador:
      item.id_utilizador ||
      null,

    nome_completo:
      item.nome_completo ||
      "Consultor",

    email:
      item.email ||
      "Sem email",

    nome_badge:
      item.nome_badge ||
      "Badge sem nome",

    descricao_badge_modelo:
      item.descricao_badge_modelo ||
      "Sem descrição.",

    nome_nivel:
      item.nome_nivel ||
      "Sem nível",

    nome_area:
      item.nome_area ||
      "Sem área",

    nome_serviceline:
      item.nome_serviceline ||
      "Sem Service Line",

    pontos: Number(
      item.pontos || 0
    ),

    imagem:
      item.imagem ||
      null,

    estado_final:
      item.estado_final ||
      "SEM_ESTADO",

    motivo_estado_final:
      item.motivo_estado_final ||
      "",

    comentarios_tm:
      item.comentarios_tm ||
      "",

    comentarios_sll:
      item.comentarios_sll ||
      "",

    data_submissao:
      item.data_submissao ||
      item.data_submisao ||
      null,

    data_avaliacao_tm:
      item.data_avaliacao_tm ||
      null,

    data_avaliacao_sll:
      item.data_avaliacao_sll ||
      null,

    data_entrada_historico:
      item.data_entrada_historico ||
      null,

    numero_requisitos_completos:
      Number(
        item.numero_requisitos_completos ||
          0
      ),

    numero_requisitos_faltantes:
      Number(
        item.numero_requisitos_faltantes ||
          0
      ),

    duracao_dias:
      item.duracao_dias === null ||
      item.duracao_dias === undefined
        ? null
        : Number(item.duracao_dias),

    renovacao_expirada:
      Boolean(
        item.renovacao_expirada
      ),
  };
}

/* =========================================================
   DATAS
========================================================= */

function formatarData(data) {
  if (!data) {
    return "Não disponível";
  }

  const date =
    new Date(data);

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

/* =========================================================
   ESTADO
========================================================= */

function obterEstadoVisual(estado) {
  const valor = String(
    estado || ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toUpperCase();

  if (
    valor.includes("APROV")
  ) {
    return {
      texto: "Aprovado",
      background: "#dcfce7",
      color: "#15803d",
      border: "#86efac",
      icon: <BiCheck size={17} />,
    };
  }

  if (
    valor.includes("REJEIT") ||
    valor.includes("RECUS")
  ) {
    return {
      texto: "Recusado",
      background: "#fee2e2",
      color: "#dc2626",
      border: "#fca5a5",
      icon: <BiX size={17} />,
    };
  }

  return {
    texto:
      estado || "Sem estado",

    background: "#fef3c7",
    color: "#a16207",
    border: "#fde68a",
    icon: (
      <BiTimeFive size={17} />
    ),
  };
}

/* =========================================================
   PÁGINA
========================================================= */

function HistoricoCandidaturasTm() {
  const navigate =
    useNavigate();

  const location = useLocation();

  const [
    historico,
    setHistorico,
  ] = useState([]);

  const [
    especializacao,
    setEspecializacao,
  ] = useState("");

  const [estados, setEstados] =
    useState([]);

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
  ] = useState(
    "MAIS_RECENTES"
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

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
          `/tm/${idUtilizador}/historico`
        );

      const dados =
        response.data || {};

      setEspecializacao(
        dados.talentManager
          ?.especializacao_tm ||
          ""
      );

      setEstados(
        Array.isArray(dados.estados)
          ? dados.estados
          : []
      );

      const lista =
        Array.isArray(
          dados.historico
        )
          ? dados.historico.map(
              normalizarHistorico
            )
          : [];

      setHistorico(lista);
    } catch (err) {
      console.error(
        "Erro ao carregar histórico do TM:",
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

      setHistorico([]);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar o histórico de candidaturas."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const historicoFiltrado =
    useMemo(() => {
      let resultado = [
        ...historico,
      ];

      const textoPesquisa =
        pesquisa
          .trim()
          .toLowerCase();

      if (textoPesquisa) {
        resultado =
          resultado.filter(
            (item) =>
              item.nome_badge
                .toLowerCase()
                .includes(
                  textoPesquisa
                ) ||
              item.nome_area
                .toLowerCase()
                .includes(
                  textoPesquisa
                ) ||
              item.nome_serviceline
                .toLowerCase()
                .includes(
                  textoPesquisa
                ) ||
              item.descricao_badge_modelo
                .toLowerCase()
                .includes(
                  textoPesquisa
                )
          );
      }

      const textoConsultor =
        pesquisaConsultor
          .trim()
          .toLowerCase();

      if (textoConsultor) {
        resultado =
          resultado.filter(
            (item) =>
              item.nome_completo
                .toLowerCase()
                .includes(
                  textoConsultor
                ) ||
              item.email
                .toLowerCase()
                .includes(
                  textoConsultor
                )
          );
      }

      if (
        filtroEstado !==
        "TODOS"
      ) {
        resultado =
          resultado.filter(
            (item) =>
              String(
                item.estado_final
              ).toUpperCase() ===
              String(
                filtroEstado
              ).toUpperCase()
          );
      }

      resultado.sort(
        (a, b) => {
          if (
            ordenacao ===
            "MAIS_ANTIGAS"
          ) {
            return (
              new Date(
                a.data_entrada_historico ||
                  a.data_submissao ||
                  0
              ) -
              new Date(
                b.data_entrada_historico ||
                  b.data_submissao ||
                  0
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
            "BADGE_ASC"
          ) {
            return a.nome_badge.localeCompare(
              b.nome_badge,
              "pt"
            );
          }

          return (
            new Date(
              b.data_entrada_historico ||
                b.data_submissao ||
                0
            ) -
            new Date(
              a.data_entrada_historico ||
                a.data_submissao ||
                0
            )
          );
        }
      );

      return resultado;
    }, [
      historico,
      pesquisa,
      pesquisaConsultor,
      filtroEstado,
      ordenacao,
    ]);

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
                Histórico de Candidaturas
              </h1>

              <div style={subtitulo}>
                Total de{" "}
                {
                  historicoFiltrado.length
                }{" "}
                {historicoFiltrado.length ===
                1
                  ? "candidatura"
                  : "candidaturas"}
              </div>

              {especializacao && (
                <div
                  style={
                    especializacaoTexto
                  }
                >
                  Especialização:{" "}
                  <strong>
                    {especializacao}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* PESQUISA */}

          <div style={pesquisaBox}>
            <BiSearch
              size={19}
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
              placeholder="Buscar por badge, área ou Service Line..."
              style={pesquisaInput}
            />
          </div>

          {/* FILTROS */}

          <div
            style={
              filtrosContainer
            }
          >
            <div style={filtroCampo}>
              <label style={filtroLabel}>
                <BiFilterAlt
                  size={16}
                />

                Filtrar por estado
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
                  Todos os estados
                </option>

                {estados.map(
                  (estado) => (
                    <option
                      key={estado}
                      value={estado}
                    >
                      {obterEstadoVisual(
                        estado
                      ).texto}
                    </option>
                  )
                )}
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
                placeholder="Nome ou email do consultor..."
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
                <option value="MAIS_RECENTES">
                  Mais recentes
                </option>

                <option value="MAIS_ANTIGAS">
                  Mais antigas
                </option>

                <option value="NOME_ASC">
                  Consultor A-Z
                </option>

                <option value="BADGE_ASC">
                  Badge A-Z
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
              A carregar histórico...
            </div>
          ) : historicoFiltrado.length >
            0 ? (
            <div style={lista}>
              {historicoFiltrado.map(
                (item) => (
                  <HistoricoCard
                    key={
                        item.id_candidatura_historico
                    }
                    item={item}
                    onDetalhes={() =>
                        navigate(
                        `/tm/historico/${item.id_candidatura_historico}`,
                        {
                            state: {
                            voltarPara:
                                location.pathname,

                            textoVoltar:
                                "Voltar ao histórico de candidaturas",
                            },
                        }
                        )
                    }
                    />
                )
              )}
            </div>
          ) : (
            <div style={mensagemBox}>
              Não foram encontradas
              candidaturas no histórico.
            </div>
          )}
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   CARD DO HISTÓRICO
========================================================= */

function HistoricoCard({
  item,
  onDetalhes,
}) {
  const estado =
    obterEstadoVisual(
      item.estado_final
    );

  return (
    <article style={card}>
      <div style={cardPrincipal}>
        <div style={consultorArea}>
          <div style={avatar}>
            <BiUserCircle
              size={53}
              color="#6092bf"
            />
          </div>

          <div style={nomeConsultor}>
            {item.nome_completo}
          </div>

          <div style={cargoConsultor}>
            Consultor
          </div>

          <div style={emailConsultor}>
            {item.email}
          </div>
        </div>

        <div style={badgeArea}>
          <div style={badgeImagemBox}>
            {item.imagem ? (
              <img
                src={item.imagem}
                alt={item.nome_badge}
                style={badgeImagem}
              />
            ) : (
              <BiMedal
                size={30}
                color="#2563eb"
              />
            )}
          </div>

          <div style={badgeInfo}>
            <div style={badgeNome}>
              {item.nome_badge}

              {item.nome_nivel &&
                item.nome_nivel !==
                  "Sem nível" &&
                ` - ${item.nome_nivel}`}
            </div>

            <div style={badgeDescricao}>
              {
                item
                  .descricao_badge_modelo
              }
            </div>

            <div style={chipsLinha}>
              <span style={areaChip}>
                {item.nome_area}
              </span>

              {item.renovacao_expirada && (
                <span
                  style={
                    renovacaoChip
                  }
                >
                  Renovação
                </span>
              )}
            </div>

            <div style={datasResumo}>
              <span>
                Solicitado em{" "}
                {formatarData(
                  item.data_submissao
                )}
              </span>

              <span>
                Entrada no histórico em{" "}
                {formatarData(
                  item
                    .data_entrada_historico
                )}
              </span>
            </div>
          </div>
        </div>

        <div style={acoesArea}>
          <div
            style={{
              ...estadoFinal,

              background:
                estado.background,

              color: estado.color,

              border:
                `1px solid ${estado.border}`,
            }}
          >
            {estado.icon}
            {estado.texto}
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

    </article>
  );
}

function DetalheItem({
  icon,
  label,
  value,
}) {
  return (
    <div style={detalheItem}>
      <div style={detalheIcon}>
        {icon}
      </div>

      <div>
        <div style={detalheLabel}>
          {label}
        </div>

        <div style={detalheValue}>
          {value}
        </div>
      </div>
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
  fontSize: 14,
  cursor: "pointer",
};

const separador = {
  height: 1,
  background: "#d1d5db",
  margin: "16px 0 20px",
};

const cabecalhoPagina = {
  marginBottom: 22,
};

const titulo = {
  margin: 0,
  fontSize: 21,
  fontWeight: 800,
  color: "#111827",
};

const subtitulo = {
  marginTop: 3,
  color: "#475569",
  fontSize: 12,
};

const especializacaoTexto = {
  marginTop: 5,
  color: "#64748b",
  fontSize: 11,
};

const pesquisaBox = {
  width: "100%",
  minHeight: 50,
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: "0 16px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 16,
  boxShadow:
    "0 2px 5px rgba(15,23,42,0.05)",
};

const pesquisaInput = {
  flex: 1,
  minWidth: 0,
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#111827",
  fontSize: 13,
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
  marginBottom: 28,
  boxShadow:
    "0 2px 5px rgba(15,23,42,0.05)",
};

const filtroCampo = {
  display: "flex",
  flexDirection: "column",
  gap: 7,
  minWidth: 0,
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
  boxSizing: "border-box",
  border: "1px solid #dbe3ef",
  borderRadius: 9,
  background: "white",
  padding: "0 11px",
  outline: "none",
  color: "#111827",
  fontSize: 12,
};

const lista = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 20,
};

const card = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow:
    "0 2px 7px rgba(15,23,42,0.05)",
};

const cardPrincipal = {
  minHeight: 170,
  display: "grid",
  gridTemplateColumns:
    "190px minmax(0, 1fr) 170px",
  gap: 22,
  alignItems: "center",
  padding: "18px 20px",
};

const consultorArea = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
};

const avatar = {
  width: 62,
  height: 62,
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
  fontWeight: 600,
  textAlign: "center",
};

const cargoConsultor = {
  marginTop: 2,
  color: "#64748b",
  fontSize: 10,
};

const emailConsultor = {
  marginTop: 2,
  color: "#64748b",
  fontSize: 10,
  textAlign: "center",
  overflowWrap: "anywhere",
};

const badgeArea = {
  minWidth: 0,
  minHeight: 115,
  boxSizing: "border-box",
  display: "grid",
  gridTemplateColumns:
    "58px minmax(0, 1fr)",
  gap: 15,
  alignItems: "center",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 10,
  padding: "14px 16px",
};

const badgeImagemBox = {
  width: 55,
  height: 55,
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
};

const badgeInfo = {
  minWidth: 0,
};

const badgeNome = {
  color: "#2563eb",
  fontSize: 14,
  fontWeight: 600,
};

const badgeDescricao = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 11,
  lineHeight: 1.45,
};

const chipsLinha = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  flexWrap: "wrap",
  marginTop: 7,
};

const areaChip = {
  display: "inline-flex",
  background: "#dbeafe",
  color: "#2563eb",
  padding: "4px 8px",
  fontSize: 9,
  borderRadius: 4,
};

const renovacaoChip = {
  display: "inline-flex",
  background: "#fef3c7",
  color: "#a16207",
  padding: "4px 8px",
  fontSize: 9,
  borderRadius: 4,
};

const datasResumo = {
  marginTop: 9,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  color: "#64748b",
  fontSize: 9,
};

const acoesArea = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 12,
};

const estadoFinal = {
  minHeight: 39,
  borderRadius: 9,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 13px",
  fontSize: 12,
  fontWeight: 600,
};

const detalhesButton = {
  minHeight: 41,
  border: "1px solid #94a3b8",
  borderRadius: 8,
  background: "#cbd5e1",
  color: "#1e293b",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 13px",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow:
    "0 2px 4px rgba(15,23,42,0.09)",
};

const detalhesArea = {
  borderTop: "1px solid #e5e7eb",
  background: "#f8fafc",
  padding: "18px 22px",
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: 16,
};

const detalheItem = {
  minHeight: 62,
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 9,
  padding: "11px 13px",
};

const detalheIcon = {
  color: "#2563eb",
  marginTop: 2,
};

const detalheLabel = {
  color: "#94a3b8",
  fontSize: 10,
};

const detalheValue = {
  marginTop: 3,
  color: "#334155",
  fontSize: 12,
  fontWeight: 600,
};

const comentarioBox = {
  gridColumn: "1 / -1",
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 9,
  padding: "12px 14px",
  color: "#334155",
  fontSize: 12,
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
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#64748b",
};

export default HistoricoCandidaturasTm;