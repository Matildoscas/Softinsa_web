import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiFilterAlt,
  BiSearch,
  BiSortAlt2,
  BiUserCircle,
  BiEnvelope,
  BiBadge,
  BiShow,
  BiFile,
  BiSpreadsheet,
  BiHistory,
} from "react-icons/bi";

import {
  useNavigate,
} from "react-router-dom";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../../services/api.js";

import Header from "../../components/Header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";

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

function normalizarSolicitacao(
  solicitacao
) {
  return {
    id_candidatura_pedido:
      solicitacao
        .id_candidatura_pedido ||
      solicitacao.id ||
      "",

    id_badge_modelo:
      solicitacao.id_badge_modelo ||
      "",

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

    data_submissao:
      solicitacao.data_submissao ||
      null,

    estado:
      solicitacao
        .estado_candidatura_pedido ||
      "PENDENTE",

    nome_badge:
      solicitacao.nome_badge ||
      "Badge sem nome",

    descricao_badge_modelo:
      solicitacao
        .descricao_badge_modelo ||
      "",

    nome_nivel:
      solicitacao.nome_nivel ||
      "Sem nível",

    codigo_nivel:
      solicitacao.codigo_nivel ||
      "",

    nome_area:
      solicitacao.nome_area ||
      "Sem área",

    nome_serviceline:
      solicitacao.nome_serviceline ||
      "Service Line",

    pontos: Number(
      solicitacao.pontos || 0
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
    "pt-PT"
  );
}

function SolicitacoesBadgesSll() {
  const navigate = useNavigate();

  const [
    solicitacoes,
    setSolicitacoes,
  ] = useState([]);

  const [
    serviceLine,
    setServiceLine,
  ] = useState(null);

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
  ] = useState("RECENTES");

  const [isLoading, setIsLoading] =
    useState(true);

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
        `/sll/${idUtilizador}/solicitacoes`
      );

      const dados = response.data;

      setServiceLine(
        dados.serviceLine || null
      );

      const lista = Array.isArray(
        dados.solicitacoes
      )
        ? dados.solicitacoes.map(
            normalizarSolicitacao
          )
        : [];

      setSolicitacoes(lista);
    } catch (err) {
      console.error(
        "Erro ao carregar solicitações:",
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

      if (
        filtroNivel !== "TODOS"
      ) {
        resultado =
          resultado.filter(
            (solicitacao) =>
              String(
                solicitacao
                  .codigo_nivel
              ).toUpperCase() ===
              filtroNivel
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
            b.data_submissao
          ) -
          new Date(
            a.data_submissao
          )
        );
      });

      return resultado;
    }, [
      solicitacoes,
      filtroNivel,
      pesquisaConsultor,
      ordenacao,
    ]);

  function gerarPdf() {
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const nomeServiceLine =
        serviceLine
          ?.nome_serviceline ||
        "Service Line";

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(18);

      pdf.text(
        "Solicitações de Badges",
        14,
        16
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(10);

      pdf.text(
        `Service Line: ${nomeServiceLine}`,
        14,
        23
      );

      pdf.text(
        `Total: ${solicitacoesFiltradas.length}`,
        14,
        29
      );

      autoTable(pdf, {
        startY: 36,

        head: [
          [
            "Consultor",
            "Email",
            "Badge",
            "Nível",
            "Área",
            "Data",
            "Estado",
          ],
        ],

        body:
          solicitacoesFiltradas.map(
            (solicitacao) => [
              solicitacao.nome_completo,
              solicitacao.email,
              solicitacao.nome_badge,
              solicitacao.nome_nivel,
              solicitacao.nome_area,
              formatarData(
                solicitacao
                  .data_submissao
              ),
              solicitacao.estado,
            ]
          ),

        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: "linebreak",
          valign: "middle",
        },

        headStyles: {
          fillColor: [
            37,
            99,
            235,
          ],

          textColor: [
            255,
            255,
            255,
          ],

          fontStyle: "bold",
        },

        alternateRowStyles: {
          fillColor: [
            248,
            250,
            252,
          ],
        },

        margin: {
          left: 14,
          right: 14,
        },
      });

      pdf.save(
        "solicitacoes_badges.pdf"
      );
    } catch (err) {
      console.error(
        "Erro ao gerar PDF:",
        err
      );

      setErro(
        "Não foi possível gerar o PDF."
      );
    }
  }

  function exportarExcel() {
    const cabecalho = [
      "ID",
      "Consultor",
      "Email",
      "Badge",
      "Nível",
      "Área",
      "Data",
      "Estado",
    ];

    const linhas =
      solicitacoesFiltradas.map(
        (solicitacao) => [
          solicitacao
            .id_candidatura_pedido,

          solicitacao.nome_completo,
          solicitacao.email,
          solicitacao.nome_badge,
          solicitacao.nome_nivel,
          solicitacao.nome_area,

          formatarData(
            solicitacao
              .data_submissao
          ),

          solicitacao.estado,
        ]
      );

    const csv = [
      cabecalho,
      ...linhas,
    ]
      .map((linha) =>
        linha
          .map((valor) => {
            const texto = String(
              valor ?? ""
            ).replace(/"/g, '""');

            return `"${texto}"`;
          })
          .join(";")
      )
      .join("\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "solicitacoes_badges.csv";

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <SllLeftSidebar />

        <main style={conteudo}>
          {/* Zona fixa no topo */}

          <div style={cabecalhoFixo}>
            <button
              type="button"
              onClick={() =>
                navigate("/sll")
              }
              style={voltarButton}
            >
              <BiArrowBack
                size={17}
              />

              Voltar
            </button>

            <div
              style={tituloAcoesRow}
            >
              <div>
                <h1 style={titulo}>
                  Solicitações de Badges
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
                  Tem{" "}
                  {
                    solicitacoesFiltradas
                      .length
                  }{" "}
                  {solicitacoesFiltradas
                    .length === 1
                    ? "badge por validar"
                    : "badges por validar"}
                </div>
              </div>

              <div style={acoesTopo}>
                <button
                  type="button"
                  onClick={
                    exportarExcel
                  }
                  style={excelButton}
                >
                  <BiSpreadsheet
                    size={17}
                  />

                  Excel
                </button>

                <button
                  type="button"
                  onClick={gerarPdf}
                  style={pdfButton}
                >
                  <BiFile size={17} />
                  PDF
                </button>
              </div>
            </div>
          </div>

          {/* Filtros */}

          <div style={filtrosContainer}>
            <div style={filtroCampo}>
              <label style={filtroLabel}>
                <BiFilterAlt
                  size={16}
                />

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
                  Todos
                </option>

                <option value="A">
                  Nível A
                </option>

                <option value="B">
                  Nível B
                </option>

                <option value="C">
                  Nível C
                </option>

                <option value="D">
                  Nível D
                </option>

                <option value="E">
                  Nível E
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

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
          )}

          {isLoading ? (
            <div style={mensagemBox}>
              A carregar solicitações...
            </div>
          ) : solicitacoesFiltradas
              .length > 0 ? (
            <div style={lista}>
              {solicitacoesFiltradas.map(
                (solicitacao) => (
                  <SolicitacaoCard
                    key={
                      solicitacao
                        .id_candidatura_pedido
                    }
                    solicitacao={
                      solicitacao
                    }
                    onDetalhes={() =>
                      navigate(
                        `/sll/solicitacoes/${solicitacao.id_candidatura_pedido}`
                      )
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div style={mensagemBox}>
              Não existem solicitações
              pendentes nesta Service Line.
            </div>
          )}
          {!isLoading && (
            <div style={acoesRodape}>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/sll/historico-candidaturas"
                  )
                }
                style={historicoButton}
              >
                <BiHistory size={17} />
                Ver Histórico de Candidaturas
              </button>
            </div>
          )}
        </main>

        <SllRightSidebar />
      </div>
    </div>
  );
}

function SolicitacaoCard({
  solicitacao,
  onDetalhes,
}) {
  return (
    <article style={card}>
      <div style={cardPrincipal}>
        <div style={avatar}>
          <BiUserCircle
            size={48}
            color="#6092bf"
          />
        </div>

        <div style={consultorInfo}>
          <div style={linhaNome}>
            <span style={nomeConsultor}>
              {
                solicitacao
                  .nome_completo
              }
            </span>

            <span style={emailTexto}>
              <BiEnvelope size={15} />

              {solicitacao.email}
            </span>
          </div>

          <div style={dataTexto}>
            Solicitado em{" "}
            {formatarData(
              solicitacao
                .data_submissao
            )}
          </div>
        </div>
      </div>

      <div style={cardRodape}>
        <div style={badgePedido}>
          <BiBadge
            size={17}
            color="#2563eb"
          />

          <span>
            Solicitação de badge:{" "}
            <strong>
              {
                solicitacao
                  .nome_badge
              }
            </strong>

            {solicitacao
              .codigo_nivel && (
              <>
                {" "}
                — Nível{" "}
                {
                  solicitacao
                    .codigo_nivel
                }
              </>
            )}
          </span>
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
  padding: "0 28px 50px",
};

const cabecalhoFixo = {
  position: "sticky",
  top: 0,
  zIndex: 20,
  background: "#f3f4f6",
  padding: "20px 0 16px",
  borderBottom:
    "1px solid #e5e7eb",
};

const voltarButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  fontSize: 14,
  cursor: "pointer",
  marginBottom: 18,
};

const tituloAcoesRow = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 20,
};

