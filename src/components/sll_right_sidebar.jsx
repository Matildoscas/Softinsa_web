import { useEffect, useState } from "react";

import {
  BiBell,
  BiGrid,
  BiMedal,
} from "react-icons/bi";

import api from "../services/api.js";

function obterUtilizadorGuardado() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

function SllRightSidebar() {
  const [notificacoes, setNotificacoes] =
    useState([]);

  const [topUtilizadores, setTopUtilizadores] =
    useState([]);

  useEffect(() => {
    const user = obterUtilizadorGuardado();

    const userId =
      user?.id_utilizador ||
      user?.ID_UTILIZADOR ||
      user?.id;

    if (!userId) {
      setNotificacoes([]);
      setTopUtilizadores([]);
      return;
    }

    Promise.allSettled([
      api.get(`/notificacoes/${userId}`),

      api.get(
        `/dashboard/sll/${userId}/top-utilizadores`
      ),
    ]).then(([notificacoesRes, topRes]) => {
      if (notificacoesRes.status === "fulfilled") {
        setNotificacoes(
          Array.isArray(notificacoesRes.value.data)
            ? notificacoesRes.value.data
            : []
        );
      } else {
        console.error(
          "Erro ao carregar notificações SLL:",
          notificacoesRes.reason
        );

        setNotificacoes([]);
      }

      if (topRes.status === "fulfilled") {
        setTopUtilizadores(
          Array.isArray(topRes.value.data)
            ? topRes.value.data
            : []
        );
      } else {
        console.error(
          "Erro ao carregar top SLL:",
          topRes.reason
        );

        setTopUtilizadores([]);
      }
    });
  }, []);

  return (
    <aside style={container}>
      <div style={sectionTitle}>Notificações</div>

      {notificacoes.length > 0 ? (
        notificacoes
          .slice(0, 3)
          .map((notificacao, index) => (
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
        <div style={emptyText}>
          Sem notificações recentes.
        </div>
      )}

      <div style={topTitle}>Top Utilizadores</div>

      {topUtilizadores.length > 0 ? (
        topUtilizadores
          .slice(0, 3)
          .map((utilizador, index) => (
            <TopUserCard
              key={
                utilizador.id_utilizador || index
              }
              utilizador={utilizador}
              posicao={index + 1}
            />
          ))
      ) : (
        <div style={emptyText}>
          Ainda não existem utilizadores com badges.
        </div>
      )}

      <div style={viewAllWrapper}>
        <a
          href="/sll/consultores"
          style={viewAllLink}
        >
          <BiGrid size={14} />
          Ver Todos
        </a>
      </div>
    </aside>
  );
}

function NotificationCard({ notificacao }) {
  const titulo =
    notificacao.titulo ||
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
        <BiBell size={13} color="#2563eb" />
      </div>

      <div>
        <div style={notificationText}>
          {titulo}
        </div>

        <div style={notificationTime}>
          {data ? formatarTempo(data) : "Agora"}
        </div>
      </div>
    </div>
  );
}

function TopUserCard({
  utilizador,
  posicao,
}) {
  const nome =
    utilizador.nome_completo ||
    utilizador.nome ||
    "Utilizador";

  const cargo =
    utilizador.tipo_utilizador ||
    "Consultor";

  const badges = Number(
    utilizador.total_badges || 0
  );

  const estilo = obterEstiloRanking(posicao);

  return (
    <div
      style={{
        ...topUserCard,
        background: estilo.background,
        border: `1px solid ${estilo.border}`,
      }}
    >
      <div
        style={{
          ...avatar,
          background: estilo.avatar,
        }}
      >
        <span style={{ fontSize: 18 }}>
          {estilo.medalha}
        </span>
      </div>

      <div style={{ flex: 1 }}>
        <div style={userName}>{nome}</div>

        <div style={userInfo}>
          Cargo: {cargo}
        </div>

        <div
          style={{
            ...badgesText,
            color: estilo.text,
          }}
        >
          <BiMedal size={13} />
          {badges} badges
        </div>
      </div>
    </div>
  );
}

function obterEstiloRanking(posicao) {
  if (posicao === 1) {
    return {
      medalha: "🥇",
      background: "#fff8e1",
      border: "#facc15",
      avatar: "#fef3c7",
      text: "#92400e",
    };
  }

  if (posicao === 2) {
    return {
      medalha: "🥈",
      background: "#f3f4f6",
      border: "#9ca3af",
      avatar: "#e5e7eb",
      text: "#374151",
    };
  }

  return {
    medalha: "🥉",
    background: "#fff1e6",
    border: "#d97706",
    avatar: "#fed7aa",
    text: "#92400e",
  };
}

function formatarTempo(data) {
  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return "Agora";
  }

  const minutos = Math.floor(
    (new Date() - date) / 60000
  );

  if (minutos < 1) return "Agora";

  if (minutos < 60) {
    return `${minutos} minuto(s) atrás`;
  }

  const horas = Math.floor(minutos / 60);

  if (horas < 24) {
    return `${horas} hora(s) atrás`;
  }

  return date.toLocaleDateString("pt-PT");
}

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

const topTitle = {
  fontSize: 14,
  fontWeight: 700,
  color: "#2563eb",
  margin: "28px 0 12px",
};

const notificationCard = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "8px 4px",
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
  color: "#111827",
};

const notificationTime = {
  fontSize: 11,
  color: "#9ca3af",
  marginTop: 2,
};

const topUserCard = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  borderRadius: 10,
  padding: "9px 10px",
  marginBottom: 10,
};

const avatar = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const userName = {
  fontSize: 12,
  fontWeight: 700,
  color: "#111827",
};

const userInfo = {
  fontSize: 11,
  color: "#6b7280",
};

const badgesText = {
  fontSize: 11,
  fontWeight: 700,
  marginTop: 2,
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const emptyText = {
  fontSize: 12,
  color: "#9ca3af",
};

const viewAllWrapper = {
  marginTop: 16,
};

const viewAllLink = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "7px 13px",
  fontSize: 12,
  textDecoration: "none",
  color: "#111827",
  background: "white",
};

export default SllRightSidebar;