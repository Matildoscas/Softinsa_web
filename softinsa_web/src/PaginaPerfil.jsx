import { useState } from "react";
import { Container, Row, Col, ListGroup, Card, Button, ProgressBar, Navbar, Nav, Form, OverlayTrigger, Popover } from 'react-bootstrap';
import { BiBell, BiUserCircle, BiMedal, BiStar, BiNote, BiGrid, BiMenu, BiSearch } from 'react-icons/bi';
import logoImg from './assets/logo.png';
import { useNavigate, Link } from 'react-router-dom';


function PaginaPerfil() {
    const navigate = useNavigate();

    const badgeConquistadoData = {
        name: "Script Initiate - Nível A",
        desc: "Automation & Deployment (CI/CD)",
        points: 10,
        dateConquered: "03/02/2025" // Adicione esta prop
    };

    const notificationsPopover = (
        <Popover id="popover-notifications" style={{ width: '320px', maxWidth: 'none', borderRadius: '12px' }}>
            <Popover.Body className="p-1">
            <ListGroup variant="flush">
                <ListGroup.Item className="py-3 border-bottom">
                <div className="d-flex align-items-start gap-2">
                    <div className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 50, height: 50 }}>
                    <BiUserCircle size={40} color="#6c757d" />
                    </div>
                    <div>
                    <h6 className="mb-0 fw-bold">Atualizou o perfil de acesso</h6>
                    <small className="text-muted d-block mb-1">Ana Maria • 59 minutos atrás</small>
                    <p className="small mb-0 text-secondary">Lorem ipsum is simply dummy text...</p>
                    </div>
                </div>
                </ListGroup.Item>
                <ListGroup.Item className="py-3 border-bottom">
                <div className="d-flex align-items-start gap-2">
                    <div className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 50, height: 50 }}>
                    <span style={{ color: '#28a745', fontSize: '30px' }}>✓</span>
                    </div>
                    <div>
                    <h6 className="mb-0 fw-bold">Recebeu um novo Badge</h6>
                    <small className="text-muted d-block mb-1">System • 12 horas atrás</small>
                    </div>
                </div>
                </ListGroup.Item>
                <ListGroup.Item className="py-3 border-bottom">
                <div className="d-flex align-items-start gap-2">
                    <div className="rounded-circle bg-success-subtle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 50, height: 50 }}>
                    <span style={{ color: '#28a745', fontSize: '30px' }}>✓</span>
                    </div>
                    <div>
                    <h6 className="mb-0 fw-bold">Recebeu um novo Badge</h6>
                    <small className="text-muted d-block mb-1">System • 12 horas atrás</small>
                    </div>
                </div>
                </ListGroup.Item>
                <ListGroup.Item className="text-center py-2">
                <a href="/notificacoes" className="text-decoration-none small fw-bold" style={{ color: '#0056b3' }}>
                    Ver todas as notificações
                </a>
                </ListGroup.Item>
            </ListGroup>
            </Popover.Body>
        </Popover>
    );

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Navbar */}
            <Navbar bg="white" className="border-bottom px-4 py-0" style={{ height: '52px' }}>
                <Navbar.Brand as={Link} to="/">
                    <img src={logoImg} alt="Softinsa" style={{ height: '40px' }} />
                </Navbar.Brand>

                <div style={{ position: 'relative', marginLeft: '3.7%' }}>
                    <BiSearch
                        size={20}
                        style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af',
                            pointerEvents: 'none'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        style={{
                            paddingLeft: '32px',
                            paddingRight: '12px',
                            height: '34px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '10px',
                            fontSize: '14px',
                            width: '600px',
                            outline: 'none',
                            color: '#374151',
                            background: '#f9fafb'
                        }}
                        onFocus={e => e.target.style.borderColor = '#2563eb'}
                        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                </div>

                <Nav className="ms-auto align-items-center gap-2">
                    <OverlayTrigger
                        trigger="click"
                        placement="bottom-end"
                        rootClose
                        overlay={notificationsPopover}
                    >
                        <div style={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: '50%', 
                        background: '#2563eb', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer',
                        position: 'relative' 
                        }}>
                        <BiBell size={18} color="white" />
                        </div>
                    </OverlayTrigger>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <BiUserCircle size={20} color="white" />
                    </div>
                </Nav>
            </Navbar>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <div style={{ width: 250, background: 'white', borderRight: '1px solid #e5e7eb', padding: '10px 0', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px 14px' }}>
                        <BiUserCircle size={28} color="#6b7280" />
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Consultor</span>
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#9ca3af', padding: '0 16px 6px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign:'left' }}>Pages</div>

                    <ListGroup variant="flush">
                        <ListGroup.Item action className="border-0 d-flex align-items-center gap-2" href="/" style={{ fontSize: 13 }}>
                            <BiGrid size={16} /> Página Principal
                        </ListGroup.Item>
                        <ListGroup.Item action active className="border-0 d-flex align-items-center gap-2"  href="/perfil" style={{ fontSize: 13, borderRight: '3px solid #2563eb', background: '#eff6ff', color: '#2563eb' }}>
                            <BiGrid size={16} /> Perfil do Consultor
                        </ListGroup.Item>
                        <div style={{ paddingLeft: 16 }}>
                            {['Catálogo de Badges','Badges Conquistados','Badges Especiais','Badges Comuns','Progresso dos Badges','Status dos Badges'].map(item => (
                                <ListGroup.Item key={item} action className="border-0" style={{ fontSize: 12, color: '#6b7280', padding: '5px 16px' }}>{item}</ListGroup.Item>
                            ))}
                        </div>
                    </ListGroup>
                </div>

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
                        <Button variant="white" className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2" style={{ fontSize: 15, fontWeight: 600 }}>
                            <BiGrid size={20} /> Catálogo de Badges
                        </Button>
                        <Button variant="white" className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2" style={{ fontSize: 15, fontWeight: 600 }}>
                            <BiGrid size={20} /> Catálogo de Badges
                        </Button>
                    </div>

                    <BadgeSection title="Os seus Badges" sub="O nosso sistema recomenda:">

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
                <div style={{ width: 250, background: 'white', borderLeft: '1px solid #e5e7eb', padding: 16, flexShrink: 0, overflowY: 'auto', textAlign:'left'}}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', marginBottom: 12 }}>Notificações</div>
                    {[
                        { text: 'Atualizou o perfil de acesso', time: '59 minutos atrás' },
                        { text: 'Recebeu um novo Badge', time: '12 horas atrás' },
                        { text: 'O seu Badge foi validado pelo Ser...', time: '12 horas atrás' },
                    ].map((n, i) => (
                        <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', marginBottom: 8, display: 'flex', gap: 8 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <BiBell size={12} color="#2563eb" />
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{n.text}</div>
                                <div style={{ fontSize: 11, color: '#9ca3af' }}>{n.time}</div>
                            </div>
                        </div>
                    ))}
                    <div style={{ textAlign: 'right' }}>
                        <a href="/notificacoes" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>Ver todas as notificações</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BadgeSection({ title, sub, children }) {
    return (
        <div className="mb-3">
            <div className="d-flex justify-content-between align-items-start mb-1">
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{title}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{sub}</div>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <BiMenu size={14} /> Ver Todos
                </div>
            </div>
            {children}
        </div>
    );
}

// Componente de card ATUALIZADO para se parecer com a image_1.png
function BadgeCard({ name, desc, points, progress, dateConquered }) {
    return (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
            {/* Seção principal do card */}
            <div style={{ padding: '16px', display: 'flex', alignItems: 'start', gap: 20 }}>
                {/* 1. Ícone do Badge dentro de um círculo */}
                <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: '#f3f6f9', // Cor de fundo do círculo da image_1.png
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexShrink: 0,
                    border: '1px solid #e1e8ed' // Borda leve para o círculo
                }}>
                    <span style={{ fontSize: 32 }}>🥇</span>
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

export default PaginaPerfil;