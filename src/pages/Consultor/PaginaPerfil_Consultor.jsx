import { useState, useEffect } from "react";
import { Container, Row, Col, ListGroup, Card, Button, ProgressBar, Spinner } from 'react-bootstrap';
import { BiLoader, BiBook, BiBell, BiUserCircle, BiMedal, BiStar, BiNote, BiGrid, BiMenu, BiSearch } from 'react-icons/bi';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js'; // Certifica-te que o caminho está correto

// Componentes Estruturais
import Header from '../../components/header.jsx';
import RightSidebar from '../../components/right_sidebar.jsx';
import LeftSidebar from '../../components/left_sidebar.jsx';
import BadgeImage from "../../components/badge_image.jsx";

function PaginaPerfil() {
    const navigate = useNavigate();

    // Estados para dados da BD
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ total_badges: 0, total_pontos: 0 });
    const [badgesConquistados, setBadgesConquistados] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            const userId = userData.id_utilizador || userData.ID_UTILIZADOR;

            setLoading(true);
            Promise.all([
                api.get(`/dashboard/${userId}`),
                api.get(`/badges/conquistados/${userId}`) // Chamada à nova rota criada acima
            ]).then(([dashboardRes, badgesRes]) => {
                setStats(dashboardRes.data);               
                // Agora os dados vêm diretamente da nova rota /conquistados
                const badgesUnicos = badgesRes.data.filter(
                    (badge, index, self) =>
                        index === self.findIndex((b) => b.id === badge.id)
                );

                setBadgesConquistados(badgesUnicos);
                setLoading(false);
            }).catch(err => {
                console.error("Erro ao carregar dados do perfil:", err);
                setLoading(false);
            });
        }
    }, []);

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

                {/* Main Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    
                    {/* Welcome Card Dinâmico */}
                    <Card className="border-0 mb-3" style={{ background: '#3b6fd4', borderRadius: 12 }}>
                        <Card.Body className="p-4 d-flex justify-content-between align-items-center text-white">
                            <div>
                                <h5 className="fw-semibold mb-3" style={{ textAlign: 'left' }}>
                                    Olá, {user?.nome_completo || user?.NOME_COMPLETO || "Consultor"}!
                                </h5>
                                <div className="d-flex gap-2">
                                    <div style={cardStyleBase}>
                                        <BiMedal size={25}/>
                                        <div>
                                            <div style={{ fontSize: 10, opacity: 0.8 }}>Badges Concluintes</div>
                                            <div style={{ fontWeight: 600 }}>{stats.total_badges} badges</div>
                                        </div>
                                    </div>
                                    <div style={cardStyleBase}>
                                        <BiStar size={25}/>
                                        <div>
                                            <div style={{ fontSize: 10, opacity: 0.8 }}>Pontuação Geral</div>
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

                    {/* Botões de Navegação */}
                    <div className="text-center mb-4 d-flex justify-content-center gap-2">
                        <Button onClick={() => navigate('/progresso')} variant="white" className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2" style={{ fontSize: 15, fontWeight: 600 }}>
                            <BiLoader size={20} /> Progresso
                        </Button>
                        <Button onClick={() => navigate('/historico_badges')} variant="white" className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2" style={{ fontSize: 15, fontWeight: 600 }}>
                            <BiBook size={20} /> Histórico de Badges
                        </Button>
                    </div>

                    <BadgeSection title="Os seus Badges Conquistados" sub="Histórico de conquistas na Softinsa:">
                        {badgesConquistados.length > 0 ? (
                            badgesConquistados.map((badge, index) => (
                                <BadgeCard
                                    key={index}
                                    name={badge.nome}
                                    desc={badge.descricao}
                                    points={badge.pontos}
                                    dateConquered={badge.data_atribuicao 
                                        ? new Date(badge.data_atribuicao).toLocaleDateString()
                                        : "Recentemente"}
                                />
                            ))
                        ) : (
                            <div className="text-center py-4 text-muted">
                                <p>Ainda não conquistou badges. Continue o seu progresso!</p>
                            </div>
                        )}
                    </BadgeSection>
                </div>

                <RightSidebar />
            </div>
        </div>
    );
}

// Estilos Auxiliares
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

function BadgeSection({ title, sub, children }) {
    return (
        <div className="mb-3">
            <div className="d-flex justify-content-between align-items-start mb-1">
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
            <div style={{ padding: '16px', display: 'flex', alignItems: 'start', gap: 20 }}>
                <div style={{
                    width: 60, height: 60, borderRadius: '50%', background: '#f3f6f9',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
                    border: '1px solid #e1e8ed'
                }}>
                    <BadgeImage
                        badge={badge}
                        nome={nome}
                        size={72}
                    />
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{desc}</div>
                </div>

                <div style={{ border: '1.5px solid #d1d5db', borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 64, flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#111827', marginBottom: 1 }}>Pontos</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{points}</div>
                </div>
            </div>

            {dateConquered && (
                <div style={{
                    borderTop: '1px solid #e5e7eb',
                    padding: '8px 16px',
                    backgroundColor: '#fafafa',
                    textAlign: 'center',
                    fontSize: 11,
                    color: '#6b7280'
                }}>
                    Conquistado a {dateConquered}
                </div>
            )}
        </div>
    );
}

export default PaginaPerfil;