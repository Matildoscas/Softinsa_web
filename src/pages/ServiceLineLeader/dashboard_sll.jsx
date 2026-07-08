import { useEffect, useState } from "react";
import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  BiUserCircle,
  BiBriefcase,
  BiMedal,
  BiTimeFive,
  BiEnvelope,
  BiAward,
  BiBookOpen,
} from "react-icons/bi";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import api from "../../services/api.js";

import Header from "../../components/Header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";

function obterUtilizadorGuardado() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

function PaginaPrincipalSll() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] =
    useState("Total Consultores");

  const [isLoading, setIsLoading] =
    useState(true);

  const [erro, setErro] = useState("");

  const [resumo, setResumo] = useState({
    nome_completo: "Service Line Leader",
    nome_serviceline: "Service Line",
    total_consultores: 0,
    consultores_ativos: 0,
    evidencias_pendentes: 0,
    badges_atribuidos_mes: 0,
    badges_por_aprovar: 0,
    pontos_obtidos_mes: 0,
  });

  const [consultores, setConsultores] =
    useState([]);

  const [grafico, setGrafico] = useState([]);

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarDashboard() {
    const user = obterUtilizadorGuardado();

    const userId =
      user?.id_utilizador ||
      user?.ID_UTILIZADOR ||
      user?.id;

    if (!userId) {
      setErro(
        "Não foi possível identificar o Service Line Leader."
      );

      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      const resultados = await Promise.allSettled([
        api.get(
          `/dashboard/sll/${userId}/resumo`
        ),

        api.get(
          `/dashboard/sll/${userId}/consultores-destaque`
        ),

        api.get(
          `/dashboard/sll/${userId}/grafico-anual`
        ),
      ]);

      const resumoResultado = resultados[0];
      const consultoresResultado = resultados[1];
      const graficoResultado = resultados[2];

      if (resumoResultado.status === "rejected") {
        throw resumoResultado.reason;
      }

      setResumo({
        nome_completo:
          resumoResultado.value.data.nome_completo ||
          user?.nome_completo ||
          "Service Line Leader",

        nome_serviceline:
          resumoResultado.value.data
            .nome_serviceline ||
          "Service Line",

        total_consultores: Number(
          resumoResultado.value.data
            .total_consultores || 0
        ),

        consultores_ativos: Number(
          resumoResultado.value.data
            .consultores_ativos || 0
        ),

        evidencias_pendentes: Number(
          resumoResultado.value.data
            .evidencias_pendentes || 0
        ),

        badges_atribuidos_mes: Number(
          resumoResultado.value.data
            .badges_atribuidos_mes || 0
        ),

        badges_por_aprovar: Number(
          resumoResultado.value.data
            .badges_por_aprovar || 0
        ),

        pontos_obtidos_mes: Number(
          resumoResultado.value.data
            .pontos_obtidos_mes || 0
        ),
      });

      if (
        consultoresResultado.status ===
        "fulfilled"
      ) {
        setConsultores(
          Array.isArray(
            consultoresResultado.value.data
          )
            ? consultoresResultado.value.data
            : []
        );
      } else {
        console.error(
          "Erro ao carregar consultores:",
          consultoresResultado.reason
        );

        setConsultores([]);
      }

      if (
        graficoResultado.status === "fulfilled"
      ) {
        setGrafico(
          Array.isArray(graficoResultado.value.data)
            ? graficoResultado.value.data
            : []
        );
      } else {
        console.error(
          "Erro ao carregar gráfico:",
          graficoResultado.reason
        );

        setGrafico([]);
      }
    } catch (err) {
      console.error(
        "Erro ao carregar dashboard SLL:",
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
          "Não foi possível carregar o dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const chartKeys =
    activeTab === "Total Consultores"
      ? {
          atual: "consultores_este_ano",
          anterior: "consultores_ano_passado",
        }
      : activeTab === "Pontos obtidos"
        ? {
            atual: "pontos_este_ano",
            anterior:
              "pontos_ano_passado",
          }
        : {
            atual: "badges_este_ano",
            anterior: "badges_ano_passado",
          };

  return (
    <div style={page}>
      <Header />

      <div style={body}>
        <SllLeftSidebar />

        <main style={main}>
          {erro && (
            <div style={errorBox}>{erro}</div>
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
                    Bom dia, {resumo.nome_completo}!
                  </h2>

                  <div style={welcomeStats}>
                    <WelcomeItem
                      icon={
                        <BiUserCircle size={20} />
                      }
                      label="Consultores"
                      value={`Tem ${resumo.total_consultores} consultores`}
                    />

                    <WelcomeItem
                      icon={<BiBriefcase size={20} />}
                      label="Evidências Pendentes"
                      value={`Tem ${resumo.evidencias_pendentes} evidências pendentes`}
                    />
                  </div>
                </div>

                <div style={welcomeAvatar}>
                  <BiUserCircle
                    size={58}
                    color="rgba(255,255,255,0.85)"
                  />
                </div>
              </section>

              <section style={statsRow}>
                <SmallStatCard
                    icon={<BiUserCircle size={28} />}
                  value={resumo.consultores_ativos}
                    label="Consultores ativos"
                />

                <SmallStatCard
                    icon={<BiMedal size={28} />}
                    value={resumo.badges_atribuidos_mes}
                    label="Badges atribuídos este mês"
                />

                <SmallStatCard
                    icon={<BiTimeFive size={28} />}
                    value={resumo.badges_por_aprovar}
                    label="Badges por aprovar"
                />
                </section>

              <section style={chartCard}>
                <div style={chartHeader}>
                  <ChartTabs
                    active={activeTab}
                    onChange={setActiveTab}
                  />

                  <div style={legend}>
                    <LegendItem
                      dashed={false}
                      label="Este ano"
                    />

                    <LegendItem
                      dashed
                      label="Ano Passado"
                    />
                  </div>
                </div>

                {grafico.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height={250}
                  >
                    <LineChart data={grafico}>
                      <XAxis
                        dataKey="mes"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fill: "#9ca3af",
                        }}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fill: "#9ca3af",
                        }}
                      />

                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey={chartKeys.atual}
                        stroke="#111827"
                        strokeWidth={2}
                        dot={false}
                      />

                      <Line
                        type="monotone"
                        dataKey={chartKeys.anterior}
                        stroke="#93c5fd"
                        strokeWidth={2}
                        strokeDasharray="4 3"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={emptyChart}>
                    Sem dados disponíveis para o
                    gráfico.
                  </div>
                )}
              </section>

              <section style={peopleSection}>
                <div style={peopleColumn}>
                  <div style={peopleHeader}>
                    <div>
                      <h3 style={sectionTitle}>
                        Os seus Consultores
                      </h3>

                      <div style={sectionDescription}>
                        Tem {resumo.total_consultores}{" "}
                        consultores nesta Service
                        Line
                      </div>

                      <div style={topText}>
                        Top 3 este mês:
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate("/sll/consultores")
                      }
                      style={viewAllButton}
                    >
                      <BiBookOpen size={15} />
                      Ver Todos
                    </button>
                  </div>

                  {consultores.length > 0 ? (
                    consultores.map((consultor, index) => {
                      const idConsultor =
                        consultor.id_utilizador ||
                        consultor.ID_UTILIZADOR ||
                        consultor.id;

                      return (
                        <ConsultorCard
                          key={idConsultor || index}
                          consultor={consultor}
                          onVerPerfil={() =>
                            navigate(
                              `/sll/consultores/${consultor.id_utilizador}`,
                              {
                                state: {
                                  voltarPara: location.pathname,
                                  textoVoltar: "Voltar ao dashboard",
                                },
                              }
                            )
                          }
                        />
                      );
                    })
                  ) : (
                    <div style={emptyBox}>
                      Ainda não existem consultores
                      associados a esta Service Line.
                    </div>
                  )}
                </div>

                
              </section>
            </>
          )}
        </main>

        <SllRightSidebar />
      </div>
    </div>
  );
}

