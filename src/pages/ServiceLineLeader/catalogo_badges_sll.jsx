import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiSearch,
  BiFilterAlt,
  BiSortAlt2,
  BiFile,
  BiSpreadsheet,
  BiMedal,
  BiX,
  BiCertification,
} from "react-icons/bi";

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import { useNavigate } from "react-router-dom";

import api from "../../services/api.js";

import Header from "../../components/header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";

/* =========================================================
   DADOS DO UTILIZADOR
========================================================= */

function obterUtilizadorGuardado() {
  const utilizadorGuardado =
    localStorage.getItem("user");

  if (!utilizadorGuardado) {
    return null;
  }

  try {
    return JSON.parse(utilizadorGuardado);
  } catch (err) {
    console.error(
      "Erro ao ler utilizador guardado:",
      err
    );

    return null;
  }
}

/* =========================================================
   NORMALIZAÇÃO DOS BADGES
========================================================= */

function normalizarBadge(badge) {
  return {
    id_badge_modelo:
      badge.id_badge_modelo ||
      badge.ID_BADGE_MODELO ||
      badge.id ||
      "",

    nome_badge:
      badge.nome_badge ||
      badge.NOME_BADGE ||
      badge.nome ||
      "Badge sem nome",

    descricao_badge_modelo:
      badge.descricao_badge_modelo ||
      badge.DESCRICAO_BADGE_MODELO ||
      badge.descricao ||
      "Sem descrição.",

    pontos: Number(
      badge.pontos ||
      badge.PONTOS ||
      0
    ),

    numero_requisitos: Number(
      badge.numero_requisitos ||
      badge.total_requisitos ||
      badge.NUMERO_REQUISITOS ||
      0
    ),

    tipo_badge:
      badge.tipo_badge ||
      badge.TIPO_BADGE ||
      "NORMAL",

    estado_badge_modelo:
      badge.estado_badge_modelo ||
      badge.ESTADO_BADGE_MODELO ||
      "ATIVO",

    nome_serviceline:
      badge.nome_serviceline ||
      badge.NOME_SERVICELINE ||
      "Service Line",

    nome_nivel:
      badge.nome_nivel ||
      badge.NOME_NIVEL ||
      "Sem nível",

    codigo_nivel:
      badge.codigo_nivel ||
      badge.CODIGO_NIVEL ||
      "",

    nome_areas:
      badge.nome_areas ||
      badge.nome_area ||
      badge.NOME_AREA ||
      "Sem área associada",

    imagem:
      badge.imagem ||
      badge.imagem_url ||
      badge.IMAGEM ||
      null,

    tempo_expiracao:
      badge.tempo_expiracao ||
      badge.TEMPO_EXPIRACAO ||
      null,
  };
}

/* =========================================================
   PÁGINA PRINCIPAL
========================================================= */

