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

function ProgressoSection({ title, sub, children }) {
    return (
        <div className="mb-4">
            <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{title}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{sub}</div>
                </div>
                <div style={{ fontSize: 12, color: "#2563eb", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                    <BiMenu size={14} /> Ver Todos
                </div>
            </div>
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
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
  pontos,
  dataAtribuicao,
}) {
  const {
    ganhouBonus,
    pontosExtra,
  } = obterBonusBadge(badge);

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
            ? `${pontos} base + ${pontosExtra} extra`
            : `Ganhou +${pontos} pts`}
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

    const isEspecial = (badge) => {
    const nivel = Number(badge.id_nivel || 0);
    return nivel === 5;
    };

    const isComum = (badge) => {
        const nivel = Number(badge.id_nivel || 0);
        return nivel >= 1 && nivel <= 4;
    };

    const [
    marcos,
    setMarcos,
    ] = useState([]);

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
            "/badges/todos"
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
                .sort((a, b) => Number(b.pontos || 0) - Number(a.pontos || 0))
                .slice(0, 3);

            setBadgesProgresso(learningPaths);
            setBadgesConquistados(ranking);

            setStats({
                total_badges: Number(dashboardRes.data.total_badges || 0),
                total_pontos: Number(dashboardRes.data.total_pontos || 0),
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
                    <ProgressoSection title="Progressos dos Badges" sub="Resumo das tuas conquistas">
                        <div className="d-flex gap-4 flex-wrap mt-1">
                            <BadgeCircle
                                conquistados={badgeStats.badges_comuns_conquistados}
                                total={badgeStats.total_badges_comuns}
                                label="Badges comuns"
                            />
                            <BadgeCircle
                                conquistados={badgeStats.badges_especiais_conquistados}
                                total={badgeStats.total_badges_especiais}
                                label="Badges especiais"
                            />
                        </div>
                    </ProgressoSection>

                    <ProgressoSection
                        title="Marcos alcançados"
                        sub={`${marcos.length} marco(s) registado(s) no teu percurso`}
                        >
                        <TimelineMarcos
                            marcos={marcos}
                        />
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
                                    pontos={
                                        Number(b.pontos || 0)
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

                </div>

                <RightSidebar />
            </div>
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

export default ProgressoPage;