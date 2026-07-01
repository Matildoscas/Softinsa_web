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
      }, []);

      async function carregarNotificacoes() {
        const storedUser =
          localStorage.getItem(
            "user"
          );

        if (!storedUser) {
          setLoading(false);
          return;
        }

        try {
          const user =
            JSON.parse(storedUser);

          const userId =
            user.id_utilizador ||
            user.ID_UTILIZADOR ||
            user.id;

          if (!userId) {
            setLoading(false);
            return;
          }

          const response =
            await api.get(
              `/notificacoes/${userId}`
            );

          setNotifications(
            Array.isArray(
              response.data
            )
              ? response.data
              : []
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
          new Date(dateString);

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
              hour: "2-digit",
              minute: "2-digit",
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
            width: "320px",
            maxWidth: "none",
            borderRadius: "12px",
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
                notifications
                  .slice(0, 4)
                  .map(
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
                        className="py-3 border-bottom"
                      >
                        <div className="d-flex align-items-start gap-2">
                          <div
                            className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: 40,
                              height: 40,
                            }}
                          >
                            <BiUserCircle
                              size={30}
                              color="#6c757d"
                            />
                          </div>

                          <div>
                            <h6
                              className="mb-0 fw-bold"
                              style={{
                                fontSize:
                                  "13px",
                              }}
                            >
                              {notification.tipo_notificacao ||
                                "Notificação"}
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
                                notification.mensagem ||
                                ""}
                            </div>

                            <small className="text-muted d-block mt-1">
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
                <ListGroup.Item className="py-3 text-center text-muted small">
                  Não tem notificações
                  novas.
                </ListGroup.Item>
              )}

              <ListGroup.Item className="text-center py-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      rotaNotificacoes
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
  border: "none",
  background: "transparent",
  color: "#0056b3",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
};

export default NotificationPopover;