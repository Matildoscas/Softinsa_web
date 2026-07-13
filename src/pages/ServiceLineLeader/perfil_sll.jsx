import { useEffect, useState } from "react";
import { Button, Card, Spinner } from "react-bootstrap";
import {
  BiBadgeCheck,
  BiBell,
  BiBookOpen,
  BiCheckShield,
  BiClipboard,
  BiUserCircle,
} from "react-icons/bi";
import { useNavigate } from "react-router-dom";

import Header from "../../components/Header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";
import api, { buildUploadUrl } from "../../services/api.js";

function obterUtilizadorGuardado() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

function obterFotoPerfilSrc(user) {
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
  const [user, setUser] = useState(null);
  const [resumo, setResumo] = useState({
    nome_completo: "Service Line Leader",
    nome_serviceline: "Service Line",
    total_consultores: 0,
    consultores_ativos: 0,
    evidencias_pendentes: 0,
    badges_por_aprovar: 0,
  });

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
    const userData = obterUtilizadorGuardado();

    if (!userData) {
      navigate("/login", { replace: true });
      return;
    }

    const idUtilizador =
      userData.id_utilizador ||
      userData.ID_UTILIZADOR ||
      userData.id;

    if (!idUtilizador) {
      navigate("/login", { replace: true });
      return;
    }

    setUser(userData);

    try {
      setLoading(true);

      const response = await api.get(
        `/dashboard/sll/${idUtilizador}/resumo`
      );

      const dados = response.data || {};

      setResumo({
        nome_completo:
          dados.nome_completo ||
          userData.nome_completo ||
          "Service Line Leader",
        nome_serviceline:
          dados.nome_serviceline ||
          "Service Line",
        total_consultores: Number(
          dados.total_consultores || 0
        ),
        consultores_ativos: Number(
          dados.consultores_ativos || 0
        ),
        evidencias_pendentes: Number(
          dados.evidencias_pendentes || 0
        ),
        badges_por_aprovar: Number(
          dados.badges_por_aprovar || 0
        ),
      });
    } catch (err) {
      console.error(
        "Erro ao carregar perfil SLL:",
        err
      );
    } finally {
      setLoading(false);
    }
  }

  const fotoSrc = obterFotoPerfilSrc(user);

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
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
            <Card.Body className="p-4 d-flex justify-content-between align-items-center text-white">
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 700,
                  }}
                >
                  {resumo.nome_completo}
                </h1>

                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
                  Service Line Leader - {resumo.nome_serviceline}
                </div>

                <div className="d-flex gap-2" style={{ marginTop: 18, flexWrap: "wrap" }}>
                  <div style={cardStat}>
                    <BiBookOpen size={20} color="#ffffff" />
                    <div>
                      <div style={cardStatLabel}>Consultores</div>
                      <div style={cardStatValue}>{resumo.total_consultores}</div>
                    </div>
                  </div>

                  <div style={cardStat}>
                    <BiClipboard size={20} color="#ffffff" />
                    <div>
                      <div style={cardStatLabel}>Evidencias Pendentes</div>
                      <div style={cardStatValue}>{resumo.evidencias_pendentes}</div>
                    </div>
                  </div>

                  <div style={cardStat}>
                    <BiCheckShield size={20} color="#ffffff" />
                    <div>
                      <div style={cardStatLabel}>Badges Por Aprovar</div>
                      <div style={cardStatValue}>{resumo.badges_por_aprovar}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={avatarWrapper}>
                {fotoSrc ? (
                  <img
                    src={fotoSrc}
                    alt="Foto de perfil"
                    style={avatarImage}
                  />
                ) : (
                  <BiUserCircle size={62} color="rgba(255,255,255,0.92)" />
                )}
              </div>
            </Card.Body>
          </Card>

          <Card
            className="border-0"
            style={{
              borderRadius: 14,
              boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
            }}
          >
            <Card.Body>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                Acoes Rapidas
              </h2>

              <p
                style={{
                  marginTop: 6,
                  marginBottom: 18,
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                Gere o seu perfil e acompanhe as operacoes da sua Service Line.
              </p>

              <div className="d-flex gap-2" style={{ flexWrap: "wrap" }}>
                <Button
                  onClick={() => navigate("/sll/definicoes")}
                  variant="white"
                  className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2"
                  style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}
                >
                  <BiBadgeCheck size={18} color="#0d6efd" />
                  Editar Perfil
                </Button>

                <Button
                  onClick={() => navigate("/sll/notificacoes")}
                  variant="white"
                  className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2"
                  style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}
                >
                  <BiBell size={18} color="#0d6efd" />
                  Ver Notificacoes
                </Button>
              </div>
            </Card.Body>
          </Card>
        </main>

        <SllRightSidebar />
      </div>
    </div>
  );
}

const cardStat = {
  background: "rgba(255,255,255,0.15)",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: 12,
  padding: "10px 14px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 178,
};

const cardStatLabel = {
  fontSize: 10,
  opacity: 0.9,
};

const cardStatValue = {
  fontSize: 15,
  fontWeight: 700,
};

const avatarWrapper = {
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

export default PerfilSllPage;
