import { useEffect, useState } from "react";

import {
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  BiGrid,
  BiBadge,
  BiHistory,
  BiTimeFive,
  BiBarChartAlt2,
  BiUser,
  BiUserCircle,
  BiChevronRight,
  BiCertification,
  BiFile,
} from "react-icons/bi";

function TmLeftSidebar() {
  const location = useLocation();

  const [badgesAberto, setBadgesAberto] =
    useState(true);

  const [
    certificadosAberto,
    setCertificadosAberto,
  ] = useState(true);

  const [
    consultoresAberto,
    setConsultoresAberto,
  ] = useState(
    location.pathname.startsWith(
      "/tm/consultores"
    )
  );

  useEffect(() => {
    if (
      location.pathname.startsWith(
        "/tm/consultores"
      )
    ) {
      setConsultoresAberto(true);
    }

    if (
      location.pathname.startsWith(
        "/tm/solicitacoes"
      ) ||
      location.pathname.startsWith(
        "/tm/status-candidaturas"
      ) ||
      location.pathname.startsWith(
        "/tm/expiracao"
      ) ||
      location.pathname.startsWith(
        "/tm/relatorios"
      )
    ) {
      setBadgesAberto(true);
    }

    if (
      location.pathname.startsWith(
        "/tm/certificados"
      )
    ) {
      setCertificadosAberto(true);
    }
  }, [location.pathname]);

  return (
    <aside className="app-left-sidebar" style={container}>
      <div style={profileBox}>
        <BiUserCircle
          size={25}
          color="#6b7280"
        />

        <span style={profileName}>
          Talent Manager
        </span>
      </div>

      <div style={pagesLabel}>
        Pages
      </div>

      <MainLink
        to="/tm"
        icon={<BiGrid size={16} />}
        label="Página Inicial"
        end
      />

      <MenuGroup
        label="Badges"
        icon={<BiBadge size={16} />}
        aberto={badgesAberto}
        onToggle={() =>
          setBadgesAberto(
            (valor) => !valor
          )
        }
      >
        <SubLink
          to="/tm/solicitacoes"
          label="Solicitações de badges"
        />

        <SubLink
          to="/tm/status-candidaturas"
          label="Status de candidaturas"
        />

        <SubLink
          to="/tm/expiracao"
          label="Badges em expiração"
        />

        <SubLink
          to="/tm/relatorios"
          label="Relatórios"
        />
      </MenuGroup>

      <MenuGroup
        label="Certificados"
        icon={<BiCertification size={16} />}
        aberto={certificadosAberto}
        onToggle={() =>
          setCertificadosAberto(
            (valor) => !valor
          )
        }
      >
        <SubLink
          to="/tm/certificados"
          label="Gerar certificado"
        />

        <SubLink
          to="/tm/historico"
          label="Histórico de candidaturas"
        />
      </MenuGroup>

      <MenuGroup
        label="Consultores"
        icon={<BiUser size={16} />}
        aberto={consultoresAberto}
        onToggle={() =>
          setConsultoresAberto(
            (valor) => !valor
          )
        }
      >
        <SubLink
          to="/tm/consultores"
          label="Lista de consultores"
        />

        <SubLink
          to="/tm/desafios/novo"
          label="Desafios e lembretes"
        />
      </MenuGroup>
    </aside>
  );
}

function MainLink({
  to,
  icon,
  label,
  end = false,
}) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        ...mainLink,

        border: isActive
          ? "1px solid #9ca3af"
          : "1px solid transparent",

        borderRadius: isActive
          ? 9
          : 0,

        background: isActive
          ? "#f9fafb"
          : "transparent",

        fontWeight: isActive
          ? 600
          : 400,
      })}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function MenuGroup({
  label,
  icon,
  aberto,
  onToggle,
  children,
}) {
  return (
    <div style={grupo}>
      <div style={groupHeader}>
        <button
          type="button"
          onClick={onToggle}
          style={toggleButton}
          aria-label={
            aberto
              ? `Fechar ${label}`
              : `Abrir ${label}`
          }
        >
          <BiChevronRight
            size={14}
            style={{
              color: "#9ca3af",

              transform: aberto
                ? "rotate(90deg)"
                : "rotate(0deg)",

              transition:
                "transform 0.15s",
            }}
          />
        </button>

        <div style={groupLabel}>
          {icon}
          <span>{label}</span>
        </div>
      </div>

      {aberto && (
        <div style={submenu}>
          {children}
        </div>
      )}
    </div>
  );
}

function SubLink({
  to,
  label,
}) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...subLink,

        color: isActive
          ? "#2563eb"
          : "#111827",

        fontWeight: isActive
          ? 600
          : 400,

        background: isActive
          ? "#eff6ff"
          : "transparent",
      })}
    >
      {label}
    </NavLink>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const container = {
  width: 250,
  background: "white",
  borderRight: "1px solid #e5e7eb",
  padding: "14px 0",
  flexShrink: 0,
  overflowY: "auto",
};

const profileBox = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 24px 28px",
};

const profileName = {
  fontSize: 14,
  fontWeight: 500,
  color: "#111827",
};

const pagesLabel = {
  fontSize: 13,
  color: "#9ca3af",
  padding: "0 28px 8px",
};

const mainLink = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  margin: "0 14px 8px",
  padding: "8px 12px",
  fontSize: 13,
  color: "#111827",
  textDecoration: "none",
};

const grupo = {
  marginBottom: 8,
};

const groupHeader = {
  display: "flex",
  alignItems: "center",
  padding: "0 14px",
};

const toggleButton = {
  width: 26,
  height: 34,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};

const groupLabel = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: "#111827",
  fontSize: 13,
};

const submenu = {
  padding: "2px 0 4px",
};

const subLink = {
  display: "block",
  padding: "7px 24px 7px 64px",
  fontSize: 13,
  textDecoration: "none",
};

export default TmLeftSidebar;