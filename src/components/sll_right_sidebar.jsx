import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  BiBell,
  BiGrid,
  BiMedal,
  BiUserCircle,
} from "react-icons/bi";

import api, { buildUploadUrl } from "../services/api.js";

function obterUtilizadorGuardado() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

function existeTokenSessao() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("jwt") ||
    "";

  return Boolean(
    String(token).trim()
  );
}

function SllRightSidebar() {
  const navigate = useNavigate();

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

    if (!existeTokenSessao()) {
      setNotificacoes([]);
      setTopUtilizadores([]);

      console.warn(
        "[SLL] Sessão sem token; a sidebar não vai pedir notificações/top até novo login."
      );

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
          (Array.isArray(notificacoesRes.value.data)
            ? notificacoesRes.value.data
            : [])
            .sort((a, b) => {
              const dataA =
                new Date(
                  a.data_envio ||
                    a.DATA_ENVIO ||
                    0
                ).getTime();

              const dataB =
                new Date(
                  b.data_envio ||
                    b.DATA_ENVIO ||
                    0
                ).getTime();

              return dataB - dataA;
            })
            .slice(0, 5)
        );
      } else {
        const status = Number(
          notificacoesRes.reason?.response?.status ||
            0
        );

        if (status === 401) {
          console.warn(
            "[SLL][NOTIFICACOES] Pedido sem sessão válida; a sidebar continua sem bloquear a página."
          );
        } else {
        console.error(
          "Erro ao carregar notificações SLL:",
          notificacoesRes.reason
        );
        }

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
    <aside
      className="app-right-sidebar sll-right-sidebar"
      style={container}
    >
      <div style={sectionTitle}>Notificações</div>

      {notificacoes.length > 0 ? (
        notificacoes
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
              onClick={() => {
                const idConsultor =
                  utilizador?.id_utilizador;

                if (!idConsultor) {
                  return;
                }

                navigate(
                  `/sll/consultores/${idConsultor}`,
                  {
                    state: {
                      voltarPara: "/sll/ranking",
                      textoVoltar: "Voltar ao ranking",
                    },
                  }
                );
              }}
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
  onClick,
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

  const fotoPerfil =
    utilizador.foto_perfil ||
    utilizador.FOTO_PERFIL ||
    utilizador.foto ||
    utilizador.imagem ||
    null;

  const fotoSrc = fotoPerfil
    ? buildUploadUrl(fotoPerfil)
    : null;

  const estilo = obterEstiloRanking(posicao);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          onClick?.();
        }
      }}
      style={{
        ...topUserCard,
        background: estilo.background,
        border: `1px solid ${estilo.border}`,
        cursor: "pointer",
      }}
    >
      <div style={avatarWrapper}>
        {fotoSrc ? (
          <img
            src={fotoSrc}
            alt={nome}
            style={avatarImage}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <BiUserCircle
            size={38}
            color={estilo.text}
          />
        )}

        <div
          style={{
            ...rankingBadge,
            background: estilo.badgeBg,
            color: estilo.text,
            border: `1px solid ${estilo.border}`,
          }}
        >
          {posicao}
        </div>
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
      background: "#fff8e1",
      border: "#facc15",
      badgeBg: "#fef3c7",
      text: "#92400e",
    };
  }

  if (posicao === 2) {
    return {
      background: "#f3f4f6",
      border: "#9ca3af",
      badgeBg: "#e5e7eb",
      text: "#374151",
    };
  }

  return {
    background: "#fff1e6",
    border: "#d97706",
    badgeBg: "#fed7aa",
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
  minWidth: 300,

  background: "white",

  borderLeft:
    "1px solid #e5e7eb",

  padding: 18,

  flexShrink: 0,

  /*
   * A sidebar acompanha toda
   * a altura da página.
   */
  alignSelf: "stretch",

  position: "relative",

  height: "auto",
  minHeight: "100%",

  overflowY: "auto",
  overflowX: "hidden",
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

const avatarWrapper = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  position: "relative",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f3f4f6",
  overflow: "visible",
};

const avatarImage = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  objectFit: "cover",
  display: "block",
  border: "2px solid white",
  boxShadow: "0 1px 4px rgba(15, 23, 42, 0.18)",
};

const rankingBadge = {
  position: "absolute",
  right: -3,
  bottom: -3,
  width: 18,
  height: 18,
  borderRadius: "50%",
  fontSize: 10,
  fontWeight: 800,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default SllRightSidebar;