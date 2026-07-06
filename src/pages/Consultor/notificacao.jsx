import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Button,
  Spinner,
} from "react-bootstrap";

import {
  HiOutlineArrowLeft,
} from "react-icons/hi";

import {
  useNavigate,
} from "react-router-dom";

import Header from "../../components/header.jsx";
import RightSidebar from "../../components/right_sidebar.jsx";
import LeftSidebar from "../../components/left_sidebar.jsx";

import api from "../../services/api.js";

import {
  emitirAtualizacaoNotificacoes,
  formatarTituloNotificacao,
  notificacaoNaoLida,
  ordenarNotificacoesRecentes,
  EVENTO_NOTIFICACOES_ATUALIZADAS,
} from "../../utils/notificacoesUtils.js";

function NotificacaoPage() {
  const navigate = useNavigate();

  const [
    notificacoes,
    setNotificacoes,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState(null);

  const [
    userId,
    setUserId,
  ] = useState(null);

  const carregarNotificacoes =
    useCallback(
      async (
        idUtilizador,
        {
          silencioso =
            false,
        } = {}
      ) => {
        if (!idUtilizador) {
          return;
        }

        try {
          if (!silencioso) {
            setLoading(true);
          }

          setErro(null);

          const response =
            await api.get(
              `/notificacoes/${idUtilizador}`
            );

          const data =
            Array.isArray(
              response.data
            )
              ? response.data
              : [];

          setNotificacoes(
            ordenarNotificacoesRecentes(
              data
            )
          );
        } catch (err) {
          console.error(
            "Erro ao carregar notificações:",
            err
          );

          setErro(
            "Não foi possível carregar as notificações."
          );
        } finally {
          if (!silencioso) {
            setLoading(false);
          }
        }
      },
      []
    );

  useEffect(() => {
    const storedUser =
      localStorage.getItem(
        "user"
      );

    if (!storedUser) {
      setLoading(false);

      navigate(
        "/login",
        {
          replace: true,
        }
      );

      return;
    }

    try {
      const user =
        JSON.parse(
          storedUser
        );

      const idUtilizador =
        user.id_utilizador ||
        user.ID_UTILIZADOR ||
        user.id;

      if (!idUtilizador) {
        setLoading(false);

        navigate(
          "/login",
          {
            replace: true,
          }
        );

        return;
      }

      setUserId(
        idUtilizador
      );

      carregarNotificacoes(
        idUtilizador
      );
    } catch (err) {
      console.error(
        "Utilizador inválido:",
        err
      );

      setLoading(false);

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    }
  }, [
    navigate,
    carregarNotificacoes,
  ]);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    const atualizar =
      () => {
        carregarNotificacoes(
          userId,
          {
            silencioso:
              true,
          }
        );
      };

    window.addEventListener(
      EVENTO_NOTIFICACOES_ATUALIZADAS,
      atualizar
    );

    return () => {
      window.removeEventListener(
        EVENTO_NOTIFICACOES_ATUALIZADAS,
        atualizar
      );
    };
  }, [
    userId,
    carregarNotificacoes,
  ]);

  async function marcarComoLida(
    notificacao
  ) {
    const idNotificacao =
      notificacao.id_notificacoes ||
      notificacao.id_notificacao;

    if (
      !idNotificacao ||
      !userId
    ) {
      return;
    }

    try {
      setErro(null);

      await api.patch(
        `/notificacoes/${idNotificacao}/lida`,
        {
          id_utilizador:
            userId,
        }
      );

      setNotificacoes(
        (anteriores) =>
          anteriores.map(
            (item) => {
              const idItem =
                item.id_notificacoes ||
                item.id_notificacao;

              if (
                String(idItem) !==
                String(
                  idNotificacao
                )
              ) {
                return item;
              }

              return {
                ...item,

                lida:
                  true,

                lido:
                  true,

                estado_leitura:
                  "LIDA",

                estado_notificacao:
                  "LIDA",
              };
            }
          )
      );

      emitirAtualizacaoNotificacoes();
    } catch (err) {
      console.error(
        "Erro ao marcar notificação como lida:",
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

      setErro(
        "Não foi possível marcar a notificação como lida."
      );
    }
  }

  return (
    <div
      style={{
        backgroundColor:
          "#f0f2f5",

        minHeight:
          "100vh",

        display:
          "flex",

        flexDirection:
          "column",
      }}
    >
      <Header />

      <div
        style={{
          display:
            "flex",

          flex:
            1,

          overflow:
            "hidden",
        }}
      >
        <LeftSidebar />

        <div
          style={{
            flex:
              1,

            overflowY:
              "auto",

            padding:
              10,
          }}
        >
          <Button
            variant="link"
            className="
              d-flex
              align-items-center
              text-decoration-none
              p-0
              mb-3
            "
            style={{
              color:
                "#4A5568",

              fontSize:
                "1.1rem",
            }}
            onClick={() =>
              navigate(
                "/pag_consultor"
              )
            }
          >
            <HiOutlineArrowLeft className="me-1" />

            <span
              style={{
                fontWeight:
                  400,
              }}
            >
              Voltar
            </span>
          </Button>

          <h5 className="mb-3">
            Notificações
          </h5>

          {loading && (
            <div
              className="
                d-flex
                justify-content-center
                align-items-center
              "
              style={{
                height:
                  200,
              }}
            >
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
            notificacoes.length ===
              0 && (
              <Alert
                variant="light"
                className="border"
              >
                Ainda não tem
                notificações.
              </Alert>
            )}

          {!loading &&
            notificacoes.map(
              (n, index) => {
                const naoLida =
                  notificacaoNaoLida(
                    n
                  );

                return (
                  <NotificationCard
                    key={
                      n.id_notificacoes ||
                      n.id_notificacao ||
                      index
                    }
                    title={formatarTituloNotificacao(
                      n.tipo_notificacao ||
                        n.TIPO_NOTIFICACAO
                    )}
                    desc={
                      n.conteudo ||
                      n.CONTEUDO ||
                      n.mensagem ||
                      ""
                    }
                    meta={
                      naoLida
                        ? "Não lida"
                        : "Lida"
                    }
                    time={formatarDataRelativa(
                      n.data_envio ||
                        n.DATA_ENVIO
                    )}
                    naoLida={
                      naoLida
                    }
                    onMarcarComoLida={() =>
                      marcarComoLida(
                        n
                      )
                    }
                  />
                );
              }
            )}
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}

function NotificationCard({
  title,
  desc,
  meta,
  time,
  naoLida,
  onMarcarComoLida,
}) {
  return (
    <div
      className="
        d-flex
        border
        rounded
        px-4
        py-3
        mb-2
        gap-3
      "
      style={{
        alignItems:
          "stretch",

        borderLeft:
          naoLida
            ? "4px solid #2563eb"
            : "1px solid #dee2e6",

        background:
          naoLida
            ? "#f8fbff"
            : "white",
      }}
    >
      <div
        className="
          d-flex
          flex-column
          align-items-center
          gap-1
        "
        style={{
          minWidth:
            80,
        }}
      >
        <div
          className="
            rounded-circle
            bg-secondary-subtle
            d-flex
            align-items-center
            justify-content-center
          "
          style={{
            width:
              44,

            height:
              44,
          }}
        >
          🔔
        </div>

        <span
          className="
            text-muted
            text-center
          "
          style={{
            fontSize:
              "0.72rem",

            lineHeight:
              1.4,
          }}
        >
          {meta}
        </span>

        <span
          className="
            text-secondary
            text-center
          "
          style={{
            fontSize:
              "0.70rem",
          }}
        >
          {time}
        </span>
      </div>

      <div className="border-start" />

      <div
        className="
          flex-grow-1
          d-flex
          flex-column
          justify-content-center
        "
      >
        <div
          className="
            fw-semibold
            text-dark
          "
          style={{
            fontSize:
              "0.9rem",
          }}
        >
          {title}
        </div>

        <div
          className="text-muted"
          style={{
            fontSize:
              "0.82rem",
          }}
        >
          {desc}
        </div>

        {naoLida && (
          <div
            style={{
              marginTop:
                10,
            }}
          >
            <Button
              size="sm"
              variant="outline-primary"
              onClick={
                onMarcarComoLida
              }
            >
              Marcar como lida
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatarDataRelativa(
  data
) {
  if (!data) {
    return "";
  }

  const agora =
    new Date();

  const dataNotificacao =
    new Date(data);

  if (
    Number.isNaN(
      dataNotificacao.getTime()
    )
  ) {
    return "";
  }

  const diffMs =
    agora.getTime() -
    dataNotificacao.getTime();

  const diffMin =
    Math.floor(
      diffMs / 60000
    );

  const diffHoras =
    Math.floor(
      diffMin / 60
    );

  const diffDias =
    Math.floor(
      diffHoras / 24
    );

  if (diffMin < 1) {
    return "Agora mesmo";
  }

  if (diffMin < 60) {
    return `${diffMin} minuto(s) atrás`;
  }

  if (diffHoras < 24) {
    return `${diffHoras} hora(s) atrás`;
  }

  if (diffDias < 7) {
    return `${diffDias} dia(s) atrás`;
  }

  return dataNotificacao
    .toLocaleDateString(
      "pt-PT"
    );
}

export default NotificacaoPage;