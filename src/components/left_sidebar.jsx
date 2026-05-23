import { useState, useEffect } from "react"; // Adicionado useEffect
import { ListGroup } from 'react-bootstrap';
import { BiGrid, BiUserCircle } from 'react-icons/bi';
import SidebarItem from './sidebar_item';

function LeftSidebar() {
  // Estado para armazenar o nome do utilizador
  const [userName, setUserName] = useState("Consultor");

  useEffect(() => {
    // 1. Ir buscar os dados guardados no localStorage durante o login
    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // 2. Usar o nome que vem da base de dados (NOME_COMPLETO no teu SQL)
        // O nome da propriedade depende de como o teu backend envia o JSON [cite: 107, 113]
        setUserName(user.nome_completo || user.NOME_COMPLETO || "Consultor");
      } catch (error) {
        console.error("Erro ao ler dados do utilizador:", error);
      }
    }
  }, []);

  return (
    <div style={{ display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 250, background: 'white', borderRight: '1px solid #e5e7eb', padding: '10px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px 14px' }}>
            <BiUserCircle size={28} color="#6b7280"/>
            {/* O nome agora é dinâmico vindo da base de dados */}
            <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
              {userName}
            </span>
        </div>
        <div style={{ fontSize: 9, fontWeight: 600, color: '#9ca3af', padding: '0 16px 6px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign:'left' }}>Pages</div>

        <ListGroup variant="flush">
            <SidebarItem to="/pag_consultor" icon={<BiGrid size={16} />} label="Página Principal" />
            <SidebarItem to="/perfil_consultor" icon={<BiGrid size={16}/>} label="Perfil do Consultor" />
            
            {/* Submenu de Badges fixo */}
            <div style={{ paddingLeft: 0, marginTop: '0px' }}>
                {['Catálogo de Badges', 'Badges Conquistados'].map(item => (
                    <div key={item} style={{ 
                        fontSize: 12, 
                        color: '#6b7280', 
                        padding: '6px 16px',
                        cursor: 'pointer' 
                    }}>
                        {item}
                    </div>
                ))}
            </div>
        </ListGroup>
        </div>
    </div>
  );
}

export default LeftSidebar;