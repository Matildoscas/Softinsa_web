import { NavLink } from "react-router-dom";

function AdminSidebarItem({ to, icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 16px",
        fontSize: 13,
        textDecoration: "none",
        transition: "all 0.2s ease",

        backgroundColor: isActive ? "#eff6ff" : "transparent",
        color: isActive ? "#2563eb" : "#4b5563",
        borderRight: isActive ? "3px solid #2563eb" : "3px solid transparent",
        fontWeight: isActive ? 600 : 400,
      })}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default AdminSidebarItem;