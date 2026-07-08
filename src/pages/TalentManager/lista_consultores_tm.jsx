import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBadge,
  BiBriefcase,
  BiFile,
  BiFilterAlt,
  BiSearch,
  BiSortAlt2,
  BiSpreadsheet,
  BiUserCircle,
  BiPlus,
  BiTargetLock,
} from "react-icons/bi";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../../services/api.js";

import Header from "../../components/Header.jsx";
import TmLeftSidebar from "../../components/tm_left_sidebar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";

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
   FUNÇÕES AUXILIARES
========================================================= */

function normalizarConsultor(
  consultor,
  index
) {
  return {
    id_utilizador:
      consultor.id_utilizador ||
      index,

    nome_completo:
      consultor.nome_completo ||
      "Consultor",

    email:
      consultor.email ||
      "Sem email",

    contacto:
      consultor.contacto ||
      "",

    nome_area:
      consultor.nome_area ||
      "Sem área definida",

    nome_serviceline:
      consultor.nome_serviceline ||
      "Sem Service Line",

    total_badges: Number(
      consultor.total_badges || 0
    ),

    online: Boolean(
      consultor.online
    ),

    estado_conta:
      consultor.estado_conta ||
      "ATIVO",

    data_criacao_conta:
      consultor.data_criacao_conta ||
      null,

    data_entrada_empresa:
      consultor.data_entrada_empresa ||
      null,
  };
}

