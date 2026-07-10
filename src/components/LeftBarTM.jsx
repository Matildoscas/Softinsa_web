import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { buildUploadUrl } from "../services/api.js";
import {
  BiGrid,
  BiBadge,
  BiHistory,
  BiUser,
  BiUserCircle,
  BiChevronRight,
  BiCertification,
  BiFileBlank,
  BiAlarmExclamation,
  BiBarChartAlt2,
  BiGroup
} from "react-icons/bi";

function LeftSidebarTM() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  // Estados para controlar quais grupos de menus estão abertos/colapsados
  const [badgesAberto, setBadgesAberto] = useState(true);
  const [consultoresAberto, setConsultoresAberto] = useState(false);

  // 1. Carregar dados do utilizador do localStorage (Vindo do Componente 2)
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

  // 2. Auto-expandir os grupos de menu baseando-se na rota atual (Vindo do Componente 1)
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/tm/Solicitacoes") || 
        path.startsWith("/tm/status-candidaturas") || 
        path.startsWith("/tm/ExpiracaoBadges") || 
        path.startsWith("/tm/Relatorios") || 
        path.startsWith("/tm/CatalogoBadges")) {
      setBadgesAberto(true);
    }
    if (path.startsWith("/tm/Consultores")) {
      setConsultoresAberto(true);
    }
  }, [location.pathname]);

  return (
    <aside style={sidebarStyle}>
      {/* Bloco Superior: Perfil + Navegação */}
      <div>
        {/* Bloco de Perfil Dinâmico */}
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

        {/* Links de Navegação */}
        <nav>
          {/* Link Simples: Página Inicial */}
          <MainLink to="/tm" icon={<BiGrid size={18} />} label="Página Inicial" end />

          {/* Grupo de Menus: Badges */}
          <MenuGroup
            label="Badges"
            icon={<BiBadge size={18} />}
            to="/tm/badges"
            aberto={badgesAberto}
            onToggle={() => setBadgesAberto((prev) => !prev)}
          >
            <SubLink to="/tm/Solicitacoes" label="Solicitação de Badges" icon={<BiFileBlank size={16} />} />
            <SubLink to="/tm/status-candidaturas" label="Status das Candidaturas" icon={<BiHistory size={16} />} />
            <SubLink to="/tm/expiracao" label="Badges em Expiração" icon={<BiAlarmExclamation size={16} />} />
            <SubLink to="/tm/Relatorios" label="Relatórios" icon={<BiBarChartAlt2 size={16} />} />
            {/* Mantido caso uses o ecrã de certificados do Componente 1 */}
            <SubLink to="/tm/certificados" label="Certificados" icon={<BiCertification size={16} />} />
          </MenuGroup>

          {/* Grupo de Menus: Consultores */}
          <MenuGroup
            label="Consultores"
            icon={<BiUser size={18} />}
            aberto={consultoresAberto}
            onToggle={() => setConsultoresAberto((prev) => !prev)}
          >
            <SubLink to="/tm/Consultores" label="Lista de Consultores" icon={<BiGroup size={16} />} />
          </MenuGroup>
        </nav>
      </div>

      {/* Bloco Inferior: Logotipo Softinsa */}
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
   SUB-COMPONENTES AUXILIARES (Otimizados com NavLink nativo)
========================================================= */

function MainLink({ to, icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        ...itemBaseStyle,
        backgroundColor: isActive ? "#e9ecef" : "transparent",
        border: isActive ? "1px solid #dee2e6" : "1px solid transparent",
        color: isActive ? "#0d6efd" : "#495057",
        fontWeight: isActive ? "600" : "400",
      })}
    >
      <BiChevronRight size={16} style={{ opacity: 0 }} />
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function MenuGroup({ label, icon, to, aberto, onToggle, children }) {
  return (
    <div style={{ marginBottom: "4px" }}>
      <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
        {/* Botão de seta customizado para expandir/colapsar */}
        <button type="button" onClick={onToggle} style={toggleButtonStyle} aria-label={aberto ? `Fechar ${label}` : `Abrir ${label}`}>
          <BiChevronRight
            size={16}
            style={{
              color: "#9ca3af",
              transform: aberto ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        </button>

        {to ? (
          <NavLink
            to={to}
            style={({ isActive }) => ({
              ...itemBaseStyle,
              paddingLeft: "40px", // Abre espaço para a seta absoluta à esquerda
              backgroundColor: isActive ? "#e9ecef" : "transparent",
              border: isActive ? "1px solid #dee2e6" : "1px solid transparent",
              color: isActive ? "#0d6efd" : "#495057",
              fontWeight: isActive ? "600" : "400",
            })}
          >
            {icon}
            <span style={{ flex: 1 }}>{label}</span>
          </NavLink>
        ) : (
          <div style={{ ...itemBaseStyle, paddingLeft: "40px", cursor: "pointer" }} onClick={onToggle}>
            {icon}
            <span style={{ flex: 1 }}>{label}</span>
          </div>
        )}
      </div>

      {/* Submenus filhos com transição visual */}
      {aberto && <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>}
    </div>
  );
}

function SubLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...subItemBaseStyle,
        backgroundColor: isActive ? "rgba(13, 110, 253, 0.08)" : "transparent",
        border: isActive ? "1px solid rgba(13, 110, 253, 0.15)" : "1px solid transparent",
        color: isActive ? "#0d6efd" : "#6c757d",
        fontWeight: isActive ? "600" : "400",
      })}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

/* =========================================================
   ESTILOS CONFIGURADOS (Combinação Visual Refinada)
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
  fontSize: "11px",
  fontWeight: "600",
  color: "#adb5bd",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "12px",
  paddingLeft: "8px",
};

// Estilos Base Reutilizáveis
const itemBaseStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "10px 14px",
  borderRadius: "12px",
  cursor: "pointer",
  fontSize: "14px",
  textDecoration: "none",
  transition: "all 0.2s ease",
  marginBottom: "4px",
  width: "100%",
  boxSizing: "border-box",
};

const subItemBaseStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "8px 12px",
  marginLeft: "28px", 
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "13px",
  textDecoration: "none",
  transition: "all 0.2s ease",
  marginBottom: "4px",
  boxSizing: "border-box",
};

const toggleButtonStyle = {
  position: "absolute",
  left: "10px",
  zIndex: 2,
  width: "24px",
  height: "24px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

// Estilos do Rodapé
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