import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  Bisort,
  BiSearch,
  BiFilterAlt,
  BiSortAlt2,
  BiFile,
  BiSpreadsheet,
  BiMedal,
  BiCertification,
} from "react-icons/bi";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import {
  useNavigate,
  useLocation, // Adicionado para corrigir o erro do location
} from "react-router-dom";

import api from "../../services/api.js";
import DebugBadgePanel from "../../components/DebugBadgePanel.jsx";

import Header from "../../components/TM_Header.jsx";
import TmLeftSidebar from "../../components/TM_LeftBar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";

/* =========================================================
   UTILIZADOR AUTENTICADO
========================================================= */

function obterUtilizadorGuardado() {
  const utilizadorGuardado = localStorage.getItem("user");

  if (!utilizadorGuardado) {
    return null;
  }

  try {
    return JSON.parse(utilizadorGuardado);
  } catch (err) {
    console.error("Erro ao ler utilizador guardado:", err);
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

    pontos: Number(badge.pontos || badge.PONTOS || 0),

    numero_requisitos: Number(
      badge.numero_requisitos ||
        badge.total_requisitos ||
        badge.NUMERO_REQUISITOS ||
        0
    ),

    tipo_badge: badge.tipo_badge || badge.TIPO_BADGE || "NORMAL",

    estado_badge_modelo:
      badge.estado_badge_modelo || badge.ESTADO_BADGE_MODELO || "ATIVO",

    id_serviceline: badge.id_serviceline || badge.ID_SERVICELINE || "",

    nome_serviceline:
      badge.nome_serviceline || badge.NOME_SERVICELINE || "Sem Service Line",

    id_areas: badge.id_areas || badge.ID_AREAS || "",

    nome_areas:
      badge.nome_areas ||
      badge.nome_area ||
      badge.NOME_AREA ||
      "Sem área associada",

    id_nivel: badge.id_nivel || badge.ID_NIVEL || "",

    nome_nivel: badge.nome_nivel || badge.NOME_NIVEL || "Sem nível",

    imagem: badge.imagem || badge.imagem_url || badge.IMAGEM || null,

    tempo_expiracao: badge.tempo_expiracao || badge.TEMPO_EXPIRACAO || null,

    debug: badge.debug || null,
  };
}

/* =========================================================
   PÁGINA PRINCIPAL
========================================================= */

