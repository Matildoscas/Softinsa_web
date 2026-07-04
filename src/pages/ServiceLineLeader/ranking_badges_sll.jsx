import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiAward,
  BiEnvelope,
  BiFile,
  BiMedal,
  BiSpreadsheet,
  BiUserCircle,
} from "react-icons/bi";

import { useNavigate } from "react-router-dom";

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import api from "../../services/api.js";

import Header from "../../components/header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";

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

function normalizarConsultor(
  consultor,
  index
) {
  return {
    id_utilizador:
      consultor.id_utilizador ||
      consultor.id ||
      index,

    nome_completo:
      consultor.nome_completo ||
      consultor.nome ||
      "Consultor",

    email:
      consultor.email ||
      consultor.email_softinsa ||
      "Sem email",

    nome_area:
      consultor.nome_area ||
      "Sem área associada",

    total_badges: Number(
      consultor.total_badges || 0
    ),

    posicao: Number(
      consultor.posicao ||
      index + 1
    ),
  };
}

/* =========================================================
   PÁGINA
========================================================= */

function RankingBadgesSll() {
  const navigate = useNavigate();

  const [ranking, setRanking] =
    useState([]);

  const [serviceLine, setServiceLine] =
    useState(null);

  const [resumo, setResumo] = useState({
    total_consultores: 0,
    total_badges: 0,
    media_badges: 0,
  });

  const [ordenacao, setOrdenacao] =
    useState("BADGES");

  const [isLoading, setIsLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    carregarRanking();
  }, []);

  async function carregarRanking() {
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
        `/sll/${idUtilizador}/ranking-badges`
      );

      const dados = response.data;

      setServiceLine(
        dados.serviceLine || null
      );

      const lista = Array.isArray(
        dados.ranking
      )
        ? dados.ranking.map(
            normalizarConsultor
          )
        : [];

      setRanking(lista);

      setResumo({
        total_consultores: Number(
          dados.total_consultores || 0
        ),

        total_badges: Number(
          dados.total_badges || 0
        ),

        media_badges: Number(
          dados.media_badges || 0
        ),
      });
    } catch (err) {
      console.error(
        "Erro ao carregar ranking:",
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

      setRanking([]);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar o ranking."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const rankingOrdenado =
    useMemo(() => {
      const lista = [...ranking];

      if (ordenacao === "NOME") {
        return lista.sort((a, b) =>
          a.nome_completo.localeCompare(
            b.nome_completo,
            "pt"
          )
        );
      }

      return lista.sort(
        (a, b) =>
          b.total_badges -
            a.total_badges ||
          a.nome_completo.localeCompare(
            b.nome_completo,
            "pt"
          )
      );
    }, [ranking, ordenacao]);

  /* =======================================================
     PDF
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

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(18);

      pdf.text(
        "Ranking de Badges",
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
        `Total de consultores: ${resumo.total_consultores}`,
        14,
        29
      );

      pdf.text(
        `Média de badges: ${resumo.media_badges}`,
        14,
        35
      );

      autoTable(pdf, {
        startY: 42,

        head: [
          [
            "Posição",
            "Consultor",
            "Email",
            "Área",
            "Badges",
          ],
        ],

        body: rankingOrdenado.map(
          (consultor) => [
            consultor.posicao,
            consultor.nome_completo,
            consultor.email,
            consultor.nome_area,
            consultor.total_badges,
          ]
        ),

        styles: {
          fontSize: 9,
          cellPadding: 3,
          valign: "middle",
          overflow: "linebreak",
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

        columnStyles: {
          0: {
            halign: "center",
            cellWidth: 24,
          },

          4: {
            halign: "center",
            cellWidth: 25,
          },
        },

        margin: {
          left: 14,
          right: 14,
        },
      });

      pdf.save(
        "ranking_badges_service_line.pdf"
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

  /* =======================================================
     EXCEL
  ======================================================= */

  function exportarExcel() {
    const cabecalho = [
      "Posição",
      "Consultor",
      "Email",
      "Área",
      "Badges",
    ];

    const linhas =
      rankingOrdenado.map(
        (consultor) => [
          consultor.posicao,
          consultor.nome_completo,
          consultor.email,
          consultor.nome_area,
          consultor.total_badges,
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
      "ranking_badges_service_line.csv";

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
          <button
            type="button"
            onClick={() =>
              navigate("/sll")
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
                Ranking de Badges
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
                {resumo.total_consultores}{" "}
                {resumo.total_consultores ===
                1
                  ? "consultor"
                  : "consultores"}
              </div>
            </div>

            <div style={acoesTopo}>
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

          <div style={ordenacaoContainer}>
            <span style={ordenacaoLabel}>
              Ordenar por:
            </span>

            <button
              type="button"
              onClick={() =>
                setOrdenacao("BADGES")
              }
              style={{
                ...ordenacaoButton,

                background:
                  ordenacao === "BADGES"
                    ? "#2563eb"
                    : "#f1f5f9",

                color:
                  ordenacao === "BADGES"
                    ? "white"
                    : "#475569",
              }}
            >
              Badges
            </button>

            <button
              type="button"
              onClick={() =>
                setOrdenacao("NOME")
              }
              style={{
                ...ordenacaoButton,

                background:
                  ordenacao === "NOME"
                    ? "#2563eb"
                    : "#f1f5f9",

                color:
                  ordenacao === "NOME"
                    ? "white"
                    : "#475569",
              }}
            >
              Nome
            </button>
          </div>

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
          )}

          {isLoading ? (
            <div style={mensagemBox}>
              A carregar ranking...
            </div>
          ) : rankingOrdenado.length >
            0 ? (
            <>
              <div style={listaRanking}>
                {rankingOrdenado.map(
                  (consultor) => (
                    <RankingCard
                      key={
                        consultor.id_utilizador
                      }
                      consultor={
                        consultor
                      }
                    />
                  )
                )}
              </div>

              <ResumoRanking
                resumo={resumo}
                primeiro={
                  ranking[0] || null
                }
              />
            </>
          ) : (
            <div style={mensagemBox}>
              Ainda não existem
              consultores nesta Service
              Line.
            </div>
          )}
        </main>

        <SllRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   CARD DO RANKING
========================================================= */

function RankingCard({
  consultor,
}) {
  const estilo = obterEstiloPosicao(
    consultor.posicao
  );

  return (
    <article
      style={{
        ...rankingCard,

        border: `1.5px solid ${estilo.border}`,

        background:
          estilo.background,
      }}
    >
      <div
        style={{
          ...posicaoBox,

          background:
            estilo.posicaoBackground,

          color: estilo.posicaoColor,
        }}
      >
        {estilo.medalha || (
          `#${consultor.posicao}`
        )}
      </div>

      <div style={avatar}>
        <BiUserCircle
          size={48}
          color="#6092bf"
        />
      </div>

      <div style={consultorInfo}>
        <div style={nomeLinha}>
          <span style={nomeConsultor}>
            {consultor.nome_completo}
          </span>

          {consultor.posicao === 1 && (
            <BiAward
              size={18}
              color="#f59e0b"
            />
          )}
        </div>

        <div style={emailConsultor}>
          <BiEnvelope size={14} />
          {consultor.email}
        </div>

        <div style={areaConsultor}>
          {consultor.nome_area}
        </div>
      </div>

      <div style={badgesQuantidade}>
        <div style={numeroBadges}>
          <BiMedal size={19} />
          {consultor.total_badges}
        </div>

        <div style={badgesLabel}>
          {consultor.total_badges === 1
            ? "badge"
            : "badges"}
        </div>
      </div>
    </article>
  );
}

function obterEstiloPosicao(
  posicao
) {
  if (posicao === 1) {
    return {
      medalha: "🥇",
      border: "#f59e0b",
      background: "#fffdf5",
      posicaoBackground: "#f59e0b",
      posicaoColor: "white",
    };
  }

  if (posicao === 2) {
    return {
      medalha: "🥈",
      border: "#94a3b8",
      background: "#ffffff",
      posicaoBackground: "#cbd5e1",
      posicaoColor: "#334155",
    };
  }

  if (posicao === 3) {
    return {
      medalha: "🥉",
      border: "#f97316",
      background: "#fffaf7",
      posicaoBackground: "#f97316",
      posicaoColor: "white",
    };
  }

  return {
    medalha: null,
    border: "#dbe3ef",
    background: "white",
    posicaoBackground: "#f1f5f9",
    posicaoColor: "#475569",
  };
}

/* =========================================================
   RESUMO
========================================================= */

function ResumoRanking({
  resumo,
  primeiro,
}) {
  return (
    <section style={resumoCard}>
      <div style={resumoTitulo}>
        <BiUserCircle
          size={19}
          color="#2563eb"
        />

        Resumo dos Consultores
      </div>

      <div style={resumoGrid}>
        <ResumoItem
          label="Consultores"
          value={
            resumo.total_consultores
          }
        />

        <ResumoItem
          label="Total de badges"
          value={
            resumo.total_badges
          }
        />

        <ResumoItem
          label="Média de badges"
          value={
            resumo.media_badges
          }
        />

        <ResumoItem
          label="Mais badges"
          value={
            primeiro
              ? primeiro.total_badges
              : 0
          }
        />
      </div>
    </section>
  );
}

function ResumoItem({
  label,
  value,
}) {
  return (
    <div style={resumoItem}>
      <div style={resumoItemLabel}>
        {label}
      </div>

      <div style={resumoItemValue}>
        {value}
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
  margin: "16px 0 18px",
};

const cabecalhoPagina = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 24,
  marginBottom: 18,
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
  marginTop: 6,
  fontSize: 13,
  color: "#374151",
};

const acoesTopo = {
  display: "flex",
  alignItems: "center",
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
};

const ordenacaoContainer = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 6,
  width: "fit-content",
  margin: "0 auto 22px",
};

const ordenacaoLabel = {
  padding: "0 5px",
  color: "#475569",
  fontSize: 12,
};

const ordenacaoButton = {
  minWidth: 70,
  border: "none",
  borderRadius: 8,
  padding: "8px 13px",
  fontSize: 12,
  cursor: "pointer",
};

const listaRanking = {
  maxWidth: 900,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const rankingCard = {
  minHeight: 78,
  borderRadius: 11,
  padding: "11px 18px",
  display: "grid",
  gridTemplateColumns:
    "52px 58px minmax(0, 1fr) 90px",
  alignItems: "center",
  gap: 14,
};

const posicaoBox = {
  width: 44,
  height: 44,
  borderRadius: 9,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 17,
  fontWeight: 800,
};

const avatar = {
  width: 54,
  height: 54,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const consultorInfo = {
  minWidth: 0,
};

const nomeLinha = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const nomeConsultor = {
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
};

const emailConsultor = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginTop: 3,
  fontSize: 12,
  color: "#64748b",
};

const areaConsultor = {
  marginTop: 3,
  fontSize: 10,
  color: "#94a3b8",
};

const badgesQuantidade = {
  textAlign: "center",
};

const numeroBadges = {
  color: "#2563eb",
  fontSize: 20,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
};

const badgesLabel = {
  marginTop: 2,
  color: "#94a3b8",
  fontSize: 10,
};

const resumoCard = {
  maxWidth: 900,
  margin: "18px auto 0",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "17px 20px",
};

const resumoTitulo = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  color: "#111827",
  fontSize: 14,
  fontWeight: 700,
};

const resumoGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: 20,
  marginTop: 16,
};

const resumoItem = {
  textAlign: "center",
};

const resumoItemLabel = {
  color: "#64748b",
  fontSize: 11,
};

const resumoItemValue = {
  marginTop: 4,
  color: "#2563eb",
  fontSize: 22,
  fontWeight: 700,
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
  color: "#991b1b",
  marginBottom: 18,
  fontSize: 13,
};

export default RankingBadgesSll;