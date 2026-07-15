import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  BiGrid,
  BiUserCircle,
  BiUser,
  BiBookOpen,
  BiLayer,
  BiBadge,
  BiInfoCircle,
  BiShield,
  BiBell,
  BiChevronRight,
  BiTimeFive,
} from "react-icons/bi";

function AdminLeftSidebar() {
  const [adminName, setAdminName] = useState("Administrador");
  const [gestaoAberta, setGestaoAberta] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) return;

    try {
      const user = JSON.parse(storedUser);

      setAdminName(
        user.nome_completo ||
        user.NOME_COMPLETO ||
        user.nome ||
        "Administrador"
      );
    } catch (err) {
      console.error("Erro ao ler admin:", err);
    }
  }, []);

  return (
    <div style={container}>
      <div style={profileBox}>
        <BiUserCircle size={26} color="#6b7280" />
        <span style={profileName}>{adminName}</span>
      </div>

      <div style={pagesLabel}>Pages</div>

      <AdminLink
        to="/admin"
        icon={<BiGrid size={16} />}
        label="Main Page"
        end
      />

      <div style={groupHeaderWrapper}>
        <button
          type="button"
          onClick={() => setGestaoAberta((v) => !v)}
          style={chevronButton}
        >
          <BiChevronRight
            size={14}
            style={{
              transform: gestaoAberta ? "rotate(90deg)" : "rotate(0deg)",
              transition: "0.15s",
              color: "#9ca3af",
            }}
          />
        </button>

        <NavLink
          to="/admin/contas"
          style={({ isActive }) => ({
            ...groupHeaderLink,
            backgroundColor: isActive ? "#f8fafc" : "transparent",
            border: isActive ? "1px solid #111827" : "1px solid transparent",
            borderRadius: isActive ? 10 : 0,
            color: "#111827",
            fontWeight: isActive ? 600 : 400,
          })}
        >
          <BiUser size={16} />
          <span>Gestão de contas</span>
        </NavLink>
      </div>

      {gestaoAberta && (
        <div style={submenu}>
          <SubLink
            to="/admin/learning-paths"
            label="Gestão de Learning Paths"
            icon={<BiBookOpen size={15} />}
          />

          <SubLink
            to="/admin/service-lines"
            label="Gestão de Service Lines"
            icon={<BiLayer size={15} />}
          />

          <SubLink
            to="/admin/badges"
            label="Gestão de Bad"
            icon={<BiBadge size={15} />}
          />

          <SubLink
            to="/admin/areas"
            label="Gestão de Areas"
            icon={<BiGrid size={15} />}
          />

          

          <SubLink
            to="/admin/pedidos-badges"
            label="Gestão de Pedidos de Badges"
            icon={<BiBadge size={20} />}
          />

          <SubLink
            to="/admin/avisos"
            label="Informações Genéricas e Avisos"
            icon={<BiInfoCircle size={20} />}
          />

          <SubLink
            to="/admin/rgpd"
            label="Políticas de RGPD"
            icon={<BiShield size={15} />}
          />
        </div>
      )}

      <AdminLink
        to="/admin/notificacoes"
        icon={<BiBell size={16} />}
        label="Configurar notificações"
      />
      <AdminLink
        to="/admin/sla"
        icon={<BiTimeFive size={16} />}
        label="Configuração de SLA"
      />
    </div>
  );
}

function AdminLink({ to, icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        ...linkBase,
        backgroundColor: isActive ? "#f8fafc" : "transparent",
        border: isActive ? "1px solid #111827" : "1px solid transparent",
        borderRadius: isActive ? 10 : 0,
        color: "#111827",
        margin: isActive ? "0 14px 6px" : "0 14px 6px",
        padding: "8px 12px",
      })}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function SubLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...subLink,
        color: isActive ? "#2563eb" : "#111827",
        fontWeight: isActive ? 600 : 400,
        backgroundColor: isActive ? "#eff6ff" : "transparent",
      })}
    >
      {icon}
      <span>{label}</span>
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
  fontSize: 15,
  fontWeight: 500,
  color: "#111827",
};

const pagesLabel = {
  fontSize: 14,
  color: "#9ca3af",
  padding: "0 32px 8px",
};

const linkBase = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  textDecoration: "none",
  transition: "all 0.15s",
};

const groupHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 28px",
  fontSize: 14,
  color: "#111827",
  cursor: "pointer",
  userSelect: "none",
};

const submenu = {
  padding: "8px 0 10px",
};

const subLink = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 28px 8px 58px",
  fontSize: 14,
  textDecoration: "none",
  transition: "all 0.15s",
};

const groupHeaderWrapper = {
  display: "flex",
  alignItems: "center",
  margin: "0 14px 6px",
};

const chevronButton = {
  width: 26,
  height: 34,
  border: "none",
  background: "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
};

const groupHeaderLink = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  fontSize: 14,
  textDecoration: "none",
  transition: "all 0.15s",
};

export default AdminLeftSidebar;