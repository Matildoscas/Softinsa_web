import { useState } from "react";
import { Container, Row, Col, ListGroup, Card, Button, ProgressBar, Navbar, Nav, Form, OverlayTrigger, Popover } from 'react-bootstrap';
import { BiBell, BiUserCircle, BiMedal, BiStar, BiNote, BiGrid, BiMenu, BiSearch } from 'react-icons/bi';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import logoImg from './assets/logo.png';
import { useNavigate, Link } from 'react-router-dom';

function LembretePage() {
    const navigate = useNavigate();

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
                <Navbar.Brand href="PaginaPrincipal">
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
                        <ListGroup.Item action active className="border-0 d-flex align-items-center gap-2" href="/" style={{ fontSize: 13, borderRight: '3px solid #2563eb', background: '#eff6ff', color: '#2563eb' }}>
                            <BiGrid size={16} /> Página Principal
                        </ListGroup.Item>
                        <ListGroup.Item action className="border-0 d-flex align-items-center gap-2" style={{ fontSize: 13 }}>
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
                <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
                    <Button 
                        variant="link" 
                        className="d-flex align-items-center text-decoration-none p-0"
                        style={{ color: '#4A5568', fontSize: '1.1rem' }}
                        onClick={() => navigate('/')}
                        >
                        <HiOutlineArrowLeft className="me-1" />
                        <span style={{ fontWeight: '400' }}>Voltar</span>
                    </Button>

                    <LembreteSection>
                        <LembreteCard name="Ana Maria" title="Atualizou o perfil de acesso" desc="Automation & Deployment (CI/CD)" meta="Script Initiate · Nível A" time="35 minutos atrás" />
                    </LembreteSection>
                </div>

                {/* Right Panel */}
                <div style={{ width: 250, background: 'white', borderLeft: '1px solid #e5e7eb', padding: 16, flexShrink: 0, overflowY: 'auto', textAlign:'left'}}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', marginBottom: 12 }}>Os meus Badges</div>
                    
                    <BadgeSection>
                        <BadgeCard name="Script Initiate - Nível A" desc="Automation & Deployment (CI/CD)" points={10} />
                    </BadgeSection>

                    <BadgeSection>
                        <BadgeCard name="Script Initiate - Nível A" desc="Automation & Deployment (CI/CD)" points={10} />
                    </BadgeSection>

                    <BadgeSection>
                        <BadgeCard name="Script Initiate - Nível A" desc="Automation & Deployment (CI/CD)" points={10} />
                    </BadgeSection>

                    <div style={{ textAlign: 'right' }}>
                        <a href="#" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>Ver todos os meus badges</a>
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
            </div>
            {children}
        </div>
    );
}

function BadgeCard({ name, points }) {
    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            background: 'white', 
            border: '1px solid #e5e7eb', 
            borderRadius: 20, 
            padding: '24px 0 16px 0', 
            width: '100%', 
            maxWidth: 350,
            textAlign: 'center'
        }}>
            {/* Círculo de fundo da medalha */}
            <div style={{ 
                width: 90, 
                height: 90, 
                backgroundColor: '#f0f7ff', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: 35,
                marginBottom: 10,
                marginTop: -10
            }}>
                🥇
            </div>

            {/* Linha Divisória */}
            <div style={{ width: '100%', height: '1px', backgroundColor: '#f3f4f6', marginBottom: 6 }} />

            {/* Conteúdo de Texto */}
            <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                    {name}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1, marginBottom: 0 }}>
                    {points} Pontos
                </div>
            </div>
        </div>
    );
}

function LembreteCard({ name, title, desc, meta, time }) {
  return (
    <div className="d-flex bg-white border rounded px-4 py-3 mb-2 gap-3" style={{ alignItems: "stretch" }}>

      {/* Esquerda: Avatar + meta + tempo */}
      <div className="d-flex flex-column align-items-center gap-1" style={{ minWidth: 80 }}>
        <div
          className="rounded-circle bg-secondary-subtle d-flex align-items-center justify-content-center"
          style={{ width: 44, height: 44 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="#8a96a8" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        </div>
        <span className="text-muted text-center" style={{ fontSize: "0.72rem", lineHeight: 1.4 }}>{meta}</span>
        <span className="text-secondary text-center" style={{ fontSize: "0.70rem" }}>{time}</span>
      </div>

      {/* Divisor vertical */}
      <div className="border-start" />

      {/* Centro: Título + Descrição */}
      <div className="flex-grow-1 d-flex flex-column justify-content-center">
        <div className="fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>{title}</div>
        <div className="text-muted" style={{ fontSize: "0.82rem" }}>{desc}</div>
      </div>

      {/* Abrir alinhado em baixo */}
      <div className="d-flex align-items-end">
        <a href="#" className="text-primary small text-decoration-none">Abrir</a>
      </div>

    </div>
  );
}

function LembreteSection({ children }) {
  return <div>{children}</div>;
}

export default LembretePage;