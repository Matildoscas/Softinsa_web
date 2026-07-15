import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { Image, Card, Button, ProgressBar, Spinner } from 'react-bootstrap';
import { BiMedal, BiStar, BiUserCircle, BiGrid, BiMenu, BiBook } from 'react-icons/bi';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js'; // Garante que o caminho está correto

// Importação dos teus componentes estruturais
import Header from '../../components/Header.jsx';
import RightSidebar from '../../components/RightSidebar.jsx';
import LeftSidebar from '../../components/LeftSidebar.jsx';
import BadgeImage from "../../components/badge_image.jsx";
import {
  obterBonusBadge,
  obterPontosTotaisBadge,
} from "../../utils/badgeBonus.js";
import {
  EVENTO_NOTIFICACOES_ATUALIZADAS,
  filtrarNotificacoesMarco,
  formatarTituloNotificacao,
  obterConteudoNotificacao,
  obterIconeMarco,
  obterIdNotificacao,
  obterTipoNotificacao,
} from "../../utils/notificacoesUtils.js";

function ProgressoSection({
  title,
  sub,
  children,
  onVerTodos,
  mostrarVerTodos = true,
}) {
  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-start mb-2">
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

        {mostrarVerTodos && (
          <button
            type="button"
            onClick={onVerTodos}
            style={verTodosButton}
          >
            <BiMenu size={14} />
            Ver Todos
          </button>
        )}
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
        }}
      >
        {children}
      </div>
    </div>
  );
}
 
function BadgeCircle({ conquistados, total, label }) {
    return (
        <div className="d-flex flex-column align-items-center gap-2">
            <div style={{
                width: 90, height: 90, borderRadius: "50%",
                background: "#3b6fd4", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 700,
            }}>
                {conquistados}/{total}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>{label}</div>
        </div>
    );
}
 
function ProgressoBadgeCard({ nome, descricao, pontos, progresso }) {
    return (
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
            <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{
                    width: 70, height: 70, borderRadius: "50%", background: "#f3f6f9",
                    display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0,
                    border: "1px solid #e1e8ed",
                }}>
                    <BiMedal size={32} color="#3b6fd4" />
                </div>
 
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{nome}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{descricao}</div>
                    {progresso !== undefined && (
                        <div className="mt-2">
                            <ProgressBar now={progresso} style={{ height: 6 }} />
                            <div style={{ fontSize: 10, color: "#6b7280", textAlign: "right" }}>{progresso}%</div>
                        </div>
                    )}
                </div>
 
                <div style={{ border: "1.5px solid #d1d5db", borderRadius: 10, padding: "5px 10px", textAlign: "center", minWidth: 60 }}>
                    <div style={{ fontSize: 10, fontWeight: 600 }}>Pontos</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{pontos}</div>
                </div>
            </div>
        </div>
    );
}
 
function RankingCard({
  badge,
  nome,
  dataAtribuicao,
}) {
  const {
    ganhouBonus,
    pontosExtra,
  } = obterBonusBadge(badge);

  const pontosTotais =
    obterPontosTotaisBadge(
      badge
    );

  const pontosBase =
    Math.max(
      pontosTotais -
        Number(
          pontosExtra || 0
        ),
      0
    );

  const dataFormatada =
    dataAtribuicao
      ? new Date(
          dataAtribuicao
        ).toLocaleDateString(
          "pt-PT"
        )
      : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,

        border: ganhouBonus
          ? "2px solid #d4af37"
          : "1px solid #e5e7eb",

        background: ganhouBonus
          ? "#fffdf4"
          : "white",

        boxShadow: ganhouBonus
          ? "0 0 0 2px rgba(212,175,55,0.10)"
          : "none",

        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 8,
      }}
    >
      <BadgeImage
        badge={badge}
        size={42}
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
      />

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#111827",
          }}
        >
          {nome}
        </div>

        <div
          style={{
            fontSize: 11,
            color: ganhouBonus
              ? "#9a6b00"
              : "#2563eb",
            fontWeight: 600,
          }}
        >
          {ganhouBonus
            ? `${pontosTotais} pts (${pontosBase} + ${pontosExtra})`
            : `Ganhou +${pontosTotais} pts`}
        </div>
      </div>

      {ganhouBonus && (
        <span
          style={{
            background: "#fff7d6",
            color: "#9a6b00",
            border:
              "1px solid #f0d36b",
            borderRadius: 999,
            padding: "3px 8px",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          Desafio
        </span>
      )}

      {dataFormatada && (
        <div
          style={{
            fontSize: 11,
            color: "#9ca3af",
          }}
        >
          {dataFormatada}
        </div>
      )}
    </div>
  );
}

