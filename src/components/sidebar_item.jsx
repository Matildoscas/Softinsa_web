import { NavLink } from 'react-router-dom';

function SidebarItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      style={({ isActive }) => ({
        // Estilos base (comuns a todos)
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        fontSize: '13px',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        
        // Estilos Condicionais (quando ativo)
        backgroundColor: isActive ? '#eff6ff' : 'transparent',
        color: isActive ? '#2563eb' : '#4b5563',
        borderRight: isActive ? '3px solid #2563eb' : '3px solid transparent',
        fontWeight: isActive ? '600' : '400',
      })}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default SidebarItem;