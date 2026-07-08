import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  BiAward,
  BiBadge,
  BiBookOpen,
  BiBriefcase,
  BiEnvelope,
  BiMedal,
  BiTimeFive,
  BiUser,
  BiUserCircle,
} from "react-icons/bi";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../../services/api.js";

import Header from "../../components/Header.jsx";
import TmLeftSidebar from "../../components/tm_left_sidebar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";

function obterUtilizadorGuardado() {
  const storedUser =
    localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(
      storedUser
    );
  } catch (err) {
    console.error(
      "Erro ao ler utilizador:",
      err
    );

    return null;
  }
}

function obterConfiguracaoDashboard(
  resumo
) {
  if (
    resumo.tipo_especializacao ===
    "RECRUTAMENTO"
  ) {
    return {
      descricaoConsultores:
        `${resumo.total_consultores_acompanhados} consultores iniciantes`,

      descricaoBadges:
        `${resumo.badges_atribuidos_mes} badges atribuídos a iniciantes este mês`,

      descricaoSll:
        `${resumo.total_sll_ativos} Service Line Leaders ativos`,

      tituloLista:
        "Consultores iniciantes",

      descricaoLista:
        `Acompanha ${resumo.total_consultores_acompanhados} consultores registados há menos de 1 ano`,

      graficoTitulo:
        "Consultores iniciantes em cada área",

      cards: [
        {
          tipo: "NOVOS",
          valor:
            resumo.novos_consultores_mes,
          label:
            "Novos consultores este mês",
        },
        {
          tipo: "BADGES",
          valor:
            resumo.badges_atribuidos_mes,
          label:
            "Badges atribuídos a iniciantes",
        },
        {
          tipo: "CANDIDATURAS",
          valor:
            resumo.candidaturas_por_ver,
          label:
            "Candidaturas por avaliar",
        },
      ],
    };
  }

  if (
    resumo.tipo_especializacao ===
    "DESENVOLVIMENTO"
  ) {
    return {
      descricaoConsultores:
        `${resumo.total_consultores_acompanhados} consultores experientes`,

      descricaoBadges:
        `${resumo.total_badges} badges e competências obtidas`,

      descricaoSll:
        `${resumo.total_sll_ativos} Service Line Leaders ativos`,

      tituloLista:
        "Consultores experientes",

      descricaoLista:
        `Acompanha ${resumo.total_consultores_acompanhados} consultores registados há pelo menos 1 ano`,

      graficoTitulo:
        "Consultores experientes em cada área",

      cards: [
        {
          tipo: "CONSULTORES",
          valor:
            resumo.consultores_com_badges,
          label:
            "Consultores com competências",
        },
        {
          tipo: "BADGES",
          valor:
            resumo.badges_atribuidos_mes,
          label:
            "Badges atribuídos este mês",
        },
        {
          tipo: "CANDIDATURAS",
          valor:
            resumo.candidaturas_por_ver,
          label:
            "Candidaturas por avaliar",
        },
      ],
    };
  }

  if (
    resumo.tipo_especializacao ===
    "RH_BADGES"
  ) {
    return {
      descricaoConsultores:
        `${resumo.total_consultores_acompanhados} consultores visíveis`,

      descricaoBadges:
        `${resumo.badges_expirados} badges expirados`,

      descricaoSll:
        `${resumo.total_sll_ativos} Service Line Leaders ativos`,

      tituloLista:
        "Todos os consultores",

      descricaoLista:
        `Pode consultar os ${resumo.total_consultores_acompanhados} consultores ativos`,

      graficoTitulo:
        "Todos os consultores em cada área",

      cards: [
        {
          tipo: "EXPIRADOS",
          valor:
            resumo.badges_expirados,
          label:
            "Badges expirados",
        },
        {
          tipo: "RENOVACOES",
          valor:
            resumo.renovacoes_ativas,
          label:
            "Renovações ativas",
        },
        {
          tipo: "CANDIDATURAS",
          valor:
            resumo.candidaturas_por_ver,
          label:
            "Renovações por avaliar",
        },
      ],
    };
  }

  return {
    descricaoConsultores:
      "0 consultores acompanhados",

    descricaoBadges:
      "0 badges",

    descricaoSll:
      "0 Service Line Leaders",

    tituloLista:
      "Consultores",

    descricaoLista:
      "Especialização não reconhecida",

    graficoTitulo:
      "Consultores em cada área",

    cards: [],
  };
}

