import { useState } from "react";
import { Container, Row, Col, ListGroup, Card, Button, ProgressBar, Navbar, Nav, Form, OverlayTrigger, Popover } from 'react-bootstrap';
import { BiFace, BiLoader, BiBook, BiBell, BiUserCircle, BiMedal, BiStar, BiNote, BiGrid, BiMenu, BiSearch } from 'react-icons/bi';
import logoImg from './assets/logo.png';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/header.jsx';
import RightSidebar from '../../components/right_sidebar.jsx';
import LeftSidebar from '../../components/left_sidebar.jsx';
import BadgeImage from "../../components/badge_image.jsx";

function ProgressoPage() {
    const navigate = useNavigate();

    const badgeConquistadoData = {
        name: "Script Initiate - Nível A",
        desc: "Automation & Deployment (CI/CD)",
        points: 10,
        dateConquered: "03/02/2025" // Adicione esta prop
    };

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Navbar */}
            <Header />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}

                <LeftSidebar />

                {/* Main Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    {/* Welcome Card */}
                    <Card className="border-0 mb-3" style={{ background: '#3b6fd4', borderRadius: 12 }}>
                        <Card.Body className="p-4 d-flex justify-content-between align-items-center text-white">
                            <div>
                                <h5 className="fw-semibold mb-3" style={{ textAlign: 'left' }}>Bom dia, Utilizador!</h5>
                                <div className="d-flex gap-2">
                                    {[
                                        { icon: <BiMedal size={25}/>, top: 'Badges', bottom: 'Tem 5 badges' },
                                        { icon: <BiStar size={25}/>, top: 'Pontos totais', bottom: '90 pontos' },
                                        { icon: <BiUserCircle size={25}/>, bottom: 'Lembretes', path: '/lembretes' }
                                    ].map((s, i) => {
                                        
                                        const CardContent = ( <> {s.icon} <div>{s.top && <div style={{ fontSize: 10, opacity: 0.8 }}>{s.top}</div>}
                                            <div style={{ fontWeight: 600 }}>{s.bottom}</div> </div> </>);

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

                                        return s.path ? ( <Link key={i} to={s.path} style={cardStyle}> {CardContent}</Link>) : (
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

                    {/* Catalog Button */}
                    <div className="text-center mb-4 d-flex justify-content-center gap-2">
                        <Button href='/perfil' variant="white" className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2" style={{ fontSize: 15, fontWeight: 600 }}>
                            <BiFace size={20} /> Perfil
                        </Button>
                        <Button variant="white" className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2" style={{ fontSize: 15, fontWeight: 600 }}>
                            <BiBook size={20} /> Histórico de Badges
                        </Button>
                    </div>

                    <BadgeSection title="Progressos dos Badges">
                        <div style={{ display: 'flex', justifyContent: 'around', alignItems: 'center', padding: '20px 0' }}>
                            <BadgeCircleProgress label="Badges comuns" current={4} total={178} size={120} />
                            <BadgeCircleProgress label="Badges especias" current={1} total={60} size={80} />
                        </div>
                    </BadgeSection>

                    <BadgeSection title="Progressos nas Learning Paths">
                        <LearningPathItem title="Application Operations" progress={50} />
                        <LearningPathItem title="Sourcing & Talent Management e Hybrid Cloud" progress={20} />
                    </BadgeSection>

                    <BadgeSection title="Ranquing de Conquistas">

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

                {/* Right Panel */}

                <RightSidebar />
                
            </div>
        </div>
    );
}

function BadgeSection({ title, sub, children }) {
    return (
        <div style={{ 
            background: '#F4F7FA', // Fundo levemente azulado como na imagem
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
            {/* Aqui entram os BadgeCards */}
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
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)' // Sombra leve para destacar do fundo cinza
        }}>
            <div style={{ padding: '16px', display: 'flex', alignItems: 'start', gap: 20 }}>
                {/* 1. Ícone do Badge dentro de um círculo */}
                <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: '#f3f6f9',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 0,
                    border: '1px solid #e1e8ed'
                }}>
                    <BadgeImage
                    badge={badge}
                    nome={nome}
                    size={72}
                    />
                </div>

                {/* 2. Textos do Badge (Título maior) */}
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

                {/* 3. Caixa de Pontos */}
                <div style={{ border: '1.5px solid #d1d5db', borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 64, flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#111827', marginBottom: 1 }}>Pontos</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1.1 }}>{points}</div>
                </div>
            </div>

            {/* 4. Rodapé do Card (Opcional, se a data existir) */}
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
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{progress}% Service Lines Concluidos</div>
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
                {/* Círculo interno branco para fazer o efeito de rosca */}
                <div style={{
                    width: '80%',
                    height: '80%',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#111827'
                }}>
                    {current}/{total}
                </div>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{label}</div>
        </div>
    );
}

export default ProgressoPage;