function CatalogoBadgesSll() {
  const navigate = useNavigate();

  const [badges, setBadges] = useState([]);
  const [serviceLine, setServiceLine] =
    useState(null);

  const [pesquisa, setPesquisa] =
    useState("");

  const [filtro, setFiltro] =
    useState("TODOS");

  const [ordenacao, setOrdenacao] =
    useState("NOME_ASC");

  const [isLoading, setIsLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    carregarBadges();
  }, []);

  /* =======================================================
     CARREGAR BADGES
  ======================================================= */

  async function carregarBadges() {
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
        `/sll/${idUtilizador}/badges`
      );

      console.log(
        "CATÁLOGO SLL:",
        response.data
      );

      const dados = response.data;

      setServiceLine(
        dados.serviceLine || null
      );

      const lista = Array.isArray(
        dados.badges
      )
        ? dados.badges.map(
            normalizarBadge
          )
        : [];

      setBadges(lista);
    } catch (err) {
      console.error(
        "Erro ao carregar catálogo SLL:",
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

      setBadges([]);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar o catálogo de badges."
      );
    } finally {
      setIsLoading(false);
    }
  }

  /* =======================================================
     FILTROS E ORDENAÇÃO
  ======================================================= */

  const badgesFiltrados = useMemo(() => {
    let resultado = [...badges];

    const textoPesquisa = pesquisa
      .trim()
      .toLowerCase();

    if (textoPesquisa) {
      resultado = resultado.filter(
        (badge) =>
          badge.nome_badge
            .toLowerCase()
            .includes(textoPesquisa) ||
          badge.descricao_badge_modelo
            .toLowerCase()
            .includes(textoPesquisa) ||
          badge.nome_areas
            .toLowerCase()
            .includes(textoPesquisa) ||
          badge.nome_nivel
            .toLowerCase()
            .includes(textoPesquisa)
      );
    }

    if (filtro === "NORMAL") {
      resultado = resultado.filter(
        (badge) =>
          String(
            badge.tipo_badge
          ).toUpperCase() !== "ESPECIAL"
      );
    }

    if (filtro === "ESPECIAL") {
      resultado = resultado.filter(
        (badge) =>
          String(
            badge.tipo_badge
          ).toUpperCase() === "ESPECIAL"
      );
    }

    if (
      ["A", "B", "C", "D", "E"].includes(
        filtro
      )
    ) {
      resultado = resultado.filter(
        (badge) =>
          String(
            badge.codigo_nivel
          ).toUpperCase() === filtro
      );
    }

    resultado.sort((a, b) => {
      if (
        ordenacao === "NOME_DESC"
      ) {
        return b.nome_badge.localeCompare(
          a.nome_badge,
          "pt"
        );
      }

      if (
        ordenacao === "PONTOS_DESC"
      ) {
        return b.pontos - a.pontos;
      }

      if (
        ordenacao === "PONTOS_ASC"
      ) {
        return a.pontos - b.pontos;
      }

      return a.nome_badge.localeCompare(
        b.nome_badge,
        "pt"
      );
    });

    return resultado;
  }, [
    badges,
    pesquisa,
    filtro,
    ordenacao,
  ]);

  /* =======================================================
     EXPORTAÇÕES
  ======================================================= */

  function gerarPdf() {
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const nomeServiceLine =
        serviceLine?.nome_serviceline ||
        "Service Line";

      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");

      pdf.text(
        "Catálogo de Badges",
        14,
        16
      );

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      pdf.text(
        `Service Line: ${nomeServiceLine}`,
        14,
        23
      );

      pdf.text(
        `Total de badges: ${badgesFiltrados.length}`,
        14,
        29
      );

      autoTable(pdf, {
        startY: 36,

        head: [
          [
            "Badge",
            "Área",
            "Nível",
            "Pontos",
            "Requisitos",
            "Tipo",
          ],
        ],

        body: badgesFiltrados.map(
          (badge) => [
            badge.nome_badge,
            badge.nome_areas,
            badge.nome_nivel,
            badge.pontos,
            badge.numero_requisitos,
            badge.tipo_badge,
          ]
        ),

        styles: {
          fontSize: 8,
          cellPadding: 3,
          overflow: "linebreak",
          valign: "middle",
        },

        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },

        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },

        columnStyles: {
          0: {
            cellWidth: 58,
          },
          1: {
            cellWidth: 60,
          },
          2: {
            cellWidth: 35,
          },
          3: {
            cellWidth: 24,
            halign: "center",
          },
          4: {
            cellWidth: 28,
            halign: "center",
          },
          5: {
            cellWidth: 30,
            halign: "center",
          },
        },

        margin: {
          left: 14,
          right: 14,
        },

        didDrawPage: () => {
          const numeroPagina =
            pdf.getNumberOfPages();

          pdf.setFontSize(8);
          pdf.setTextColor(100);

          pdf.text(
            `Página ${numeroPagina}`,
            pdf.internal.pageSize.getWidth() -
              28,
            pdf.internal.pageSize.getHeight() -
              8
          );
        },
      });

      const nomeFicheiro = String(
        nomeServiceLine
      )
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();

      pdf.save(
        `catalogo_badges_${nomeFicheiro || "service_line"}.pdf`
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
      "Badge",
      "Service Line",
      "Áreas",
      "Nível",
      "Pontos",
      "Requisitos",
      "Tipo",
    ];

    const linhas =
      badgesFiltrados.map(
        (badge) => [
          badge.id_badge_modelo,
          badge.nome_badge,
          badge.nome_serviceline,
          badge.nome_areas,
          badge.nome_nivel,
          badge.pontos,
          badge.numero_requisitos,
          badge.tipo_badge,
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
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "catalogo_badges_service_line.csv";

    document.body.appendChild(link);

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  /* =======================================================
     RENDERIZAÇÃO
  ======================================================= */

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <SllLeftSidebar />

        <main style={conteudo}>
          {/* Voltar */}

          <button
            type="button"
            onClick={() =>
              navigate("/sll")
            }
            style={voltarButton}
          >
            <BiArrowBack size={17} />
            Voltar
          </button>

          {/* Cabeçalho */}

          <div style={cabecalhoPagina}>
            <div>
              <h2 style={titulo}>
                Catálogo de Badges
              </h2>

              <div style={subtitulo}>
                Total de{" "}
                {badgesFiltrados.length}{" "}
                {badgesFiltrados.length ===
                1
                  ? "badge"
                  : "badges"}
              </div>
            </div>

            <div style={acoesTopo}>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/sll/certificados"
                  )
                }
                style={certificadoButton}
              >
                <BiCertification
                  size={17}
                />

                Gerar Certificado
                Personalizado
              </button>

              <button
                type="button"
                onClick={exportarExcel}
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

          {/* Pesquisa principal */}

          <div style={pesquisaLinha}>
            <div style={pesquisaBox}>
              <BiSearch
                size={19}
                color="#94a3b8"
              />

              <input
                value={pesquisa}
                onChange={(event) =>
                  setPesquisa(
                    event.target.value
                  )
                }
                placeholder="Buscar badges..."
                style={pesquisaInput}
              />
            </div>
          </div>

          {/* Filtros */}

          <div style={filtrosContainer}>
            <div style={filtroCampo}>
              <label style={filtroLabel}>
                <BiFilterAlt size={16} />
                Filtrar por
              </label>

              <select
                value={filtro}
                onChange={(event) =>
                  setFiltro(
                    event.target.value
                  )
                }
                style={selectFiltro}
              >
                <option value="TODOS">
                  Todos
                </option>

                <option value="NORMAL">
                  Normais
                </option>

                <option value="ESPECIAL">
                  Especiais
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
                style={selectFiltro}
              >
                <option value="NOME_ASC">
                  Nome A-Z
                </option>

                <option value="NOME_DESC">
                  Nome Z-A
                </option>

                <option value="PONTOS_DESC">
                  Mais pontos
                </option>

                <option value="PONTOS_ASC">
                  Menos pontos
                </option>
              </select>
            </div>
          </div>

          {/* Informação da Service Line */}

          <div style={serviceLineInfoRow}>
            <div style={serviceLineInfo}>
              Catálogo limitado à Service
              Line:{" "}
              <strong>
                {serviceLine
                  ?.nome_serviceline ||
                  "Service Line"}
              </strong>
            </div>
          </div>

          {/* Erro */}

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
          )}

          {/* Conteúdo */}

          {isLoading ? (
            <div style={loadingBox}>
              A carregar badges...
            </div>
          ) : badgesFiltrados.length >
            0 ? (
            <div style={listaBadges}>
              {badgesFiltrados.map(
                (badge) => (
                  <BadgeCard
                    key={
                      badge.id_badge_modelo
                    }
                    badge={badge}
                    onConsultar={() =>
                      navigate(
                        `/sll/badges/${badge.id_badge_modelo}`
                      )
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div style={loadingBox}>
              Não foram encontrados badges
              nesta Service Line.
            </div>
          )}
        </main>

        <SllRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   CARD DO BADGE
========================================================= */

function BadgeCard({
  badge,
  onConsultar,
}) {
  const especial =
    String(
      badge.tipo_badge
    ).toUpperCase() === "ESPECIAL";

  return (
    <article
      style={{
        ...badgeCard,

        background: especial
          ? "#fff3cd"
          : "white",

        border: especial
          ? "1px solid #f59e0b"
          : "1px solid #e5e7eb",
      }}
    >
      <div style={serviceLineTexto}>
        Service Line:{" "}
        <span style={serviceLineLink}>
          {badge.nome_serviceline}
        </span>
      </div>

      <div style={badgeConteudo}>
        {/* Imagem */}

        <div
          style={{
            ...badgeImagemBox,

            background: especial
              ? "#ff8a00"
              : "#eff6ff",

            border: especial
              ? "2px solid #f59e0b"
              : "2px solid #dbeafe",
          }}
        >
          {badge.imagem ? (
            <img
              src={badge.imagem}
              alt={badge.nome_badge}
              style={badgeImagem}
            />
          ) : (
            <BiMedal
              size={34}
              color={
                especial
                  ? "white"
                  : "#2563eb"
              }
            />
          )}
        </div>

        {/* Informação */}

        <div style={badgeInfo}>
          <div style={badgeNome}>
            {badge.nome_badge}
          </div>

          <div style={badgeDescricao}>
            {
              badge.descricao_badge_modelo
            }
          </div>

          <div style={areasTexto}>
            Áreas: {badge.nome_areas}
          </div>

          <span
            style={{
              ...nivelBadge,

              background: especial
                ? "#ff8a00"
                : "#eff6ff",

              color: especial
                ? "white"
                : "#2563eb",
            }}
          >
            {especial
              ? "Especial"
              : badge.nome_nivel}
          </span>
        </div>

        {/* Pontos e botão */}

        <div style={badgeActions}>
          <div style={pontosBox}>
            <div style={pontosLabel}>
              Pontos
            </div>

            <div
              style={{
                ...pontosValor,

                background: especial
                  ? "#facc15"
                  : "#eff6ff",
              }}
            >
              {badge.pontos}
            </div>
          </div>

          <button
            type="button"
            onClick={onConsultar}
            style={consultarButton}
          >
            Consultar
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   MODAL DO BADGE
========================================================= */

function BadgeModal({
  badge,
  onClose,
}) {
  return (
    <div style={modalOverlay}>
      <div style={modalCard}>
        <button
          type="button"
          onClick={onClose}
          style={modalClose}
        >
          <BiX size={22} />
        </button>

        <div style={modalHeader}>
          <div style={modalImagem}>
            {badge.imagem ? (
              <img
                src={badge.imagem}
                alt={badge.nome_badge}
                style={badgeImagem}
              />
            ) : (
              <BiMedal
                size={34}
                color="#2563eb"
              />
            )}
          </div>

          <div>
            <h3 style={modalTitle}>
              {badge.nome_badge}
            </h3>

            <div
              style={modalServiceLine}
            >
              {badge.nome_serviceline}
            </div>
          </div>
        </div>

        <p style={modalDescription}>
          {
            badge.descricao_badge_modelo
          }
        </p>

        <div style={modalGrid}>
          <ModalInfo
            label="Nível"
            value={badge.nome_nivel}
          />

          <ModalInfo
            label="Pontos"
            value={`${badge.pontos} pts`}
          />

          <ModalInfo
            label="Requisitos"
            value={
              badge.numero_requisitos
            }
          />

          <ModalInfo
            label="Tipo"
            value={badge.tipo_badge}
          />
        </div>

        <div style={modalAreas}>
          <strong>
            Áreas associadas:
          </strong>{" "}
          {badge.nome_areas}
        </div>

        <div style={modalActions}>
          <button
            type="button"
            onClick={onClose}
            style={fecharButton}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INFORMAÇÃO DO MODAL
========================================================= */

function ModalInfo({
  label,
  value,
}) {
  return (
    <div style={modalInfo}>
      <div style={modalInfoLabel}>
        {label}
      </div>

      <div style={modalInfoValue}>
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   ESTILOS GERAIS
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
  position: "relative",
  flex: 1,
  minWidth: 0,
  overflowY: "auto",
  padding: "22px 28px 60px",
};

/* =========================================================
   CABEÇALHO
========================================================= */

const voltarButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: 0,
  fontSize: 14,
  marginBottom: 22,
};

const cabecalhoPagina = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 24,
  marginBottom: 24,
};

const titulo = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.2,
  fontWeight: 800,
  color: "#111827",
};

const subtitulo = {
  marginTop: 3,
  fontSize: 13,
  color: "#6b7280",
};

const acoesTopo = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 12,
  flexWrap: "wrap",
};

/* =========================================================
   BOTÕES DO CABEÇALHO
========================================================= */

const certificadoButton = {
  minHeight: 42,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  border: "1px solid #cbd5e1",
  borderRadius: 9,
  background: "white",
  color: "#334155",
  padding: "9px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow:
    "0 2px 5px rgba(15, 23, 42, 0.12)",
};

const excelButton = {
  minHeight: 42,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  border: "none",
  borderRadius: 9,
  background: "#16a34a",
  color: "white",
  padding: "9px 20px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow:
    "0 2px 5px rgba(15, 23, 42, 0.12)",
};

const pdfButton = {
  minHeight: 42,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  border: "none",
  borderRadius: 9,
  background: "#dc2626",
  color: "white",
  padding: "9px 20px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow:
    "0 2px 5px rgba(15, 23, 42, 0.12)",
};

/* =========================================================
   PESQUISA
========================================================= */

const pesquisaLinha = {
  width: "100%",
  marginBottom: 16,
};

const pesquisaBox = {
  width: "100%",
  minHeight: 50,
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 16px",
  boxSizing: "border-box",
  boxShadow:
    "0 2px 5px rgba(15, 23, 42, 0.05)",
};

const pesquisaInput = {
  flex: 1,
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 14,
  color: "#111827",
};

/* =========================================================
   FILTROS
========================================================= */

const filtrosContainer = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 16,
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 14,
  boxShadow:
    "0 2px 5px rgba(15, 23, 42, 0.05)",
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
  fontSize: 12,
  fontWeight: 600,
  color: "#475569",
};

const selectFiltro = {
  width: "100%",
  height: 42,
  border: "1px solid #dbe3ee",
  borderRadius: 9,
  padding: "0 12px",
  outline: "none",
  background: "white",
  color: "#111827",
  fontSize: 13,
  boxSizing: "border-box",
};

/* =========================================================
   INFORMAÇÃO DA SERVICE LINE
========================================================= */

const serviceLineInfoRow = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: 24,
};

const serviceLineInfo = {
  display: "inline-flex",
  alignItems: "center",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 999,
  padding: "7px 13px",
  color: "#1d4ed8",
  fontSize: 12,
};

/* =========================================================
   LISTA DE BADGES
========================================================= */

const listaBadges = {
  display: "flex",
  flexDirection: "column",
  gap: 22,
  maxWidth: 900,
  margin: "0 auto",
};

const badgeCard = {
  borderRadius: 14,
  padding: "12px 24px",
  boxShadow:
    "0 3px 8px rgba(15, 23, 42, 0.13)",
};

const serviceLineTexto = {
  fontSize: 13,
  color: "#475569",
  marginBottom: 16,
};

const serviceLineLink = {
  color: "#2563eb",
  fontWeight: 600,
};

const badgeConteudo = {
  display: "grid",
  gridTemplateColumns:
    "76px minmax(0, 1fr) 105px",
  gap: 20,
  alignItems: "center",
};

const badgeImagemBox = {
  width: 72,
  height: 72,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  flexShrink: 0,
  boxSizing: "border-box",
  boxShadow:
    "0 3px 8px rgba(15, 23, 42, 0.15)",
};

const badgeImagem = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: "50%",
};

const badgeInfo = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

const badgeNome = {
  fontSize: 16,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 7,
  lineHeight: 1.3,
};

const badgeDescricao = {
  fontSize: 13,
  color: "#64748b",
  lineHeight: 1.5,
  maxWidth: 620,
};

const areasTexto = {
  marginTop: 6,
  fontSize: 12,
  color: "#94a3b8",
};

const nivelBadge = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  padding: "5px 14px",
  fontSize: 11,
  fontWeight: 500,
  marginTop: 14,
};

const badgeActions = {
  minHeight: 110,
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "space-between",
  gap: 14,
};

const pontosBox = {
  width: "100%",
  border: "1px solid #2563eb",
  borderRadius: 16,
  padding: "7px 10px",
  textAlign: "center",
  background: "white",
  boxSizing: "border-box",
  boxShadow:
    "0 3px 6px rgba(15, 23, 42, 0.16)",
};

const pontosLabel = {
  fontSize: 10,
  color: "#475569",
  marginBottom: 3,
};

const pontosValor = {
  width: 48,
  height: 48,
  margin: "0 auto",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
};

const consultarButton = {
  width: "100%",
  minHeight: 40,
  border: "none",
  borderRadius: 9,
  background: "#d1d5db",
  color: "#475569",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
};

/* =========================================================
   MENSAGENS
========================================================= */

const loadingBox = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#6b7280",
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

/* =========================================================
   MODAL
========================================================= */

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background:
    "rgba(15, 23, 42, 0.55)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const modalCard = {
  position: "relative",
  width: "100%",
  maxWidth: 570,
  background: "white",
  borderRadius: 16,
  padding: 26,
  boxShadow:
    "0 24px 70px rgba(15, 23, 42, 0.3)",
};

const modalClose = {
  position: "absolute",
  top: 14,
  right: 14,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#64748b",
};

const modalHeader = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 16,
};

const modalImagem = {
  width: 58,
  height: 58,
  borderRadius: 10,
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const modalTitle = {
  margin: 0,
  fontSize: 20,
  color: "#111827",
};

const modalServiceLine = {
  color: "#2563eb",
  fontSize: 12,
  marginTop: 3,
};

const modalDescription = {
  color: "#64748b",
  lineHeight: 1.6,
  fontSize: 13,
};

const modalGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  marginTop: 18,
};

const modalInfo = {
  background: "#f8fafc",
  borderRadius: 9,
  padding: 12,
};

const modalInfoLabel = {
  fontSize: 11,
  color: "#94a3b8",
};

const modalInfoValue = {
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
  marginTop: 3,
};

const modalAreas = {
  marginTop: 14,
  fontSize: 12,
  color: "#475569",
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 22,
};

const fecharButton = {
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  padding: "9px 18px",
  cursor: "pointer",
};

export default CatalogoBadgesSll;