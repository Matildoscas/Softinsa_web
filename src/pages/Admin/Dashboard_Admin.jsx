import { useState, useEffect } from "react";
import { Card } from "react-bootstrap";
import {
  BiMedal,
  BiStar,
  BiUserCircle,
  BiGrid,
  BiUser,
  BiTrendingUp,
  BiTrendingDown,
} from "react-icons/bi";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import api from "../../services/api.js";

import Header from "../../components/Header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

const PIE_COLORS = ["#2563eb", "#93c5fd"];

// ─── STAT CARD ─────────────────────────────────────────────

function StatCard({ icon, label, value, trend, positive = true }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "#eff6ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#111827",
          }}
        >
          {value}
        </div>

        <div
          style={{
            fontSize: 13,
            color: "#374151",
          }}
        >
          {label}
        </div>

        {trend && (
          <div
            style={{
              fontSize: 11,
              color: positive ? "#16a34a" : "#dc2626",
              display: "flex",
              alignItems: "center",
              gap: 2,
              marginTop: 2,
            }}
          >
            {positive ? (
              <BiTrendingUp size={13} />
            ) : (
              <BiTrendingDown size={13} />
            )}
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CHART TABS ─────────────────────────────────────────────

function ChartTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", gap: 0 }}>
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            border: "none",
            background: "none",
            fontSize: 13,
            padding: "4px 10px",
            color: active === t ? "#111827" : "#9ca3af",
            fontWeight: active === t ? 600 : 400,
            borderBottom:
              active === t
                ? "2px solid #2563eb"
                : "2px solid transparent",
            cursor: "pointer",
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────

function PaginaPrincipalAdmin() {
  const [activeTab, setActiveTab] = useState("Total Consultores");

  const [adminResumo, setAdminResumo] = useState({
    nome_completo: "Administrador",
    total_consultores: 0,
    service_line_leaders: 0,
    talent_managers: 0,
    total_badges: 0,
  });

  const [statsResumo, setStatsResumo] = useState({
    total_consultores: 0,
    total_badges_atribuidos: 0,
    total_badges: 0,
  });

  const [lineChartData, setLineChartData] = useState([]);

  const [pieData, setPieData] = useState([
    { name: "Consultores Ativos", value: 0, total: 0 },
    { name: "Consultores Inativos", value: 0, total: 0 },
  ]);

  const [barChartData, setBarChartData] = useState([]);
  const [areasDetalhe, setAreasDetalhe] = useState([]);

  // ─── RESUMO PRINCIPAL ─────────────────────────────────────

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    let nomeAdmin = "Administrador";

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);

        nomeAdmin =
          user.nome_completo ||
          user.nome ||
          user.NOME_COMPLETO ||
          "Administrador";
      } catch (err) {
        console.error("Erro ao ler admin:", err);
      }
    }

    api
      .get("/dashboard/admin/resumo-principal")
      .then((res) => {
        console.log("RESUMO ADMIN:", res.data);

        setAdminResumo({
          nome_completo: nomeAdmin,
          total_consultores: Number(res.data.total_consultores || 0),
          service_line_leaders: Number(res.data.total_sll || 0),
          talent_managers: Number(res.data.total_tm || 0),
          total_badges: Number(res.data.total_badges || 0),
        });

        setStatsResumo({
          total_consultores: Number(res.data.total_consultores || 0),
          total_badges_atribuidos: Number(
            res.data.total_badges_atribuidos || 0
          ),
          total_badges: Number(res.data.total_badges || 0),
        });
      })
      .catch((err) => {
        console.error("Erro ao carregar resumo admin:", err);
        console.error("STATUS:", err.response?.status);
        console.error("BODY:", err.response?.data);
      });
  }, []);

  // ─── GRÁFICO ANUAL ────────────────────────────────────────

  useEffect(() => {
    api
      .get("/dashboard/admin/grafico-anual")
      .then((res) => {
        console.log("GRÁFICO ANUAL:", res.data);
        setLineChartData(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Erro ao carregar gráfico anual:", err);
        console.error("STATUS:", err.response?.status);
        console.error("BODY:", err.response?.data);
      });
  }, []);

  // ─── ATIVIDADE DOS CONSULTORES ────────────────────────────

  useEffect(() => {
    api
      .get("/dashboard/admin/atividade-consultores")
      .then((res) => {
        setPieData([
          {
            name: "Consultores Ativos",
            value: Number(res.data.percentagem_ativos || 0),
            total: Number(res.data.ativos || 0),
          },
          {
            name: "Consultores Inativos",
            value: Number(res.data.percentagem_inativos || 0),
            total: Number(res.data.inativos || 0),
          },
        ]);
      })
      .catch((err) => {
        console.error("Erro ao carregar atividade dos consultores:", err);
        console.error("STATUS:", err.response?.status);
        console.error("BODY:", err.response?.data);
      });
  }, []);

  // ─── CONSULTORES POR ÁREA ─────────────────────────────────

  useEffect(() => {
    api
      .get("/dashboard/admin/consultores-por-area")
      .then((res) => {
        const dados = Array.isArray(res.data) ? res.data : [];

        const normalizados = dados.map((item) => ({
          area: abreviarArea(item.area),
          areaCompleta: item.area,
          total: Number(item.total || 0),
        }));

        const ordenados = [...normalizados].sort(
          (a, b) => b.total - a.total
        );

        setBarChartData(ordenados.slice(0, 5));
        setAreasDetalhe(ordenados);
      })
      .catch((err) => {
        console.error("Erro ao carregar consultores por área:", err);
        console.error("STATUS:", err.response?.status);
        console.error("BODY:", err.response?.data);
      });
  }, []);

  const chartKeys =
    activeTab === "Total Consultores"
      ? {
          esteAno: "consultores_este_ano",
          anoPassado: "consultores_ano_passado",
        }
      : activeTab === "Total Learning Paths"
        ? {
            esteAno: "learningpaths_este_ano",
            anoPassado: "learningpaths_ano_passado",
          }
        : {
            esteAno: "badges_este_ano",
            anoPassado: "badges_ano_passado",
          };

  function abreviarArea(area) {
    if (!area) return "Sem área";

    const texto = area.toLowerCase();

    if (texto.includes("hybrid")) return "Hybrid Cloud";
    if (texto.includes("application")) return "App Operations";
    if (texto.includes("sourcing")) return "Sourcing & Talent";
    if (texto.includes("cyber")) return "Cybersecurity";
    if (texto.includes("machine")) return "Machine Learning";
    if (texto.includes("sap")) return "SAP";
    if (texto.includes("lowcode") || texto.includes("outsystems"))
      return "LowCode";

    if (area.length > 18) {
      return area.slice(0, 18) + "...";
    }

    return area;
  }

  return (
    <div
      style={{
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />

      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <AdminLeftSidebar />

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 20,
          }}
        >
          {/* Welcome Card */}
          <Card
            className="border-0 mb-4"
            style={{
              background: "#1e3a6e",
              borderRadius: 12,
            }}
          >
            <Card.Body className="p-4 text-white">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h5
                    style={{
                      fontWeight: 600,
                      marginBottom: 16,
                    }}
                  >
                    Bom dia, {adminResumo.nome_completo}!
                  </h5>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <WelcomeStat
                      icon={<BiUserCircle size={20} />}
                      label="Consultores"
                      value={`Tem ${adminResumo.total_consultores} consultores`}
                    />

                    <WelcomeStat
                      icon={<BiUser size={20} />}
                      label="Service Line Leaders"
                      value={`Tem ${adminResumo.service_line_leaders} S.L.L`}
                    />

                    <WelcomeStat
                      icon={<BiUser size={20} />}
                      label="Talent Managers"
                      value={`Tem ${adminResumo.talent_managers} T.M.`}
                    />

                    <WelcomeStat
                      icon={<BiMedal size={20} />}
                      label="Badges"
                      value={`Tem ${adminResumo.total_badges} badges`}
                    />
                  </div>
                </div>

                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BiUserCircle
                    size={50}
                    color="rgba(255,255,255,0.8)"
                  />
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Stat Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <StatCard
              icon={<BiUserCircle size={26} color="#2563eb" />}
              label="Consultores"
              value={statsResumo.total_consultores}
              trend={null}
            />

            <StatCard
              icon={<BiMedal size={26} color="#2563eb" />}
              label="Badges atribuídos"
              value={statsResumo.total_badges_atribuidos}
              trend={null}
            />

            <StatCard
              icon={<BiStar size={26} color="#2563eb" />}
              label="Total Badges"
              value={statsResumo.total_badges}
              trend={null}
            />
          </div>

          {/* Charts Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {/* Line Chart */}
            <div
              style={{
                background: "white",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <ChartTabs
                  tabs={[
                    "Total Consultores",
                    "Total Learning Paths",
                    "Badges atribuídos",
                  ]}
                  active={activeTab}
                  onChange={setActiveTab}
                />

                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    fontSize: 11,
                    color: "#6b7280",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 24,
                        height: 2,
                        background: "#2563eb",
                        display: "inline-block",
                        borderRadius: 2,
                      }}
                    />
                    Este ano
                  </span>

                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 24,
                        height: 2,
                        background: "#d1d5db",
                        display: "inline-block",
                        borderRadius: 2,
                      }}
                    />
                    Ano passado
                  </span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lineChartData}>
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey={chartKeys.esteAno}
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />

                  <Line
                    type="monotone"
                    dataKey={chartKeys.anoPassado}
                    stroke="#d1d5db"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="4 2"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div
              style={{
                background: "white",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 20,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 14,
                }}
              >
                Atividade dos Consultores
              </div>

              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={PIE_COLORS[index]}
                      />
                    ))}
                  </Pie>

                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginTop: 8,
                }}
              >
                {pieData.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "#374151",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: PIE_COLORS[i],
                          display: "inline-block",
                        }}
                      />
                      {item.name}
                      <span style={{ color: "#9ca3af" }}>
                        ({item.total})
                      </span>
                    </span>

                    <span style={{ fontWeight: 600 }}>
                      {Number(item.value || 0).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            {/* Bar Chart */}
            <div
              style={{
                background: "white",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 20,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 14,
                }}
              >
                Total de consultores em cada área
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barChartData} barSize={36}>
                  <XAxis
                    dataKey="area"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    height={45}
                  />

                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${value} consultores`,
                      "Total",
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.areaCompleta || label;
                    }}
                  />

                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {barChartData.map((item, i) => (
                      <Cell
                        key={item.areaCompleta || item.area}
                        fill={getAreaColor(i)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Area breakdown */}
            <div
              style={{
                background: "white",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 20,
                minHeight: 220,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 14,
                }}
              >
                Detalhes por Área
              </div>

              <div
                style={{
                  maxHeight: 190,
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {areasDetalhe.length > 0 ? (
                  areasDetalhe.map((item, i) => (
                    <div
                      key={item.areaCompleta || item.area}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 14,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: getAreaColor(i),
                          flexShrink: 0,
                        }}
                      />

                      <span
                        style={{
                          fontSize: 12,
                          color: "#374151",
                          flex: 1,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={item.areaCompleta || item.area}
                      >
                        {item.areaCompleta || item.area}
                      </span>

                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#1e40af",
                          minWidth: 28,
                          textAlign: "right",
                        }}
                      >
                        {item.total}
                      </span>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                    }}
                  >
                    Sem dados por área.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <AdminRightSidebar />
      </div>
    </div>
  );
}

// ─── SMALL HELPER ───────────────────────────────────────────

function WelcomeStat({ icon, label, value }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.15)",
        borderRadius: 8,
        padding: "6px 12px",
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
      }}
    >
      {icon}

      <div style={{ textAlign: "left" }}>
        <div
          style={{
            fontSize: 10,
            opacity: 0.8,
          }}
        >
          {label}
        </div>

        <div style={{ fontWeight: 600 }}>{value}</div>
      </div>
    </div>
  );
}

function getAreaColor(index) {
  const colors = [
    "#93c5fd",
    "#06b6d4",
    "#2563eb",
    "#111827",
    "#8b5cf6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
  ];

  return colors[index % colors.length];
}

export default PaginaPrincipalAdmin;