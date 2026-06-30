import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  BiBell,
  BiBookOpen,
  BiMedal,
  BiUserCircle,
} from "react-icons/bi";

import api from "../services/api.js";

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

function TmRightSidebar() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    notificacoes,
    setNotificacoes,
  ] = useState([]);

  const [
    topUtilizadores,
    setTopUtilizadores,
  ] = useState([]);

  useEffect(() => {
    carregarSidebar();
  }, []);

  async function carregarSidebar() {
    const user =
      obterUtilizadorGuardado();

    const userId =
      user?.id_utilizador ||
      user?.ID_UTILIZADOR ||
      user?.id;

    if (!userId) {
      setNotificacoes([]);
      setTopUtilizadores([]);
      return;
    }

    const resultados =
      await Promise.allSettled([
        api.get(
          `/notificacoes/${userId}`
        ),

        api.get(
          `/dashboard/tm/${userId}/top-utilizadores`
        ),
      ]);

    const notificacoesResultado =
      resultados[0];

    const topResultado =
      resultados[1];

    if (
      notificacoesResultado.status ===
      "fulfilled"
    ) {
      setNotificacoes(
        Array.isArray(
          notificacoesResultado
            .value.data
        )
          ? notificacoesResultado
              .value.data
          : []
      );
    } else {
      console.error(
        "Erro ao carregar notificações TM:",
        notificacoesResultado.reason
      );

      setNotificacoes([]);
    }

    if (
      topResultado.status ===
      "fulfilled"
    ) {
      setTopUtilizadores(
        Array.isArray(
          topResultado.value.data
        )
          ? topResultado.value.data
          : []
      );
    } else {
      console.error(
        "Erro ao carregar top de utilizadores TM:",
        topResultado.reason
      );

      setTopUtilizadores([]);
    }
  }

  function abrirPerfil(
    utilizador
  ) {
    const idConsultor =
      utilizador.id_utilizador ||
      utilizador.ID_UTILIZADOR ||
      utilizador.id;

    if (!idConsultor) {
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
    <aside style={container}>
      <div style={sectionTitle}>
        Notificações
      </div>

      {notificacoes.length >
      0 ? (
        notificacoes
          .slice(0, 3)
          .map(
            (
              notificacao,
              index
            ) => (
              <NotificationCard
                key={
                  notificacao.id_notificacoes ||
                  notificacao.id ||
                  index
                }
                notificacao={
                  notificacao
                }
              />
            )
          )
      ) : (
        <div style={emptyText}>
          Sem notificações recentes.
        </div>
      )}

      <div style={topTitle}>
        Top Utilizadores
      </div>

      {topUtilizadores.length >
      0 ? (
        topUtilizadores
          .slice(0, 3)
          .map(
            (
              utilizador,
              index
            ) => (
              <TopUserCard
                key={
                  utilizador.id_utilizador ||
                  index
                }
                utilizador={
                  utilizador
                }
                onPerfil={() =>
                  abrirPerfil(
                    utilizador
                  )
                }
              />
            )
          )
      ) : (
        <div style={emptyText}>
          Ainda não existem
          utilizadores com badges.
        </div>
      )}

      <div style={viewAllWrapper}>
        <button
          type="button"
          onClick={() =>
            navigate(
              "/tm/consultores"
            )
          }
          style={viewAllButton}
        >
          <BiBookOpen size={14} />
          Ver Todos
        </button>
      </div>
    </aside>
  );
}

function NotificationCard({
  notificacao,
}) {
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
        <BiBell
          size={13}
          color="#2563eb"
        />
      </div>

      <div style={notificationContent}>
        <div style={notificationText}>
          {titulo}
        </div>

        <div style={notificationTime}>
          {data
            ? formatarTempo(data)
            : "Agora"}
        </div>
      </div>
    </div>
  );
}

function TopUserCard({
  utilizador,
  onPerfil,
}) {
  const nome =
    utilizador.nome_completo ||
    utilizador.nome ||
    "Utilizador";

  const cargo =
    utilizador.tipo_utilizador ||
    utilizador.cargo ||
    "Consultor";

  const badges = Number(
    utilizador.total_badges || 0
  );

  return (
    <div style={topUserCard}>
      <div style={avatar}>
        <BiUserCircle
          size={38}
          color="#6092bf"
        />
      </div>

      <div style={userContent}>
        <div style={userName}>
          {nome}
        </div>

        <div style={userInfo}>
          Cargo: {cargo}
        </div>

        <div style={badgesText}>
          <BiMedal size={13} />
          {badges} badges
        </div>
      </div>

      <button
        type="button"
        onClick={onPerfil}
        style={profileButton}
      >
        Ver perfil
      </button>
    </div>
  );
}

function formatarTempo(data) {
  const date = new Date(data);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Agora";
  }

  const minutos = Math.floor(
    (new Date() - date) /
      60000
  );

  if (minutos < 1) {
    return "Agora";
  }

  if (minutos < 60) {
    return `${minutos} minuto(s) atrás`;
  }

  const horas = Math.floor(
    minutos / 60
  );

  if (horas < 24) {
    return `${horas} hora(s) atrás`;
  }

  return date.toLocaleDateString(
    "pt-PT"
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const container = {
  width: 300,
  background: "white",
  borderLeft:
    "1px solid #e5e7eb",
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

const notificationContent = {
  minWidth: 0,
};

const notificationText = {
  fontSize: 12,
  color: "#111827",
  lineHeight: 1.35,
};

const notificationTime = {
  fontSize: 11,
  color: "#9ca3af",
  marginTop: 2,
};

const topUserCard = {
  minHeight: 72,
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "#ffffff",
  border:
    "1px solid #f1f5f9",
  borderRadius: 10,
  padding: "9px 10px",
  marginBottom: 10,
};

const avatar = {
  width: 43,
  height: 43,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const userContent = {
  flex: 1,
  minWidth: 0,
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
  fontWeight: 600,
  marginTop: 2,
  display: "flex",
  alignItems: "center",
  gap: 4,
  color: "#334155",
};

const profileButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  fontSize: 10,
  cursor: "pointer",
  padding: 0,
  whiteSpace: "nowrap",
};

const emptyText = {
  fontSize: 12,
  color: "#9ca3af",
};

const viewAllWrapper = {
  marginTop: 16,
};

const viewAllButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  border:
    "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "7px 13px",
  fontSize: 12,
  color: "#111827",
  background: "white",
  cursor: "pointer",
};

export default TmRightSidebar;