function WelcomeItem({
  icon,
  label,
  value,
}) {
  return (
    <div style={welcomeItem}>
      <div style={welcomeItemIcon}>{icon}</div>

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
              {consultor.nome_completo}
            </span>

            <span style={consultorEmail}>
              <BiEnvelope size={14} />
              {consultor.email || "Sem email"}
            </span>
          </div>

          <div style={consultorCargo}>
            Cargo: Consultor
          </div>
        </div>
      </div>

      <div style={consultorFooter}>
        <div style={badgeCount}>
          <BiAward size={15} />
          {Number(
            consultor.total_badges || 0
          )}{" "}
          badges
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

function SmallStatCard({
  icon,
  value,
  label,
}) {
  return (
    <div style={smallStatCard}>
      <div style={smallStatIcon}>{icon}</div>

      <div style={smallStatContent}>
        <div style={smallStatValue}>
          {value}
        </div>

        <div style={smallStatLabel}>
          {label}
        </div>
      </div>
    </div>
  );
}

function ChartTabs({
  active,
  onChange,
}) {
  const tabs = [
    "Total Consultores",
    "Pontos obtidos",
    "Badges atribuídos",
  ];

  return (
    <div style={tabsWrapper}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          style={{
            ...tabButton,

            color:
              active === tab
                ? "#111827"
                : "#9ca3af",

            fontWeight:
              active === tab ? 700 : 400,
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function LegendItem({
  label,
  dashed,
}) {
  return (
    <div style={legendItem}>
      <span
        style={{
          width: 22,
          height: 2,
          display: "inline-block",
          background: dashed
            ? "#93c5fd"
            : "#111827",

          borderTop: dashed
            ? "1px dashed #93c5fd"
            : "none",
        }}
      />

      {label}
    </div>
  );
}

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
  padding: "22px 30px",
  overflowY: "auto",
};

const welcomeCard = {
  background: "#3277d4",
  color: "white",
  borderRadius: 13,
  padding: "24px 28px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0 8px 18px rgba(37, 99, 235, 0.22)",
  marginBottom: 18,
};

const welcomeTitle = {
  fontSize: 18,
  fontWeight: 500,
  margin: "0 0 18px",
};

const welcomeStats = {
  display: "flex",
  gap: 34,
  flexWrap: "wrap",
};

const welcomeItem = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const welcomeItemIcon = {
  width: 32,
  height: 32,
  borderRadius: 7,
  background: "rgba(255,255,255,0.17)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const welcomeItemLabel = {
  fontSize: 10,
  color: "rgba(255,255,255,0.8)",
};

const welcomeItemValue = {
  fontSize: 12,
  fontWeight: 500,
};

const welcomeAvatar = {
  width: 68,
  height: 68,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.17)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const peopleSection = {
  display: "block",
  marginTop: 0,
  marginBottom: 30,
};

const peopleColumn = {
  minWidth: 0,
};

const peopleHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
};

const sectionTitle = {
  fontSize: 18,
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const sectionDescription = {
  fontSize: 12,
  color: "#111827",
};

const topText = {
  fontSize: 14,
  color: "#111827",
  marginTop: 2,
};

const viewAllButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  color: "#111827",
  padding: "7px 13px",
  fontSize: 12,
  cursor: "pointer",
};

const consultorCard = {
  background: "white",
  border: "1px solid #bfdbfe",
  borderRadius: 9,
  marginBottom: 14,
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
};

const consultorEmail = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  color: "#64748b",
  fontSize: 11,
};

const consultorCargo = {
  color: "#111827",
  fontSize: 11,
  marginTop: 3,
};

const consultorFooter = {
  borderTop: "1px solid #e5e7eb",
  padding: "7px 8px",
  display: "flex",
  justifyContent: "space-between",
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
  justifyContent: "flex-end",
  paddingTop: 70,
};

const smallStatCard = {
  minHeight: 120,
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 16,
  padding: "20px 24px",
  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.04)",
};

const smallStatIcon = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  background: "#eff6ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const smallStatContent = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 2,
};

const smallStatValue = {
  fontSize: 24,
  fontWeight: 700,
  color: "#111827",
  lineHeight: 1.1,
};

const smallStatLabel = {
  fontSize: 13,
  color: "#374151",
};

const chartCard = {
  background: "white",
  borderRadius: 14,
  padding: "20px 20px 10px",
  minHeight: 310,
  marginBottom: 64,
};

const chartHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
};

const tabsWrapper = {
  display: "flex",
  alignItems: "center",
};

const tabButton = {
  border: "none",
  background: "none",
  padding: "5px 12px",
  fontSize: 12,
  cursor: "pointer",
};

const legend = {
  display: "flex",
  alignItems: "center",
  gap: 22,
};

const legendItem = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 10,
  color: "#111827",
};

const loadingBox = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  color: "#6b7280",
  textAlign: "center",
};

const errorBox = {
  background: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: "10px 12px",
  color: "#991b1b",
  fontSize: 13,
  marginBottom: 16,
};

const emptyBox = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 26,
  textAlign: "center",
  color: "#9ca3af",
  fontSize: 12,
};

const emptyChart = {
  height: 230,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#9ca3af",
  fontSize: 12,
};

const statsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 16,
  marginBottom: 24,
};

export default PaginaPrincipalSll;