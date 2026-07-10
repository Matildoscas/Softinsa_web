import { useEffect, useState } from "react";

import {
  BiBell,
  BiTask,
  BiHistory,
  BiChevronRight,
  BiBadgeCheck,
} from "react-icons/bi";

import { useNavigate } from "react-router-dom";

import api from "../services/api.js";

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

function TmRightSidebar() {
  const navigate = useNavigate();

  const [totalPendentes, setTotalPendentes] = useState(0);
  const [totalHistorico, setTotalHistorico] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const user = obterUtilizadorGuardado();

    const userId =
      user?.id_utilizador ||
      user?.ID_UTILIZADOR ||
      user?.id;

    if (!userId) {
      setTotalPendentes(0);
      setTotalHistorico(0);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const resultados = await Promise.allSettled([
      api.get("/candidaturas/tm/candidaturas"),
      api.get("/candidaturas/tm/historico"),
      api.get(`/notificacoes/${userId}`),
    ]);

    if (resultados[0].status === "fulfilled") {
      const dados = Array.isArray(resultados[0].value.data)
        ? resultados[0].value.data
        : [];

      setTotalPendentes(dados.length);
    } else {
      console.error(
        "Erro ao carregar solicitações TM:",
        resultados[0].reason
      );

      setTotalPendentes(0);
    }

    if (resultados[1].status === "fulfilled") {
      const dados = Array.isArray(resultados[1].value.data)
        ? resultados[1].value.data
        : [];

      setTotalHistorico(dados.length);
    } else {
      console.error(
        "Erro ao carregar histórico TM:",
        resultados[1].reason
      );

      setTotalHistorico(0);
    }

    if (resultados[2].status === "fulfilled") {
      setNotifications(
        Array.isArray(resultados[2].value.data)
          ? resultados[2].value.data
          : []
      );
    } else {
      console.error(
        "Erro ao carregar notificações TM:",
        resultados[2].reason
      );

      setNotifications([]);
    }

    setLoading(false);
  }

  return (
    <aside style={container}>
      <div>
        <div style={sectionTitle}>
          Painel Operacional
        </div>

        <IndicadorMetrica
          title="Pedidos por Analisar"
          count={loading ? "..." : totalPendentes}
          type="pending"
          onClick={() => navigate("/tm/solicitacoes")}
        />

        <IndicadorMetrica
          title="Total de Histórico"
          count={loading ? "..." : totalHistorico}
          type="history"
          onClick={() => navigate("/tm/historico")}
        />
      </div>

      <div>
        <div style={sectionTitle}>
          Notificações Recentes
        </div>

        {notifications.length > 0 ? (
          notifications.slice(0, 4).map((notificacao, index) => (
            <NotificationCard
              key={
                notificacao.id_notificacoes ||
                notificacao.id ||
                index
              }
              notificacao={notificacao}
            />
          ))
        ) : (
          <div style={emptyBox}>
            <BiBadgeCheck size={20} color="#adb5bd" />

            <span style={emptyTitle}>
              Tudo em dia!
            </span>

            <span style={emptySub}>
              Sem alertas pendentes.
            </span>
          </div>
        )}
      </div>

      <div style={footer}>
        <button
          type="button"
          onClick={() => navigate("/tm/notificacoes")}
          style={verNotificacoesButton}
        >
          Ver Notificações
        </button>
      </div>
    </aside>
  );
}

function IndicadorMetrica({
  title,
  count,
  type,
  onClick,
}) {
  const isHistory = type === "history";

  return (
    <div
      onClick={onClick}
      style={metricCard}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#cbd5e1";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e5e7eb";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          ...metricIcon,
          background: isHistory ? "#f8fafc" : "#eff6ff",
          color: isHistory ? "#475569" : "#2563eb",
        }}
      >
        {isHistory ? (
          <BiHistory size={18} />
        ) : (
          <BiTask size={18} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={metricTitle}>
          {title}
        </div>

        <div style={metricCount}>
          {count}
        </div>
      </div>

      <BiChevronRight size={16} color="#9ca3af" />
    </div>
  );
}

function NotificationCard({ notificacao }) {
  const conteudo =
    notificacao.conteudo ||
    notificacao.mensagem ||
    notificacao.descricao ||
    "Notificação";

  const data =
    notificacao.data_envio ||
    notificacao.created_at ||
    notificacao.data_criacao ||
    null;

  return (
    <div style={notificationCard}>
      <div style={notificationIcon}>
        <BiBell size={13} color="#495057" />
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={notificationText}>
          {conteudo}
        </div>

        <div style={notificationTime}>
          {data
            ? new Date(data).toLocaleDateString("pt-PT")
            : "Agora"}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const container = {
  width: 300,
  background: "white",
  borderLeft: "1px solid #e5e7eb",
  padding: 18,
  flexShrink: 0,
  overflowY: "auto",
};

const sectionTitle = {
  fontSize: 14,
  fontWeight: 700,
  color: "#2563eb",
  marginBottom: 12,
};

const metricCard = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  marginBottom: 8,
  cursor: "pointer",
  transition: "all 0.2s ease",
};

const metricIcon = {
  width: 36,
  height: 36,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const metricTitle = {
  fontSize: 11,
  color: "#6b7280",
  fontWeight: 600,
  textTransform: "uppercase",
};

const metricCount = {
  fontSize: 18,
  fontWeight: 700,
  color: "#1f2937",
  marginTop: 1,
};

const notificationCard = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  marginBottom: 8,
  display: "flex",
  gap: 10,
  background: "white",
};

const notificationIcon = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  background: "#f1f3f5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const notificationText = {
  fontSize: 12,
  fontWeight: 500,
  color: "#212529",
  lineHeight: 1.3,
  wordBreak: "break-word",
};

const notificationTime = {
  fontSize: 10,
  color: "#adb5bd",
  marginTop: 4,
};

const emptyBox = {
  textAlign: "center",
  padding: "30px 10px",
  background: "#f8f9fa",
  borderRadius: 12,
  border: "1px dashed #dee2e6",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
};

const emptyTitle = {
  fontSize: 12,
  color: "#6c757d",
  fontWeight: 600,
};

const emptySub = {
  fontSize: 11,
  color: "#adb5bd",
};

const footer = {
  borderTop: "1px solid #f1f3f5",
  paddingTop: 12,
  textAlign: "right",
  marginTop: 16,
};

const verNotificacoesButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
  padding: 0,
};

export default TmRightSidebar;