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
  BiMedal,
  BiHistory,
} from "react-icons/bi";

import {
  useNavigate,
} from "react-router-dom";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../../services/api.js";
import DebugBadgePanel from "../../components/DebugBadgePanel.jsx";

import Header from "../../components/Header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";
import PaginacaoCatalogo from "../../components/PaginacaoCatalogo.jsx";

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

    id_candidatura_sll:
      solicitacao
        .id_candidatura_sll ||
      null,

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
      solicitacao.data_submisao ||
      null,

    data_rececao_sll:
      solicitacao.data_rececao_sll ||
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

    debug: solicitacao.debug || null,
  };
}

function estadoCancelado(estado) {
  const valor = String(
    estado || ""
  )
    .trim()
    .toUpperCase();

  return (
    valor === "CANCELADA" ||
    valor === "CANCELADO"
  );
}

function formatarData(data) {
  if (!data) {
    return "Data não disponível";
  }

  const valor = String(data).trim();
  if (!valor) {
    return "Data não disponível";
  }

  const tryParse = (input) => {
    const date = new Date(input);
    return Number.isNaN(date.getTime())
      ? null
      : date;
  };

  let date = tryParse(valor);

  if (!date) {
    const iso = valor.replace(/\s+/g, "T");
    date = tryParse(iso);
  }

  if (!date) {
    const semMilissegundos = valor.replace(/\.\d+/, "");
    date = tryParse(semMilissegundos);
  }

  if (!date) {
    const apenasData = valor.split(" ")[0];
    date = tryParse(apenasData);
  }

  if (!date) {
    return "Data não disponível";
  }

  return date.toLocaleDateString("pt-PT");
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

  const [
    paginaAtual,
    setPaginaAtual,
  ] = useState(1);

  const itensPorPagina = 5;

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

      resultado = resultado.filter(
        (solicitacao) =>
          !estadoCancelado(
            solicitacao.estado
          )
      );

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
              a.data_rececao_sll ||
                a.data_submissao
            ) -
            new Date(
              b.data_rececao_sll ||
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
            b.data_rececao_sll ||
              b.data_submissao
          ) -
          new Date(
            a.data_rececao_sll ||
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

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        solicitacoesFiltradas.length /
        itensPorPagina
      )
    );

  const inicioPagina =
    (paginaAtual - 1) *
    itensPorPagina;

  const solicitacoesPaginaAtual =
    solicitacoesFiltradas.slice(
      inicioPagina,
      inicioPagina + itensPorPagina
    );

  useEffect(() => {
    setPaginaAtual(1);
  }, [
    filtroNivel,
    pesquisaConsultor,
    ordenacao,
  ]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [
    paginaAtual,
    totalPaginas,
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
                  .data_rececao_sll ||
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
              .data_rececao_sll ||
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
          ) : solicitacoesFiltradas.length > 0 ? (
            <>
              <div style={lista}>
                {solicitacoesPaginaAtual.map(
                  (solicitacao) => (
                    <CandidaturaCardUniversal
                      key={
                        solicitacao.id_candidatura_sll ||
                        solicitacao.id_candidatura_pedido
                      }
                      dados={solicitacao}
                      role = "tm"
                      onClick={() =>
                        navigate(
                          `/sll/solicitacoes/${solicitacao.id_candidatura_pedido}${
                            solicitacao.id_candidatura_sll
                              ? `?sid=${encodeURIComponent(
                                  solicitacao.id_candidatura_sll
                                )}`
                              : ""
                          }`
                        )
                      }
                    />
                  )
                )}
              </div>

              <PaginacaoCatalogo
                paginaAtual={paginaAtual}
                totalPaginas={totalPaginas}
                onAnterior={() =>
                  setPaginaAtual((pagina) =>
                    Math.max(1, pagina - 1)
                  )
                }
                onProxima={() =>
                  setPaginaAtual((pagina) =>
                    Math.min(totalPaginas, pagina + 1)
                  )
                }
                onSelecionarPagina={setPaginaAtual}
              />
            </>
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

function CandidaturaCardUniversal({ dados, onClick, role = "tm" }) {
  // 1. Normalização dos dados do Consultor (Funciona para TM e SLL)
  const nome = dados.nome_consultor || dados.nome_utilizador || dados.nome_completo || "Consultor";
  const email = dados.email_consultor || dados.email || "";
  
  // 2. Tempo/Data de Submissão
  const tempoTexto = dados.dias_passados !== undefined 
    ? `Submetido há ${dados.dias_passados} dias`
    : `Solicitado em ${dados.data_rececao_sll || dados.data_submissao || ""}`;

  // 3. Informações do Badge
  const badgeNome = dados.nome_badge || dados.nome || "Badge Especificado";
  const areaNome = dados.nome_area || dados.service_line || dados.area || "";
  const nivel = dados.codigo_nivel || null;

  // 4. Tratamento da Imagem do Badge
  const imagemPath = dados.imagem_badge || dados.badge_imagem || dados.imagem;
  const badgeImagemUrl = imagemPath
    ? (imagemPath.startsWith("http") ? imagemPath : `https://softinsa-api.onrender.com${imagemPath}`)
    : null;

  // 5. Estado e Progresso (Mecanismo do TM) - CÓDIGO ATUALIZADO AQUI
  const estado = dados.estado_validacao || dados.estado_candidatura_pedido || dados.estado || "Por avaliar";
  const isEmAvaliacao = estado === "Em avaliação" || estado === "EM_AVALIACAO";

  const totalEvidencias = Number(dados.total_requisitos || dados.total_evidencias || 0);
  const evidenciasAvalia = Number(dados.requisitos_avaliados || dados.evidencias_avaliadas || 0);
  const temProgresso = totalEvidencias > 0;
  const percentagemProgresso = totalEvidencias > 0 
    ? Math.round((evidenciasAvalia / totalEvidencias) * 100)
    : 0;

  return (
    <div style={styles.card}>
      
      {/* Coluna 1: Perfil do Consultor */}
      <div style={styles.userSection}>
        <div style={styles.avatarCircle}>
          <BiUserCircle size={40} color="#6092bf" />
        </div>
        <div style={styles.userTextGroup}>
          <div style={styles.userName}>{nome}</div>
          <div style={styles.userEmail}>
            <BiEnvelope size={13} style={{ marginRight: "4px" }} />
            {email}
          </div>
          <div style={styles.submissionDate}>{tempoTexto}</div>
        </div>
      </div>

      {/* Coluna 2: Informação do Badge, Nível e Área */}
      <div style={styles.infoSection}>
        <div style={styles.badgeHeader}>
          <div style={styles.badgeIconWrapper}>
            {badgeImagemUrl ? (
              <img src={badgeImagemUrl} alt={badgeNome} style={styles.badgeImg} />
            ) : (
              <BiMedal size={32} color="#2563EB" />
            )}
          </div>
          <div>
            <div style={styles.badgeTitle}>
              {badgeNome}
              {nivel && <span style={styles.nivelBadge}>Nível {nivel}</span>}
            </div>
            {areaNome && <div style={styles.serviceLine}>{areaNome}</div>}
          </div>
        </div>

        {/* Só mostra a barra de progresso se houver dados de evidências (comum no TM) */}
        {temProgresso && (
          <div style={styles.progressContainer}>
            <div style={styles.progressHeader}>
              <span style={styles.progressLabel}>Progresso de Avaliação</span>
              <span style={styles.progressValue}>{percentagemProgresso}%</span>
            </div>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${percentagemProgresso}%` }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Coluna 3: Estado, Ferramentas de Debug e Ações */}
      <div style={styles.actionSection}>
        <div style={styles.topActions}>
          <span style={{
            ...styles.statusTag,
            backgroundColor: isEmAvaliacao ? "#FFedd5" : "#Fce7f3",
            color: isEmAvaliacao ? "#C2410c" : "#Be185d",
          }}>
            {estado}
          </span>
          
          {/* Se o componente Debug do SLL existir nos teus imports, ele renderiza aqui de forma limpa */}
          {typeof DebugBadgePanel !== "undefined" && (
            <DebugBadgePanel badge={dados} variant="solicitacao" />
          )}
        </div>
        
        <button type="button" style={styles.btnAction} onClick={onClick}>
          {role === "sll" ? (
            <>
              <BiShow size={16} style={{ marginRight: "6px" }} />
              Ver Detalhes
            </>
          ) : isEmAvaliacao ? (
            "Continuar Avaliação"
          ) : (
            "Avaliar"
          )}
        </button>
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

const styles = {
  card: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "16px 24px",
    marginBottom: "16px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    border: "1px solid #f1f5f9",
    gap: "24px",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: "250px",
    flex: "1",
  },
  avatarCircle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f4f8",
    borderRadius: "50%",
    padding: "6px",
  },
  userTextGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  userName: {
    fontWeight: "600",
    color: "#1e293b",
    fontSize: "15px",
  },
  userEmail: {
    display: "flex",
    alignItems: "center",
    color: "#64748b",
    fontSize: "13px",
  },
  submissionDate: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "2px",
  },
  infoSection: {
    flex: "2",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minWidth: "300px",
  },
  badgeHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  badgeIconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
  },
  badgeImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  badgeTitle: {
    fontWeight: "600",
    color: "#0f172a",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  nivelBadge: {
    fontSize: "11px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    padding: "2px 8px",
    borderRadius: "20px",
    fontWeight: "500",
  },
  serviceLine: {
    fontSize: "12px",
    color: "#64748b",
  },
  progressContainer: {
    width: "100%",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    marginBottom: "4px",
  },
  progressLabel: {
    color: "#64748b",
  },
  progressValue: {
    fontWeight: "600",
    color: "#2563eb",
  },
  progressBarBg: {
    width: "100%",
    height: "6px",
    backgroundColor: "#f1f5f9",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },
  actionSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "12px",
    minWidth: "180px",
    flex: "1",
  },
  topActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusTag: {
    fontSize: "12px",
    fontWeight: "500",
    padding: "4px 10px",
    borderRadius: "6px",
    textTransform: "capitalize",
  },
  btnAction: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    color: "#ffffff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    width: "100%",
    transition: "background 0.2s",
  }
};

export default SolicitacoesBadgesSll;