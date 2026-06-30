import React, {
  useEffect,
  useState,
} from "react";

import {
  Popover,
  ListGroup,
  Spinner,
} from "react-bootstrap";

import {
  BiUserCircle,
} from "react-icons/bi";

import {
  useNavigate,
} from "react-router-dom";

import api from "../services/api";

function obterUtilizadorGuardado() {
  const storedUser =
    localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (err) {
    console.error(
      "Erro ao ler utilizador:",
      err
    );

    return null;
  }
}

function obterRotaNotificacoes(user) {
  const tipo = String(
    user?.tipo_utilizador ||
      user?.TIPO_UTILIZADOR ||
      user?.cargo ||
      user?.CARGO ||
      ""
  )
    .trim()
    .toLowerCase();

  if (
    tipo.includes(
      "talent manager"
    ) ||
    tipo === "tm"
  ) {
    return "/tm/notificacoes";
  }

  if (
    tipo.includes(
      "service line leader"
    ) ||
    tipo === "sll"
  ) {
    return "/sll/notificacoes";
  }

  if (
    tipo.includes("admin") ||
    tipo.includes("administrador")
  ) {
    return "/admin/notificacoes";
  }

  return "/notificacoes";
}

const NotificationPopover =
  React.forwardRef(
    (
      {
        style,
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

      const user =
        obterUtilizadorGuardado();

      const rotaNotificacoes =
        obterRotaNotificacoes(user);

      useEffect(() => {
        carregarNotificacoes();
      }, []);

      async function carregarNotificacoes() {
        const userAtual =
          obterUtilizadorGuardado();

        const userId =
          userAtual?.id_utilizador ||
          userAtual?.ID_UTILIZADOR ||
          userAtual?.id;

        if (!userId) {
          setNotifications([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

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
                          notification.id ||
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
                              {notification.conteudo ||
                                notification.CONTEUDO ||
                                notification.tipo_notificacao ||
                                "Notificação"}
                            </h6>

                            <small className="text-muted d-block mb-1">
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
                  style={verTodasButton}
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
  fontSize: "0.875rem",
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
};

export default NotificationPopover;