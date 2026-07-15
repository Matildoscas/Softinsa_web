import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Button,
  Spinner,
} from "react-bootstrap";

import {
  BiBell,
  BiArrowBack,
  BiTrash,
} from "react-icons/bi";

import { useNavigate } from "react-router-dom";

import Header from "../../components/Header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";

import api from "../../services/api.js";
import {
  emitirAtualizacaoNotificacoes,
  notificacaoNaoLida,
} from "../../utils/notificacoesUtils.js";

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
  const PAGE_SIZE = 10;

  const [
    notificacoes,
    setNotificacoes,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [marcandoTodas, setMarcandoTodas] =
    useState(false);

  const [apagandoTodas, setApagandoTodas] =
    useState(false);

  const [apagandoId, setApagandoId] =
    useState(null);

  const [paginaAtual, setPaginaAtual] =
    useState(1);

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  function obterIdLogado() {
    const utilizador =
      obterUtilizadorGuardado();

    return (
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id ||
      null
    );
  }

  async function carregarNotificacoes() {
    const userId = obterIdLogado();

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
        (Array.isArray(response.data)
          ? response.data
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
      );

  setPaginaAtual(1);
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

  async function marcarTodasComoLidas() {
    const userId = obterIdLogado();

    if (!userId) {
      return;
    }

    try {
      setMarcandoTodas(true);
      setErro("");

      await api.patch(
        `/notificacoes/utilizador/${userId}/lidas`
      );

      setNotificacoes((anteriores) =>
        anteriores.map((item) => ({
          ...item,
          lida: true,
          lido: true,
          estado_leitura: "LIDA",
          estado_notificacao: "LIDA",
        }))
      );

      emitirAtualizacaoNotificacoes();
    } catch (err) {
      console.error(
        "Erro ao marcar todas as notificações do SLL como lidas:",
        err
      );

      setErro(
        "Não foi possível marcar todas as notificações como lidas."
      );
    } finally {
      setMarcandoTodas(false);
    }
  }

  async function apagarNotificacao(notificacao) {
    const userId = obterIdLogado();
    const idNotificacao =
      notificacao.id_notificacoes ||
      notificacao.id_notificacao ||
      notificacao.id;

    if (!userId || !idNotificacao) {
      return;
    }

    try {
      setErro("");
      setApagandoId(idNotificacao);

      await api.delete(
        `/notificacoes/${idNotificacao}`,
        {
          data: {
            id_utilizador: userId,
          },
        }
      );

      setNotificacoes((anteriores) =>
        anteriores.filter((item) => {
          const idItem =
            item.id_notificacoes ||
            item.id_notificacao ||
            item.id;

          return (
            String(idItem) !==
            String(idNotificacao)
          );
        })
      );

      emitirAtualizacaoNotificacoes();
    } catch (err) {
      console.error(
        "Erro ao apagar notificação do SLL:",
        err
      );

      setErro(
        "Não foi possível apagar a notificação."
      );
    } finally {
      setApagandoId(null);
    }
  }

  async function apagarTodasNotificacoes() {
    const userId = obterIdLogado();

    if (!userId) {
      return;
    }

    try {
      setErro("");
      setApagandoTodas(true);

      await api.delete(`/notificacoes/limpar/${userId}`);

      setNotificacoes([]);
      setPaginaAtual(1);

      emitirAtualizacaoNotificacoes();
    } catch (err) {
      console.error(
        "Erro ao apagar todas as notificações do SLL:",
        err
      );

      setErro(
        "Não foi possível apagar todas as notificações."
      );
    } finally {
      setApagandoTodas(false);
    }
  }

  const totalNaoLidas =
    notificacoes.filter(
      notificacaoNaoLida
    ).length;

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        notificacoes.length /
          PAGE_SIZE
      )
    );

  const paginaAjustada =
    Math.min(
      paginaAtual,
      totalPaginas
    );

  const indiceInicial =
    (paginaAjustada - 1) * PAGE_SIZE;

  const notificacoesPaginadas =
    notificacoes.slice(
      indiceInicial,
      indiceInicial + PAGE_SIZE
    );

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
            <div style={cabecalhoNotificacoesTop}>
              <div>
                <h1 style={titulo}>
                  Notificações
                </h1>

                <div style={subtitulo}>
                  Notificações recebidas pela sua
                  conta de Service Line Leader
                </div>
              </div>

              <Button
                variant="outline-primary"
                size="sm"
                onClick={marcarTodasComoLidas}
                disabled={
                  loading ||
                  marcandoTodas ||
                  totalNaoLidas === 0
                }
              >
                {marcandoTodas
                  ? "A marcar..."
                  : "Marcar todas como lidas"}
              </Button>

              <Button
                variant="outline-danger"
                size="sm"
                onClick={apagarTodasNotificacoes}
                disabled={
                  loading ||
                  apagandoTodas ||
                  notificacoes.length === 0
                }
              >
                {apagandoTodas
                  ? "A apagar..."
                  : "Apagar todas"}
              </Button>
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
                {notificacoesPaginadas.map(
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
                      onApagar={() =>
                        apagarNotificacao(notificacao)
                      }
                      apagando={
                        String(apagandoId) ===
                        String(
                          notificacao.id_notificacoes ||
                            notificacao.id_notificacao ||
                            notificacao.id ||
                            index
                        )
                      }
                    />
                  )
                )}
              </div>
            )}

          {!loading &&
            !erro &&
            notificacoes.length > 0 && (
              <div style={paginacaoBarra}>
                <span style={paginacaoInfo}>
                  Página {paginaAjustada} de {totalPaginas}
                </span>

                <div style={paginacaoAcoes}>
                  <button
                    type="button"
                    style={paginacaoBotao}
                    disabled={paginaAjustada <= 1}
                    onClick={() =>
                      setPaginaAtual((atual) =>
                        Math.max(1, atual - 1)
                      )
                    }
                  >
                    Anterior
                  </button>

                  <button
                    type="button"
                    style={paginacaoBotao}
                    disabled={paginaAjustada >= totalPaginas}
                    onClick={() =>
                      setPaginaAtual((atual) =>
                        Math.min(totalPaginas, atual + 1)
                      )
                    }
                  >
                    Seguinte
                  </button>
                </div>
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
  onApagar,
  apagando,
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

        <div style={acoesCard}>
          <button
            type="button"
            style={apagarBotao}
            onClick={onApagar}
            disabled={apagando}
          >
            <BiTrash size={15} />
            {apagando ? "A apagar..." : "Apagar"}
          </button>
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

const cabecalhoNotificacoesTop = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
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

const acoesCard = {
  marginTop: 10,
  display: "flex",
  justifyContent: "flex-start",
};

const apagarBotao = {
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
};

const paginacaoBarra = {
  maxWidth: 920,
  margin: "12px auto 0",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
};

const paginacaoInfo = {
  color: "#64748b",
  fontSize: 12,
};

const paginacaoAcoes = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const paginacaoBotao = {
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#374151",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

export default NotificacoesSllPage;