import { useState } from "react";
import { Container, Row, Col, ListGroup, Card, Button, ProgressBar, Dropdown, Navbar, Nav, Form, OverlayTrigger, Popover } from 'react-bootstrap';
import { BiLogOut, BiUser, BiBell, BiUserCircle, BiMedal, BiStar, BiNote, BiGrid, BiMenu, BiSearch, BiCog } from 'react-icons/bi';
import { useNavigate, Link } from 'react-router-dom';
import NotificationPopover from './NotificacoesPop';
import logoImg from '../assets/logo.png';

function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear(); // Limpa token e dados do utilizador [cite: 3]
    navigate('/login');   // Redireciona para o Login [cite: 3]
  };

  return (
    <div >
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
                    <OverlayTrigger trigger="click" placement="bottom-end" rootClose overlay={<NotificationPopover />}>
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

                    <Dropdown align="end">
                    <Dropdown.Toggle as="div" bsPrefix="p-0" style={{ cursor: 'pointer' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BiUserCircle size={20} color="white" />
                        </div>
                    </Dropdown.Toggle>

                    <Dropdown.Menu className="shadow border-0 mt-2" style={{ borderRadius: '12px', fontSize: '14px' }}>
                        <Dropdown.Item onClick={() => navigate('/perfil')} className="py-2 d-flex align-items-center gap-2">
                        <BiUser size={18} /> O meu Perfil
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={() => navigate("/definicoes")} className="py-2 d-flex align-items-center gap-2">
                        <BiCog size={18} /> Definições de Conta
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={handleLogout} className="py-2 d-flex align-items-center gap-2 text-danger">
                        <BiLogOut size={18} /> Terminar Sessão
                        </Dropdown.Item>
                    </Dropdown.Menu>
                    </Dropdown>
                </Nav>
            </Navbar>
        </div>
  );
}

export default Header;