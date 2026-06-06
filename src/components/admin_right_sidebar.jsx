import { useEffect, useState } from "react";
import { BiBell, BiUserCircle, BiGrid } from "react-icons/bi";
import api from "../services/api";

function AdminRightSidebar() {
  const [notifications, setNotifications] = useState([]);
  const [topUtilizadores, setTopUtilizadores] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const userId = user?.id_utilizador || user?.ID_UTILIZADOR;

    if (userId) {
        api
        .get(`/notificacoes/${userId}`)
        .then((res) => {
            setNotifications(Array.isArray(res.data) ? res.data : []);
        })
        .catch((err) => {
            console.error("Erro ao carregar notificações do admin:", err);
            setNotifications([]);
        });
    }

    api
        .get("/admin/top-utilizadores-ativos")
        .then((res) => {
        setTopUtilizadores(Array.isArray(res.data) ? res.data : []);
        })
        .catch((err) => {
        console.error("Erro ao carregar top utilizadores ativos:", err);
        setTopUtilizadores([]);
        });
    }, []);

  return (
    <div style={containerStyle}>
      <div style={sectionTitle}>Notificações</div>

      {notifications.length > 0 ? (
        notifications.slice(0, 3).map((n, i) => (
          <NotificationCard key={n.id_notificacao || n.id || i} n={n} />
        ))
      ) : (
        <div style={emptyText}>Sem notificações recentes.</div>
      )}

      <div style={{ textAlign: "right", marginTop: 4 }}>
        <a
          href="/admin/notificacoes"
          style={smallLink}
        >
          Ver todas as notificações
        </a>
      </div>

      <div style={topTitle}>Top Utilizadores</div>

      {topUtilizadores.length > 0 ? (
        topUtilizadores.slice(0, 3).map((u, i) => (
          <TopUserCard key={u.id_utilizador || i} user={u} />
        ))
      ) : (
        <div style={emptyText}>
          Ainda não existem utilizadores ativos.
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 10 }}>
        <a href="/admin/utilizadores" style={viewAllLink}>
          <BiGrid size={14} /> Ver Todos
        </a>
      </div>
    </div>
  );
}

function NotificationCard({ n }) {
  const titulo =
    n.titulo ||
    n.conteudo ||
    n.CONTEUDO ||
    "Notificação";

  const data =
    n.data_envio ||
    n.DATA_ENVIO ||
    n.created_at ||
    null;

  return (
    <div style={notificationCard}>
      <div style={notificationIcon}>
        <BiBell size={13} color="#2563eb" />
      </div>

      <div>
        <div style={notificationText}>{titulo}</div>
        <div style={notificationTime}>
          {data ? formatarTempo(data) : "Agora"}
        </div>
      </div>
    </div>
  );
}

function TopUserCard({ user }) {
  const nome =
    user.nome_completo ||
    user.nome ||
    user.NOME_COMPLETO ||
    "Utilizador";

  const cargo =
    user.cargo ||
    user.tipo_utilizador ||
    user.perfil ||
    "Utilizador";

  const tempo =
    user.tempo_ativo ||
    user.tempo_sessao ||
    user.tempo_consecutivo ||
    null;

  return (
    <div style={topUserCard}>
      <div style={avatar}>
        <BiUserCircle size={28} color="#6b7280" />
      </div>

      <div style={{ flex: 1 }}>
        <div style={userName}>{nome}</div>
        <div style={userInfo}>Cargo: {cargo}</div>
        <div style={userInfo}>
          {tempo ? `Ativo há ${tempo}` : "Ativo recentemente"}
        </div>
      </div>
    </div>
  );
}

function formatarTempo(data) {
  const date = new Date(data);
  const agora = new Date();

  const diffMs = agora - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (Number.isNaN(diffMin)) return "Agora";

  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin} minuto(s) atrás`;

  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `${diffHoras} hora(s) atrás`;

  return date.toLocaleDateString("pt-PT");
}

const containerStyle = {
  width: 260,
  background: "white",
  borderLeft: "1px solid #e5e7eb",
  padding: 16,
  flexShrink: 0,
  overflowY: "auto",
  textAlign: "left",
};

const sectionTitle = {
  fontSize: 14,
  fontWeight: 700,
  color: "#2563eb",
  marginBottom: 12,
};

const topTitle = {
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
  margin: "22px 0 12px",
};

const notificationCard = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "10px 12px",
  marginBottom: 8,
  display: "flex",
  gap: 8,
  alignItems: "flex-start",
};

const notificationIcon = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const notificationText = {
  fontSize: 12,
  fontWeight: 600,
  color: "#111827",
};

const notificationTime = {
  fontSize: 11,
  color: "#9ca3af",
  marginTop: 2,
};

const smallLink = {
  fontSize: 12,
  color: "#2563eb",
  textDecoration: "none",
};

const topUserCard = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 12,
  background: "#fafafa",
  borderRadius: 10,
  padding: "9px 10px",
};

const avatar = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  background: "#e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const userName = {
  fontSize: 13,
  fontWeight: 700,
  color: "#111827",
};

const userInfo = {
  fontSize: 11,
  color: "#6b7280",
};

const viewAllLink = {
  fontSize: 12,
  color: "#111827",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "6px 14px",
  background: "white",
};

const emptyText = {
  fontSize: 12,
  color: "#9ca3af",
  marginBottom: 8,
};

export default AdminRightSidebar;