function PaginaPrincipalTm() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [erro, setErro] =
    useState("");

  const [resumo, setResumo] =
    useState({
        nome_completo:
        "Talent Manager",

        especializacao_tm:
        "Especialização não definida",

        tipo_especializacao:
        "",

        total_consultores_acompanhados:
        0,

        total_consultores_online:
        0,

        total_consultores: 0,

        total_badges: 0,

        consultores_com_badges:
        0,

        badges_atribuidos_mes:
        0,

        badges_expirados: 0,

        novos_consultores_mes:
        0,

        candidaturas_ativas:
        0,

        candidaturas_por_ver:
        0,

        renovacoes_ativas: 0,

        total_sll_ativos: 0,

        total_sll_online: 0,
    });

  const [
    consultores,
    setConsultores,
  ] = useState([]);

  const [
    consultoresPorArea,
    setConsultoresPorArea,
  ] = useState([]);

  const configuracao =
  obterConfiguracaoDashboard(resumo);

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarDashboard() {
    const user =
      obterUtilizadorGuardado();

    const userId =
      user?.id_utilizador ||
      user?.ID_UTILIZADOR ||
      user?.id;

    if (!userId) {
      setErro(
        "Não foi possível identificar o Talent Manager."
      );

      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      const resultados =
        await Promise.allSettled([
          api.get(
            `/dashboard/tm/${userId}/resumo`
          ),

          api.get(
            `/dashboard/tm/${userId}/consultores-destaque`
          ),

          api.get(
            `/dashboard/tm/${userId}/consultores-por-area`
          ),
        ]);

      const resumoResultado =
        resultados[0];

      const consultoresResultado =
        resultados[1];

      const graficoResultado =
        resultados[2];

      if (
        resumoResultado.status ===
        "rejected"
      ) {
        throw resumoResultado.reason;
      }

      const dadosResumo =
        resumoResultado.value.data ||
        {};

      setResumo({
        nome_completo:
            dadosResumo.nome_completo ||
            user?.nome_completo ||
            user?.nome ||
            "Talent Manager",

        especializacao_tm:
            dadosResumo.especializacao_tm ||
            "Especialização não definida",

        tipo_especializacao:
            dadosResumo.tipo_especializacao ||
            "",

        total_consultores_acompanhados:
            Number(
            dadosResumo
                .total_consultores_acompanhados ||
                0
            ),

        total_consultores_online:
            Number(
            dadosResumo
                .total_consultores_online ||
                0
            ),

        total_consultores:
            Number(
            dadosResumo.total_consultores ||
                0
            ),

        total_badges:
            Number(
            dadosResumo.total_badges ||
                0
            ),

        consultores_com_badges:
            Number(
            dadosResumo
                .consultores_com_badges ||
                0
            ),

        badges_atribuidos_mes:
            Number(
            dadosResumo
                .badges_atribuidos_mes ||
                0
            ),

        badges_expirados:
            Number(
            dadosResumo
                .badges_expirados ||
                0
            ),

        novos_consultores_mes:
            Number(
            dadosResumo
                .novos_consultores_mes ||
                0
            ),

        candidaturas_ativas:
            Number(
            dadosResumo
                .candidaturas_ativas ||
                0
            ),

        candidaturas_por_ver:
            Number(
            dadosResumo
                .candidaturas_por_ver ||
                0
            ),

        renovacoes_ativas:
            Number(
            dadosResumo
                .renovacoes_ativas ||
                0
            ),

        total_sll_ativos:
            Number(
            dadosResumo.total_sll_ativos ||
                0
            ),

        total_sll_online:
            Number(
            dadosResumo
                .total_sll_online ||
                0
            ),
        });

      if (
        consultoresResultado.status ===
        "fulfilled"
      ) {
        setConsultores(
          Array.isArray(
            consultoresResultado
              .value.data
          )
            ? consultoresResultado
                .value.data
            : []
        );
      } else {
        console.error(
          "Erro ao carregar consultores em destaque:",
          consultoresResultado.reason
        );

        setConsultores([]);
      }

      if (
        graficoResultado.status ===
        "fulfilled"
      ) {
        setConsultoresPorArea(
          Array.isArray(
            graficoResultado
              .value.data
          )
            ? graficoResultado
                .value.data
            : []
        );
      } else {
        console.error(
          "Erro ao carregar gráfico de áreas:",
          graficoResultado.reason
        );

        setConsultoresPorArea([]);
      }
    } catch (err) {
      console.error(
        "Erro ao carregar dashboard TM:",
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

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar o dashboard do Talent Manager."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function abrirPerfil(
    consultor
  ) {
    const idConsultor =
      consultor.id_utilizador ||
      consultor.ID_UTILIZADOR ||
      consultor.id;

    if (!idConsultor) {
      console.error(
        "O consultor não possui ID:",
        consultor
      );

      return;
    }

    navigate(
      `/tm/consultores/${idConsultor}`,
      {
        state: {
          voltarPara:
            location.pathname,

          textoVoltar:
            "Voltar ao dashboard",
        },
      }
    );
  }

  return (
    <div style={page}>
      <Header />

      <div style={body}>
        <TmLeftSidebar />

        <main style={main}>
          {erro && (
            <div style={errorBox}>
              {erro}
            </div>
          )}

          {isLoading ? (
            <div style={loadingBox}>
              A carregar dashboard...
            </div>
          ) : (
            <>
              <section style={welcomeCard}>
                <div>
                  <h2 style={welcomeTitle}>
                    Bom dia,{" "}
                    {resumo.nome_completo}!
                  </h2>

                  <div style={welcomeStats}>
                    <WelcomeItem
                    icon={
                        <BiUserCircle size={20} />
                    }
                    label="Consultores"
                    value={
                        configuracao
                        .descricaoConsultores
                    }
                    />

                    <WelcomeItem
                    icon={<BiBadge size={20} />}
                    label="Badges"
                    value={
                        configuracao
                        .descricaoBadges
                    }
                    />

                    <WelcomeItem
                    icon={
                        <BiBriefcase size={20} />
                    }
                    label="Service Line Leaders"
                    value={
                        configuracao
                        .descricaoSll
                    }
                    />
                  </div>
                </div>

                <div style={welcomeAvatar}>
                  <BiUserCircle
                    size={58}
                    color="rgba(255,255,255,0.88)"
                  />
                </div>
              </section>

              <div style={dashboardGrid}>
                <section style={consultoresArea}>
                  <div style={peopleHeader}>
                    <div>
                        <h3 style={areaTitle}>
                        Especialização:{" "}
                        <span style={areaName}>
                            {resumo.especializacao_tm}
                        </span>
                        </h3>

                        <div style={areaTotal}>
                        {configuracao.descricaoLista}
                        </div>

                      <div style={topText}>
                        {configuracao.tituloLista}
                        </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/tm/consultores"
                        )
                      }
                      style={viewAllButton}
                    >
                      <BiBookOpen
                        size={15}
                      />
                      Ver Todos
                    </button>
                  </div>

                  {consultores.length >
                  0 ? (
                    consultores
                      .slice(0, 3)
                      .map(
                        (
                          consultor,
                          index
                        ) => (
                          <ConsultorCard
                            key={
                              consultor.id_utilizador ||
                              index
                            }
                            consultor={
                              consultor
                            }
                            onVerPerfil={() =>
                              abrirPerfil(
                                consultor
                              )
                            }
                          />
                        )
                      )
                  ) : (
                    <div style={emptyBox}>
                      Ainda não existem
                      consultores em
                      destaque.
                    </div>
                  )}
                </section>

                <aside style={statsColumn}>
                  {configuracao.cards.map(
                    (card, index) => (
                        <StatCard
                        key={card.tipo}
                        icon={
                            card.tipo ===
                            "EXPIRADOS" ? (
                            <BiTimeFive size={46} />
                            ) : card.tipo ===
                                "CANDIDATURAS" ||
                            card.tipo ===
                                "RENOVACOES" ? (
                            <BiTimeFive size={46} />
                            ) : card.tipo ===
                                "CONSULTORES" ||
                            card.tipo === "NOVOS" ? (
                            <BiUser size={46} />
                            ) : (
                            <BiMedal size={46} />
                            )
                        }
                        value={card.valor}
                        label={card.label}
                        secondary={
                            card.tipo ===
                            "CANDIDATURAS"
                            ? "Pendentes de avaliação"
                            : null
                        }
                        secondaryColor="#dc2626"
                        />
                    )
                    )}
                </aside>
              </div>

              <section style={chartCard}>
                <h3 style={chartTitle}>
                {configuracao.graficoTitulo}
                </h3>

                {consultoresPorArea.length >
                0 ? (
                  <div style={chartLayout}>
                    <div style={chartArea}>
                      <ResponsiveContainer
                        width="100%"
                        height={245}
                      >
                        <BarChart
                          data={
                            consultoresPorArea
                          }
                          margin={{
                            top: 20,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f1f5f9"
                          />

                          <XAxis
                            dataKey="nome_area_curto"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 10,
                              fill: "#9ca3af",
                            }}
                          />

                          <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 10,
                              fill: "#9ca3af",
                            }}
                          />

                          <Tooltip
                            content={
                              <AreaTooltip />
                            }
                          />

                          <Bar
                            dataKey="total_consultores"
                            radius={[
                              8,
                              8,
                              0,
                              0,
                            ]}
                            maxBarSize={32}
                          >
                            {consultoresPorArea.map(
                              (
                                item,
                                index
                              ) => (
                                <Cell
                                  key={
                                    item.id_areas ||
                                    index
                                  }
                                  fill={
                                    CORES_GRAFICO[
                                      index %
                                        CORES_GRAFICO.length
                                    ]
                                  }
                                />
                              )
                            )}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={chartLegend}>
                      {consultoresPorArea.map(
                        (
                          area,
                          index
                        ) => (
                          <div
                            key={
                              area.id_areas ||
                              index
                            }
                            style={legendRow}
                          >
                            <span
                              style={{
                                ...legendDot,

                                background:
                                  CORES_GRAFICO[
                                    index %
                                      CORES_GRAFICO.length
                                  ],
                              }}
                            />

                            <span
                              style={
                                legendLabel
                              }
                            >
                              {area.nome_serviceline
                                ? `${area.nome_serviceline} - `
                                : ""}

                              {area.nome_area}
                            </span>

                            <strong
                              style={
                                legendValue
                              }
                            >
                              {Number(
                                area.total_consultores ||
                                  0
                              )}
                            </strong>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={emptyChart}>
                    Sem dados disponíveis
                    para o gráfico.
                  </div>
                )}
              </section>
            </>
          )}
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function WelcomeItem({
  icon,
  label,
  value,
}) {
  return (
    <div style={welcomeItem}>
      <div style={welcomeItemIcon}>
        {icon}
      </div>

      <div>
        <div style={welcomeItemLabel}>
          {label}
        </div>

        <div style={welcomeItemValue}>
          {value}
        </div>
      </div>
    </div>
  );
}

function ConsultorCard({
  consultor,
  onVerPerfil,
}) {
  const nome =
    consultor.nome_completo ||
    consultor.nome ||
    "Consultor";

  const email =
    consultor.email ||
    consultor.email_softinsa ||
    "Sem email";

  const area =
    consultor.nome_area ||
    "Sem área";

  const totalBadges = Number(
    consultor.total_badges || 0
  );

  return (
    <article style={consultorCard}>
      <div style={consultorMain}>
        <div style={consultorAvatar}>
          <BiUserCircle
            size={42}
            color="#6092bf"
          />
        </div>

        <div style={consultorInfo}>
          <div style={consultorTopLine}>
            <span style={consultorName}>
              {nome}
            </span>

            <span style={consultorEmail}>
              <BiEnvelope size={14} />
              {email}
            </span>
          </div>

          <div style={consultorArea}>
            {area}
          </div>
        </div>
      </div>

      <div style={consultorFooter}>
        <div style={badgeCount}>
          <BiAward size={15} />

          {totalBadges}{" "}
          {totalBadges === 1
            ? "badge"
            : "badges"}
        </div>

        <button
          type="button"
          onClick={onVerPerfil}
          style={profileLink}
        >
          Ver perfil
        </button>
      </div>
    </article>
  );
}

function StatCard({
  icon,
  value,
  label,
  secondary,
  secondaryColor,
}) {
  return (
    <div style={statCard}>
      <div style={statIcon}>
        {icon}
      </div>

      <div style={statContent}>
        <div style={statValue}>
          {value}
        </div>

        <div style={statLabel}>
          {label}
        </div>

        {secondary && (
          <div
            style={{
              ...statSecondary,

              color:
                secondaryColor ||
                "#64748b",
            }}
          >
            {secondary}
          </div>
        )}
      </div>
    </div>
  );
}

function AreaTooltip({
  active,
  payload,
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  const area =
    payload[0].payload;

  return (
    <div style={tooltipBox}>
      <div style={tooltipTitle}>
        {area.nome_area}
      </div>

      <div style={tooltipText}>
        {Number(
          area.total_consultores ||
            0
        )}{" "}
        consultores
      </div>
    </div>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const CORES_GRAFICO = [
  "#9bb8e8",
  "#64d8cc",
  "#111111",
  "#f59e0b",
  "#8b5cf6",
];

const page = {
  background: "#f3f4f6",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};

const body = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const main = {
  flex: 1,
  minWidth: 0,
  padding: "22px 30px 50px",
  overflowY: "auto",
};

const welcomeCard = {
  background: "#1269ed",
  color: "white",
  borderRadius: 13,
  padding: "24px 28px",
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
  boxShadow:
    "0 8px 18px rgba(37, 99, 235, 0.22)",
  marginBottom: 18,
};

const welcomeTitle = {
  fontSize: 18,
  fontWeight: 500,
  margin: "0 0 18px",
};

const welcomeStats = {
  display: "flex",
  gap: 36,
  flexWrap: "wrap",
};

const welcomeItem = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const welcomeItemIcon = {
  width: 34,
  height: 34,
  borderRadius: 7,
  background:
    "rgba(255,255,255,0.17)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const welcomeItemLabel = {
  fontSize: 10,
  color:
    "rgba(255,255,255,0.78)",
};

const welcomeItemValue = {
  fontSize: 12,
  fontWeight: 500,
};

const welcomeAvatar = {
  width: 68,
  height: 68,
  borderRadius: "50%",
  background:
    "rgba(255,255,255,0.17)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const dashboardGrid = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 250px",
  gap: 28,
  alignItems: "start",
};

const consultoresArea = {
  minWidth: 0,
};

const peopleHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent:
    "space-between",
  marginBottom: 10,
};

const areaTitle = {
  fontSize: 17,
  fontWeight: 800,
  color: "#111827",
  margin: 0,
};

const areaName = {
  fontWeight: 400,
};

const areaTotal = {
  fontSize: 12,
  color: "#111827",
};

const topText = {
  fontSize: 15,
  color: "#111827",
  marginTop: 12,
};

const viewAllButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border:
    "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  color: "#111827",
  padding: "7px 13px",
  fontSize: 12,
  cursor: "pointer",
};

const consultorCard = {
  background: "white",
  border:
    "1px solid #bfdbfe",
  borderRadius: 9,
  marginBottom: 12,
  overflow: "hidden",
};

const consultorMain = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "13px 15px",
};

const consultorAvatar = {
  width: 48,
  height: 48,
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

const consultorTopLine = {
  display: "flex",
  alignItems: "center",
  gap: 18,
  flexWrap: "wrap",
};

const consultorName = {
  fontSize: 14,
  color: "#111827",
  fontWeight: 500,
};

const consultorEmail = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  color: "#64748b",
  fontSize: 11,
};

const consultorArea = {
  color: "#111827",
  fontSize: 10,
  marginTop: 3,
};

const consultorFooter = {
  borderTop:
    "1px solid #e5e7eb",
  padding: "7px 8px",
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "center",
};

const badgeCount = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  color: "#475569",
  fontSize: 11,
};

const profileLink = {
  border: "none",
  background: "none",
  padding: 0,
  color: "#2563eb",
  textDecoration: "underline",
  fontSize: 11,
  cursor: "pointer",
};

const statsColumn = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  paddingTop: 82,
};

