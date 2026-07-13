import { useEffect, useMemo, useState } from "react";
import { Button, Card, Spinner } from "react-bootstrap";
import {
  BiBell,
  BiBookOpen,
  BiCheckShield,
  BiClipboard,
  BiCog,
  BiMedal,
  BiStar,
  BiUserCircle,
} from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Header from "../../components/Header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";
import api, { buildUploadUrl } from "../../services/api.js";

function obterUtilizadorGuardado() {
  const guardado = localStorage.getItem("user");

  if (!guardado) {
    return null;
  }

  try {
    return JSON.parse(guardado);
  } catch {
    return null;
  }
}

function obterFotoPerfil(user) {
  const foto =
    user?.foto_perfil ||
    user?.FOTO_PERFIL ||
    user?.foto ||
    user?.imagem ||
    null;

  if (!foto) {
    return null;
  }

  return buildUploadUrl(foto);
}

function PerfilSllPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [utilizador, setUtilizador] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [consultoresDestaque, setConsultoresDestaque] = useState([]);
  const [graficoAnual, setGraficoAnual] = useState([]);

  useEffect(() => {
    carregarDadosPerfil();
  }, []);

  async function carregarDadosPerfil() {
    const userGuardado = obterUtilizadorGuardado();

    if (!userGuardado) {
      navigate("/login", { replace: true });
      return;
    }

    const idUtilizador =
      userGuardado.id_utilizador ||
      userGuardado.ID_UTILIZADOR ||
      userGuardado.id;

    if (!idUtilizador) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setErro("");

      const [utilizadorRes, resumoRes, destaqueRes, graficoRes] =
        await Promise.all([
          api.get(`/utilizadores/${idUtilizador}`),
          api.get(`/dashboard/sll/${idUtilizador}/resumo`),
          api.get(`/dashboard/sll/${idUtilizador}/consultores-destaque`),
          api.get(`/dashboard/sll/${idUtilizador}/grafico-anual`),
        ]);

      const dadosUtilizador = utilizadorRes.data || {};
      const dadosResumo = resumoRes.data || {};

      setUtilizador({
        ...dadosUtilizador,
        id_utilizador:
          dadosUtilizador.id_utilizador ||
          dadosUtilizador.ID_UTILIZADOR ||
          idUtilizador,
      });

      setResumo({
        nome_completo:
          dadosResumo.nome_completo ||
          dadosUtilizador.nome_completo ||
          dadosUtilizador.NOME_COMPLETO ||
          "Service Line Leader",
        nome_serviceline:
          dadosResumo.nome_serviceline ||
          "Service Line",
        total_consultores: Number(dadosResumo.total_consultores || 0),
        consultores_ativos: Number(dadosResumo.consultores_ativos || 0),
        evidencias_pendentes: Number(dadosResumo.evidencias_pendentes || 0),
        badges_por_aprovar: Number(dadosResumo.badges_por_aprovar || 0),
        badges_atribuidos_mes: Number(dadosResumo.badges_atribuidos_mes || 0),
        pontos_obtidos_mes: Number(dadosResumo.pontos_obtidos_mes || 0),
      });

      setConsultoresDestaque(
        Array.isArray(destaqueRes.data) ? destaqueRes.data : []
      );

      setGraficoAnual(
        Array.isArray(graficoRes.data) ? graficoRes.data : []
      );
    } catch (err) {
      console.error("Erro ao carregar perfil SLL:", err);
      setErro(
        err.response?.data?.error ||
          "Nao foi possivel carregar os dados do perfil."
      );
    } finally {
      setLoading(false);
    }
  }

  const fotoSrc = useMemo(() => obterFotoPerfil(utilizador), [utilizador]);

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
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

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <SllLeftSidebar />

        <main style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <Card
            className="border-0 mb-4"
            style={{
              background: "#0d6efd",
              borderRadius: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            <Card.Body className="p-4 d-flex justify-content-between align-items-center text-white">
              <div>
                <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
                  {resumo?.nome_completo || "Service Line Leader"}
                </h1>

                <div style={{ marginTop: 6, opacity: 0.9, fontSize: 13 }}>
                  Service Line Leader - {resumo?.nome_serviceline || "Service Line"}
                </div>

                <div className="d-flex gap-2" style={{ marginTop: 16, flexWrap: "wrap" }}>
                  <StatChip
                    icon={<BiBookOpen size={20} color="#fff" />}
                    label="Consultores"
                    value={resumo?.total_consultores || 0}
                  />

                  <StatChip
                    icon={<BiCheckShield size={20} color="#fff" />}
                    label="Consultores Ativos"
                    value={resumo?.consultores_ativos || 0}
                  />

                  <StatChip
                    icon={<BiClipboard size={20} color="#fff" />}
                    label="Evidencias Pendentes"
                    value={resumo?.evidencias_pendentes || 0}
                  />

                  <StatChip
                    icon={<BiMedal size={20} color="#fff" />}
                    label="Badges por Aprovar"
                    value={resumo?.badges_por_aprovar || 0}
                  />
                </div>
              </div>

              <div style={avatarBox}>
                {fotoSrc ? (
                  <img src={fotoSrc} alt="Foto de perfil" style={avatarImage} />
                ) : (
                  <BiUserCircle size={62} color="rgba(255,255,255,0.92)" />
                )}
              </div>
            </Card.Body>
          </Card>

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
          )}

          <div className="d-flex gap-2 mb-3" style={{ flexWrap: "wrap" }}>
            <Button
              onClick={() => navigate("/sll/definicoes")}
              variant="white"
              className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2"
              style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}
            >
              <BiCog size={18} color="#0d6efd" />
              Editar Perfil
            </Button>

            <Button
              onClick={() => navigate("/sll/notificacoes")}
              variant="white"
              className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2"
              style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}
            >
              <BiBell size={18} color="#0d6efd" />
              Notificacoes
            </Button>

            <Button
              onClick={() => navigate("/sll/consultores")}
              variant="white"
              className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2"
              style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}
            >
              <BiUserCircle size={18} color="#0d6efd" />
              Ver Consultores
            </Button>
          </div>

          <div style={gridInfo}>
            <Card className="border-0" style={cardPanel}>
              <Card.Body>
                <h2 style={tituloCard}>Resumo Mensal</h2>
                <div style={subtituloCard}>Indicadores mais recentes da tua Service Line</div>

                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <LinhaResumo
                    label="Badges atribuidos no mes"
                    value={resumo?.badges_atribuidos_mes || 0}
                  />
                  <LinhaResumo
                    label="Pontos obtidos no mes"
                    value={resumo?.pontos_obtidos_mes || 0}
                  />
                  <LinhaResumo
                    label="Badges por aprovar"
                    value={resumo?.badges_por_aprovar || 0}
                  />
                </div>
              </Card.Body>
            </Card>

            <Card className="border-0" style={cardPanel}>
              <Card.Body>
                <h2 style={tituloCard}>Dados Pessoais</h2>
                <div style={subtituloCard}>Informacao atual do teu registo</div>

                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <LinhaResumo
                    label="Nome"
                    value={
                      utilizador?.nome_completo ||
                      utilizador?.NOME_COMPLETO ||
                      "-"
                    }
                  />
                  <LinhaResumo
                    label="Email"
                    value={
                      utilizador?.email_softinsa ||
                      utilizador?.EMAIL_SOFTINSA ||
                      utilizador?.email ||
                      "-"
                    }
                  />
                  <LinhaResumo
                    label="Contacto"
                    value={utilizador?.contacto || "-"}
                  />
                  <LinhaResumo
                    label="Estado"
                    value={utilizador?.estado_conta || "ATIVO"}
                  />
                </div>
              </Card.Body>
            </Card>
          </div>

          <div style={gridInfo}>
            <Card className="border-0" style={cardPanel}>
              <Card.Body>
                <h2 style={tituloCard}>Consultores em Destaque</h2>
                <div style={subtituloCard}>Top consultores da tua Service Line</div>

                {consultoresDestaque.length === 0 ? (
                  <div style={vazioBox}>Sem registos de consultores para mostrar.</div>
                ) : (
                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {consultoresDestaque.map((item, index) => (
                      <div key={`${item.id_utilizador}-${index}`} style={linhaConsultor}>
                        <div>
                          <div style={nomeConsultor}>{item.nome_completo || "Consultor"}</div>
                          <div style={metaConsultor}>{item.nome_area || "Sem area"}</div>
                        </div>

                        <div style={statsConsultor}>
                          <span>{Number(item.total_badges || 0)} badges</span>
                          <span>{Number(item.total_pontos || 0)} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>

            <Card className="border-0" style={cardPanel}>
              <Card.Body>
                <h2 style={tituloCard}>Tendencia Anual</h2>
                <div style={subtituloCard}>Evolucao de badges e pontos por mes</div>

                {graficoAnual.length === 0 ? (
                  <div style={vazioBox}>Sem dados para o grafico anual.</div>
                ) : (
                  <div style={{ width: "100%", height: 250, marginTop: 8 }}>
                    <ResponsiveContainer>
                      <LineChart data={graficoAnual}>
                        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="badges_este_ano"
                          name="Badges"
                          stroke="#0d6efd"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="pontos_este_ano"
                          name="Pontos"
                          stroke="#16a34a"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </main>

        <SllRightSidebar />
      </div>
    </div>
  );
}

function StatChip({ icon, label, value }) {
  return (
    <div style={chipStat}>
      {icon}
      <div>
        <div style={chipLabel}>{label}</div>
        <div style={chipValue}>{value}</div>
      </div>
    </div>
  );
}

function LinhaResumo({ label, value }) {
  return (
    <div style={linhaResumo}>
      <span style={linhaResumoLabel}>{label}</span>
      <span style={linhaResumoValue}>{value}</span>
    </div>
  );
}

const avatarBox = {
  width: 88,
  height: 88,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  border: "2px solid rgba(255,255,255,0.4)",
};

const avatarImage = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const chipStat = {
  background: "rgba(255,255,255,0.15)",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: 12,
  padding: "10px 14px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 170,
};

const chipLabel = {
  fontSize: 10,
  opacity: 0.9,
};

const chipValue = {
  fontSize: 15,
  fontWeight: 700,
};

const erroBox = {
  marginBottom: 14,
  background: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: 10,
  color: "#991b1b",
  fontSize: 13,
};

const gridInfo = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 14,
  marginBottom: 14,
};

const cardPanel = {
  borderRadius: 14,
  boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
};

const tituloCard = {
  margin: 0,
  fontSize: 17,
  fontWeight: 700,
  color: "#1e293b",
};

const subtituloCard = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 12,
};

const linhaResumo = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "10px 12px",
};

const linhaResumoLabel = {
  color: "#475569",
  fontSize: 13,
};

const linhaResumoValue = {
  color: "#0f172a",
  fontSize: 13,
  fontWeight: 700,
};

const vazioBox = {
  marginTop: 12,
  fontSize: 13,
  color: "#64748b",
  border: "1px dashed #cbd5e1",
  borderRadius: 10,
  padding: 12,
};

const linhaConsultor = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "10px 12px",
};

const nomeConsultor = {
  fontSize: 13,
  fontWeight: 700,
  color: "#0f172a",
};

const metaConsultor = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 2,
};

const statsConsultor = {
  display: "flex",
  gap: 10,
  color: "#334155",
  fontSize: 12,
  fontWeight: 600,
};

export default PerfilSllPage;
