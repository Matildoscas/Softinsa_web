import {
  useEffect,
  useState,
} from "react";

import {
  BiBell,
} from "react-icons/bi";

import {
  Link,
  useLocation,
} from "react-router-dom";

import api from "../services/api.js";

import BadgeImage from "./badge_image.jsx";

import {
  obterBonusBadge,
  removerBadgesDuplicados,
} from "../utils/badgeBonus.js";

import {
  EVENTO_NOTIFICACOES_ATUALIZADAS,
  formatarTituloNotificacao,
} from "../utils/notificacoesUtils.js";

function BadgeCard({
  badge,
  name,
  points,
}) {
  const {
    ganhouBonus,
    pontosExtra,
  } = obterBonusBadge(
    badge
  );

  const pontosBase =
    Number(points || 0);

  const totalComBonus =
    pontosBase +
    Number(
      pontosExtra || 0
    );

  return (
    <div
      style={{
        display:
          "flex",

        flexDirection:
          "column",

        alignItems:
          "center",

        background:
          ganhouBonus
            ? "#fffef8"
            : "white",

        border:
          ganhouBonus
            ? "2px solid #d4af37"
            : "1px solid #e5e7eb",

        boxShadow:
          ganhouBonus
            ? "0 0 0 3px rgba(212,175,55,0.12)"
            : "none",

        borderRadius:
          20,

        padding:
          "18px 12px 16px",

        width:
          "100%",

        maxWidth:
          350,

        textAlign:
          "center",

        marginBottom:
          12,
      }}
    >
      <BadgeImage
        badge={badge}
        size={64}
        background={
          ganhouBonus
            ? "#fff7d6"
            : "#eff6ff"
        }
        borderColor={
          ganhouBonus
            ? "#d4af37"
            : "#dbeafe"
        }
        padding={6}
      />

      {ganhouBonus && (
        <div
          style={{
            background:
              "#fff7d6",

            color:
              "#9a6b00",

            border:
              "1px solid #f0d36b",

            borderRadius:
              999,

            padding:
              "3px 9px",

            fontSize:
              10,

            fontWeight:
              700,

            marginTop:
              9,
          }}
        >
          Desafio concluído
        </div>
      )}

      <div
        style={{
          width:
            "100%",

          height:
            1,

          backgroundColor:
            ganhouBonus
              ? "#f0d36b"
              : "#f3f4f6",

          marginTop:
            12,

          marginBottom:
            8,
        }}
      />

      <div>
        <div
          style={{
            fontSize:
              14,

            fontWeight:
              600,

            color:
              "#111827",
          }}
        >
          {name}
        </div>

        <div
          style={{
            fontSize:
              12,

            color:
              ganhouBonus
                ? "#9a6b00"
                : "#6b7280",

            marginTop:
              3,

            fontWeight:
              ganhouBonus
                ? 600
                : 400,
          }}
        >
          {pontosBase} pontos
        </div>

        {ganhouBonus &&
          pontosExtra > 0 && (
            <>
              <div
                style={{
                  fontSize:
                    12,

                  color:
                    "#d4a017",

                  marginTop:
                    2,

                  fontWeight:
                    700,
                }}
              >
                +{pontosExtra} pontos
                extra
              </div>

              <div
                style={{
                  fontSize:
                    11,

                  color:
                    "#9a6b00",

                  marginTop:
                    4,

                  fontWeight:
                    600,
                }}
              >
                Total obtido:{" "}
                {totalComBonus} pontos
              </div>
            </>
          )}
      </div>
    </div>
  );
}

