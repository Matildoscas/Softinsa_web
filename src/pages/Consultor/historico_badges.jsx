import { useState, useEffect } from "react";
import { Card, Button, Spinner, Badge } from "react-bootstrap";
import { BiMedal, BiStar, BiUserCircle, BiBook, BiCheckCircle, BiXCircle, BiTimeFive } from "react-icons/bi";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useNavigate, Link } from "react-router-dom";

import Header from "../../components/Header.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import api from "../../services/api.js";
import BadgeImage from "../../components/badge_image.jsx";
import DebugBadgePanel from "../../components/DebugBadgePanel.jsx";
import {
  obterBonusBadge,
  obterPontosTotaisBadge,
  removerBadgesDuplicados,
} from "../../utils/badgeBonus.js";

function HistoricoBadgesPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState({ total_badges: 0, total_pontos: 0 });
  const [loading, setLoading] = useState(true);

  const removerDuplicados = (lista) => {
    const mapa = new Map();

    lista.forEach((badge) => {
        const id = String(badge.id || badge.id_badge_modelo);

        if (!mapa.has(id)) {
        mapa.set(id, { ...badge });
        }
    });

    return Array.from(mapa.values());
    };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      setLoading(false);
      navigate("/login", { replace: true });
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    const userId = userData.id_utilizador || userData.ID_UTILIZADOR;

    if (!userId) {
      setLoading(false);
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);

    Promise.all([
      api.get(`/badges/conquistados/${userId}`),
      api.get(`/utilizadores/dashboard/${userId}`),
    ])
      .then(([badgesRes, dashboardRes]) => {
        const badgesRaw = Array.isArray(badgesRes.data) ? badgesRes.data : [];
        const badgesUnicos =
        removerBadgesDuplicados(
          badgesRaw
        );

        const totalPontosCalculado =
          badgesUnicos.reduce(
            (total, badge) =>
              total +
              obterPontosTotaisBadge(
                badge
              ),
            0
          );

        console.table(
            badgesRaw.map((b) => ({
                id: b.id,
                nome: b.nome,
                data_atribuicao: b.data_atribuicao,
                data_validade: b.data_validade,
                estado_badge_atribuido: b.estado_badge_atribuido,
            }))
            );

            console.table(
            badgesUnicos.map((b) => ({
                id: b.id,
                nome: b.nome,
                data_atribuicao: b.data_atribuicao,
                data_validade: b.data_validade,
                estado_badge_atribuido: b.estado_badge_atribuido,
            }))
            );

        setBadges(badgesUnicos);

        setStats({
          total_badges: Number(dashboardRes.data.total_badges || 0),
          total_pontos: totalPontosCalculado,
        });
      })
      .catch((err) => {
        console.error("Erro ao carregar histórico de badges:", err);
        console.error("STATUS:", err.response?.status);
        console.error("BODY:", err.response?.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  const ativos = badges.filter((b) => {
    const estado = obterEstadoBadge(b).tipo;
    return estado === "ativo" || estado === "quase_expirar";
  }).length;

  const expirados = badges.filter((b) => {
    return obterEstadoBadge(b).tipo === "expirado";
  }).length;

  const quaseExpirar = badges.filter((b) => {
    return obterEstadoBadge(b).tipo === "quase_expirar";
  }).length;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f0f2f5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <div style={{ display: "flex", flex: 1 }}>
        <LeftSidebar />

        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <Button
            variant="link"
            className="d-flex align-items-center text-decoration-none p-0 mb-3"
            style={{ color: "#4A5568", fontSize: "1.05rem" }}
            onClick={() => navigate("/perfil_consultor")}
          >
            <HiOutlineArrowLeft className="me-1" />
            <span style={{ fontWeight: 400 }}>Voltar</span>
          </Button>

          <Card className="border-0 mb-3" style={{ background: "#3b6fd4", borderRadius: 12 }}>
            <Card.Body className="p-4 d-flex justify-content-between align-items-center text-white">
              <div>
                <h5 className="fw-semibold mb-3" style={{ textAlign: "left" }}>
                  Histórico de Badges, {user?.nome_completo || user?.nome || "Consultor"}!
                </h5>

                <div className="d-flex gap-2 flex-wrap">
                  <div style={cardStyleBase}>
                    <BiMedal size={25} />
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.8 }}>Badges</div>
                      <div style={{ fontWeight: 600 }}>{stats.total_badges} conquistados</div>
                    </div>
                  </div>

                  <div style={cardStyleBase}>
                    <BiStar size={25} />
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.8 }}>Pontos totais</div>
                      <div style={{ fontWeight: 600 }}>{stats.total_pontos} pontos</div>
                    </div>
                  </div>

                  <Link
                    to="/lembretes"
                    style={{
                      ...cardStyleBase,
                      cursor: "pointer",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <BiUserCircle size={25} />

                    <div style={{ fontWeight: 600 }}>
                      Lembretes
                    </div>
                  </Link>
                </div>
              </div>

              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BiUserCircle size={50} color="rgba(255,255,255,0.8)" />
              </div>
            </Card.Body>
          </Card>

          <div className="d-flex gap-3 mb-4 flex-wrap">
            <ResumoCard titulo="Ativos" valor={ativos} tipo="ativo" />
            <ResumoCard titulo="A expirar" valor={quaseExpirar} tipo="quase_expirar" />
            <ResumoCard titulo="Expirados" valor={expirados} tipo="expirado" />
          </div>

          <HistoricoSection
            title="Os seus Badges"
            sub={`${badges.length} badge(s) no histórico`}
          >
            {badges.length > 0 ? (
              badges.map((badge, index) => (
                <HistoricoBadgeCard
                  key={badge.id || badge.id_badge_modelo || index}
                  badge={badge}
                />
              ))
            ) : (
              <p className="text-muted small mb-0">
                Ainda não tem badges conquistados.
              </p>
            )}
          </HistoricoSection>
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}

function HistoricoSection({ title, sub, children }) {
  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{title}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{sub}</div>
        </div>
      </div>

      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        {children}
      </div>
    </div>
  );
}

