import React, { useState, useEffect } from "react";
import { Dropdown, Modal, Nav, Navbar, OverlayTrigger, Button } from "react-bootstrap";
import { BiBell, BiCog, BiLogOut, BiSearch, BiUser, BiUserCircle, BiStar } from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";

import useNotificacoesRealtime from "../hooks/useNotificacoesRealtime.js";
import NotificationPopover from "./NotificacoesPop.jsx"; // Ajustado para o nome da V2 do teu colega
import logoImg from "../assets/logo.png";
import { buildUploadUrl } from "../services/api.js";
import { limparUtilizadorAnalytics } from "../services/firebaseAnalytics";
import MobileMenuButton from "./MobileMenuButton.jsx";

// Função auxiliar para carregar o utilizador de forma segura
function obterUtilizadorGuardado() {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser);
  } catch (err) {
    console.error("Erro ao ler utilizador:", err);
    return null;
  }
}

// Rotas unificadas (mantendo as rotas que o teu colega padronizou para a app)
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
    return { inicio: "/admin", perfil: "/admin/perfil", definicoes: "/admin/definicoes", notificacoes: "/admin/notificacoespage" };
  }
  return { inicio: "/pag_consultor", perfil: "/perfil_consultor", definicoes: "/definicoes", notificacoes: "/notificacoes" };
}

function Header() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // 💡 Otimização: useState com função inicializadora executa o localStorage APENAS UMA VEZ no mount
  const [user, setUser] = useState(() => obterUtilizadorGuardado());

  const userId = user?.id_utilizador || user?.ID_UTILIZADOR || user?.id || null;
  const { totalNaoLidas } = useNotificacoesRealtime(userId);
  const rotas = obterRotasUtilizador(user);

  // Validação de cargos para exibir o botão do menu lateral responsivo
  const tipoUtilizador = String(user?.tipo_utilizador || user?.TIPO_UTILIZADOR || user?.cargo || user?.CARGO || "").trim().toLowerCase();
  const mostrarMenuLateral = ["admin", "administrador", "consultor", "service", "sll", "talent", "tm"].some(role => tipoUtilizador.includes(role));

  const handleLogout = async () => {
    try {
      await limparUtilizadorAnalytics();
    } catch (err) {
      console.error("Erro ao limpar analytics:", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const obterSaudacao = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return "Bom dia";
    if (hora >= 12 && hora < 20) return "Boa tarde";
    return "Boa noite";
  };

  const primeiroNome = user?.nome_completo ? user.nome_completo.split(" ")[0] : "Utilizador";

  return (
    <header className="app-header" style={headerStyle}>
      {/* Botão de Menu Mobile do teu colega */}
      {mostrarMenuLateral && <MobileMenuButton />}

      {/* Logótipo */}
      <Navbar.Brand as={Link} to={rotas.inicio} className="app-header-logo">
        <img src={logoImg} alt="Softinsa" style={{ height: "40px" }} />
      </Navbar.Brand>

      {/* Mensagem de Boas-Vindas (Esconde em ecrãs muito pequenos via CSS da classe se necessário, ou fica inline) */}
      <div className="d-none d-md-flex align-items-center gap-2 ms-3" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <BiStar size={18} color="#0d6efd" style={{ opacity: 0.8 }} />
        <span style={{ fontSize: '14px', color: '#495057', fontWeight: '500' }}>
          {obterSaudacao()}, <strong style={{ color: '#0d6efd' }}>{primeiroNome}</strong>!
        </span>
      </div>

      {/* Barra de Pesquisa */}
      <div className="app-header-search" style={searchContainer}>
        <BiSearch size={20} style={searchIcon} />
        <input
          type="text"
          placeholder="Pesquisar..."
          style={searchInput}
          onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
        />
      </div>

      {/* Ações da Direita */}
      <Nav className="app-header-actions ms-auto align-items-center gap-2">
        
        {/* Notificações */}
        <OverlayTrigger
          trigger="click"
          placement="bottom-end"
          rootClose
          overlay={<NotificationPopover rotaNotificacoes={rotas.notificacoes} />}
        >
          <button type="button" style={notificationButton} aria-label={`Notificações: ${totalNaoLidas} não lidas`}>
            <BiBell size={18} color="white" />
            {totalNaoLidas > 0 && (
              <span style={notificationBadge}>
                {totalNaoLidas > 99 ? "99+" : totalNaoLidas}
              </span>
            )}
          </button>
        </OverlayTrigger>

        {/* Menu Dropdown com Foto de Perfil Dinâmica Reintroduzida */}
        <Dropdown align="end">
          <Dropdown.Toggle as="div" bsPrefix="p-0" style={{ cursor: "pointer" }}>
            <div style={profileCircle}>
              {user?.foto_perfil ? (
                <img 
                  src={buildUploadUrl(user.foto_perfil)} 
                  alt="Perfil" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <BiUserCircle size={20} color="white" />
              )}
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu className="shadow border-0 mt-2" style={{ borderRadius: "12px", fontSize: "14px" }}>
            <Dropdown.Item onClick={() => navigate(rotas.perfil)} className="py-2 d-flex align-items-center gap-2">
              <BiUser size={18} color="#2563eb" /> O meu Perfil
            </Dropdown.Item>

            <Dropdown.Item onClick={() => navigate(rotas.definicoes)} className="py-2 d-flex align-items-center gap-2">
              <BiCog size={18} color="#2563eb" /> Definições de Conta
            </Dropdown.Item>

            <Dropdown.Divider />

            <Dropdown.Item onClick={() => setShowLogoutModal(true)} className="py-2 d-flex align-items-center gap-2 text-danger fw-semibold">
              <BiLogOut size={18} /> Terminar Sessão
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Nav>

      {/* Modal de Confirmação de Logout */}
      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>Tens a certeza que queres terminar a sessão?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleLogout}>Terminar Sessão</Button>
        </Modal.Footer>
      </Modal>
    </header>
  );
}

// --- ESTILOS INTEGRAIS (V2 do Colega) ---
const notificationBadge = {
  position: "absolute",
  top: -5,
  right: -6,
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

const searchContainer = { position: "relative", marginLeft: "3.7%" };
const searchIcon = { position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" };

const searchInput = {
  paddingLeft: "32px",
  paddingRight: "12px",
  height: "34px",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  fontSize: "14px",
  width: "100%",       // 💡 Alterado de 600px para 100% para evitar que quebre o layout em ecrãs pequenos
  maxWidth: "600px",   // Mantém o limite visual dele mas aceita encolher em mobile
  outline: "none",
  color: "#374151",
  background: "#f9fafb",
};

const notificationButton = { width: 36, height: 36, border: "none", borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", padding: 0 };
const profileCircle = { width: 36, height: 36, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" };
const headerStyle = { width: "100%", height: 52, flexShrink: 0, background: "white", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 24px", position: "relative" };

export default Header;