function RightSidebar() {
  const location =
    useLocation();

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    badges,
    setBadges,
  ] = useState([]);

  const showBadges =
    location.pathname ===
      "/notificacoes" ||
    location.pathname ===
      "/lembretes";

  useEffect(() => {
    const storedUser =
      localStorage.getItem(
        "user"
      );

    if (!storedUser) {
      setNotifications([]);
      setBadges([]);
      return undefined;
    }

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
      setBadges([]);
      return undefined;
    }

    async function carregarNotificacoes() {
      try {
        const res =
          await api.get(
            `/notificacoes/${userId}`
          );

        const data =
          Array.isArray(
            res.data
          )
            ? res.data
            : [];

        setNotifications(
          [...data]
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
      } catch (err) {
        console.error(
          "Erro ao carregar notificações:",
          err
        );

        setNotifications([]);
      }
    }

    async function carregarBadges() {
      try {
        const res =
          await api.get(
            `/badges/conquistados/${userId}`
          );

        const data =
          Array.isArray(
            res.data
          )
            ? res.data
            : [];

        setBadges(
          removerBadgesDuplicados(
            data
          )
        );
      } catch (err) {
        console.error(
          "Erro ao carregar badges:",
          err
        );

        setBadges([]);
      }
    }

    carregarNotificacoes();

    if (showBadges) {
      carregarBadges();
    }

    const atualizarNotificacoes =
      () => {
        carregarNotificacoes();
      };

    window.addEventListener(
      EVENTO_NOTIFICACOES_ATUALIZADAS,
      atualizarNotificacoes
    );

    return () => {
      window.removeEventListener(
        EVENTO_NOTIFICACOES_ATUALIZADAS,
        atualizarNotificacoes
      );
    };
  }, [
    location.pathname,
    showBadges,
  ]);

  const containerStyle = {
    width: 280,
    background: "white",
    borderLeft: "1px solid #e5e7eb",
    padding: 16,
    flexShrink: 0,

    alignSelf: "stretch",
    position: "relative",
    height: "auto",
    minHeight: "100%",

    overflowY: "auto",
    textAlign: "left",
  };

  if (showBadges) {
    return (
      <aside className="app-right-sidebar consultor-right-sidebar" style={containerStyle}>
        <div
          style={{
            fontSize:
              14,

            fontWeight:
              700,

            color:
              "#2563eb",

            marginBottom:
              12,
          }}
        >
          Os meus Badges
        </div>

        {badges.length > 0 ? (
          badges
            .slice(0, 3)
            .map(
              (b, i) => (
                <BadgeCard
                  key={
                    b.id ||
                    b.id_badge_modelo ||
                    i
                  }
                  badge={b}
                  name={
                    b.nome ||
                    b.nome_badge ||
                    b.NOME ||
                    "Badge"
                  }
                  points={
                    Number(
                      b.pontos ||
                      0
                    )
                  }
                />
              )
            )
        ) : (
          <div
            style={{
              fontSize:
                12,

              color:
                "#9ca3af",
            }}
          >
            Sem badges conquistados.
          </div>
        )}

        <div
          style={{
            textAlign:
              "right",
          }}
        >
          <Link
            to="/meus_badges"
            style={{
              fontSize:
                12,

              color:
                "#2563eb",

              textDecoration:
                "none",
            }}
          >
            Ver todos
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <div style={containerStyle}>
      <div
        style={{
          fontSize:
            14,

          fontWeight:
            700,

          color:
            "#2563eb",

          marginBottom:
            12,
        }}
      >
        Notificações
      </div>

      {notifications.length >
      0 ? (
        notifications.map(
          (n, index) => {
            const dataEnvio =
              n.data_envio ||
              n.DATA_ENVIO;

            const dataFormatada =
              formatarDataNotificacao(
                dataEnvio
              );

            return (
              <div
                key={
                  n.id_notificacoes ||
                  n.id_notificacao ||
                  index
                }
                style={{
                  border:
                    "1px solid #e5e7eb",

                  borderRadius:
                    8,

                  padding:
                    "10px 12px",

                  marginBottom:
                    8,

                  display:
                    "flex",

                  gap:
                    8,

                  background:
                    "#f8fbff",

                  borderLeft:
                    "3px solid #2563eb",
                }}
              >
                <div
                  style={{
                    width:
                      22,

                    height:
                      22,

                    borderRadius:
                      "50%",

                    background:
                      "#eff6ff",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    flexShrink:
                      0,
                  }}
                >
                  <BiBell
                    size={12}
                    color="#2563eb"
                  />
                </div>

                <div
                  style={{
                    flex:
                      1,
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        11,

                      fontWeight:
                        700,

                      color:
                        "#2563eb",

                      marginBottom:
                        2,
                    }}
                  >
                    {formatarTituloNotificacao(
                      n.tipo_notificacao ||
                        n.TIPO_NOTIFICACAO
                    )}
                  </div>

                  <div
                    style={{
                      fontSize:
                        12,

                      fontWeight:
                        600,

                      color:
                        "#111827",

                      lineHeight:
                        1.35,
                    }}
                  >
                    {n.conteudo ||
                      n.CONTEUDO ||
                      n.mensagem ||
                      "Notificação"}
                  </div>

                  {dataFormatada && (
                    <div
                      style={{
                        fontSize:
                          11,

                        color:
                          "#9ca3af",

                        marginTop:
                          3,
                      }}
                    >
                      {dataFormatada}
                    </div>
                  )}
                </div>
              </div>
            );
          }
        )
      ) : (
        <div
          style={{
            fontSize:
              12,

            color:
              "#9ca3af",
          }}
        >
          Sem notificações.
        </div>
      )}

      <div
        style={{
          textAlign:
            "right",
        }}
      >
        <Link
          to="/notificacoes"
          style={{
            fontSize:
              12,

            color:
              "#2563eb",

            textDecoration:
              "none",
          }}
        >
          Ver todas
        </Link>
      </div>
    </div>
  );
}

function formatarDataNotificacao(
  data
) {
  if (!data) {
    return "";
  }

  const dataObjeto =
    new Date(data);

  if (
    Number.isNaN(
      dataObjeto.getTime()
    )
  ) {
    return "";
  }

  return dataObjeto
    .toLocaleDateString(
      "pt-PT"
    );
}

export default RightSidebar;