function HistoricoBadgeCard({
  badge,
}) {
  const estado =
    obterEstadoBadge(badge);

  const {
    ganhouBonus,
    pontosExtra,
  } = obterBonusBadge(badge);

  const pontosTotais =
    obterPontosTotaisBadge(
      badge
    );

  return (
    <div
      style={{
        background: "white",

        border: ganhouBonus
          ? "2px solid #d4af37"
          : "1px solid #e5e7eb",

        boxShadow: ganhouBonus
          ? "0 0 0 3px rgba(212,175,55,0.12)"
          : "none",

        borderRadius: 12,
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px",
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <BadgeImage
          badge={badge}
          size={64}
          background={
            ganhouBonus
              ? "#fff7d6"
              : estado.bgIcon
          }
          borderColor={
            ganhouBonus
              ? "#d4af37"
              : estado.border
          }
          padding={6}
        />

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 3,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {badge.nome ||
                badge.nome_badge ||
                "Badge"}
            </div>

            <Badge
              bg={estado.bootstrap}
            >
              {estado.texto}
            </Badge>

            {ganhouBonus && (
              <span
                style={{
                  background: "#fff7d6",
                  color: "#9a6b00",
                  border:
                    "1px solid #f0d36b",
                  borderRadius: 999,
                  padding: "3px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Desafio concluído
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              maxWidth: 700,
            }}
          >
            {badge.descricao ||
              badge.descricao_badge_modelo ||
              ""}

            <DebugBadgePanel badge={badge} />
          </div>
        </div>

        <div
          style={{
            border: ganhouBonus
              ? "1.5px solid #d4af37"
              : "1.5px solid #d1d5db",

            background: ganhouBonus
              ? "#fffdf4"
              : "white",

            borderRadius: 10,
            padding: "7px 12px",
            textAlign: "center",
            minWidth: 78,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: ganhouBonus
                ? "#9a6b00"
                : "#111827",
            }}
          >
            Pontos
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {pontosTotais}
          </div>

          {ganhouBonus &&
            pontosExtra > 0 && (
              <div
                style={{
                  color: "#d4a017",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                +{pontosExtra} extra
              </div>
            )}
        </div>
      </div>

      <div
        style={{
          borderTop:
            "1px solid #e5e7eb",
          padding: "10px 16px",

          backgroundColor:
            ganhouBonus
              ? "#fffdf4"
              : "#fafafa",

          display: "flex",
          justifyContent:
            "space-between",
          gap: 12,
          flexWrap: "wrap",
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        <DataInfo
          label="Conquistado"
          value={formatarData(
            badge.data_atribuicao
          )}
        />

        <DataInfo
          label="Validade"
          value={formatarData(
            badge.data_validade
          )}
        />

        <DataInfo
          label="Estado"
          value={
            badge.estado_badge_atribuido ||
            estado.texto
          }
        />

        {ganhouBonus && (
          <DataInfo
            label="Bónus do desafio"
            value={`+${pontosExtra} pontos`}
          />
        )}
      </div>
    </div>
  );
}

function ResumoCard({ titulo, valor, tipo }) {
  const config = {
    ativo: {
      cor: "#2E7D32",
      fundo: "#E8F5E9",
      icon: <BiCheckCircle size={26} />,
    },
    quase_expirar: {
      cor: "#ED8A00",
      fundo: "#FFF3E0",
      icon: <BiTimeFive size={26} />,
    },
    expirado: {
      cor: "#D32F2F",
      fundo: "#FFEBEE",
      icon: <BiXCircle size={26} />,
    },
  };

  const c = config[tipo];

  return (
    <div
      style={{
        flex: "1 1 180px",
        background: c.fundo,
        border: `1px solid ${c.cor}33`,
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ color: c.cor }}>{c.icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: c.cor, lineHeight: 1 }}>
          {valor}
        </div>
        <div style={{ fontSize: 12, color: c.cor }}>{titulo}</div>
      </div>
    </div>
  );
}

function DataInfo({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#9ca3af" }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{value}</div>
    </div>
  );
}

function obterEstadoBadge(badge) {
  const validadeRaw = badge.data_validade || badge.DATA_VALIDADE;

  if (!validadeRaw) {
    return {
      tipo: "sem_validade",
      texto: "Sem validade",
      bootstrap: "secondary",
      bgIcon: "#F5F5F5",
      border: "#e5e7eb",
    };
  }

  const validade = new Date(validadeRaw);

  if (Number.isNaN(validade.getTime())) {
    return {
      tipo: "sem_validade",
      texto: "Data inválida",
      bootstrap: "secondary",
      bgIcon: "#F5F5F5",
      border: "#e5e7eb",
    };
  }

  const hoje = new Date();
  const diffMs = validade.getTime() - hoje.getTime();
  const diasRestantes = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) {
    return {
      tipo: "expirado",
      texto: "Expirado",
      bootstrap: "danger",
      bgIcon: "#FFEBEE",
      border: "#ffcdd2",
    };
  }

  if (diasRestantes <= 30) {
    return {
      tipo: "quase_expirar",
      texto: `Expira em ${diasRestantes} dias`,
      bootstrap: "warning",
      bgIcon: "#FFF3E0",
      border: "#ffe0b2",
    };
  }

  return {
    tipo: "ativo",
    texto: "Ativo",
    bootstrap: "success",
    bgIcon: "#E8F5E9",
    border: "#c8e6c9",
  };
}

function formatarData(data) {
  if (!data) return "-";

  const dt = new Date(data);

  if (Number.isNaN(dt.getTime())) {
    return data.toString();
  }

  return dt.toLocaleDateString("pt-PT");
}

const cardStyleBase = {
  background: "rgba(255,255,255,0.2)",
  borderRadius: 8,
  padding: "6px 12px",
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  textAlign: "left",
};

export default HistoricoBadgesPage;