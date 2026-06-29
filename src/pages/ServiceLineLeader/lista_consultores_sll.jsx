import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBadge,
  BiEnvelope,
  BiFile,
  BiFilterAlt,
  BiSearch,
  BiSortAlt2,
  BiSpreadsheet,
  BiUserCircle,
} from "react-icons/bi";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import api from "../../services/api.js";

import Header from "../../components/header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";

import LogoSoftinsa from "../../assets/logo.png";

/* =========================================================
   UTILIZADOR AUTENTICADO
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

    contacto:
      consultor.contacto ||
      "Sem contacto",

    estado_conta:
      consultor.estado_conta ||
      "ATIVO",

    id_areas:
      consultor.id_areas ||
      "",

    nome_area:
      consultor.nome_area ||
      "Sem área associada",

    nome_serviceline:
      consultor.nome_serviceline ||
      "Service Line",

    data_entrada_empresa:
      consultor.data_entrada_empresa ||
      null,

    data_entrada_area:
      consultor.data_entrada_area ||
      null,

    progresso_nivel:
      consultor.progresso_nivel ||
      "Sem progresso",

    total_badges: Number(
      consultor.total_badges || 0
    ),
  };
}

function formatarData(data) {
  if (!data) {
    return "Não disponível";
  }

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return "Não disponível";
  }

  return date.toLocaleDateString(
    "pt-PT"
  );
}

function limparNomeFicheiro(valor) {
  return String(valor || "consultor")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-zA-Z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    )
    .toLowerCase();
}

function carregarImagemComoDataUrl(
  origem
) {
  return new Promise(
    (resolve, reject) => {
      const imagem = new Image();

      imagem.onload = () => {
        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width =
          imagem.naturalWidth;

        canvas.height =
          imagem.naturalHeight;

        const contexto =
          canvas.getContext("2d");

        contexto.drawImage(
          imagem,
          0,
          0
        );

        resolve(
          canvas.toDataURL(
            "image/png"
          )
        );
      };

      imagem.onerror = reject;
      imagem.src = origem;
    }
  );
}

/* =========================================================
   PÁGINA
========================================================= */