function formatarData(data) {
  if (!data) {
    return "Não disponível";
  }

  const date = new Date(data);

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

function limparNomeFicheiro(valor) {
  return String(
    valor || "consultor"
  )
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

/* =========================================================
   PÁGINA
========================================================= */

function ListaConsultoresTm() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    consultores,
    setConsultores,
  ] = useState([]);

  const [
    especializacao,
    setEspecializacao,
  ] = useState("");

  const [
    tipoEspecializacao,
    setTipoEspecializacao,
  ] = useState("");

  const [pesquisa, setPesquisa] =
    useState("");

  const [
    filtroArea,
    setFiltroArea,
  ] = useState("TODAS");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("TODOS");

  const [
    ordenacao,
    setOrdenacao,
  ] = useState("NOME_ASC");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

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
          `/tm/${idUtilizador}/consultores`
        );

      const dados =
        response.data || {};

      setEspecializacao(
        dados.talentManager
          ?.especializacao_tm ||
          ""
      );

      setTipoEspecializacao(
        dados.talentManager
          ?.tipo_especializacao ||
          ""
      );

      const lista =
        Array.isArray(
          dados.consultores
        )
          ? dados.consultores.map(
              normalizarConsultor
            )
          : [];

      setConsultores(lista);
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

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar a lista de consultores."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const areasDisponiveis =
    useMemo(() => {
      return [
        ...new Set(
          consultores
            .map(
              (consultor) =>
                consultor.nome_area
            )
            .filter(Boolean)
        ),
      ].sort((a, b) =>
        a.localeCompare(
          b,
          "pt"
        )
      );
    }, [consultores]);

  const consultoresFiltrados =
    useMemo(() => {
      let resultado = [
        ...consultores,
      ];

      const texto =
        pesquisa
          .trim()
          .toLowerCase();

      if (texto) {
        resultado =
          resultado.filter(
            (consultor) =>
              consultor.nome_completo
                .toLowerCase()
                .includes(texto) ||
              consultor.email
                .toLowerCase()
                .includes(texto) ||
              consultor.nome_area
                .toLowerCase()
                .includes(texto) ||
              consultor.nome_serviceline
                .toLowerCase()
                .includes(texto)
          );
      }

      if (
        filtroArea !== "TODAS"
      ) {
        resultado =
          resultado.filter(
            (consultor) =>
              consultor.nome_area ===
              filtroArea
          );
      }

      if (
        filtroEstado === "ONLINE"
      ) {
        resultado =
          resultado.filter(
            (consultor) =>
              consultor.online
          );
      }

      if (
        filtroEstado === "OFFLINE"
      ) {
        resultado =
          resultado.filter(
            (consultor) =>
              !consultor.online
          );
      }

      resultado.sort(
        (a, b) => {
          if (
            ordenacao ===
            "NOME_DESC"
          ) {
            return b.nome_completo.localeCompare(
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
              a.total_badges
            );
          }

          if (
            ordenacao ===
            "BADGES_ASC"
          ) {
            return (
              a.total_badges -
              b.total_badges
            );
          }

          if (
            ordenacao ===
            "REGISTO_RECENTE"
          ) {
            return (
              new Date(
                b.data_criacao_conta ||
                  0
              ) -
              new Date(
                a.data_criacao_conta ||
                  0
              )
            );
          }

          return a.nome_completo.localeCompare(
            b.nome_completo,
            "pt"
          );
        }
      );

      return resultado;
    }, [
      consultores,
      pesquisa,
      filtroArea,
      filtroEstado,
      ordenacao,
    ]);

  function obterDescricaoEspecializacao() {
    if (
      tipoEspecializacao ===
      "RECRUTAMENTO"
    ) {
      return "Consultores registados há menos de 1 ano";
    }

    if (
      tipoEspecializacao ===
      "DESENVOLVIMENTO"
    ) {
      return "Consultores registados há 1 ano ou mais";
    }

    if (
      tipoEspecializacao ===
      "RH_BADGES"
    ) {
      return "Todos os consultores da plataforma";
    }

    return "Consultores acompanhados";
  }

  function abrirPerfil(consultor) {
    navigate(
      `/tm/consultores/${consultor.id_utilizador}`,
      {
        state: {
          voltarPara:
            location.pathname,

          textoVoltar:
            "Voltar à lista de consultores",
        },
      }
    );
  }

  function abrirCriarDesafio(
    consultor = null
  ) {
    navigate(
      "/tm/desafios/novo",
      {
        state: {
          idConsultor:
            consultor?.id_utilizador ||
            null,

          voltarPara:
            location.pathname,
        },
      }
    );
  }

  function gerarPdfConsultor(
    consultor
  ) {
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(19);

      pdf.text(
        "Resumo do Consultor",
        15,
        18
      );

      pdf.setFontSize(14);
      pdf.setTextColor(
        37,
        99,
        235
      );

      pdf.text(
        consultor.nome_completo,
        15,
        29
      );

      pdf.setTextColor(
        17,
        24,
        39
      );

      autoTable(pdf, {
        startY: 38,

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
            consultor.contacto ||
              "Não disponível",
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
            "Badges conquistados",
            consultor.total_badges,
          ],
          [
            "Estado",
            consultor.online
              ? "Online"
              : "Offline",
          ],
          [
            "Entrada na empresa",
            formatarData(
              consultor
                .data_entrada_empresa
            ),
          ],
        ],

        styles: {
          fontSize: 9,
          cellPadding: 4,
        },

        headStyles: {
          fillColor: [
            37,
            99,
            235,
          ],
        },

        columnStyles: {
          0: {
            cellWidth: 60,
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
        "Não foi possível gerar o PDF."
      );
    }
  }

  function gerarExcelConsultor(
    consultor
  ) {
    const linhas = [
      [
        "RESUMO DO CONSULTOR",
        "",
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
        consultor.contacto ||
          "Não disponível",
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
        "Badges conquistados",
        consultor.total_badges,
      ],
      [
        "Estado",
        consultor.online
          ? "Online"
          : "Offline",
      ],
      [
        "Data de entrada",
        formatarData(
          consultor
            .data_entrada_empresa
        ),
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

          <div style={cabecalhoLinha}>
            <div style={cabecalhoPagina}>
              <h1 style={titulo}>
                Lista de Consultores
              </h1>

              <div style={subtitulo}>
                Total de{" "}
                {consultoresFiltrados.length}{" "}
                {consultoresFiltrados.length === 1
                  ? "consultor"
                  : "consultores"}
              </div>

              <div style={especializacaoTexto}>
                Especialização:{" "}
                <strong>
                  {especializacao}
                </strong>
              </div>

              <div style={regraTexto}>
                {obterDescricaoEspecializacao()}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                abrirCriarDesafio()
              }
              style={adicionarDesafioTopo}
            >
              <BiPlus size={19} />
              Adicionar desafio
            </button>
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
              placeholder="Pesquisar por nome, email, área ou Service Line..."
              style={pesquisaInput}
            />
          </div>

          {/* FILTROS */}

          <div style={filtrosContainer}>
            <div style={filtroCampo}>
              <label style={filtroLabel}>
                <BiBriefcase
                  size={16}
                />
                Filtrar por área
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

                {areasDisponiveis.map(
                  (area) => (
                    <option
                      key={area}
                      value={area}
                    >
                      {area}
                    </option>
                  )
                )}
              </select>
            </div>

            <div style={filtroCampo}>
              <label style={filtroLabel}>
                <BiFilterAlt
                  size={16}
                />
                Estado
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

                <option value="ONLINE">
                  Online
                </option>

                <option value="OFFLINE">
                  Offline
                </option>
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

                <option value="REGISTO_RECENTE">
                  Registo mais recente
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
              A carregar consultores...
            </div>
          ) : consultoresFiltrados.length >
            0 ? (
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
                      abrirPerfil(
                        consultor
                      )
                    }
                    onDesafio={() =>
                      abrirCriarDesafio(
                        consultor
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
              consultores.
            </div>
          )}
        </main>

        <TmRightSidebar />
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
  onDesafio,
  onPdf,
  onExcel,
}) {
  return (
    <article style={card}>
      <div style={perfilArea}>
        <div style={avatar}>
          <BiUserCircle
            size={55}
            color="#6092bf"
          />
        </div>

        <div style={estadoLinha}>
          <span
            style={{
              ...estadoChip,

              background:
                consultor.online
                  ? "#dcfce7"
                  : "#e2e8f0",

              color:
                consultor.online
                  ? "#15803d"
                  : "#64748b",
            }}
          >
            {consultor.online
              ? "Online"
              : "Offline"}
          </span>
        </div>
      </div>

      <div style={informacaoArea}>
        <div style={nomeConsultor}>
          {consultor.nome_completo}
        </div>

        <div style={cargoConsultor}>
          Consultor
        </div>

        <div style={emailConsultor}>
          {consultor.email}
        </div>

        <div style={areaConsultor}>
          Área:{" "}
          {consultor.nome_area}
        </div>

        <div style={serviceLineConsultor}>
          Service Line:{" "}
          {
            consultor.nome_serviceline
          }
        </div>

        <button
          type="button"
          onClick={onPerfil}
          style={perfilButton}
        >
          Ver Perfil Completo
        </button>
      </div>

      <div style={badgesArea}>
        <div style={badgesResumo}>
          <BiBadge
            size={22}
            color="#6092bf"
          />

          <div>
            <div style={badgesLabel}>
              Badges conquistados
            </div>

            <div style={badgesValor}>
              {consultor.total_badges}{" "}
              {consultor.total_badges ===
              1
                ? "badge"
                : "badges"}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDesafio}
          style={desafioButton}
        >
          <BiTargetLock size={18} />
          Adicionar desafio
        </button>

        <div style={acoes}>
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
            <BiSpreadsheet
              size={17}
            />
            Gerar Excel
          </button>
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
  padding: "22px 30px 70px",
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
  marginBottom: 20,
};

