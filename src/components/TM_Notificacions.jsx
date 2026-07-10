import React, {
  useEffect,
  useState,
} from "react";

import {
  ListGroup,
  Popover,
  Spinner,
} from "react-bootstrap";

import {
  BiUserCircle,
} from "react-icons/bi";

import {
  useNavigate,
} from "react-router-dom";

import api from "../services/api.js";

import {
  EVENTO_NOTIFICACOES_ATUALIZADAS,
  formatarTituloNotificacao,
  notificacaoNaoLida,
  ordenarNotificacoesRecentes,
} from "../utils/notificacoesUtils.js";

const NotificationPopover =
  React.forwardRef(
    (
      {
        style,
        rotaNotificacoes =
          "/notificacoes",
        ...props
      },
      ref
    ) => {
      const navigate =
        useNavigate();

      const [
        notifications,
        setNotifications,
      ] = useState([]);

      const [
        loading,
        setLoading,
      ] = useState(true);

      useEffect(() => {
        carregarNotificacoes();

        const atualizar =
          () => {
            carregarNotificacoes();
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
      }, []);

      async function carregarNotificacoes() {
        const storedUser =
          localStorage.getItem(
            "user"
          );

        if (!storedUser) {
          setNotifications([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

          const user =
            JSON.parse(
              storedUser
            );

          const userId =
            user.id_utilizador ||
            user.ID_UTILIZADOR ||
            user.id;

          if (!userId) {
            setNotifications([]);
            return;
          }

          const response =
            await api.get(
              `/notificacoes/${userId}`
            );

          const data =
            Array.isArray(
              response.data
            )
              ? response.data
              : [];

          const naoLidas =
            ordenarNotificacoesRecentes(
              data
            )
              .filter(
                notificacaoNaoLida
              )
              .slice(0, 5);

          setNotifications(
            naoLidas
          );
        } catch (err) {
          console.error(
            "Erro ao carregar notificações do popover:",
            err
          );

          setNotifications([]);
        } finally {
          setLoading(false);
        }
      }

      function formatTime(
        dateString
      ) {
        if (!dateString) {
          return "";
        }

        const date =
          new Date(
            dateString
          );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return "";
        }

        return (
          date.toLocaleDateString(
            "pt-PT"
          ) +
          " " +
          date.toLocaleTimeString(
            "pt-PT",
            {
              hour:
                "2-digit",

              minute:
                "2-digit",
            }
          )
        );
      }

      return (
        <Popover
          id="popover-notifications"
          ref={ref}
          style={{
            ...style,

            width:
              "320px",

            maxWidth:
              "none",

            borderRadius:
              "12px",
          }}
          {...props}
        >
          <Popover.Body className="p-1">
            <ListGroup variant="flush">
              {loading ? (
                <div className="text-center py-3">
                  <Spinner
                    size="sm"
                    animation="border"
                  />
                </div>
              ) : notifications.length >
                0 ? (
                notifications.map(
                  (
                    notification,
                    index
                  ) => (
                    <ListGroup.Item
                      key={
                        notification.id_notificacoes ||
                        notification.id_notificacao ||
                        index
                      }
                      className="
                        py-3
                        border-bottom
                      "
                    >
                      <div
                        className="
                          d-flex
                          align-items-start
                          gap-2
                        "
                      >
                        <div
                          className="
                            rounded-circle
                            bg-light
                            d-flex
                            align-items-center
                            justify-content-center
                            flex-shrink-0
                          "
                          style={{
                            width:
                              40,

                            height:
                              40,
                          }}
                        >
                          <BiUserCircle
                            size={30}
                            color="#6c757d"
                          />
                        </div>

                        <div
                          style={{
                            flex:
                              1,
                          }}
                        >
                          <h6
                            className="
                              mb-1
                              fw-bold
                            "
                            style={{
                              fontSize:
                                "13px",
                            }}
                          >
                            {formatarTituloNotificacao(
                              notification.tipo_notificacao ||
                                notification.TIPO_NOTIFICACAO
                            )}
                          </h6>

                          <div
                            style={{
                              fontSize:
                                "12px",

                              color:
                                "#475569",
                            }}
                          >
                            {notification.conteudo ||
                              notification.CONTEUDO ||
                              notification.mensagem ||
                              ""}
                          </div>

                          <small
                            className="
                              text-muted
                              d-block
                              mt-1
                            "
                          >
                            {formatTime(
                              notification.data_envio ||
                                notification.DATA_ENVIO
                            )}
                          </small>
                        </div>
                      </div>
                    </ListGroup.Item>
                  )
                )
              ) : (
                <ListGroup.Item
                  className="
                    py-3
                    text-center
                    text-muted
                    small
                  "
                >
                  Não tem notificações
                  novas.
                </ListGroup.Item>
              )}

              <ListGroup.Item
                className="
                  text-center
                  py-2
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      '/tm/notificacoes'
                    )
                  }
                  style={
                    verTodasButton
                  }
                >
                  Ver todas as
                  notificações
                </button>
              </ListGroup.Item>
            </ListGroup>
          </Popover.Body>
        </Popover>
      );
    }
  );

NotificationPopover.displayName =
  "NotificationPopover";

const verTodasButton = {
  border:
    "none",

  background:
    "transparent",

  color:
    "#0056b3",

  fontSize:
    13,

  fontWeight:
    700,

  cursor:
    "pointer",

  padding:
    0,
};

export default NotificationPopover;