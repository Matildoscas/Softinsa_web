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
import DebugBadgePanel from "../../components/DebugBadgePanel.jsx";

import Header from "../../components/Header.jsx";
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

    debug: badge.debug || null,
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
  const [serviceLines, setServiceLines] =
    useState([]);
  const [serviceLineId, setServiceLineId] =
    useState("MINE");

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

  const [paginaAtual, setPaginaAtual] = useState(1);

  const badgesPorPagina = 4;

  useEffect(() => {
    carregarServiceLines();
  }, []);

  useEffect(() => {
    carregarBadges();
  }, [serviceLineId]);

  /* =======================================================
     CARREGAR SERVICE LINES
  ======================================================= */

  async function carregarServiceLines() {
    try {
      const response = await api.get(
        "/servicelines/select"
      );

      if (
        Array.isArray(response.data)
      ) {
        setServiceLines(response.data);
      }
    } catch (err) {
      console.error(
        "Erro ao carregar Service Lines:",
        err
      );
    }
  }

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

      let endpoint = `/sll/${idUtilizador}/badges`;

      if (serviceLineId === "ALL") {
        endpoint += "?scope=all";
      } else if (
        serviceLineId &&
        serviceLineId !== "MINE"
      ) {
        endpoint += `?id_serviceline=${serviceLineId}`;
      }

      const response = await api.get(endpoint);

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

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        badgesFiltrados.length /
        badgesPorPagina
      )
    );

  const inicio =
    (paginaAtual - 1) *
    badgesPorPagina;

  const badgesPaginaAtual =
    badgesFiltrados.slice(
      inicio,
      inicio + badgesPorPagina
    );

  useEffect(() => {
    setPaginaAtual(1);
  }, [
    pesquisa,
    filtro,
    ordenacao,
    serviceLineId,
  ]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [
    paginaAtual,
    totalPaginas,
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
                Service Line
              </label>

              <select
                value={serviceLineId || "MINE"}
                onChange={(event) =>
                  setServiceLineId(event.target.value)
                }
                style={selectFiltro}
              >
                <option value="MINE">
                  Minha Service Line
                </option>

                <option value="ALL">
                  Todas as Service Lines
                </option>

                {serviceLines.map(
                  (sl) => (
                    <option
                      key={
                        sl.id_serviceline
                      }
                      value={
                        String(
                          sl.id_serviceline
                        )
                      }
                    >
                      {sl.nome_serviceline}
                    </option>
                  )
                )}
              </select>
            </div>

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
              Catálogo atualmente em:{" "}
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
            ) : badgesPaginaAtual.length > 0 ? (
              <>
                <div style={listaBadges}>
                  {badgesPaginaAtual.map((badge) => (
                    <BadgeCard
                      key={badge.id_badge_modelo}
                      badge={badge}
                      onConsultar={() => {
                        const params =
                          new URLSearchParams();

                        if (serviceLineId === "ALL") {
                          params.set("scope", "all");
                        } else if (
                          serviceLineId &&
                          serviceLineId !== "MINE"
                        ) {
                          params.set(
                            "id_serviceline",
                            String(serviceLineId)
                          );
                        }

                        const sufixo =
                          params.toString()
                            ? `?${params.toString()}`
                            : "";

                        navigate(
                          `/sll/badges/${badge.id_badge_modelo}${sufixo}`
                        );
                      }}
                    />
                  ))}
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
              <div style={loadingBox}>
                {serviceLineId &&
                serviceLineId !== "MINE"
                  ? "Não foram encontrados badges nesta Service Line."
                  : "Não foram encontrados badges."}
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
    <div
      style={{
        ...badgeCard,

        cursor: "pointer",

        border: especial
          ? "2px solid #f59e0b"
          : badgeCard.border,

        boxShadow: especial
          ? "0 0 0 3px rgba(245, 158, 11, 0.12)"
          : "none",
      }}
      onClick={onConsultar}
    >
      <div style={badgeContent}>
        <div
          style={{
            ...badgeImagemBox,

            background: especial
              ? "#a48d73"
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

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={badgeNome}>
              {badge.nome_badge}
            </div>

            {especial && (
              <span style={especialPill}>
                Especial
              </span>
            )}
          </div>

          <div style={badgeDescricao}>
            {badge.descricao_badge_modelo}

            {badge.nome_areas && (
              <div style={areaLinha}>
                {badge.nome_areas}
              </div>
            )}

            {badge.nome_nivel && (
              <div style={nivelLinha}>
                {badge.nome_nivel}
              </div>
            )}
          </div>
        </div>

        <div style={pointsBox}>
          <div style={pointsLabel}>
            Pontos
          </div>

          <div style={pointsValue}>
            {badge.pontos}
          </div>
        </div>
      </div>

      <div style={statusBar}>
        Service Line:{" "}
        <strong>{badge.nome_serviceline}</strong>
      </div>
    </div>
  );
}

/* =========================================================
   MODAL DO BADGE
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

  const disabledAnterior =
    paginaAtual === 1;

  const disabledProxima =
    paginaAtual === totalPaginas;

  const criarPaginasVisiveis = () => {
    if (totalPaginas <= 5) {
      return Array.from(
        { length: totalPaginas },
        (_, index) => index + 1
      );
    }

    if (paginaAtual <= 3) {
      return [
        1,
        2,
        3,
        4,
        "...",
        totalPaginas,
      ];
    }

    if (
      paginaAtual >=
      totalPaginas - 2
    ) {
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

  const paginasVisiveis =
    criarPaginasVisiveis();

  return (
    <div style={paginationWrapper}>
      <div style={paginationBox}>
        <button
          type="button"
          onClick={onAnterior}
          disabled={disabledAnterior}
          style={{
            ...paginationButton,

            color: disabledAnterior
              ? "#cbd0d6"
              : "#5f6b7a",

            cursor: disabledAnterior
              ? "not-allowed"
              : "pointer",

            background: disabledAnterior
              ? "#fafafa"
              : "white",
          }}
        >
          ‹
        </button>

        {paginasVisiveis.map(
          (pagina, index) => {
            if (pagina === "...") {
              return (
                <div
                  key={`ellipsis-${index}`}
                  style={paginationEllipsis}
                >
                  ...
                </div>
              );
            }

            const ativa =
              Number(pagina) ===
              Number(paginaAtual);

            return (
              <button
                key={pagina}
                type="button"
                onClick={() =>
                  onSelecionarPagina(
                    Number(pagina)
                  )
                }
                style={{
                  ...paginationButton,

                  background: ativa
                    ? "#e8edf3"
                    : "white",

                  color: ativa
                    ? "#1f2937"
                    : "#667085",

                  borderColor: ativa
                    ? "#d6dce4"
                    : "transparent",

                  fontWeight: ativa
                    ? 700
                    : 500,

                  cursor: "pointer",
                }}
              >
                {pagina}
              </button>
            );
          }
        )}

        <div style={paginationCounter}>
          {paginaAtual}/{totalPaginas}
        </div>

        <button
          type="button"
          onClick={onProxima}
          disabled={disabledProxima}
          style={{
            ...paginationButton,

            color: disabledProxima
              ? "#cbd0d6"
              : "#5f6b7a",

            cursor: disabledProxima
              ? "not-allowed"
              : "pointer",

            background: disabledProxima
              ? "#fafafa"
              : "white",
          }}
        >
          ›
        </button>
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
    "repeat(auto-fit, minmax(220px, 1fr))",
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
  gap: 14,
  maxWidth: "100%",
  margin: "0",
};

const badgeCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  overflow: "hidden",
  marginBottom: 0,
};

const badgeContent = {
  padding: "18px 12px",
  display: "flex",
  alignItems: "center",
  gap: 18,
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
};

const badgeImagem = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: "50%",
};

const badgeNome = {
  fontSize: 15,
  fontWeight: 600,
  color: "#111827",
};

const badgeDescricao = {
  fontSize: 12,
  color: "#344563",
  marginTop: 4,
  lineHeight: 1.45,
};

const areaLinha = {
  fontSize: 12,
  color: "#4470AF",
  marginTop: 3,
};

const nivelLinha = {
  display: "inline-flex",
  marginTop: 8,
  padding: "4px 10px",
  borderRadius: 999,
  background: "#eff6ff",
  color: "#2563eb",
  fontSize: 11,
  fontWeight: 600,
};

const especialPill = {
  background: "#fff7d6",
  color: "#9a6b00",
  border: "1px solid #f0d36b",
  borderRadius: 999,
  padding: "3px 9px",
  fontSize: 11,
  fontWeight: 700,
};

const pointsBox = {
  border: "1.5px solid #4470AF",
  borderRadius: 12,
  padding: "8px 10px",
  minWidth: 52,
  textAlign: "center",
  boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
  background: "white",
  flexShrink: 0,
};

const pointsLabel = {
  fontSize: 10,
  fontWeight: 600,
  color: "#111827",
};

const pointsValue = {
  fontSize: 17,
  fontWeight: 700,
  color: "#111827",
};

const statusBar = {
  borderTop: "1px solid #e5e7eb",
  textAlign: "center",
  padding: "8px 14px",
  fontSize: 12,
  lineHeight: 1.45,
  background: "#fbfdff",
  color: "#646c65",
  whiteSpace: "normal",
  overflowWrap: "anywhere",
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

export default CatalogoBadgesSll;