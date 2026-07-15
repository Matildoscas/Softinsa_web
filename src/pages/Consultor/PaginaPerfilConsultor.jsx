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

import Header from "../../components/Header.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";
import BadgeImage from "../../components/badge_image.jsx";

import {
  obterBonusBadge,
  obterPontosTotaisBadge,
  removerBadgesDuplicados,
} from "../../utils/badgeBonus.js";

function normalizarAreaBadge(badge) {
  return String(
    badge?.nome_area ||
      badge?.nome_areas ||
      badge?.area ||
      badge?.area_nome ||
      badge?.nome_area_utilizador ||
      ""
  ).trim();
}

function obterAreaPrincipal(badges) {
  const contagem = new Map();

  badges.forEach((badge) => {
    const area = normalizarAreaBadge(badge);

    if (!area) {
      return;
    }

    contagem.set(area, (contagem.get(area) || 0) + 1);
  });

  const ordenadas = Array.from(contagem.entries()).sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }

    return a[0].localeCompare(b[0], "pt-PT");
  });

  return ordenadas[0]?.[0] || "Área não definida";
}

function obterDistribuicaoAreas(badges) {
  const mapa = new Map();

  badges.forEach((badge) => {
    const area = normalizarAreaBadge(badge) || "Sem área definida";
    mapa.set(area, (mapa.get(area) || 0) + 1);
  });

  return Array.from(mapa.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return a[0].localeCompare(b[0], "pt-PT");
    })
    .map(([area, total]) => ({ area, total }));
}

function normalizarAreaTexto(valor) {
  return String(valor || "").trim();
}

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

  const [dadosPerfil, setDadosPerfil] = useState(null);

  const [perfilResumo, setPerfilResumo] = useState({
    areaPrincipal: "Área não definida",
    areasDistribuicao: [],
    ultimoBadge: null,
  });

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

    Promise.allSettled([
      api.get(
        `/utilizadores/dashboard/${userId}`
      ),

      api.get(
        `/utilizadores/${userId}`
      ),

      api.get(
        `/badges/conquistados/${userId}`
      ),
    ])
      .then((resultados) => {
        const dashboardRes =
          resultados[0].status === "fulfilled"
            ? resultados[0].value
            : { data: { total_badges: 0, total_pontos: 0 } };

        const userRes =
          resultados[1].status === "fulfilled"
            ? resultados[1].value
            : { data: null };

        const badgesRes =
          resultados[2].status === "fulfilled"
            ? resultados[2].value
            : { data: [] };

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

          const totalPontosCalculado =
            badgesUnicos.reduce(
              (total, badge) =>
                total +
                obterPontosTotaisBadge(
                  badge
                ),
              0
            );

          const badgesOrdenados = [...badgesUnicos].sort((a, b) => {
            const dataA = new Date(a.data_atribuicao || a.data_emissao || 0).getTime();
            const dataB = new Date(b.data_atribuicao || b.data_emissao || 0).getTime();

            return dataB - dataA;
          });

          setStats({
            total_badges:
              Number(
                dashboardRes.data
                  .total_badges ||
                0
              ),

            total_pontos:
              totalPontosCalculado,
          });

          setBadgesConquistados(
            badgesUnicos
          );

          setDadosPerfil(
            userRes.data || null
          );

          setPerfilResumo({
            areaPrincipal:
              normalizarAreaTexto(
                userRes.data?.nome_area ||
                  userRes.data?.departamento ||
                  obterAreaPrincipal(badgesUnicos)
              ),
            areasDistribuicao: obterDistribuicaoAreas(badgesUnicos),
            ultimoBadge: badgesOrdenados[0] || null,
          });
        }
      )
      .catch((err) => {
        console.error(
          "Erro ao carregar dados do perfil:",
          err
        );

        const areaFallback =
          normalizarAreaTexto(
            dadosPerfil?.nome_area ||
              dadosPerfil?.departamento ||
              obterAreaPrincipal(badgesConquistados)
          );

        if (areaFallback) {
          setPerfilResumo((anterior) => ({
            ...anterior,
            areaPrincipal: areaFallback,
          }));
        }

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
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(255,255,255,0.16)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    marginBottom: 14,
                  }}
                >
                  <BiMedal size={16} />
                  Área principal: {perfilResumo.areaPrincipal}
                </div>

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

          <div className="d-flex gap-3 flex-wrap mb-4">
            <Card className="border-0 flex-grow-1" style={{ minWidth: 260, borderRadius: 12, background: "white" }}>
              <Card.Body>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Área de atuação</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginTop: 4 }}>
                  {perfilResumo.areaPrincipal}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                  {dadosPerfil?.nome_area
                    ? "Área obtida diretamente do perfil do consultor."
                    : "Baseado nos badges conquistados e na área onde tens maior presença."}
                </div>
              </Card.Body>
            </Card>

            <Card className="border-0 flex-grow-1" style={{ minWidth: 260, borderRadius: 12, background: "white" }}>
              <Card.Body>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Última conquista</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginTop: 4 }}>
                  {perfilResumo.ultimoBadge?.nome || perfilResumo.ultimoBadge?.nome_badge || "Sem conquistas recentes"}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                  {perfilResumo.ultimoBadge?.data_atribuicao
                    ? new Date(perfilResumo.ultimoBadge.data_atribuicao).toLocaleDateString("pt-PT")
                    : "Aguardando a próxima conquista"}
                </div>
              </Card.Body>
            </Card>

            <Card className="border-0 flex-grow-1" style={{ minWidth: 260, borderRadius: 12, background: "white" }}>
              <Card.Body>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Áreas com badges</div>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                  {perfilResumo.areasDistribuicao.length > 0 ? (
                    perfilResumo.areasDistribuicao.slice(0, 4).map((item) => (
                      <div key={item.area} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <span style={{ fontSize: 13, color: "#111827", fontWeight: 600 }}>{item.area}</span>
                        <span style={{ fontSize: 13, color: "#2563eb", fontWeight: 700 }}>{item.total}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 12, color: "#6b7280" }}>Ainda sem distribuição disponível.</div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </div>

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
                navigate("/progresso-badges")
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

            <Button
              variant="light"
              onClick={() =>
                navigate("/minha-galeria-publica")
              }
              className="
                d-flex
                align-items-center
                justify-content-center
                gap-2
              "
              style={{
                ...navigationButtonStyle,
                minWidth: 220,
              }}
            >
              <BiMenu size={18} />
              Minha Galeria Publica
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
                      obterPontosTotaisBadge(
                        badge
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