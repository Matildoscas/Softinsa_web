import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Spinner,
} from "react-bootstrap";

import {
  BiBell,
  BiArrowBack,
} from "react-icons/bi";

import { useNavigate } from "react-router-dom";

import Header from "../../components/header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";

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
   PÁGINA
========================================================= */

function NotificacoesSllPage() {
  const navigate = useNavigate();

  const [
    notificacoes,
    setNotificacoes,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  async function carregarNotificacoes() {
    const utilizador =
      obterUtilizadorGuardado();

    const userId =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    if (!userId) {
      navigate(
        "/login",
        {
          replace: true,
        }
      );

      return;
    }

    try {
      setLoading(true);
      setErro("");

      const response = await api.get(
        `/notificacoes/${userId}`
      );

      setNotificacoes(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(
        "Erro ao carregar notificações do SLL:",
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
      setLoading(false);
    }
  }

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <SllLeftSidebar />

        <main style={conteudo}>
          <button
            type="button"
            onClick={() =>
              navigate("/sll")
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
              conta de Service Line Leader
            </div>
          </div>

          {loading && (
            <div style={loadingBox}>
              <Spinner
                animation="border"
                variant="primary"
              />
            </div>
          )}

          {erro && (
            <Alert variant="danger">
              {erro}
            </Alert>
          )}

          {!loading &&
            !erro &&
            notificacoes.length === 0 && (
              <div style={mensagemVazia}>
                Ainda não tem notificações.
              </div>
            )}

          {!loading &&
            !erro &&
            notificacoes.length > 0 && (
              <div style={lista}>
                {notificacoes.map(
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
                )}
              </div>
            )}
        </main>

        <SllRightSidebar />
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

  return (
    <article style={card}>
      <div style={iconArea}>
        <div style={iconCircle}>
          <BiBell
            size={21}
            color="#2563eb"
          />
        </div>

        <div style={estadoTexto}>
          {estado}
        </div>

        <div style={tempoTexto}>
          {formatarDataRelativa(
            notificacao.data_envio
          )}
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
   DATA
========================================================= */

function formatarDataRelativa(data) {
  if (!data) {
    return "";
  }

  const agora = new Date();
  const dataNotificacao =
    new Date(data);

  if (
    Number.isNaN(
      dataNotificacao.getTime()
    )
  ) {
    return "";
  }

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
    "pt-PT"
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
  margin: "16px 0 18px",
};

const cabecalhoPagina = {
  maxWidth: 920,
  margin: "0 auto 20px",
};

const titulo = {
  margin: 0,
  fontSize: 23,
  fontWeight: 800,
  color: "#111827",
};

const subtitulo = {
  marginTop: 4,
  fontSize: 12,
  color: "#64748b",
};

const loadingBox = {
  maxWidth: 920,
  height: 200,
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const mensagemVazia = {
  maxWidth: 920,
  margin: "0 auto",
  background: "#ffffff",
  border: "1px solid #dbe3ef",
  borderRadius: 11,
  padding: 35,
  textAlign: "center",
  color: "#64748b",
  fontSize: 13,
};

const lista = {
  maxWidth: 920,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const card = {
  minHeight: 110,
  background: "#ffffff",
  border: "1px solid #dbe3ef",
  borderRadius: 11,
  padding: "16px 20px",
  display: "flex",
  alignItems: "stretch",
  gap: 18,
};

const iconArea = {
  width: 105,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
};

const iconCircle = {
  width: 46,
  height: 46,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const estadoTexto = {
  color: "#64748b",
  textAlign: "center",
  fontSize: 11,
  lineHeight: 1.35,
};

const tempoTexto = {
  color: "#94a3b8",
  textAlign: "center",
  fontSize: 10,
};

const divisor = {
  width: 1,
  background: "#e5e7eb",
  flexShrink: 0,
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
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.5,
  marginTop: 4,
};

export default NotificacoesSllPage;