function ListaConsultoresSll() {
  const navigate = useNavigate();
  const location = useLocation();

  const [
    consultores,
    setConsultores,
  ] = useState([]);

  const [areas, setAreas] =
    useState([]);

  const [
    serviceLine,
    setServiceLine,
  ] = useState(null);

  const [pesquisa, setPesquisa] =
    useState("");

  const [filtroArea, setFiltroArea] =
    useState("TODAS");

  const [ordenacao, setOrdenacao] =
    useState("NOME_ASC");

  const [isLoading, setIsLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    carregarConsultores();
  }, []);

  async function carregarConsultores() {
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
        `/sll/${idUtilizador}/consultores`
      );

      const dados = response.data;

      setServiceLine(
        dados.serviceLine || null
      );

      const lista = Array.isArray(
        dados.consultores
      )
        ? dados.consultores.map(
            normalizarConsultor
          )
        : [];

      setConsultores(lista);

      setAreas(
        Array.isArray(dados.areas)
          ? dados.areas
          : []
      );
    } catch (err) {
      console.error(
        "Erro ao carregar consultores:",
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

      setConsultores([]);
      setAreas([]);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar os consultores."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const consultoresFiltrados =
    useMemo(() => {
      let resultado = [
        ...consultores,
      ];

      const termoPesquisa =
        pesquisa
          .trim()
          .toLowerCase();

      if (termoPesquisa) {
        resultado =
          resultado.filter(
            (consultor) =>
              consultor
                .nome_completo
                .toLowerCase()
                .includes(
                  termoPesquisa
                )
          );
      }

      if (filtroArea !== "TODAS") {
        resultado =
          resultado.filter(
            (consultor) =>
              String(
                consultor.id_areas
              ) ===
              String(filtroArea)
          );
      }

      resultado.sort((a, b) => {
        if (
          ordenacao ===
          "NOME_DESC"
        ) {
          return b.nome_completo
            .localeCompare(
              a.nome_completo,
              "pt"
            );
        }

        if (
          ordenacao ===
          "BADGES_DESC"
        ) {
          return (
            b.total_badges -
              a.total_badges ||
            a.nome_completo
              .localeCompare(
                b.nome_completo,
                "pt"
              )
          );
        }

        if (
          ordenacao ===
          "BADGES_ASC"
        ) {
          return (
            a.total_badges -
              b.total_badges ||
            a.nome_completo
              .localeCompare(
                b.nome_completo,
                "pt"
              )
          );
        }

        return a.nome_completo
          .localeCompare(
            b.nome_completo,
            "pt"
          );
      });

      return resultado;
    }, [
      consultores,
      pesquisa,
      filtroArea,
      ordenacao,
    ]);

  async function gerarPdfConsultor(
    consultor
  ) {
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const logoDataUrl =
        await carregarImagemComoDataUrl(
          LogoSoftinsa
        );

      pdf.addImage(
        logoDataUrl,
        "PNG",
        15,
        13,
        48,
        14
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(18);
      pdf.setTextColor(
        17,
        24,
        39
      );

      pdf.text(
        "Perfil do Consultor",
        15,
        42
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(10);
      pdf.setTextColor(
        71,
        85,
        105
      );

      pdf.text(
        `Service Line: ${consultor.nome_serviceline}`,
        15,
        49
      );

      autoTable(pdf, {
        startY: 58,

        head: [
          [
            "Campo",
            "Informação",
          ],
        ],

        body: [
          [
            "Nome",
            consultor.nome_completo,
          ],
          [
            "Email",
            consultor.email,
          ],
          [
            "Contacto",
            consultor.contacto,
          ],
          [
            "Área",
            consultor.nome_area,
          ],
          [
            "Service Line",
            consultor.nome_serviceline,
          ],
          [
            "Data de entrada na empresa",
            formatarData(
              consultor
                .data_entrada_empresa
            ),
          ],
          [
            "Data de entrada na área",
            formatarData(
              consultor
                .data_entrada_area
            ),
          ],
          [
            "Progresso",
            consultor.progresso_nivel,
          ],
          [
            "Badges conquistados",
            consultor.total_badges,
          ],
          [
            "Estado da conta",
            consultor.estado_conta,
          ],
        ],

        styles: {
          fontSize: 10,
          cellPadding: 4,
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

        columnStyles: {
          0: {
            cellWidth: 62,
            fontStyle: "bold",
          },
        },
      });

      pdf.save(
        `consultor_${limparNomeFicheiro(
          consultor.nome_completo
        )}.pdf`
      );
    } catch (err) {
      console.error(
        "Erro ao gerar PDF:",
        err
      );

      setErro(
        "Não foi possível gerar o PDF do consultor."
      );
    }
  }

  function gerarExcelConsultor(
    consultor
  ) {
    const linhas = [
      [
        "Campo",
        "Informação",
      ],
      [
        "Nome",
        consultor.nome_completo,
      ],
      [
        "Email",
        consultor.email,
      ],
      [
        "Contacto",
        consultor.contacto,
      ],
      [
        "Área",
        consultor.nome_area,
      ],
      [
        "Service Line",
        consultor.nome_serviceline,
      ],
      [
        "Data de entrada na empresa",
        formatarData(
          consultor
            .data_entrada_empresa
        ),
      ],
      [
        "Data de entrada na área",
        formatarData(
          consultor
            .data_entrada_area
        ),
      ],
      [
        "Progresso",
        consultor.progresso_nivel,
      ],
      [
        "Badges conquistados",
        consultor.total_badges,
      ],
      [
        "Estado da conta",
        consultor.estado_conta,
      ],
    ];

    const csv = linhas
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
      `consultor_${limparNomeFicheiro(
        consultor.nome_completo
      )}.csv`;

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
            <h1 style={titulo}>
              Consultores da Plataforma
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
                consultoresFiltrados
                  .length
              }{" "}
              {consultoresFiltrados
                .length === 1
                ? "consultor"
                : "consultores"}
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
                placeholder="Buscar consultor..."
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
                  value={filtroArea}
                  onChange={(event) =>
                    setFiltroArea(
                      event.target.value
                    )
                  }
                  style={inputFiltro}
                >
                  <option value="TODAS">
                    Todas as áreas
                  </option>

                  {areas.map((area) => (
                    <option
                      key={
                        area.id_areas
                      }
                      value={
                        area.id_areas
                      }
                    >
                      {area.nome_area}
                    </option>
                  ))}
                </select>
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
                  <option value="NOME_ASC">
                    Nome A-Z
                  </option>

                  <option value="NOME_DESC">
                    Nome Z-A
                  </option>

                  <option value="BADGES_DESC">
                    Mais badges
                  </option>

                  <option value="BADGES_ASC">
                    Menos badges
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
              A carregar consultores...
            </div>
          ) : consultoresFiltrados
              .length > 0 ? (
            <div style={lista}>
              {consultoresFiltrados.map(
                (consultor) => (
                  <ConsultorCard
                    key={
                      consultor.id_utilizador
                    }
                    consultor={
                      consultor
                    }
                    onPerfil={() =>
                      navigate(
                        `/sll/consultores/${consultor.id_utilizador}`,
                        {
                          state: {
                            voltarPara: location.pathname,
                            textoVoltar:
                              "Voltar à lista de consultores",
                          },
                        }
                      )
                    }
                    onPdf={() =>
                      gerarPdfConsultor(
                        consultor
                      )
                    }
                    onExcel={() =>
                      gerarExcelConsultor(
                        consultor
                      )
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div style={mensagemBox}>
              Não foram encontrados
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
   CARD DO CONSULTOR
========================================================= */

function ConsultorCard({
  consultor,
  onPerfil,
  onPdf,
  onExcel,
}) {
  return (
    <article style={card}>
      <div style={consultorTopo}>
        <div style={avatar}>
          <BiUserCircle
            size={52}
            color="#6092bf"
          />
        </div>

        <div style={consultorInfo}>
          <div style={nomeConsultor}>
            {consultor.nome_completo}
          </div>

          <div style={cargoTexto}>
            Consultor
          </div>

          <div style={emailTexto}>
            <BiEnvelope size={14} />
            {consultor.email}
          </div>

          <div style={areaTexto}>
            Área:{" "}
            <strong>
              {consultor.nome_area}
            </strong>
          </div>

          <div style={badgesTexto}>
            <BiBadge
              size={14}
              color="#2563eb"
            />

            {consultor.total_badges}{" "}
            {consultor.total_badges === 1
              ? "badge conquistado"
              : "badges conquistados"}
          </div>
        </div>
      </div>

      <div style={acoesCard}>
        <button
          type="button"
          onClick={onPerfil}
          style={perfilButton}
        >
          Ver Perfil Completo
        </button>

        <button
          type="button"
          onClick={onPdf}
          style={acaoButton}
        >
          <BiFile size={17} />
          Gerar PDF
        </button>

        <button
          type="button"
          onClick={onExcel}
          style={acaoButton}
        >
          <BiSpreadsheet size={17} />
          Gerar Excel
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
  maxWidth: 920,
  margin: "0 auto 18px",
};

const titulo = {
  margin: 0,
  maxWidth: 260,
  fontSize: 17,
  fontWeight: 800,
  color: "#111827",
};

const subtitulo = {
  marginTop: 4,
  fontSize: 12,
  color: "#64748b",
};

const totalTexto = {
  marginTop: 3,
  fontSize: 12,
  color: "#475569",
};

const filtrosArea = {
  maxWidth: 920,
  margin: "0 auto 28px",
  display: "grid",
  gridTemplateColumns:
    "minmax(230px, 0.7fr) minmax(420px, 1fr)",
  gap: 30,
  alignItems: "end",
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
    "repeat(2, minmax(0, 1fr))",
  gap: 14,
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
  fontSize: 13,
};

const lista = {
  maxWidth: 900,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 25,
};

const card = {
  minHeight: 172,
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "16px 20px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const consultorTopo = {
  display: "flex",
  alignItems: "flex-start",
  gap: 16,
};

const avatar = {
  width: 62,
  height: 62,
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
  marginTop: 3,
  display: "flex",
  alignItems: "center",
  gap: 5,
  color: "#64748b",
  fontSize: 11,
};

const areaTexto = {
  marginTop: 3,
  color: "#64748b",
  fontSize: 11,
};

const badgesTexto = {
  marginTop: 6,
  display: "flex",
  alignItems: "center",
  gap: 5,
  color: "#2563eb",
  fontSize: 11,
  fontWeight: 600,
};

const acoesCard = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns:
    "190px 135px 135px",
  gap: 28,
  alignItems: "center",
};

const perfilButton = {
  minHeight: 38,
  border: "1px solid #2563eb",
  borderRadius: 8,
  background: "white",
  color: "#2563eb",
  padding: "8px 15px",
  fontSize: 12,
  cursor: "pointer",
};

const acaoButton = {
  minHeight: 38,
  border: "none",
  borderRadius: 8,
  background: "#f1f5f9",
  color: "#334155",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 14px",
  fontSize: 12,
  cursor: "pointer",
};

const erroBox = {
  maxWidth: 900,
  margin: "0 auto 18px",
  background: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: 12,
  color: "#991b1b",
  fontSize: 13,
};

const mensagemBox = {
  maxWidth: 900,
  margin: "0 auto",
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#64748b",
};

export default ListaConsultoresSll;