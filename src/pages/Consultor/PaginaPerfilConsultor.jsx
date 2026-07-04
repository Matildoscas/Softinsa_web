import {
  useEffect,
  useState,
} from "react";

import {
  Button,
  Card,
  ProgressBar,
  Spinner,
} from "react-bootstrap";

import {
  BiBook,
  BiLoader,
  BiMedal,
  BiMenu,
  BiStar,
  BiUserCircle,
} from "react-icons/bi";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../../services/api.js";

import Header from "../../components/header.jsx";
import LeftSidebar from "../../components/left_sidebar.jsx";
import RightSidebar from "../../components/right_sidebar.jsx";
import BadgeImage from "../../components/badge_image.jsx";

import {
  obterBonusBadge,
  removerBadgesDuplicados,
} from "../../utils/badgeBonus.js";

function PaginaPerfil() {
  const navigate = useNavigate();

  const [user, setUser] =
    useState(null);

  const [stats, setStats] =
    useState({
      total_badges: 0,
      total_pontos: 0,
    });

  const [
    badgesConquistados,
    setBadgesConquistados,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user");

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

    const userData =
      JSON.parse(storedUser);

    setUser(userData);

    const userId =
      userData.id_utilizador ||
      userData.ID_UTILIZADOR;

    if (!userId) {
      setLoading(false);

      navigate(
        "/login",
        {
          replace: true,
        }
      );

      return;
    }

    setLoading(true);

    Promise.all([
      api.get(
        `/utilizadores/dashboard/${userId}`
      ),

      api.get(
        `/badges/conquistados/${userId}`
      ),
    ])
      .then(
        ([
          dashboardRes,
          badgesRes,
        ]) => {
          const badgesRaw =
            Array.isArray(
              badgesRes.data
            )
              ? badgesRes.data
              : [];

          const badgesUnicos =
            removerBadgesDuplicados(
              badgesRaw
            );

          setStats({
            total_badges:
              Number(
                dashboardRes.data
                  .total_badges ||
                0
              ),

            total_pontos:
              Number(
                dashboardRes.data
                  .total_pontos ||
                0
              ),
          });

          setBadgesConquistados(
            badgesUnicos
          );
        }
      )
      .catch((err) => {
        console.error(
          "Erro ao carregar dados do perfil:",
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
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <div
        className="
          d-flex
          justify-content-center
          align-items-center
        "
        style={{
          height: "100vh",
        }}
      >
        <Spinner
          animation="border"
          variant="primary"
        />
      </div>
    );
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
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <LeftSidebar />

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 20,
          }}
        >
          <Card
            className="border-0 mb-3"
            style={{
              background:
                "#3b6fd4",

              borderRadius:
                12,
            }}
          >
            <Card.Body
              className="
                p-4
                d-flex
                justify-content-between
                align-items-center
                text-white
              "
            >
              <div>
                <h5
                  className="
                    fw-semibold
                    mb-3
                  "
                  style={{
                    textAlign:
                      "left",
                  }}
                >
                  Olá,{" "}
                  {user?.nome_completo ||
                    user?.NOME_COMPLETO ||
                    "Consultor"}
                  !
                </h5>

                <div
                  className="
                    d-flex
                    gap-2
                    flex-wrap
                  "
                >
                  <div
                    style={
                      cardStyleBase
                    }
                  >
                    <BiMedal
                      size={25}
                    />

                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          opacity: 0.8,
                        }}
                      >
                        Badges
                        conquistados
                      </div>

                      <div
                        style={{
                          fontWeight:
                            600,
                        }}
                      >
                        {
                          stats.total_badges
                        }{" "}
                        badges
                      </div>
                    </div>
                  </div>

                  <div
                    style={
                      cardStyleBase
                    }
                  >
                    <BiStar
                      size={25}
                    />

                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          opacity: 0.8,
                        }}
                      >
                        Pontuação
                        geral
                      </div>

                      <div
                        style={{
                          fontWeight:
                            600,
                        }}
                      >
                        {
                          stats.total_pontos
                        }{" "}
                        pontos
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/lembretes"
                    style={{
                      ...cardStyleBase,

                      cursor:
                        "pointer",

                      textDecoration:
                        "none",

                      color:
                        "inherit",
                    }}
                  >
                    <BiUserCircle
                      size={25}
                    />

                    <div
                      style={{
                        fontWeight:
                          600,
                      }}
                    >
                      Lembretes
                    </div>
                  </Link>
                </div>
              </div>

              <div
                style={{
                  width: 72,
                  height: 72,

                  borderRadius:
                    "50%",

                  background:
                    "rgba(255,255,255,0.25)",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",
                }}
              >
                <BiUserCircle
                  size={50}
                  color="
                    rgba(
                      255,
                      255,
                      255,
                      0.8
                    )
                  "
                />
              </div>
            </Card.Body>
          </Card>

          <div
            className="
              d-flex
              justify-content-center
              gap-2
              mb-4
              flex-wrap
            "
          >
            <Button
              variant="light"
              onClick={() =>
                navigate("/progresso")
              }
              className="
                d-flex
                align-items-center
                justify-content-center
                gap-2
              "
              style={{
                ...navigationButtonStyle,
                minWidth: 160,
              }}
            >
              <BiLoader size={18} />
              Progresso
            </Button>

            <Button
              variant="light"
              onClick={() =>
                navigate("/historico_badges")
              }
              className="
                d-flex
                align-items-center
                justify-content-center
                gap-2
              "
              style={{
                ...navigationButtonStyle,
                minWidth: 210,
              }}
            >
              <BiBook size={18} />
              Histórico de Badges
            </Button>
          </div>

          <BadgeSection
            title="
              Os seus Badges
              Conquistados
            "
            sub="
              Histórico de conquistas
              na Softinsa:
            "
            onVerTodos={() =>
              navigate(
                "/meus_badges"
              )
            }
          >
            {badgesConquistados.length >
            0 ? (
              badgesConquistados.map(
                (
                  badge,
                  index
                ) => (
                  <BadgeCard
                    key={
                      badge.id ||
                      badge.id_badge_modelo ||
                      index
                    }
                    badge={
                      badge
                    }
                    name={
                      badge.nome ||
                      badge.nome_badge ||
                      "Badge"
                    }
                    desc={
                      badge.descricao ||
                      badge.descricao_badge_modelo ||
                      ""
                    }
                    points={
                      Number(
                        badge.pontos ||
                        0
                      )
                    }
                    dateConquered={
                      badge.data_atribuicao
                        ? new Date(
                            badge.data_atribuicao
                          ).toLocaleDateString(
                            "pt-PT"
                          )
                        : "Recentemente"
                    }
                    onClick={() =>
                      navigate(
                        `/badge-detalhe/${
                          badge.id ||
                          badge.id_badge_modelo
                        }`
                      )
                    }
                  />
                )
              )
            ) : (
              <div
                className="
                  text-center
                  py-4
                  text-muted
                "
              >
                Ainda não conquistou
                badges. Continue o seu
                progresso!
              </div>
            )}
          </BadgeSection>
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}

