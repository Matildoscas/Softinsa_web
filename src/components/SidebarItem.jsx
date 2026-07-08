import {
  NavLink,
} from "react-router-dom";

function SidebarItem({
  to,
  icon,
  label,
  nested = false,
  end = false,
}) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: 9,

        padding: nested
          ? "9px 22px 9px 63px"
          : "10px 22px",

        fontSize: nested
          ? 12
          : 13,

        textDecoration: "none",

        backgroundColor: isActive
          ? "#eaf2ff"
          : "transparent",

        color: isActive
          ? "#0d5cff"
          : "#374151",

        borderRight: isActive
          ? "3px solid #2563eb"
          : "3px solid transparent",

        fontWeight: isActive
          ? 600
          : 400,

        transition:
          "background-color 0.15s ease, color 0.15s ease",

        width: "100%",
      })}
    >
      {icon && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
      )}

      <span>{label}</span>
    </NavLink>
  );
}

export default SidebarItem;