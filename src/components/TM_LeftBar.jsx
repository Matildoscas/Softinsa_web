import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { buildUploadUrl } from "../services/api.js";
import {
  BiGrid,
  BiBadge,
  BiUser,
  BiUserCircle,
  BiChevronRight,
  BiCertification
} from "react-icons/bi";

function LeftSidebarTM() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Estados de controlo dos menus (Versão 2)
  const [badgesAberto, setBadgesAberto] = useState(true);
  const [certificadosAberto, setCertificadosAberto] = useState(true);
  const [consultoresAberto, setConsultoresAberto] = useState(
    location.pathname.startsWith("/tm/consultores")
  );

  const handleBadgesToggle = () => {
  // 1. Alterna o estado para abrir/fechar o submenu
  setBadgesAberto((prev) => !prev);
  
  // 2. Força a navegação para a página principal dos badges
  navigate('/tm/badges');
};

  // 1. Carregar dados dinâmicos do utilizador (Versão 1)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Erro ao ler dados do utilizador na Sidebar:", error);
      }
    }
  }, []);

  // 2. Auto-expandir os grupos com base na rota atual (Versão 2)
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    
    if (
      path.startsWith("/tm/solicitacoes") ||
      path.startsWith("/tm/status-candidaturas") ||
      path.startsWith("/tm/expiracao") ||
      path.startsWith("/tm/relatorios")
    ) {
      setBadgesAberto(true);
    }

    if (path.startsWith("/tm/certificados") || path.startsWith("/tm/historico")) {
      setCertificadosAberto(true);
    }

    if (path.startsWith("/tm/consultores") || path.startsWith("/tm/desafios")) {
      setConsultoresAberto(true);
    }
  }, [location.pathname]);

  return (
    <aside style={sidebarStyle}>
      {/* Bloco Superior: Perfil + Navegação */}
      <div>
        {/* Bloco de Perfil Dinâmico (Versão 1) */}
        <div style={profileBoxStyle}>
          <div style={avatarWrapperStyle}>
            {user?.foto_perfil ? (
              <img
                src={buildUploadUrl(user.foto_perfil)}
                alt="Foto de perfil"
                style={avatarImageStyle}
              />
            ) : (
              <BiUserCircle size={26} color="#495057" />
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={profileNameStyle}>
              {user?.nome_completo || "Talent Manager"}
            </span>
            <span style={profileRoleStyle}>Talent Manager</span>
          </div>
        </div>

        {/* Separador de Secção */}
        <div style={sectionTitleStyle}>Pages</div>

        {/* Links de Navegação (Menu da Versão 2) */}
        <nav>
          <MainLink
            to="/tm"
            icon={<BiGrid size={16} />}
            label="Página Inicial"
            end
          />

          <MenuGroup
            label="Badges"
            icon={<BiBadge size={16} />}
            to="/tm/badges"
            aberto={badgesAberto}
            onToggle={() => setBadgesAberto((prev) => !prev)}
          >
            <SubLink to="/tm/badges" label="Catalogo de badges" />
            <SubLink to="/tm/solicitacoes" label="Solicitações de badges" />
            <SubLink to="/tm/status-candidaturas" label="Status de candidaturas" />
            <SubLink to="/tm/expiracao" label="Badges em expiração" />
            <SubLink to="/tm/relatorios" label="Relatórios" />
          </MenuGroup>

          <MenuGroup
            label="Certificados"
            icon={<BiCertification size={16} />}
            aberto={certificadosAberto}
            onToggle={() => setCertificadosAberto((prev) => !prev)}
          >
            <SubLink to="/tm/certificados" label="Gerar certificado" />
            <SubLink to="/tm/historico" label="Histórico de candidaturas" />
          </MenuGroup>

          <MenuGroup
            label="Consultores"
            icon={<BiUser size={16} />}
            aberto={consultoresAberto}
            onToggle={() => setConsultoresAberto((prev) => !prev)}
          >
            <SubLink to="/tm/consultores" label="Lista de consultores" />
            <SubLink to="/tm/desafios/novo" label="Desafios e lembretes" />
          </MenuGroup>
        </nav>
      </div>

      {/* Bloco Inferior: Logotipo Softinsa (Versão 1) */}
      <div style={logoContainerStyle}>
        <div style={logoBoxStyle}>
          <span style={logoTextStyle}>
            SOFT<span style={{ color: "#06b6d4" }}>I</span>NSA
          </span>
        </div>
      </div>
    </aside>
  );
}

/* =========================================================
    SUB-COMPONENTES AUXILIARES
========================================================= */

function MainLink({ to, icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        ...mainLinkStyle,
        border: isActive ? "1px solid #dee2e6" : "1px solid transparent",
        borderRadius: isActive ? "9px" : "0px",
        background: isActive ? "#e9ecef" : "transparent",
        fontWeight: isActive ? "600" : "400",
        color: isActive ? "#0d6efd" : "#111827",
      })}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function MenuGroup({ label, icon, aberto, onToggle, children }) {
  return (
    <div style={grupoStyle}>
      <div style={groupHeaderStyle}>
        <button
          type="button"
          onClick={onToggle}
          style={toggleButtonStyle}
          aria-label={aberto ? `Fechar ${label}` : `Abrir ${label}`}
        >
          <BiChevronRight
            size={14}
            style={{
              color: "#9ca3af",
              transform: aberto ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
            }}
          />
        </button>

        <div style={groupLabelStyle}>
          {icon}
          <span>{label}</span>
        </div>
      </div>

      {aberto && <div style={submenuStyle}>{children}</div>}
    </div>
  );
}

