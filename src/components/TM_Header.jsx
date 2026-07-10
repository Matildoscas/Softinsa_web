import React, { useState, useEffect } from "react";
import { Navbar, Nav, Dropdown, OverlayTrigger } from 'react-bootstrap';
import { BiLogOut, BiUser, BiBell, BiUserCircle, BiCog, BiStar } from 'react-icons/bi'; // 🚀 Alterado BiSparkles para BiStar
import { useNavigate, Link, useLocation } from 'react-router-dom';
import NotificationPopover from './TM_Notificacions';
import logoImg from '../assets/logo.png';
import { buildUploadUrl } from '../services/api.js';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Carregar os dados do utilizador do localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Erro ao ler utilizador no Header:", error);
      }
    }
  }, []);

  // Função para Terminar Sessão
  const handleLogout = () => {
    localStorage.clear(); 
    navigate('/login');   
  };

  // Função para gerar uma saudação baseada nas horas
  const obterSaudacao = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return "Bom dia";
    if (hora >= 12 && hora < 20) return "Boa tarde";
    return "Boa noite";
  };

  // Obter apenas o primeiro nome
  const primeiroNome = user?.nome_completo ? user.nome_completo.split(" ")[0] : "Utilizador";

  // Determinar a rota do Logótipo
  const rotaDashboard = (location.pathname.startsWith('/tm') || location.pathname === '/talent_manager')
    ? '/tm'
    : '/';

  return (
    <div>
      <Navbar bg="white" className="border-bottom px-4 py-0" style={{ height: '60px' }}>
        
        {/* LOGÓTIPO */}
        <Navbar.Brand as={Link} to={rotaDashboard} style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logoImg} alt="Softinsa" style={{ height: '38px' }} />
        </Navbar.Brand>

        {/* MENSAGEM DE BOAS-VINDAS ELEGANTE */}
        <div style={{ 
          marginLeft: '32px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          {/* ✨ Ícone corrigido aqui para BiStar */}
          <BiStar size={18} color="#0d6efd" style={{ opacity: 0.8 }} />
          
          <span style={{ fontSize: '14px', color: '#495057', fontWeight: '500' }}>
            {obterSaudacao()}, <strong style={{ color: '#0d6efd' }}>{primeiroNome}</strong>!
          </span>
          <span style={{ 
            fontSize: '12px', 
            color: '#adb5bd', 
            marginLeft: '12px', 
            paddingLeft: '12px', 
            borderLeft: '1px solid #dee2e6',
            fontWeight: '400' 
          }}>
            Softinsa Academy Platform
          </span>
        </div>

        {/* ZONA DIREITA */}
        <Nav className="ms-auto align-items-center gap-3">
          
          {/* SINO DE NOTIFICAÇÕES */}
          <OverlayTrigger trigger="click" placement="bottom-end" rootClose overlay={<NotificationPopover />}>
            <div style={{ 
              width: 38, 
              height: 38, 
              borderRadius: '50%', 
              background: '#2563eb', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2563ebcc'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
            >
              <BiBell size={20} color="white" />
            </div>
          </OverlayTrigger>

          {/* MENU DROPDOWN */}
          <Dropdown align="end">
            <Dropdown.Toggle as="div" bsPrefix="p-0" style={{ cursor: 'pointer' }}>
              <div style={{ 
                width: 38, 
                height: 38, 
                borderRadius: '50%', 
                background: '#2563eb', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid #e9ecef'
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2563ebcc'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}>

                {user?.foto_perfil ? (
                  <img 
                    src={buildUploadUrl(user.foto_perfil)} 
                    alt="Perfil" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <BiUserCircle size={22} color="white" />
                )}
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow-sm border mt-2" style={{ borderRadius: '12px', fontSize: '14px', minWidth: '180px' }}>
              <Dropdown.Item onClick={() => navigate('/tm/perfil')} className="py-2 d-flex align-items-center gap-2">
                <BiUser size={18} color="#2563eb" /> O meu Perfil
              </Dropdown.Item>
              
              <Dropdown.Item onClick={() => navigate("/tm/definicoes")} className="py-2 d-flex align-items-center gap-2">
                <BiCog size={18} color="#2563eb" /> Definições de Conta
              </Dropdown.Item>
              
              <Dropdown.Divider />
              
              <Dropdown.Item onClick={handleLogout} className="py-2 d-flex align-items-center gap-2 text-danger fw-semibold">
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