const titulo = {
  margin: 0,
  color: "#111827",
  fontSize: 21,
  fontWeight: 800,
};

const subtitulo = {
  marginTop: 3,
  color: "#475569",
  fontSize: 12,
};

const especializacaoTexto = {
  marginTop: 6,
  color: "#64748b",
  fontSize: 11,
};

const regraTexto = {
  marginTop: 3,
  color: "#2563eb",
  fontSize: 10,
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
  gap: 20,
};

const card = {
  width: "100%",
  minHeight: 170,
  boxSizing: "border-box",
  display: "grid",
  gridTemplateColumns:
    "95px minmax(0, 1fr) 340px",
  gap: 20,
  alignItems: "center",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "18px 22px",
  boxShadow:
    "0 2px 7px rgba(15,23,42,0.05)",
};

const perfilArea = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const avatar = {
  width: 65,
  height: 65,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const estadoLinha = {
  marginTop: 8,
};

const estadoChip = {
  display: "inline-flex",
  borderRadius: 999,
  padding: "4px 12px",
  fontSize: 9,
  fontWeight: 600,
};

const informacaoArea = {
  minWidth: 0,
};

const nomeConsultor = {
  color: "#111827",
  fontSize: 15,
  fontWeight: 700,
};

const cargoConsultor = {
  marginTop: 2,
  color: "#475569",
  fontSize: 11,
};

const emailConsultor = {
  marginTop: 2,
  color: "#64748b",
  fontSize: 11,
};

const areaConsultor = {
  marginTop: 4,
  color: "#475569",
  fontSize: 11,
};

const serviceLineConsultor = {
  marginTop: 2,
  color: "#64748b",
  fontSize: 10,
};

const perfilButton = {
  minWidth: 190,
  minHeight: 40,
  marginTop: 17,
  border: "1px solid #2563eb",
  borderRadius: 8,
  background: "white",
  color: "#2563eb",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
};

const badgesArea = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

const badgesResumo = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
};

const badgesLabel = {
  color: "#94a3b8",
  fontSize: 9,
  textTransform: "uppercase",
};

const badgesValor = {
  marginTop: 2,
  color: "#111827",
  fontSize: 13,
  fontWeight: 600,
};

const acoes = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

const acaoButton = {
  minHeight: 40,
  border: "none",
  borderRadius: 8,
  background: "#e2e8f0",
  color: "#334155",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
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

const cabecalhoLinha = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 20,
};

const adicionarDesafioTopo = {
  minHeight: 42,
  border: "none",
  borderRadius: 9,
  background: "#2563eb",
  color: "white",
  padding: "9px 17px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const desafioButton = {
  width: "100%",
  minHeight: 41,
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
};

export default ListaConsultoresTm;