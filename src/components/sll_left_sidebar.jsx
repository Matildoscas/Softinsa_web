import { useState } from "react";
import { NavLink } from "react-router-dom";

import {
  BiGrid,
  BiBadge,
  BiBookOpen,
  BiBarChartAlt2,
  BiCertification,
  BiFile,
  BiUser,
  BiUserCircle,
  BiChevronRight,
} from "react-icons/bi";

function SllLeftSidebar() {
  const [badgesAberto, setBadgesAberto] = useState(true);
  const [certificadosAberto, setCertificadosAberto] =
    useState(true);
  const [consultoresAberto, setConsultoresAberto] =
    useState(true);

  return (
    <aside style={container}>
      <div style={profileBox}>
        <BiUserCircle size={25} color="#6b7280" />

        <span style={profileName}>Service Line</span>
      </div>

      <div style={pagesLabel}>Pages</div>

      <MainLink
        to="/sll"
        icon={<BiGrid size={16} />}
        label="Main Page"
        end
      />

      <MenuGroup
        label="Badges"
        icon={<BiBadge size={16} />}
        aberto={badgesAberto}
        onToggle={() =>
          setBadgesAberto((valor) => !valor)
        }
      >
        <SubLink
          to="/sll/badges"
          label="Catálogo de Badges"
        />

        <SubLink
          to="/sll/solicitacoes"
          label="Solicitações de badges"
        />

        <SubLink
          to="/sll/ranking"
          label="Ranking de badges"
        />
      </MenuGroup>

      <MenuGroup
        label="Certificados e Relatórios"
        icon={<BiCertification size={16} />}
        aberto={certificadosAberto}
        onToggle={() =>
          setCertificadosAberto((valor) => !valor)
        }
      >
        <SubLink
          to="/sll/certificados"
          label="Gerar certificado"
        />

        <SubLink
          to="/sll/relatorios"
          label="Gerar relatório"
        />
      </MenuGroup>

      <MenuGroup
        label="Consultores"
        icon={<BiUser size={16} />}
        aberto={consultoresAberto}
        onToggle={() =>
          setConsultoresAberto((valor) => !valor)
        }
      >
        <SubLink
          to="/sll/consultores"
          label="Lista de consultores"
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

        borderRadius: isActive ? 9 : 0,
        background: isActive
          ? "#f9fafb"
          : "transparent",

        fontWeight: isActive ? 600 : 400,
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
    <div style={{ marginBottom: 8 }}>
      <div style={groupHeader}>
        <button
          type="button"
          onClick={onToggle}
          style={toggleButton}
        >
          <BiChevronRight
            size={14}
            style={{
              color: "#9ca3af",
              transform: aberto
                ? "rotate(90deg)"
                : "rotate(0deg)",
              transition: "0.15s",
            }}
          />
        </button>

        <div style={groupLabel}>
          {icon}
          <span>{label}</span>
        </div>
      </div>

      {aberto && (
        <div style={submenu}>{children}</div>
      )}
    </div>
  );
}

function SubLink({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...subLink,
        color: isActive
          ? "#2563eb"
          : "#111827",

        fontWeight: isActive ? 600 : 400,

        background: isActive
          ? "#eff6ff"
          : "transparent",
      })}
    >
      {label}
    </NavLink>
  );
}

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

export default SllLeftSidebar;