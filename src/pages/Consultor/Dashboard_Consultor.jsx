import { useState, useEffect } from "react";
import { Image, Card, Button, ProgressBar, Spinner } from 'react-bootstrap';
import { BiMedal, BiStar, BiUserCircle, BiGrid, BiMenu } from 'react-icons/bi';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js'; 

import Header from '../../components/header.jsx';
import RightSidebar from '../../components/right_sidebar.jsx';
import LeftSidebar from '../../components/left_sidebar.jsx';

function PaginaPrincipal() {
    const navigate = useNavigate();
    
    const [user, setUser] = useState(null);
    const [progressoBadges, setProgressoBadges] = useState([]);
    const [recomendados, setRecomendados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total_badges: 0, total_pontos: 0 });

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            
            const userId = userData.id_utilizador || userData.ID_UTILIZADOR;

            if (!userId) {
                console.error("ID do utilizador não encontrado no localStorage.");
                setLoading(false);
                return;
            }

            setLoading(true);
            Promise.all([
                api.get(`/badges/progresso/${userId}`),
                api.get(`/badges/recomendados/${userId}`),
                api.get(`/dashboard/${userId}`) 
            ]).then(([progressoRes, recomendadosRes, dashboardRes]) => {
                setProgressoBadges(progressoRes.data || []);
                setRecomendados(recomendadosRes.data || []);
                
                if (dashboardRes.data) {
                    setStats({
                        total_badges: Number(dashboardRes.data.total_badges || 0),
                        total_pontos: Number(dashboardRes.data.total_pontos || 0)
                    });
                }
                setLoading(false);
            }).catch(err => {
                console.error("Erro ao carregar dados em paralelo:", err);
                setLoading(false);
            });
        } else {
            setLoading(false);
            navigate('/login'); 
        }
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
                    
                    <Card className="border-0 mb-3" style={{ background: '#3b6fd4', borderRadius: 12 }}>
                        <Card.Body className="p-4 d-flex justify-content-between align-items-center text-white">
                            <div>
                                <h5 className="fw-semibold mb-3" style={{ textAlign: 'left' }}>
                                    Bom dia, {user?.nome_completo || user?.NOME_COMPLETO || "Utilizador"}!
                                </h5>
                                <div className="d-flex gap-2">
                                    <div style={cardStyleBase}>
                                        <BiMedal size={25}/>
                                        <div>
                                            <div style={{ fontSize: 10, opacity: 0.8 }}>Badges</div>
                                            <div style={{ fontWeight: 600 }}>Tem {stats.total_badges} badges</div>
                                        </div>
                                    </div>
                                    <div style={cardStyleBase}>
                                        <BiStar size={25}/>
                                        <div>
                                            <div style={{ fontSize: 10, opacity: 0.8 }}>Pontos totais</div>
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

                    <div className="text-center mb-4">
                        <Button variant="white" onClick={() => navigate('/catalogo')} className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2 mx-auto" style={{ fontSize: 15, fontWeight: 600 }}>
                            <BiGrid size={20} /> Catálogo de Badges
                        </Button>
                    </div>

                    <BadgeSection 
                        title="Badges com progresso" 
                        sub={`Tem ${progressoBadges.length} badge(s) em progresso`}
                    >
                        {progressoBadges.length > 0 ? (
                            progressoBadges.map((b, i) => (
                                <BadgeCard 
                                    key={i}
                                    name={b.nome || b.NOME_BADGE || b.nome_badge} 
                                    desc={b.descricao} 
                                    points={b.pontos} 
                                    progress={b.progresso || 0} 
                                />
                            ))
                        ) : (
                            <p className="text-muted small ms-2">Não tem badges em progresso de momento.</p>
                        )}
                    </BadgeSection>

                    <BadgeSection title="Recomendação de badge" sub="Baseado no seu perfil e área:">
                        {recomendados.length > 0 ? (
                            recomendados.map((b, i) => (
                                <BadgeCard 
                                    key={i}
                                    name={b.nome || b.NOME_BADGE} 
                                    desc={b.descricao} 
                                    points={b.pontos} 
                                    dateConquered={b.tempo_limite ? "⚠️ Pontos em Dobro (Tempo Limite)" : "Por Conquistar"} 
                                />
                            ))
                        ) : (
                            <p className="text-muted small ms-2">Nenhuma recomendação disponível para esta área de momento.</p>
                        )}
                    </BadgeSection>
                </div>

                <RightSidebar />
            </div>
        </div>
    );
}

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
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{desc}</div>
                    {progress !== undefined && progress > 0 && (
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

export default PaginaPrincipal;