function SubLink({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...subLinkStyle,
        color: isActive ? "#2563eb" : "#495057",
        fontWeight: isActive ? "600" : "400",
        background: isActive ? "#eff6ff" : "transparent",
        borderRadius: isActive ? "8px" : "0px",
      })}
    >
      {label}
    </NavLink>
  );
}

/* =========================================================
    ESTILOS UNIFICADOS
========================================================= */

const sidebarStyle = {
  width: "260px",
  backgroundColor: "#f8f9fa",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: "24px 16px",
  borderRight: "1px solid #e9ecef",
  fontFamily: "system-ui, sans-serif",
  flexShrink: 0,
  boxSizing: "border-box",
};

const profileBoxStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "32px",
  paddingLeft: "8px",
};

const avatarWrapperStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "50%",
  backgroundColor: "#dee2e6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  border: "1px solid #dee2e6",
};

const avatarImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const profileNameStyle = {
  fontWeight: "600",
  fontSize: "14px",
  color: "#212529",
  lineHeight: "1.2",
};

const profileRoleStyle = {
  fontSize: "11px",
  color: "#6c757d",
};

const sectionTitleStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#adb5bd",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "12px",
  paddingLeft: "14px",
};

const mainLinkStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  margin: "0 4px 8px",
  padding: "8px 12px",
  fontSize: "13px",
  color: "#111827",
  textDecoration: "none",
  transition: "all 0.2s ease",
};

const grupoStyle = {
  marginBottom: "8px",
};

const groupHeaderStyle = {
  display: "flex",
  alignItems: "center",
  padding: "0 4px",
};

const toggleButtonStyle = {
  width: "26px",
  height: "34px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

const groupLabelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#111827",
  fontSize: "13px",
};

const submenuStyle = {
  padding: "2px 0 4px",
};

const subLinkStyle = {
  display: "block",
  padding: "8px 16px 8px 38px",
  margin: "2px 4px",
  fontSize: "13px",
  textDecoration: "none",
  transition: "all 0.15s ease",
};

const logoContainerStyle = {
  display: "flex",
  justifyContent: "center",
  paddingBottom: "8px",
  marginTop: "32px",
};

const logoBoxStyle = {
  backgroundColor: "#ffffff",
  padding: "8px 24px",
  borderRadius: "4px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const logoTextStyle = {
  fontWeight: "bold",
  color: "#1d4ed8",
  fontSize: "16px",
  letterSpacing: "0.5px",
};

export default LeftSidebarTM;