const statCard = {
  minHeight: 92,
  background: "white",
  border:
    "1px solid #2563eb",
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  gap: 18,
  padding: "14px 17px",
  boxShadow:
    "0 2px 5px rgba(15,23,42,0.06)",
};

const statIcon = {
  width: 58,
  height: 58,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#000000",
  flexShrink: 0,
};

const statContent = {
  flex: 1,
  minWidth: 0,
};

const statValue = {
  fontSize: 13,
  color: "#111827",
};

const statLabel = {
  marginTop: 3,
  fontSize: 12,
  color: "#111827",
  lineHeight: 1.3,
};

const statSecondary = {
  marginTop: 2,
  fontSize: 11,
};

const chartCard = {
  background: "white",
  borderRadius: 14,
  padding: "20px",
  marginTop: 18,
  minHeight: 290,
};

const chartTitle = {
  margin: "0 0 16px",
  fontSize: 13,
  fontWeight: 700,
  color: "#111827",
};

const chartLayout = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 340px",
  gap: 28,
  alignItems: "center",
};

const chartArea = {
  minWidth: 0,
};

const chartLegend = {
  display: "flex",
  flexDirection: "column",
  gap: 11,
};

const legendRow = {
  display: "grid",
  gridTemplateColumns:
    "8px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 7,
};

const legendDot = {
  width: 6,
  height: 6,
  borderRadius: "50%",
};

const legendLabel = {
  fontSize: 10,
  color: "#111827",
};

const legendValue = {
  fontSize: 10,
  color: "#111827",
};

const tooltipBox = {
  background: "white",
  border:
    "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "8px 10px",
  boxShadow:
    "0 5px 15px rgba(15,23,42,0.12)",
};

const tooltipTitle = {
  fontSize: 12,
  fontWeight: 700,
  color: "#111827",
};

const tooltipText = {
  marginTop: 3,
  fontSize: 11,
  color: "#64748b",
};

const loadingBox = {
  background: "white",
  border:
    "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  color: "#6b7280",
  textAlign: "center",
};

const errorBox = {
  background: "#fee2e2",
  border:
    "1px solid #fecaca",
  borderRadius: 10,
  padding: "10px 12px",
  color: "#991b1b",
  fontSize: 13,
  marginBottom: 16,
};

const emptyBox = {
  background: "white",
  border:
    "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 26,
  textAlign: "center",
  color: "#9ca3af",
  fontSize: 12,
};

const emptyChart = {
  height: 220,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#9ca3af",
  fontSize: 12,
};

export default PaginaPrincipalTm;