function ProgressoPage() {
    const navigate = useNavigate();
    
    // Estados para os dados da BD
    const [user, setUser] = useState(null);
    const [badgesProgresso, setBadgesProgresso] = useState([]);
    const [badgesConquistados, setBadgesConquistados] = useState([]);
    const [stats, setStats] = useState({ total_badges: 0, total_pontos: 0 });
    const [badgeStats, setBadgeStats] = useState({
        badges_comuns_conquistados: 0,
        badges_especiais_conquistados: 0,
        total_badges_comuns: 0,
        total_badges_especiais: 0,
    });
    const [badgeFaltaLearningPathStats, setBadgeFaltaLearningPathStats] = useState({
      badges_comuns_falta: 0,
      badges_especiais_falta: 0,
      total_badges_comuns: 0,
      total_badges_especiais: 0,
    });
    const [loading, setLoading] = useState(true);

    const removerDuplicados = (lista) => {
        return lista.filter(
            (badge, index, self) =>
            index === self.findIndex(
                (b) =>
                String(b.id || b.id_badge_modelo) ===
                String(badge.id || badge.id_badge_modelo)
            )
        );
    };

    /*const isEspecial = (badge) => {
    const nivel = Number(badge.id_nivel || 0);
    return nivel === 5;
    };

    const isComum = (badge) => {
        const nivel = Number(badge.id_nivel || 0);
        return nivel >= 1 && nivel <= 4;
    };*/

    const isEspecial = (badge) => {
    return String(
        badge.tipo_badge ||
        badge.TIPO_BADGE ||
        ""
    )
        .trim()
        .toUpperCase() === "ESPECIAL";
    };

    const isComum = (badge) => {
    return !isEspecial(badge);
    };

    const normalizarNumero = (valor) =>
      Number(valor || 0);

    const [
    marcos,
    setMarcos,
    ] = useState([]);

    const [
    modalMarcosAberto,
    setModalMarcosAberto,
    ] = useState(false);

    const [
    userId,
    setUserId,
    ] = useState(null);

    const carregarMarcos =
        useCallback(
            async (
            idUtilizador
            ) => {
            if (!idUtilizador) {
                setMarcos([]);
                return;
            }

            try {
                const response =
                await api.get(
                    `/notificacoes/${idUtilizador}`
                );

                const lista =
                Array.isArray(response.data)
                    ? response.data
                    : [];

                setMarcos(
                filtrarNotificacoesMarco(
                    lista
                )
                );
            } catch (err) {
                console.error(
                "[PROGRESSO] Erro ao carregar marcos:",
                err
                );

                setMarcos([]);
            }
            },
            []
        );

    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            setLoading(false);
            navigate("/login", { replace: true });
            return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);

        const userId = userData.id_utilizador || userData.ID_UTILIZADOR;

        setUserId(userId);
        carregarMarcos(userId);

        if (!userId) {
            setLoading(false);
            navigate("/login", { replace: true });
            return;
        }

        setLoading(true);

        Promise.all([
        api
            .get(
            `/badges/progresso/${userId}`
            )
            .catch((err) => {
            console.error(
                "Erro apenas nas Learning Paths:",
                err.response?.data
            );

            return {
                data: [],
            };
            }),

        api.get(
        "/badges/modelos-disponiveis"
        ),

        api.get(
            `/badges/conquistados/${userId}`
        ),

        api.get(
            `/utilizadores/dashboard/${userId}`
        ),
        ])
        .then(([learningRes, todosRes, conquistadosRes, dashboardRes]) => {
            const learningPaths = Array.isArray(learningRes.data)
                ? learningRes.data
                : [];

            const resumoFaltasLearningPath = learningPaths.reduce(
              (acc, lp) => {
                const totalComuns = normalizarNumero(
                  lp.total_badges_comuns
                );

                const comunsConquistados = normalizarNumero(
                  lp.badges_comuns_conquistados
                );

                const totalEspeciais = normalizarNumero(
                  lp.total_badges_especiais
                );

                const especiaisConquistados = normalizarNumero(
                  lp.badges_especiais_conquistados
                );

                acc.total_badges_comuns += totalComuns;
                acc.total_badges_especiais += totalEspeciais;

                acc.badges_comuns_falta += Math.max(
                  totalComuns - comunsConquistados,
                  0
                );

                acc.badges_especiais_falta += Math.max(
                  totalEspeciais - especiaisConquistados,
                  0
                );

                return acc;
              },
              {
                badges_comuns_falta: 0,
                badges_especiais_falta: 0,
                total_badges_comuns: 0,
                total_badges_especiais: 0,
              }
            );

            const todosRaw = Array.isArray(todosRes.data)
                ? todosRes.data
                : [];

            const conquistadosRaw = Array.isArray(conquistadosRes.data)
                ? conquistadosRes.data
                : [];

            const todos = removerDuplicados(todosRaw);
            const conquistados = removerDuplicados(conquistadosRaw);

            console.log("===== BADGES CONQUISTADOS =====");

            conquistados.forEach((badge) => {
                console.log({
                    id: badge.id,
                    nome: badge.nome,
                    id_nivel: badge.id_nivel,
                    pontos: badge.pontos,
                });
            });

            console.log("===============================");

            console.log("===== TODOS OS BADGES =====");

            todos.forEach((badge) => {
                console.log({
                    id: badge.id,
                    nome: badge.nome,
                    id_nivel: badge.id_nivel,
                    pontos: badge.pontos,
                });
            });

            console.log("========================");

            console.log(
                "ESPECIAIS CONQUISTADOS:",
                conquistados.filter((b) => Number(b.id_nivel) === 5)
            );

            console.log(
                "COMUNS CONQUISTADOS:",
                conquistados.filter((b) => Number(b.id_nivel) < 5)
            );

            let comunsTotal = 0;
            let especiaisTotal = 0;

            todos.forEach((b) => {
                if (isEspecial(b)) {
                    especiaisTotal++;
                } else if (isComum(b)) {
                    comunsTotal++;
                }
            });

            let comunsObtidos = 0;
            let especiaisObtidos = 0;

            conquistados.forEach((b) => {
                if (isEspecial(b)) {
                    especiaisObtidos++;
                } else if (isComum(b)) {
                    comunsObtidos++;
                }
            });

            const ranking = [...conquistados]
                .sort(
                  (a, b) =>
                    obterPontosTotaisBadge(b) -
                    obterPontosTotaisBadge(a)
                )
                .slice(0, 3);

            const totalPontosCalculado =
              conquistados.reduce(
                (total, badge) =>
                  total +
                  obterPontosTotaisBadge(
                    badge
                  ),
                0
              );

            setBadgesProgresso(learningPaths);
            setBadgesConquistados(ranking);
            setBadgeFaltaLearningPathStats(resumoFaltasLearningPath);

            setStats({
                total_badges: Number(dashboardRes.data.total_badges || 0),
              total_pontos: totalPontosCalculado,
            });

            setBadgeStats({
                badges_comuns_conquistados: comunsObtidos,
                badges_especiais_conquistados: especiaisObtidos,
                total_badges_comuns: comunsTotal,
                total_badges_especiais: especiaisTotal,
            });
        })
            .catch((err) => {
            console.error("Erro ao carregar progresso:", err);
            console.error("STATUS:", err.response?.status);
            console.error("BODY:", err.response?.data);
            })
            .finally(() => {
            setLoading(false);
            });
    }, [navigate, carregarMarcos]);

    useEffect(() => {
        if (!userId) {
            return undefined;
        }

        const atualizar =
            () => {
            carregarMarcos(
                userId
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
        carregarMarcos,
    ]);

    const marcosDisponiveis =
    montarMarcosDisponiveis({
        marcos,
        stats,
        badgeStats,
    });

    const ultimosMarcos =
    marcos.slice(0, 3);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <LeftSidebar />

                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    
                    {/* Welcome Card Dinâmico */}
                    <Card className="border-0 mb-3" style={{ background: '#3b6fd4', borderRadius: 12 }}>
                        <Card.Body className="p-4 d-flex justify-content-between align-items-center text-white">
                            <div>
                                <h5 className="fw-semibold mb-3" style={{ textAlign: 'left' }}>
                                    Bom dia, {user?.nome_completo || "Utilizador"}!
                                </h5>
                                <div className="d-flex gap-2">
                                    <div style={cardStyleBase}>
                                        <BiMedal size={25}/>
                                        <div>
                                            <div style={{ fontSize: 10, opacity: 0.8 }}>Badges</div>
                                            {/* Usa o stats vindo da dashboard */}
                                            <div style={{ fontWeight: 600 }}>Tem {stats.total_badges} badges</div>
                                        </div>
                                    </div>
                                    <div style={cardStyleBase}>
                                        <BiStar size={25}/>
                                        <div>
                                            <div style={{ fontSize: 10, opacity: 0.8 }}>Pontos totais</div>
                                            {/* Usa o stats vindo da dashboard */}
                                            <div style={{ fontWeight: 600 }}>{stats.total_pontos} pontos</div>
                                        </div>
                                    </div>
                                    <Link to="/lembretes" style={{ ...cardStyleBase, cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}>
                                        <BiUserCircle size={25}/>
                                        <div style={{ fontWeight: 600 }}>Lembretes</div>
                                    </Link>
                                </div>
                            </div>
                            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BiUserCircle size={50} color="rgba(255,255,255,0.8)" />
                            </div>
                        </Card.Body>
                    </Card>

                    <div
                    className="
                        d-flex
                        justify-content-center
                        mb-4
                    "
                    >
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

                    <ProgressoSection
                        title="Progressos nas Learning Paths"
                        sub={`${badgesProgresso.length} learning path(s)`}
                        >
                        {badgesProgresso.length > 0 ? (
                            badgesProgresso.map((lp, i) => (
                            <div key={i} className="mb-3">
                                <div style={{ fontSize: 13, fontWeight: 600 }}>
                                {lp.nome_learningpath}
                                </div>

                                <ProgressBar
                                now={Number(lp.percentagem || 0)}
                                style={{ height: 7, marginTop: 6 }}
                                />

                                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                                {lp.badges_conquistados} / {lp.total_badges} badges concluídos •{" "}
                                {lp.percentagem}%
                                </div>
                            </div>
                            ))
                        ) : (
                            <p className="text-muted small">Sem learning paths disponíveis.</p>
                        )}
                        </ProgressoSection>

                    {/* Seção: Badges com Progresso */}
                    <ProgressoSection title="Progressos dos Badges" sub="Badges que faltam concluir nas Learning Paths">
                        <div className="d-flex gap-4 flex-wrap mt-1">
                            <BadgeCircle
                          conquistados={badgeFaltaLearningPathStats.badges_comuns_falta}
                          total={badgeFaltaLearningPathStats.total_badges_comuns}
                          label="Badges comuns em falta"
                            />
                            <BadgeCircle
                          conquistados={badgeFaltaLearningPathStats.badges_especiais_falta}
                          total={badgeFaltaLearningPathStats.total_badges_especiais}
                          label="Badges especiais em falta"
                            />
                        </div>
                    </ProgressoSection>

                    {/* Ranking de Conquistas */}
                    <ProgressoSection
                      title="Ranking de conquistas"
                      sub={`${badgesConquistados.length} badge(s) conquistado(s)`}
                    >
                      {badgesConquistados.length > 0 ? (
                        badgesConquistados.map((b, i) => (
                          <RankingCard
                            key={
                              b.id ||
                              b.id_badge_modelo ||
                              i
                            }
                            badge={b}
                            nome={
                              b.nome ||
                              b.nome_badge ||
                              "Badge"
                            }
                            dataAtribuicao={
                              b.data_atribuicao
                            }
                            />
                        ))
                        ) : (
                        <p className="text-muted small">Ainda não há conquistas registadas.</p>
                      )}
                    </ProgressoSection>

                    <ProgressoSection
                    title="Marcos alcançados"
                    sub={`${marcos.length} marco(s) registado(s) no teu percurso`}
                    onVerTodos={() =>
                        setModalMarcosAberto(true)
                    }
                    >
                    <TimelineMarcos
                        marcos={ultimosMarcos}
                    />
                    </ProgressoSection>

                </div>

                <RightSidebar />
            </div>
            {modalMarcosAberto && (
                <ModalTodosMarcos
                    marcos={marcosDisponiveis}
                    onClose={() =>
                    setModalMarcosAberto(false)
                    }
                />
            )}
        </div>
    );
}

// Estilo auxiliar para os mini-cards do Header Azul
const cardStyleBase = { 
    background: 'rgba(255,255,255,0.2)', 
    borderRadius: 8, 
    padding: '6px 12px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    fontSize: 12, 
    textAlign: 'left'
};

const DEFINICOES_MARCOS = [
  {
    tipo: "MARCO_PRIMEIRO_BADGE",
    titulo: "Primeiro badge conquistado",
    descricao:
      "Conquista o teu primeiro badge na Softinsa Academy.",
    icone: "🎉",
    condicao: ({ stats }) =>
      Number(stats.total_badges || 0) >= 1,
  },
  {
    tipo: "MARCO_5_BADGES",
    titulo: "5 badges conquistados",
    descricao:
      "Conquista pelo menos 5 badges.",
    icone: "🔥",
    condicao: ({ stats }) =>
      Number(stats.total_badges || 0) >= 5,
  },
  {
    tipo: "MARCO_10_BADGES",
    titulo: "10 badges conquistados",
    descricao:
      "Conquista pelo menos 10 badges.",
    icone: "🚀",
    condicao: ({ stats }) =>
      Number(stats.total_badges || 0) >= 10,
  },
  {
    tipo: "MARCO_NIVEL_E",
    titulo: "Primeiro badge de nível E",
    descricao:
      "Conquista pelo menos um badge especial / nível E.",
    icone: "🏆",
    condicao: ({ badgeStats }) =>
      Number(
        badgeStats.badges_especiais_conquistados ||
        0
      ) >= 1,
  },
];

function encontrarMarcoNotificacao(
  marcos,
  tipo
) {
  return marcos.find(
    (marco) =>
      obterTipoNotificacao(marco) === tipo
  );
}

function montarMarcosDisponiveis({
  marcos,
  stats,
  badgeStats,
}) {
  const listaMarcos =
    Array.isArray(marcos)
      ? marcos
      : [];

  return DEFINICOES_MARCOS.map(
    (definicao) => {
      const notificacao =
        encontrarMarcoNotificacao(
          listaMarcos,
          definicao.tipo
        );

      const alcancadoPorDados =
        definicao.condicao({
          stats,
          badgeStats,
        });

      const alcancado =
        Boolean(notificacao) ||
        alcancadoPorDados;

      return {
        ...definicao,
        alcancado,
        notificacao:
          notificacao || null,
        data:
          notificacao?.data_envio ||
          notificacao?.DATA_ENVIO ||
          null,
      };
    }
  );
}

function TimelineMarcos({
  marcos,
}) {
  const lista =
    Array.isArray(marcos)
      ? marcos
      : [];

  if (lista.length === 0) {
    return (
      <div style={timelineEmpty}>
        Ainda não existem marcos alcançados.
        Continua a conquistar badges para desbloquear celebrações.
      </div>
    );
  }

  return (
    <div style={timelineWrap}>
      {lista.map(
        (marco, index) => {
          const tipo =
            obterTipoNotificacao(
              marco
            );

          const data =
            marco.data_envio ||
            marco.DATA_ENVIO ||
            null;

          return (
            <div
              key={
                obterIdNotificacao(
                  marco
                ) || index
              }
              style={timelineItem}
            >
              <div style={timelineLine}>
                <div style={timelineIcon}>
                  {obterIconeMarco(
                    tipo
                  )}
                </div>

                {index <
                  lista.length - 1 && (
                  <div style={timelineBar} />
                )}
              </div>

              <div style={timelineContent}>
                <div style={timelineTitle}>
                  {formatarTituloNotificacao(
                    tipo
                  )}
                </div>

                <div style={timelineText}>
                  {obterConteudoNotificacao(
                    marco
                  )}
                </div>

                {data && (
                  <div style={timelineDate}>
                    {new Date(
                      data
                    ).toLocaleDateString(
                      "pt-PT",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

// --- COMPONENTES AUXILIARES (BadgeSection e BadgeCard) ---
// (Mantive a estrutura visual que enviaste, apenas injetando as props)

function BadgeSection({ title, sub, children }) {
    return (
        <div className="mb-4">
            <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{title}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{sub}</div>
                </div>
                <div style={{ fontSize: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <BiMenu size={14} /> Ver Todos
                </div>
            </div>
            {children}
        </div>
    );
}

function BadgeCard({ name, desc, points, progress, dateConquered }) {
    return (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{
                    width: 70, height: 70, borderRadius: '50%', background: '#f3f6f9',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
                    border: '1px solid #e1e8ed', overflow: 'hidden'
                }}>
                    {/* <Image src={ImagemBadge} alt='Badge' fluid /> */}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{desc}</div>
                    {progress !== undefined && (
                        <div className="mt-2">
                            <ProgressBar now={progress} style={{ height: 6 }} />
                            <div style={{ fontSize: 10, color: '#6b7280', textAlign: 'right' }}>{progress}%</div>
                        </div >
                    )}
                </div>

                <div style={{ border: '1.5px solid #d1d5db', borderRadius: 10, padding: '5px 10px', textAlign: 'center', minWidth: 60 }}>
                    <div style={{ fontSize: 10, fontWeight: 600 }}>Pontos</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{points}</div>
                </div>
            </div>
            {dateConquered && (
                <div style={{ borderTop: '1px solid #e5e7eb', padding: '6px', backgroundColor: '#fafafa', textAlign: 'center', fontSize: 11, color: '#2563eb', fontWeight: 500 }}>
                    {dateConquered}
                </div>
            )}
        </div>
    );
}

function ModalTodosMarcos({
  marcos,
  onClose,
}) {
  const lista =
    Array.isArray(marcos)
      ? marcos
      : [];

  const alcancados =
    lista.filter(
      (marco) => marco.alcancado
    );

  const porAlcancar =
    lista.filter(
      (marco) => !marco.alcancado
    );

  return (
    <div style={modalOverlay}>
      <div style={modalCard}>
        <div style={modalHeader}>
          <div>
            <h3 style={modalTitle}>
              Todos os Marcos
            </h3>

            <div style={modalSubtitle}>
              {alcancados.length} alcançado(s) de{" "}
              {lista.length} marco(s)
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={modalCloseButton}
          >
            ×
          </button>
        </div>

        <div style={modalBody}>
          <div style={modalSectionTitle}>
            Marcos alcançados
          </div>

          {alcancados.length > 0 ? (
            alcancados.map((marco) => (
              <MarcoCard
                key={marco.tipo}
                marco={marco}
              />
            ))
          ) : (
            <div style={timelineEmpty}>
              Ainda não alcançaste nenhum marco.
            </div>
          )}

          <div
            style={{
              ...modalSectionTitle,
              marginTop: 22,
            }}
          >
            Marcos disponíveis
          </div>

          {porAlcancar.length > 0 ? (
            porAlcancar.map((marco) => (
              <MarcoCard
                key={marco.tipo}
                marco={marco}
              />
            ))
          ) : (
            <div style={timelineEmpty}>
              Já alcançaste todos os marcos disponíveis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MarcoCard({
  marco,
}) {
  const alcancado =
    Boolean(marco.alcancado);

  return (
    <div
      style={{
        ...marcoCard,
        border: alcancado
          ? "1px solid #bbf7d0"
          : "1px solid #e5e7eb",
        background: alcancado
          ? "#f0fdf4"
          : "#f8fafc",
      }}
    >
      <div
        style={{
          ...marcoIcon,
          background: alcancado
            ? "#16a34a"
            : "#94a3b8",
        }}
      >
        {alcancado
          ? marco.icone
          : "🔒"}
      </div>

      <div style={{ flex: 1 }}>
        <div style={marcoTitulo}>
          {marco.titulo}
        </div>

        <div style={marcoDescricao}>
          {marco.descricao}
        </div>

        {marco.data && (
          <div style={marcoData}>
            Alcançado em{" "}
            {new Date(
              marco.data
            ).toLocaleDateString(
              "pt-PT"
            )}
          </div>
        )}
      </div>

      <span
        style={{
          ...marcoEstado,
          background: alcancado
            ? "#dcfce7"
            : "#e5e7eb",
          color: alcancado
            ? "#15803d"
            : "#475569",
        }}
      >
        {alcancado
          ? "Alcançado"
          : "Por alcançar"}
      </span>
    </div>
  );
}

const timelineWrap = {
  display: "flex",
  flexDirection: "column",
  gap: 0,
};

const timelineItem = {
  display: "grid",
  gridTemplateColumns: "48px 1fr",
  gap: 12,
};

const timelineLine = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const timelineIcon = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  background: "#2563eb",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 20,
  boxShadow:
    "0 8px 18px rgba(37, 99, 235, 0.25)",
  zIndex: 1,
};

const timelineBar = {
  width: 2,
  flex: 1,
  minHeight: 34,
  background: "#dbeafe",
  marginTop: 4,
  marginBottom: 4,
};

const timelineContent = {
  background:
    "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
  border: "1px solid #dbeafe",
  borderRadius: 12,
  padding: "12px 14px",
  marginBottom: 12,
};

const timelineTitle = {
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 4,
};

const timelineText = {
  fontSize: 13,
  color: "#475569",
  lineHeight: 1.45,
};

const timelineDate = {
  fontSize: 11,
  color: "#64748b",
  marginTop: 8,
  fontWeight: 600,
};

const timelineEmpty = {
  padding: 18,
  textAlign: "center",
  borderRadius: 12,
  background: "#f8fafc",
  color: "#64748b",
  fontSize: 13,
  border: "1px dashed #cbd5e1",
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

const verTodosButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  gap: 4,
  cursor: "pointer",
  fontSize: 12,
  padding: 0,
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "rgba(15, 23, 42, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 22,
};

const modalCard = {
  width: "100%",
  maxWidth: 760,
  maxHeight: "86vh",
  background: "white",
  borderRadius: 16,
  boxShadow:
    "0 24px 70px rgba(15, 23, 42, 0.30)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const modalHeader = {
  padding: "18px 22px",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
};

const modalTitle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
};

const modalSubtitle = {
  marginTop: 3,
  fontSize: 12,
  color: "#64748b",
};

const modalCloseButton = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  border: "none",
  background: "#f1f5f9",
  color: "#334155",
  fontSize: 22,
  lineHeight: 1,
  cursor: "pointer",
};

const modalBody = {
  padding: 22,
  overflowY: "auto",
};

const modalSectionTitle = {
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 10,
};

const marcoCard = {
  display: "flex",
  alignItems: "center",
  gap: 13,
  borderRadius: 12,
  padding: "13px 14px",
  marginBottom: 10,
};

const marcoIcon = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  flexShrink: 0,
};

const marcoTitulo = {
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
};

const marcoDescricao = {
  marginTop: 3,
  fontSize: 12,
  color: "#64748b",
  lineHeight: 1.45,
};

const marcoData = {
  marginTop: 5,
  fontSize: 11,
  color: "#15803d",
  fontWeight: 700,
};

const marcoEstado = {
  borderRadius: 999,
  padding: "5px 10px",
  fontSize: 11,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

export default ProgressoPage;