function CatalogoBadgesTm() {
  const navigate = useNavigate();
  const location = useLocation(); // Inicializado o hook para obter o state da rota

  const [badges, setBadges] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [filtroServiceLine, setFiltroServiceLine] = useState("TODAS");
  const [ordenacao, setOrdenacao] = useState("NOME_ASC");
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const BADGES_POR_PAGINA = 5;

  useEffect(() => {
    carregarBadges();
  }, []);

  /* =======================================================
      CARREGAR BADGES
  ======================================================= */

  async function carregarBadges() {
    const utilizador = obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador || utilizador?.ID_UTILIZADOR || utilizador?.id;

    if (!idUtilizador) {
      setErro("Não foi possível identificar o Talent Manager.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      const response = await api.get(`/tm/${idUtilizador}/badges`);

      console.log("CATÁLOGO TM:", response.data);

      const dados = response.data;

      const listaOriginal = Array.isArray(dados)
        ? dados
        : Array.isArray(dados?.badges)
        ? dados.badges
        : [];

      const listaNormalizada = listaOriginal.map(normalizarBadge);

      setBadges(listaNormalizada);
    } catch (err) {
      console.error("Erro ao carregar catálogo TM:", err);

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
      SERVICE LINES DISPONÍVEIS
  ======================================================= */

  const serviceLines = useMemo(() => {
    const nomes = badges
      .map((badge) => badge.nome_serviceline)
      .filter((nome) => nome && nome !== "Sem Service Line");

    return [...new Set(nomes)].sort((a, b) => a.localeCompare(b, "pt"));
  }, [badges]);

  /* =======================================================
      FILTROS E ORDENAÇÃO
  ======================================================= */

  const badgesFiltrados = useMemo(() => {
    let resultado = [...badges];

    const textoPesquisa = pesquisa.trim().toLowerCase();

    if (textoPesquisa) {
      resultado = resultado.filter(
        (badge) =>
          badge.nome_badge.toLowerCase().includes(textoPesquisa) ||
          badge.descricao_badge_modelo.toLowerCase().includes(textoPesquisa) ||
          badge.nome_areas.toLowerCase().includes(textoPesquisa) ||
          badge.nome_nivel.toLowerCase().includes(textoPesquisa) ||
          badge.nome_serviceline.toLowerCase().includes(textoPesquisa)
      );
    }

    if (filtroTipo === "NORMAL") {
      resultado = resultado.filter(
        (badge) => String(badge.tipo_badge).toUpperCase() !== "ESPECIAL"
      );
    }

    if (filtroTipo === "ESPECIAL") {
      resultado = resultado.filter(
        (badge) => String(badge.tipo_badge).toUpperCase() === "ESPECIAL"
      );
    }

    if (filtroServiceLine !== "TODAS") {
      resultado = resultado.filter(
        (badge) => badge.nome_serviceline === filtroServiceLine
      );
    }

    resultado.sort((a, b) => {
      if (ordenacao === "NOME_DESC") {
        return b.nome_badge.localeCompare(a.nome_badge, "pt");
      }

      if (ordenacao === "PONTOS_DESC") {
        return b.pontos - a.pontos;
      }

      if (ordenacao === "PONTOS_ASC") {
        return a.pontos - b.pontos;
      }

      if (ordenacao === "SERVICELINE_ASC") {
        return a.nome_serviceline.localeCompare(b.nome_serviceline, "pt");
      }

      return a.nome_badge.localeCompare(b.nome_badge, "pt");
    });

    return resultado;
  }, [badges, pesquisa, filtroTipo, filtroServiceLine, ordenacao]);

  // Resetar para a primeira página caso os filtros mudem e a página atual fique "vazia"
  useEffect(() => {
    setPaginaAtual(1);
  }, [pesquisa, filtroTipo, filtroServiceLine]);

  /* =======================================================
      CÁLCULO DA PAGINAÇÃO (Movido para baixo dos filtros)
  ======================================================= */
  const totalPaginas = Math.max(
    1,
    Math.ceil(badgesFiltrados.length / BADGES_POR_PAGINA)
  );

  // Recorta a lista para mostrar apenas os badges da página atual
  const badgesPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * BADGES_POR_PAGINA;
    return badgesFiltrados.slice(inicio, inicio + BADGES_POR_PAGINA);
  }, [badgesFiltrados, paginaAtual]);

  /* =======================================================
      EXPORTAR PDF
  ======================================================= */

  function gerarPdf() {
    try {
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Catálogo Completo de Badges", 14, 16);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Todas as Service Lines", 14, 23);
      pdf.text(`Total de badges: ${badgesFiltrados.length}`, 14, 29);

      autoTable(pdf, {
        startY: 36,
        head: [
          [
            "Badge",
            "Service Line",
            "Área",
            "Nível",
            "Pontos",
            "Requisitos",
            "Tipo",
          ],
        ],
        body: badgesFiltrados.map((badge) => [
          badge.nome_badge,
          badge.nome_serviceline,
          badge.nome_areas,
          badge.nome_nivel,
          badge.pontos,
          badge.numero_requisitos,
          badge.tipo_badge,
        ]),
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
          0: { cellWidth: 46 },
          1: { cellWidth: 40 },
          2: { cellWidth: 50 },
          3: { cellWidth: 30 },
          4: { cellWidth: 20, halign: "center" },
          5: { cellWidth: 24, halign: "center" },
          6: { cellWidth: 28, halign: "center" },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: () => {
          const numeroPagina = pdf.getNumberOfPages();
          pdf.setFontSize(8);
          pdf.setTextColor(100);
          pdf.text(
            `Página ${numeroPagina}`,
            pdf.internal.pageSize.getWidth() - 28,
            pdf.internal.pageSize.getHeight() - 8
          );
        },
      });

      pdf.save("catalogo_completo_badges.pdf");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      setErro("Não foi possível gerar o PDF.");
    }
  }

  /* =======================================================
      EXPORTAR EXCEL/CSV
  ======================================================= */

  function exportarExcel() {
    try {
      const cabecalho = [
        "ID",
        "Badge",
        "Service Line",
        "Área",
        "Nível",
        "Pontos",
        "Requisitos",
        "Tipo",
        "Tempo de expiração",
      ];

      const linhas = badgesFiltrados.map((badge) => [
        badge.id_badge_modelo,
        badge.nome_badge,
        badge.nome_serviceline,
        badge.nome_areas,
        badge.nome_nivel,
        badge.pontos,
        badge.numero_requisitos,
        badge.tipo_badge,
        badge.tempo_expiracao || "",
      ]);

      const csv = [cabecalho, ...linhas]
        .map((linha) =>
          linha
            .map((valor) => {
              const texto = String(valor ?? "").replace(/"/g, '""');
              return `"${texto}"`;
            })
            .join(";")
        )
        .join("\n");

      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "catalogo_completo_badges.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao exportar Excel:", err);
      setErro("Não foi possível exportar o ficheiro.");
    }
  }

  const textoVoltar = location.state?.textoVoltar || "Voltar atrás";

  const lidarComVoltar = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/tm");
    }
  };

  /* =======================================================
      RENDERIZAÇÃO
  ======================================================= */

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <TmLeftSidebar />

        <main style={conteudo}>
          <button type="button" onClick={lidarComVoltar} style={voltarButton}>
            <BiArrowBack size={18} />
            {textoVoltar}
          </button>

          <div style={cabecalhoPagina}>
            <div>
              <h2 style={titulo}>Catálogo de Badges</h2>
              <div style={subtitulo}>
                Total de {badgesFiltrados.length}{" "}
                {badgesFiltrados.length === 1 ? "badge" : "badges"}
              </div>
            </div>

            <div style={acoesTopo}>
              <button
                type="button"
                onClick={() => navigate("/tm/certificados")}
                style={certificadoButton}
              >
                <BiCertification size={17} />
                Gerar Certificado Personalizado
              </button>

              <button type="button" onClick={exportarExcel} style={excelButton}>
                <BiSpreadsheet size={17} />
                Excel
              </button>

              <button type="button" onClick={gerarPdf} style={pdfButton}>
                <BiFile size={17} />
                PDF
              </button>
            </div>
          </div>

          {/* PESQUISA */}
          <div style={pesquisaLinha}>
            <div style={pesquisaBox}>
              <BiSearch size={19} color="#94a3b8" />
              <input
                type="text"
                value={pesquisa}
                onChange={(event) => setPesquisa(event.target.value)}
                placeholder="Buscar badges, áreas ou Service Lines..."
                style={pesquisaInput}
              />
            </div>
          </div>

          {/* FILTROS */}
          <div style={filtrosContainer}>
            <div style={filtroCampo}>
              <label style={filtroLabel}>
                <BiFilterAlt size={16} />
                Tipo de badge
              </label>
              <select
                value={filtroTipo}
                onChange={(event) => setFiltroTipo(event.target.value)}
                style={selectFiltro}
              >
                <option value="TODOS">Todos os tipos</option>
                <option value="NORMAL">Normais</option>
                <option value="ESPECIAL">Especiais</option>
              </select>
            </div>

            <div style={filtroCampo}>
              <label style={filtroLabel}>
                <BiFilterAlt size={16} />
                Service Line
              </label>
              <select
                value={filtroServiceLine}
                onChange={(event) => setFiltroServiceLine(event.target.value)}
                style={selectFiltro}
              >
                <option value="TODAS">Todas as Service Lines</option>
                {serviceLines.map((nomeServiceLine) => (
                  <option key={nomeServiceLine} value={nomeServiceLine}>
                    {nomeServiceLine}
                  </option>
                ))}
              </select>
            </div>

            <div style={filtroCampo}>
              <label style={filtroLabel}>
                <BiSortAlt2 size={16} />
                Ordenar por
              </label>
              <select
                value={ordenacao}
                onChange={(event) => setOrdenacao(event.target.value)}
                style={selectFiltro}
              >
                <option value="NOME_ASC">Nome A-Z</option>
                <option value="NOME_DESC">Nome Z-A</option>
                <option value="PONTOS_DESC">Mais pontos</option>
                <option value="PONTOS_ASC">Menos pontos</option>
                <option value="SERVICELINE_ASC">Service Line A-Z</option>
              </select>
            </div>
          </div>

          <div style={catalogoInfoRow}>
            <div style={catalogoInfo}>
              Catálogo completo de badges de todas as Service Lines
            </div>
          </div>

          {erro && <div style={erroBox}>{erro}</div>}

          {isLoading ? (
            <div style={loadingBox}>A carregar badges...</div>
          ) : badgesFiltrados.length > 0 ? (
            <> {/* Adicionado o fragment correto aqui */}
              <div style={listaBadges}>
                {badgesPaginados.map((badge) => (
                  <BadgeCard
                    key={badge.id_badge_modelo}
                    badge={badge}
                    onConsultar={() =>
                      navigate(`/tm/badges/${badge.id_badge_modelo}`)
                    }
                  />
                ))}
              </div>

              <PaginacaoCatalogo
                paginaAtual={paginaAtual}
                totalPaginas={totalPaginas}
                onAnterior={() =>
                  setPaginaAtual((pagina) => Math.max(1, pagina - 1))
                }
                onProxima={() =>
                  setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))
                }
                onSelecionarPagina={setPaginaAtual}
              />
            </>
          ) : (
            <div style={loadingBox}>Não foram encontrados badges.</div>
          )}
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   CARD DO BADGE
========================================================= */