function BadgeSection({
  title,
  sub,
  children,
  onVerTodos,
}) {
  return (
    <div className="mb-3">
      <div
        className="
          d-flex
          justify-content-between
          align-items-start
          mb-2
        "
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            {title}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            {sub}
          </div>
        </div>

        <div
          onClick={onVerTodos}
          style={{
            fontSize: 12,
            color: "#2563eb",

            display: "flex",
            alignItems: "center",
            gap: 4,

            cursor:
              "pointer",
          }}
        >
          <BiMenu
            size={14}
          />

          Ver Todos
        </div>
      </div>

      {children}
    </div>
  );
}

function BadgeCard({
  badge,
  name,
  desc,
  points,
  dateConquered,
  onClick,
}) {
  const {
    ganhouBonus,
    pontosExtra,
  } = obterBonusBadge(
    badge
  );

  return (
    <div
      style={{
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
          12,

        marginBottom:
          10,

        overflow:
          "hidden",

        cursor:
          "pointer",
      }}
      onClick={onClick}
    >
      <div
        style={{
          padding:
            "16px",

          display:
            "flex",

          alignItems:
            "center",

          gap:
            20,
        }}
      >
        <BadgeImage
          badge={badge}
          size={60}
          background={
            ganhouBonus
              ? "#fff7d6"
              : "#f3f6f9"
          }
          borderColor={
            ganhouBonus
              ? "#d4af37"
              : "#e1e8ed"
          }
          padding={5}
        />

        <div
          style={{
            flex: 1,
          }}
        >
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                8,

              flexWrap:
                "wrap",

              marginBottom:
                3,
            }}
          >
            <div
              style={{
                fontSize:
                  16,

                fontWeight:
                  700,

                color:
                  "#111827",
              }}
            >
              {name}
            </div>

            {ganhouBonus && (
              <span
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
                    11,

                  fontWeight:
                    700,
                }}
              >
                Desafio concluído
              </span>
            )}
          </div>

          <div
            style={{
              fontSize:
                12,

              color:
                "#6b7280",
            }}
          >
            {desc}
          </div>
        </div>

        <div
          style={{
            border:
              ganhouBonus
                ? "1.5px solid #d4af37"
                : "1.5px solid #d1d5db",

            background:
              ganhouBonus
                ? "#fffdf4"
                : "white",

            borderRadius:
              10,

            padding:
              "8px 14px",

            textAlign:
              "center",

            minWidth:
              82,

            flexShrink:
              0,
          }}
        >
          <div
            style={{
              fontSize:
                11,

              fontWeight:
                600,

              color:
                ganhouBonus
                  ? "#9a6b00"
                  : "#111827",
            }}
          >
            Pontos
          </div>

          <div
            style={{
              fontSize:
                20,

              fontWeight:
                700,

              color:
                "#111827",

              lineHeight:
                1.1,
            }}
          >
            {points}
          </div>

          {ganhouBonus &&
            pontosExtra >
              0 && (
              <div
                style={{
                  marginTop:
                    3,

                  fontSize:
                    11,

                  fontWeight:
                    700,

                  color:
                    "#d4a017",

                  whiteSpace:
                    "nowrap",
                }}
              >
                +
                {
                  pontosExtra
                }{" "}
                extra
              </div>
            )}
        </div>
      </div>

      {dateConquered && (
        <div
          style={{
            borderTop:
              "1px solid #e5e7eb",

            padding:
              "8px 16px",

            backgroundColor:
              ganhouBonus
                ? "#fffdf4"
                : "#fafafa",

            textAlign:
              "center",

            fontSize:
              11,

            color:
              ganhouBonus
                ? "#9a6b00"
                : "#2E7D32",

            fontWeight:
              600,
          }}
        >
          Conquistado a{" "}
          {dateConquered}

          {ganhouBonus &&
            pontosExtra >
              0 &&
            ` • Recebeste +${pontosExtra} pontos extra`}
        </div>
      )}
    </div>
  );
}

const cardStyleBase = {
  background:
    "rgba(255,255,255,0.2)",

  borderRadius:
    8,

  padding:
    "6px 12px",

  display:
    "flex",

  alignItems:
    "center",

  gap:
    6,

  fontSize:
    12,

  textAlign:
    "left",
};

const navigationButtonStyle = {
  height: 40,
  padding: "0 18px",

  border: "1px solid #d6dbe1",
  borderRadius: 8,

  background: "#f8f9fa",
  color: "#344054",

  fontSize: 14,
  fontWeight: 500,

  boxShadow:
    "0 1px 2px rgba(0, 0, 0, 0.05)",

  transition:
    "background-color 0.15s ease, border-color 0.15s ease",
};

export default PaginaPerfil;