import React, { useState, useEffect } from "react";
import { Navbar, Nav, Dropdown, OverlayTrigger, Modal, Button } from 'react-bootstrap';
import { BiLogOut, BiUser, BiBell, BiUserCircle, BiCog, BiStar, BiMenu, BiX } from 'react-icons/bi'; // 🚀 Alterado BiSparkles para BiStar
import { useNavigate, Link, useLocation } from 'react-router-dom';
import NotificationPopover from './TM_Notificacions'; // Mantido o import da V1
import logoImg from '../assets/logo.png';
import { buildUploadUrl } from '../services/api.js';
import useNotificacoesRealtime from "../hooks/useNotificacoesRealtime.js"; // Novo import da V2
import { limparUtilizadorAnalytics } from "../services/firebaseAnalytics"; // Opcional/Recomendado da V2

// Função auxiliar da V2 para mapear rotas com base no cargo do utilizador
function obterRotasUtilizador(user) {
  const tipo = String(
    user?.tipo_utilizador || user?.TIPO_UTILIZADOR || user?.cargo || user?.CARGO || ""
  ).trim().toLowerCase();

  const isTm = tipo.includes("talent manager") || tipo.includes("talentmanager") || tipo.includes("talent_manager") || tipo === "tm";
  const isSll = tipo.includes("service line leader") || tipo.includes("servicelineleader") || tipo.includes("service_line_leader") || tipo === "sll";
  const isAdmin = tipo.includes("admin") || tipo.includes("administrador");

  if (isTm) {
    return { inicio: "/tm", perfil: "/tm/perfil", definicoes: "/tm/definicoes", notificacoes: "/tm/notificacoes" };
  }
  if (isSll) {
    return { inicio: "/sll", perfil: "/sll/perfil", definicoes: "/sll/definicoes", notificacoes: "/sll/notificacoes" };
  }
  if (isAdmin) {
    return { inicio: "/admin", perfil: "/admin", definicoes: "/admin", notificacoes: "/admin/notificacoes" };
  }
  return { inicio: "/pag_consultor", perfil: "/perfil_consultor", definicoes: "/definicoes", notificacoes: "/notificacoes" };
}

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Carregar os dados do utilizador do localStorage (Mantido da V1)
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

  // Configuração das Notificações em Tempo Real (V2)
  const userId = user?.id_utilizador || user?.ID_UTILIZADOR || user?.id || null;
  const { totalNaoLidas } = useNotificacoesRealtime(userId);
  const rotas = obterRotasUtilizador(user);

  useEffect(() => {
    document.body.classList.toggle("mobile-sidebar-open", mobileMenuOpen);

    return () => {
      document.body.classList.remove("mobile-sidebar-open");
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Função para Terminar Sessão melhorada com limpeza de Analytics da V2
  const handleLogout = async () => {
    try {
      await limparUtilizadorAnalytics();
    } catch (err) {
      console.error("Erro ao limpar analytics:", err);
    }
    localStorage.clear(); 
    navigate('/login', { replace: true });   
  };

  const abrirModalLogout = () => {
    setShowLogoutModal(true);
  };

  const fecharModalLogout = () => {
    setShowLogoutModal(false);
  };

  const confirmarLogout = () => {
    setShowLogoutModal(false);
    handleLogout();
  };

  const alternarMenuMobile = () => {
    setMobileMenuOpen((aberto) => !aberto);
  };

  const fecharMenuMobile = () => {
    setMobileMenuOpen(false);
  };

  // Função para gerar uma saudação baseada nas horas
  const obterSaudacao = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return "Bom dia";
    if (hora >= 12 && hora < 20) return "Boa tarde";
    return "Boa noite";
  };

  // Obter apenas o primeiro nome (Mantido da V1)
  const primeiroNome = user?.nome_completo ? user.nome_completo.split(" ")[0] : "Utilizador";

  // Determinar a rota do Logótipo (Mantido da V1)
  const rotaDashboard = (location.pathname.startsWith('/tm') || location.pathname === '/talent_manager')
    ? '/tm'
    : '/';

  return (
    <div>
      <div className="app-mobile-overlay" onClick={fecharMenuMobile} aria-hidden="true" />

      <Navbar bg="white" className="app-topbar border-bottom px-4 py-0" style={{ height: '60px' }}>
        <button
          type="button"
          className="app-menu-toggle"
          aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          onClick={alternarMenuMobile}
        >
          {mobileMenuOpen ? <BiX size={18} /> : <BiMenu size={18} />}
        </button>
        
        {/* LOGÓTIPO */}
        <Navbar.Brand as={Link} to={rotaDashboard} style={{ display: 'flex', alignItems: 'center' }} onClick={fecharMenuMobile}>
          <img src={logoImg} alt="Softinsa" style={{ height: '38px' }} />
        </Navbar.Brand>

        {/* MENSAGEM DE BOAS-VINDAS ELEGANTE */}
        <div className="app-topbar-search" style={{ 
          marginLeft: '32px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontFamily: 'system-ui, sans-serif'
        }}>
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
        <Nav className="app-topbar-actions ms-auto align-items-center gap-3">
          
          {/* SINO DE NOTIFICAÇÕES COM BADGE REALTIME */}
          <OverlayTrigger 
            trigger="click" 
            placement="bottom-end" 
            rootClose 
            overlay={<NotificationPopover rotaNotificacoes={rotas.notificacoes} />}
          >
            <button
              type="button"
              style={{ 
                width: 38, 
                height: 38, 
                borderRadius: '50%', 
                background: '#2563eb', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                border: 'none',
                position: 'relative',
                padding: 0,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2563ebcc'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
              aria-label={`Notificações: ${totalNaoLidas} não lidas`}
            >
              <BiBell size={20} color="white" />

              {/* Contador Vermelho Dinâmico */}
              {totalNaoLidas > 0 && (
                <span style={notificationBadgeStyle}>
                  {totalNaoLidas > 99 ? "99+" : totalNaoLidas}
                </span>
              )}
            </button>
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
              <Dropdown.Item onClick={() => navigate(rotas.perfil)} className="py-2 d-flex align-items-center gap-2">
                <BiUser size={18} color="#2563eb" /> O meu Perfil
              </Dropdown.Item>
              
              <Dropdown.Item onClick={() => navigate(rotas.definicoes)} className="py-2 d-flex align-items-center gap-2">
                <BiCog size={18} color="#2563eb" /> Definições de Conta
              </Dropdown.Item>
              
              <Dropdown.Divider />
              
              <Dropdown.Item onClick={abrirModalLogout} className="py-2 d-flex align-items-center gap-2 text-danger fw-semibold">
                <BiLogOut size={18} /> Terminar Sessão
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

        </Nav>
      </Navbar>

      <Modal show={showLogoutModal} onHide={fecharModalLogout} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar logout</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Tens a certeza que queres terminar a sessão?
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={fecharModalLogout}>
            Cancelar
          </Button>

          <Button variant="danger" onClick={confirmarLogout}>
            Terminar Sessão
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

// Estilo do Badge de Notificações
const notificationBadgeStyle = {
  position: "absolute",
  top: -2,
  right: -2,
  minWidth: 18,
  height: 18,
  padding: "0 5px",
  borderRadius: 999,
  background: "#dc2626",
  color: "white",
  border: "2px solid white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 9,
  fontWeight: 700,
  lineHeight: 1,
};

export default Header;