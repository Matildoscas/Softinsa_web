import { useState, useEffect } from "react";
import { Card, Button, ProgressBar } from 'react-bootstrap';
import { BiLoader, BiBook, BiUserCircle, BiMedal, BiStar, BiMenu } from 'react-icons/bi';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js'; 

// Componentes Estruturais
import Header from '../../components/Header.jsx';
import RightSidebar from '../../components/RightSidebar.jsx';
import LeftSidebar from '../../components/LeftSidebar.jsx';

function ProgressoPage() {
    const navigate = useNavigate();

    // Estados para os dados dinâmicos do topo
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ total_badges: 0, total_pontos: 0 });

    const badgeConquistadoData = {
        name: "Script Initiate - Nível A",
        desc: "Automation & Deployment (CI/CD)",
        points: 10,
        dateConquered: "03/02/2025" 
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            
            // Vai buscar as métricas reais para manter o topo azul sempre atualizado
            api.get(`/dashboard/${userData.id_utilizador}`)
                .then(res => {
                    if (res.data) {
                        setStats({
                            total_badges: Number(res.data.total_badges || 0),
                            total_pontos: Number(res.data.total_pontos || 0)
                        });
                    }
                })
                .catch(err => console.error("Erro ao sincronizar métricas no progresso:", err));
        }
    }, []);

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <LeftSidebar />

                {/* Main Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    
                    {/* Welcome Card Dinâmico integrado */}
                    <Card className="border-0 mb-3" style={{ background: '#3b6fd4', borderRadius: 12 }}>
                        <Card.Body className="p-4 d-flex justify-content-between align-items-center text-white">
                            <div>
                                <h5 className="fw-semibold mb-3" style={{ textAlign: 'left' }}>
                                    Bom dia, {user?.nome_completo || "Utilizador"}!
                                </h5>
                                <div className="d-flex gap-2">
                                    {[
                                        { icon: <BiMedal size={25}/>, top: 'Badges', bottom: `Tem ${stats.total_badges} badges` },
                                        { icon: <BiStar size={25}/>, top: 'Pontos totais', bottom: `${stats.total_pontos} pontos` },
                                        { icon: <BiUserCircle size={25}/>, bottom: 'Lembretes', path: '/lembretes' }
                                    ].map((s, i) => {
                                        
                                        const CardContent = (
                                            <> 
                                                {s.icon} 
                                                <div>
                                                    {s.top && <div style={{ fontSize: 10, opacity: 0.8 }}>{s.top}</div>}
                                                    <div style={{ fontWeight: 600 }}>{s.bottom}</div> 
                                                </div> 
                                            </>
                                        );

                                        const cardStyle = { 
                                            background: 'rgba(255,255,255,0.2)', 
                                            borderRadius: 8, 
                                            padding: '6px 12px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 6, 
                                            fontSize: 12, 
                                            textAlign: 'left',
                                            color: 'inherit',
                                            textDecoration: 'none',
                                            cursor: s.path ? 'pointer' : 'default'
                                        };

                                        return s.path ? (
                                            <Link key={i} to={s.path} style={cardStyle}>{CardContent}</Link>
                                        ) : (
                                            <div key={i} style={cardStyle}>
                                                {CardContent}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BiUserCircle size={50} color="rgba(255,255,255,0.8)" />
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Botões de Navegação corrigidos */}
                    <div className="text-center mb-4 d-flex justify-content-center gap-2">
                        <Button onClick={() => navigate('/perfil')} variant="white" className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2" style={{ fontSize: 15, fontWeight: 600 }}>
                            <BiUserCircle size={20} /> Perfil
                        </Button>
                        <Button variant="white" className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2" style={{ fontSize: 15, fontWeight: 600 }}>
                            <BiBook size={20} /> Histórico de Badges
                        </Button>
                    </div>

                    <BadgeSection title="Progressos dos Badges">
                        <div style={{ display: 'flex', justifyContent: 'around', alignItems: 'center', padding: '20px 0' }}>
                            <BadgeCircleProgress label="Badges comuns" current={4} total={178} size={120} />
                            <BadgeCircleProgress label="Badges especiais" current={1} total={60} size={80} />
                        </div>
                    </BadgeSection>

                    <BadgeSection title="Progressos nas Learning Paths">
                        <LearningPathItem title="Application Operations" progress={50} />
                        <LearningPathItem title="Sourcing & Talent Management e Hybrid Cloud" progress={20} />
                    </BadgeSection>

                    <BadgeSection title="Ranking de Conquistas">
                        <BadgeCard
                            name={badgeConquistadoData.name}
                            desc={badgeConquistadoData.desc}
                            points={badgeConquistadoData.points}
                            dateConquered={badgeConquistadoData.dateConquered}
                        />
                        <BadgeCard
                            name={badgeConquistadoData.name}
                            desc={badgeConquistadoData.desc}
                            points={badgeConquistadoData.points}
                            dateConquered={badgeConquistadoData.dateConquered}
                        />
                    </BadgeSection>
                    
                </div>

                <RightSidebar />
            </div>
        </div>
    );
}

function BadgeSection({ title, sub, children }) {
    return (
        <div style={{ 
            background: '#F4F7FA', 
            border: '2px solid #39639C', 
            borderRadius: 16, 
            padding: '20px', 
            marginBottom: 20 
        }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{title}</div>
                    {sub && <div style={{ fontSize: 13, color: '#6b7280' }}>{sub}</div>}
                </div>
                <div style={{ fontSize: 13, color: '#39639C', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <BiMenu size={16} /> Ver Todos
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {children}
            </div>
        </div>
    );
}

function BadgeCard({ name, desc, points, progress, dateConquered }) {
    return (
        <div style={{ 
            background: 'white', 
            border: '1px solid #E2E8F0', 
            borderRadius: 12, 
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)' 
        }}>
            <div style={{ padding: '16px', display: 'flex', alignItems: 'start', gap: 20 }}>
                <div style={{
                    width: 60, height: 60, borderRadius: '50%', background: '#f3f6f9',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
                    border: '1px solid #e1e8ed'
                }}>
                    <span style={{ fontSize: 32 }}>🥇</span>
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: progress ? 8 : 0 }}>{desc}</div>
                    {progress && (
                        <>
                            <ProgressBar now={progress} style={{ height: 6 }} />
                            <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'right', marginTop: 2 }}>{progress}%</div>
                        </>
                    )}
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

function LearningPathItem({ title, progress }) {
    return (
        <div style={{ marginBottom: 15 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#4b5563', marginBottom: 4 }}>{title}</div>
            <ProgressBar now={progress} style={{ height: 10, borderRadius: 5 }} />
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{progress}% Service Lines Concluintes</div>
        </div>
    );
}

function BadgeCircleProgress({ label, current, total, size = 100 }) {
    const percentage = (current / total) * 100;
    return (
        <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: `conic-gradient(#39639C ${percentage}%, #e2e8f0 0)`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '0 auto 10px',
                position: 'relative'
            }}>
                <div style={{
                    width: '80%', height: '80%', backgroundColor: 'white', borderRadius: '50%',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    fontSize: 16, fontWeight: 700, color: '#111827'
                }}>
                    {current}/{total}
                </div>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</div>
        </div>
    );
}

export default ProgressoPage;