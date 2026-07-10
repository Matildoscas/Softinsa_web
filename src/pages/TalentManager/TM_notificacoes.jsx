import {
  useEffect,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBell,
} from "react-icons/bi";

import {
  useNavigate,
} from "react-router-dom";

import Header from "../../components/TM_Header.jsx";
import TmLeftSidebar from "../../components/LeftBarTM.jsx";
import TmRightSidebar from "../../components/TM_RightBar.jsx";

import api from "../../services/api.js";

/* =========================================================
   UTILIZADOR AUTENTICADO
========================================================= */

function obterUtilizadorGuardado() {
  const guardado =
    localStorage.getItem("user");

  if (!guardado) {
    return null;
  }

  try {
    return JSON.parse(guardado);
  } catch (err) {
    console.error(
      "Erro ao ler utilizador:",
      err
    );

    return null;
  }
}

/* =========================================================
   DATA RELATIVA
========================================================= */

function formatarDataRelativa(data) {
  if (!data) {
    return "";
  }

  const dataNotificacao =
    new Date(data);

  if (
    Number.isNaN(
      dataNotificacao.getTime()
    )
  ) {
    return "";
  }

  const agora = new Date();

  const diferenca =
    agora - dataNotificacao;

  const minutos = Math.floor(
    diferenca / 60000
  );

  const horas = Math.floor(
    minutos / 60
  );

  const dias = Math.floor(
    horas / 24
  );

  if (minutos < 1) {
    return "Agora mesmo";
  }

  if (minutos < 60) {
    return `${minutos} minuto(s) atrás`;
  }

  if (horas < 24) {
    return `${horas} hora(s) atrás`;
  }

  if (dias < 7) {
    return `${dias} dia(s) atrás`;
  }

  return dataNotificacao.toLocaleDateString(
    "pt-PT",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

/* =========================================================
   PÁGINA
========================================================= */

function NotificacoesTm() {
  const navigate =
    useNavigate();

  const [
    notificacoes,
    setNotificacoes,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  async function carregarNotificacoes() {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    if (!idUtilizador) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      const response =
        await api.get(
          `/notificacoes/${idUtilizador}`
        );

      setNotificacoes(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(
        "Erro ao carregar notificações do TM:",
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

      setNotificacoes([]);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar as notificações."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <TmLeftSidebar />

        <main style={conteudo}>
          <button
            type="button"
            onClick={() =>
              navigate("/tm")
            }
            style={voltarButton}
          >
            <BiArrowBack size={18} />
            Voltar
          </button>

          <div style={separador} />

          <div style={cabecalhoPagina}>
            <h1 style={titulo}>
              Notificações
            </h1>

            <div style={subtitulo}>
              Notificações recebidas pela sua
              conta de Talent Manager
            </div>
          </div>

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
          )}

          {isLoading ? (
            <div style={mensagemBox}>
              A carregar notificações...
            </div>
          ) : notificacoes.length > 0 ? (
            <div style={lista}>
              {notificacoes.map(
                (
                  notificacao,
                  index
                ) => (
                  <NotificationCard
                    key={
                      notificacao.id_notificacoes ||
                      notificacao.id_notificacao ||
                      notificacao.id ||
                      index
                    }
                    notificacao={
                      notificacao
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div style={mensagemBox}>
              Ainda não tem notificações.
            </div>
          )}
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   CARD
========================================================= */

function NotificationCard({
  notificacao,
}) {
  const tituloNotificacao =
    notificacao.tipo_notificacao ||
    notificacao.titulo ||
    "Notificação";

  const descricao =
    notificacao.conteudo ||
    notificacao.mensagem ||
    notificacao.descricao ||
    "";

  const estado =
    notificacao.estado_notificacao ||
    "Enviada";

  const data =
    notificacao.data_envio ||
    notificacao.data_criacao ||
    notificacao.created_at ||
    null;

  return (
    <article style={card}>
      <div style={iconArea}>
        <div style={iconCircle}>
          <BiBell
            size={22}
            color="#2563eb"
          />
        </div>

        <div style={estadoTexto}>
          {estado}
        </div>

        <div style={tempoTexto}>
          {formatarDataRelativa(data)}
        </div>
      </div>

      <div style={divisor} />

      <div style={textoArea}>
        <div style={tituloCard}>
          {tituloNotificacao}
        </div>

        <div style={descricaoCard}>
          {descricao}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const pagina = {
  minHeight: "100vh",
  background: "#f3f4f6",
  display: "flex",
  flexDirection: "column",
};

const corpo = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const conteudo = {
  flex: 1,
  minWidth: 0,
  overflowY: "auto",
  padding: "22px 30px 60px",
};

const voltarButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: 0,
  fontSize: 14,
  cursor: "pointer",
};

const separador = {
  height: 1,
  background: "#d1d5db",
  margin: "16px 0 20px",
};

const cabecalhoPagina = {
  marginBottom: 22,
};

const titulo = {
  margin: 0,
  color: "#111827",
  fontSize: 22,
  fontWeight: 800,
};

const subtitulo = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 12,
};

const lista = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const card = {
  width: "100%",
  minHeight: 115,
  boxSizing: "border-box",
  display: "flex",
  alignItems: "stretch",
  gap: 18,
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "17px 20px",
  boxShadow:
    "0 2px 6px rgba(15,23,42,0.04)",
};

const iconArea = {
  width: 110,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const iconCircle = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const estadoTexto = {
  marginTop: 7,
  color: "#475569",
  fontSize: 10,
  fontWeight: 600,
};

const tempoTexto = {
  marginTop: 3,
  color: "#94a3b8",
  fontSize: 9,
  textAlign: "center",
};

const divisor = {
  width: 1,
  background: "#e2e8f0",
};

const textoArea = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const tituloCard = {
  color: "#111827",
  fontSize: 14,
  fontWeight: 700,
};

const descricaoCard = {
  marginTop: 7,
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.55,
};

const erroBox = {
  background: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: 12,
  color: "#991b1b",
  marginBottom: 18,
  fontSize: 13,
};

const mensagemBox = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#64748b",
};

export default NotificacoesTm;