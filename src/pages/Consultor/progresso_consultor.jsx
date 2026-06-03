import { useState, useEffect } from "react";
import { Image, Card, Button, ProgressBar, Spinner } from 'react-bootstrap';
import { BiMedal, BiStar, BiUserCircle, BiGrid, BiMenu, BiBook } from 'react-icons/bi';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js'; // Garante que o caminho está correto

// Importação dos teus componentes estruturais
import Header from '../../components/header.jsx';
import RightSidebar from '../../components/right_sidebar.jsx';
import LeftSidebar from '../../components/left_sidebar.jsx';
//import ImagemBadge from '../../assets/Cybersecurity_Badge.png';

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
 
function RankingCard({ nome, pontos, dataAtribuicao }) {
    const dataFormatada = dataAtribuicao
        ? new Date(dataAtribuicao).toLocaleDateString("pt-PT")
        : null;
 
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 12,
            border: "1px solid #e5e7eb", borderRadius: 10,
            padding: "10px 14px", marginBottom: 8,
        }}>
            <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: "#f3f6f9", border: "1px solid #e1e8ed",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
                <BiMedal size={22} color="#3b6fd4" />
            </div>
 
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{nome}</div>
                <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 500 }}>
                    Ganhou +{pontos} pts
                </div>
            </div>
 
            {dataFormatada && (
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{dataFormatada}</div>
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

        if (!userId) {
            setLoading(false);
            navigate("/login", { replace: true });
            return;
        }

        setLoading(true);

        Promise.all([
            api.get(`/badges/learningpaths/${userId}`),
            api.get(`/badges/todos`),
            api.get(`/badges/conquistados/${userId}`),
            api.get(`/dashboard/${userId}`),
        ])
        .then(([learningRes, todosRes, conquistadosRes, dashboardRes]) => {
            const learningPaths = Array.isArray(learningRes.data)
                ? learningRes.data
                : [];

            /*const todos = Array.isArray(todosRes.data)
                ? todosRes.data
                : [];*/

            /*const conquistadosRaw = Array.isArray(conquistadosRes.data)
                ? conquistadosRes.data
                : [];*/

            /*const conquistados = conquistadosRaw.filter(
                (badge, index, self) =>
                index === self.findIndex(
                    (b) =>
                    String(b.id || b.id_badge_modelo) ===
                    String(badge.id || badge.id_badge_modelo)
                )
            );*/

            let comunsTotal = 0;
            let especiaisTotal = 0;

            todos.forEach((b) => {
                const nivel = Number(b.id_nivel || 0);

                if (nivel === 5) {
                especiaisTotal++;
                } else if (nivel >= 1 && nivel <= 4) {
                comunsTotal++;
                }
            });

            let comunsObtidos = 0;
            let especiaisObtidos = 0;

            conquistados.forEach((b) => {
                const nivel = Number(b.id_nivel || 0);

                if (nivel === 5) {
                especiaisObtidos++;
                } else if (nivel >= 1 && nivel <= 4) {
                comunsObtidos++;
                }
            });

            const ranking = [...conquistados]
                .sort((a, b) => Number(b.pontos || 0) - Number(a.pontos || 0))
                .slice(0, 3);

            setBadgesProgresso(learningPaths);
            setBadgesConquistados(ranking);

            const todosRaw = Array.isArray(todosRes.data) ? todosRes.data : [];
            const conquistadosRaw = Array.isArray(conquistadosRes.data) ? conquistadosRes.data : [];

            const todos = removerDuplicados(todosRaw);
            const conquistados = removerDuplicados(conquistadosRaw);

            const totalBadgesComuns = todos.filter((b) => {
            const nivel = Number(b.id_nivel);
            return nivel >= 1 && nivel <= 4;
            }).length;

            const totalBadgesEspeciais = todos.filter((b) => {
            const nivel = Number(b.id_nivel);
            return nivel === 5;
            }).length;

            const badgesComunsConquistados = conquistados.filter((b) => {
            const nivel = Number(b.id_nivel);
            return nivel >= 1 && nivel <= 4;
            }).length;

            const badgesEspeciaisConquistados = conquistados.filter((b) => {
            const nivel = Number(b.id_nivel);
            return nivel === 5;
            }).length;

            setStats({
                total_badges: Number(dashboardRes.data.total_badges || 0),
                total_pontos: Number(dashboardRes.data.total_pontos || 0),
            });

            setBadgeStats({
                badges_comuns_conquistados: badgesComunsConquistados,
                badges_especiais_conquistados: badgesEspeciaisConquistados,
                total_badges_comuns: totalBadgesComuns,
                total_badges_especiais: totalBadgesEspeciais,
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
        }, [navigate]);

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

                    <div className="text-center mb-4 d-flex justify-content-center gap-2">
                        <Button onClick={() => navigate('/historico_badges')} variant="white" className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2" style={{ fontSize: 15, fontWeight: 600 }}>
                            <BiBook size={20} /> Histórico de Badges
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

 
                    {/* Ranking de Conquistas */}
                    <ProgressoSection
                        title="Ranking de conquistas"
                        sub={`${badgesConquistados.length} badge(s) conquistado(s)`}
                    >
                        {badgesConquistados.length > 0 ? (
                            badgesConquistados.map((b, i) => (
                                <RankingCard
                                key={b.id || i}
                                nome={b.nome || b.nome_badge || "Badge"}
                                pontos={b.pontos || 0}
                                dataAtribuicao={b.data_atribuicao}
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

export default ProgressoPage;