function BadgeCard({ badge, onConsultar }) {
  const especial = String(badge.tipo_badge).toUpperCase() === "ESPECIAL";

  return (
    <article
      onClick={onConsultar}
      style={{
        ...badgeCard,
        cursor: "pointer",
        background: especial ? "#fff3cd" : "white",
        border: especial ? "2px solid #f59e0b" : "1px solid #e5e7eb",
        boxShadow: especial
          ? "0 0 0 3px rgba(245, 158, 11, 0.12)"
          : "none",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      {/* 1. Service Line no topo (como gostas na Versão 1) */}
      <div style={serviceLineTexto}>
        Service Line:{" "}
        <span style={serviceLineLink}>{badge.nome_serviceline}</span>
      </div>

      <div style={badgeConteudo}>
        {/* 2. Caixa da Imagem com as cores vibrantes da Versão 1 */}
        <div
          style={{
            ...badgeImagemBox,
            background: especial ? "#ff8a00" : "#eff6ff",
            border: especial ? "2px solid #f59e0b" : "2px solid #dbeafe",
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
              color={especial ? "white" : "#2563eb"}
            />
          )}
        </div>

        {/* 3. Informações Centrais */}
        <div style={{ ...badgeInfo, flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: "4px",
            }}
          >
            <div style={badgeNome}>{badge.nome_badge}</div>
            
            {/* Pill de Especial ao lado do nome (da Versão 2) */}
            {especial && (
              <span
                style={{
                  background: "#ff8a00",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                Especial
              </span>
            )}
          </div>

          <div style={badgeDescricao}>{badge.descricao_badge_modelo}</div>

          {badge.nome_areas && (
            <div style={areasTexto}>Área: {badge.nome_areas}</div>
          )}

          {/* Nível do Badge (apenas se não for especial, para evitar duplicados) */}
          {badge.nome_nivel && !especial && (
            <span
              style={{
                ...nivelBadge,
                background: "#eff6ff",
                color: "#2563eb",
                marginTop: "6px",
                display: "inline-block",
              }}
            >
              {badge.nome_nivel}
            </span>
          )}

          {/* Painel de Debug (Versão 1) mantido para ajudar no desenvolvimento */}
          <DebugBadgePanel badge={badge} />
        </div>

        {/* 4. Caixa de Pontuação à Direita */}
        <div style={pontosBox}>
          <div style={pontosLabel}>Pontos</div>
          <div
            style={{
              ...pontosValor,
              background: especial ? "#facc15" : "#eff6ff",
              color: especial ? "#78350f" : "#2563eb",
            }}
          >
            {badge.pontos}
          </div>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   PAGINAÇÃO
========================================================= */

function PaginacaoCatalogo({
  paginaAtual,
  totalPaginas,
  onAnterior,
  onProxima,
  onSelecionarPagina,
}) {
  if (totalPaginas <= 1) {
    return null;
  }

  const disabledAnterior = paginaAtual === 1;
  const disabledProxima = paginaAtual === totalPaginas;

  const criarPaginasVisiveis = () => {
    if (totalPaginas <= 5) {
      return Array.from({ length: totalPaginas }, (_, index) => index + 1);
    }

    if (paginaAtual <= 3) {
      return [1, 2, 3, 4, "...", totalPaginas];
    }

    if (paginaAtual >= totalPaginas - 2) {
      return [
        1,
        "...",
        totalPaginas - 3,
        totalPaginas - 2,
        totalPaginas - 1,
        totalPaginas,
      ];
    }

    return [
      1,
      "...",
      paginaAtual - 1,
      paginaAtual,
      paginaAtual + 1,
      "...",
      totalPaginas,
    ];
  };

  const paginasVisiveis = criarPaginasVisiveis();

  return (
    <div style={paginationWrapper}>
      <div style={paginationBox}>
        <button
          type="button"
          onClick={onAnterior}
          disabled={disabledAnterior}
          style={{
            ...paginationButton,
            color: disabledAnterior ? "#cbd0d6" : "#5f6b7a",
            cursor: disabledAnterior ? "not-allowed" : "pointer",
            background: disabledAnterior ? "#fafafa" : "white",
          }}
        >
          ‹
        </button>

        {paginasVisiveis.map((pagina, index) => {
          if (pagina === "...") {
            return (
              <div key={`ellipsis-${index}`} style={paginationEllipsis}>
                ...
              </div>
            );
          }

          const ativa = Number(pagina) === Number(paginaAtual);

          return (
            <button
              key={pagina}
              type="button"
              onClick={() => onSelecionarPagina(Number(pagina))}
              style={{
                ...paginationButton,
                background: ativa ? "#e8edf3" : "white",
                color: ativa ? "#1f2937" : "#667085",
                borderColor: ativa ? "#d6dce4" : "transparent",
                fontWeight: ativa ? 700 : 500,
                cursor: "pointer",
              }}
            >
              {pagina}
            </button>
          );
        })}

        <div style={paginationCounter}>
          {paginaAtual}/{totalPaginas}
        </div>

        <button
          type="button"
          onClick={onProxima}
          disabled={disabledProxima}
          style={{
            ...paginationButton,
            color: disabledProxima ? "#cbd0d6" : "#5f6b7a",
            cursor: disabledProxima ? "not-allowed" : "pointer",
            background: disabledProxima ? "#fafafa" : "white",
          }}
        >
          ›
        </button>
      </div>
    </div>
  );
};

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
  position: "relative",
  flex: 1,
  minWidth: 0,
  overflowY: "auto",
  padding: "22px 28px 60px",
};

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
  justifyContent:
    "space-between",
  alignItems: "flex-end",
  gap: 24,
  marginBottom: 24,
};

const titulo = {
  margin: 0,
  fontSize: 20,
  lineHeight: 1.2,
  fontWeight: 800,
  color: "#111827",
};

const subtitulo = {
  marginTop: 4,
  fontSize: 13,
  color: "#6b7280",
};

const acoesTopo = {
  display: "flex",
  alignItems: "center",
  justifyContent:
    "flex-end",
  gap: 12,
  flexWrap: "wrap",
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
    "0 2px 5px rgba(15,23,42,0.12)",
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
    "0 2px 5px rgba(15,23,42,0.12)",
};

const pesquisaLinha = {
  width: "100%",
  marginBottom: 16,
};

const pesquisaBox = {
  width: "100%",
  minHeight: 50,
  background: "white",
  border:
    "1px solid #e2e8f0",
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 16px",
  boxSizing: "border-box",
  boxShadow:
    "0 2px 5px rgba(15,23,42,0.05)",
};

const pesquisaInput = {
  flex: 1,
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 14,
  color: "#111827",
};

const filtrosContainer = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: 16,
  background: "white",
  border:
    "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 14,
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
  fontSize: 12,
  fontWeight: 600,
  color: "#475569",
};

const selectFiltro = {
  width: "100%",
  height: 42,
  border:
    "1px solid #dbe3ee",
  borderRadius: 9,
  padding: "0 12px",
  outline: "none",
  background: "white",
  color: "#111827",
  fontSize: 13,
  boxSizing: "border-box",
};

const catalogoInfoRow = {
  display: "flex",
  justifyContent: "flex-end",
  marginBottom: 24,
};

const catalogoInfo = {
  display: "inline-flex",
  alignItems: "center",
  background: "#eff6ff",
  border:
    "1px solid #bfdbfe",
  borderRadius: 999,
  padding: "7px 13px",
  color: "#1d4ed8",
  fontSize: 12,
};

const listaBadges = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 22,
  margin: 0,
};

const badgeCard = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 14,
  padding: "16px 24px",
  boxShadow:
    "0 3px 8px rgba(15,23,42,0.13)",
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
    "0 3px 8px rgba(15,23,42,0.15)",
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
  width: "100%",
  fontSize: 13,
  color: "#64748b",
  lineHeight: 1.5,
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
  justifyContent:
    "space-between",
  gap: 14,
};

const pontosBox = {
  width: "100%",
  border:
    "1px solid #2563eb",
  borderRadius: 16,
  padding: "7px 10px",
  textAlign: "center",
  background: "white",
  boxSizing: "border-box",
  boxShadow:
    "0 3px 6px rgba(15,23,42,0.16)",
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

const loadingBox = {
  background: "white",
  border:
    "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#6b7280",
};

const erroBox = {
  background: "#fee2e2",
  border:
    "1px solid #fecaca",
  borderRadius: 10,
  padding: 12,
  color: "#991b1b",
  marginBottom: 18,
  fontSize: 13,
};

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

const paginationWrapper = {
  display: "flex",
  justifyContent: "center",
  marginTop: 24,
  marginBottom: 24,
};

const paginationBox = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  background: "white",
  border: "1px solid #dfe3e8",
  borderRadius: 9,
  padding: 5,
  boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
};

const paginationButton = {
  width: 34,
  height: 32,
  border: "1px solid transparent",
  borderRadius: 6,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  lineHeight: 1,
  padding: 0,
  transition:
    "background-color 0.15s ease, border-color 0.15s ease",
};

const paginationEllipsis = {
  width: 30,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#8a94a3",
  fontSize: 13,
};

const paginationCounter = {
  minWidth: 42,
  padding: "0 6px",
  textAlign: "center",
  color: "#667085",
  fontSize: 12,
  fontWeight: 500,
};

export default CatalogoBadgesTm;