const titulo = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
  color: "#111827",
};

const subtitulo = {
  marginTop: 3,
  fontSize: 12,
  color: "#64748b",
};

const totalTexto = {
  marginTop: 12,
  fontSize: 13,
  color: "#374151",
};

const acoesTopo = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 12,
};

const excelButton = {
  minWidth: 104,
  height: 42,
  border: "none",
  borderRadius: 9,
  background: "#16a34a",
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow:
    "0 2px 5px rgba(15, 23, 42, 0.13)",
};

const pdfButton = {
  minWidth: 104,
  height: 42,
  border: "none",
  borderRadius: 9,
  background: "#dc2626",
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow:
    "0 2px 5px rgba(15, 23, 42, 0.13)",
};

const filtrosContainer = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: 16,
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  margin: "20px 0",
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
  fontSize: 12,
  fontWeight: 600,
  color: "#475569",
};

const inputFiltro = {
  width: "100%",
  height: 42,
  border: "1px solid #dbe3ef",
  borderRadius: 9,
  padding: "0 12px",
  background: "white",
  outline: "none",
  boxSizing: "border-box",
  fontSize: 13,
};

const lista = {
  maxWidth: 900,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const card = {
  background: "white",
  border: "1px solid #bfdbfe",
  borderRadius: 11,
  overflow: "hidden",
  boxShadow:
    "0 2px 5px rgba(15, 23, 42, 0.05)",
};

const cardPrincipal = {
  padding: "14px 18px",
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const avatar = {
  width: 54,
  height: 54,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const consultorInfo = {
  flex: 1,
  minWidth: 0,
};

const linhaNome = {
  display: "flex",
  alignItems: "center",
  gap: 24,
  flexWrap: "wrap",
};

const nomeConsultor = {
  fontSize: 14,
  fontWeight: 600,
  color: "#111827",
};

const emailTexto = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  color: "#64748b",
};

const dataTexto = {
  marginTop: 3,
  fontSize: 11,
  color: "#64748b",
};

const cardRodape = {
  borderTop: "1px solid #e5e7eb",
  padding: "8px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
};

const badgePedido = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  color: "#475569",
  fontSize: 12,
};

const detalhesButton = {
  border: "none",
  borderRadius: 999,
  background: "#f1f5f9",
  color: "#334155",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "7px 13px",
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
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

const acoesRodape = {
  maxWidth: 900,
  margin: "22px auto 0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const historicoButton = {
  minHeight: 42,
  border: "1px solid #cbd5e1",
  borderRadius: 9,
  background: "white",
  color: "#334155",
  padding: "9px 18px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow:
    "0 2px 5px rgba(15, 23, 42, 0.14)",
};

export default SolicitacoesBadgesSll;