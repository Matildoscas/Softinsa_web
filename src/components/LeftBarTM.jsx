import { useLocation, useNavigate } from 'react-router-dom';
import { BiUserCircle, BiChevronRight, BiLayout, BiMedal, BiGroup } from 'react-icons/bi';

function LeftSidebarTM() {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;

    // Função melhorada para verificar com precisão se a rota está ativa
    const isActive = (path) => currentPath === path || currentPath.startsWith(path + '/');

    // Estilos corrigidos para preencher o ecrã até abaixo de forma fluida
    const sidebarStyle = {
        width: '260px',
        backgroundColor: '#f8f9fa',
        // 🚀 Faz com que o menu ocupe todo o ecrã vertical disponível descontando o Header
        minHeight: 'calc(100vh - 65px)', 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        borderRight: '1px solid #e9ecef',
        fontFamily: 'system-ui, sans-serif',
        flexShrink: 0 // Garante que o menu não esmaga horizontalmente em ecrãs mais pequenos
    };

    const itemStyle = (active) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: '12px',
        cursor: 'pointer',
        backgroundColor: active ? '#e9ecef' : 'transparent', // Destaque cinza mais visível
        border: active ? '1px solid #dee2e6' : '1px solid transparent',
        color: active ? '#0d6efd' : '#495057', // Texto azul se estiver ativo
        fontWeight: active ? '600' : '400',
        fontSize: '14px',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        marginBottom: '4px'
    });

    const subItemStyle = (active) => ({
        display: 'block',
        padding: '8px 12px 8px 42px',
        color: active ? '#0d6efd' : '#6c757d',
        fontWeight: active ? '600' : '400',
        fontSize: '13px',
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'color 0.2s ease'
    });

    return (
        <div style={sidebarStyle}>
            {/* PARTE SUPERIOR DO MENU */}
            <div>
                {/* Perfil do Tipo de Utilizador */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#dee2e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BiUserCircle size={24} color="#495057" />
                    </div>
                    <span style={{ fontWeight: '500', fontSize: '14px', color: '#212529' }}>Talent Manager</span>
                </div>

                {/* Título da Secção */}
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', paddingLeft: '8px' }}>
                    Pages
                </div>

                {/* LINKS DO MENU */}
                <nav>
                    {/* Página Inicial */}
                    <div style={itemStyle(isActive('/tm/dashboard'))} onClick={() => navigate('/tm/dashboard')}>
                        <BiChevronRight size={16} style={{ opacity: isActive('/tm/dashboard') ? 1 : 0.5 }} />
                        <BiLayout size={18} />
                        <span>Página Inicial</span>
                    </div>

                    {/* Menu Pai: Badges (Corrigido o bug do duplo atributo style) */}
                    <div style={{ ...itemStyle(false), cursor: 'default' }}>
                        <BiChevronRight size={16} style={{ opacity: 0.5 }} />
                        <BiMedal size={18} />
                        <span>Badges</span>
                    </div>

                    {/* Submenus de Badges (Com recuo) */}
                    <div style={subItemStyle(isActive('/tm/solicitacoes'))} onClick={() => navigate('/tm/solicitacoes')}>
                        Solicitação de Badges
                    </div>
                    <div style={subItemStyle(isActive('/tm/historico'))} onClick={() => navigate('/tm/historico')}>
                        Histórico de Candidaturas
                    </div>
                    <div style={subItemStyle(isActive('/tm/expiracao'))} onClick={() => navigate('/tm/expiracao')}>
                        Badges em Expiração
                    </div>
                    <div style={subItemStyle(isActive('/tm/relatorios'))} onClick={() => navigate('/tm/relatorios')}>
                        Relatórios
                    </div>

                    {/* Consultores */}
                    <div style={{ ...itemStyle(isActive('/tm/consultores')), marginTop: '8px' }} onClick={() => navigate('/tm/consultores')}>
                        <BiChevronRight size={16} style={{ opacity: isActive('/tm/consultores') ? 1 : 0.5 }} />
                        <BiGroup size={18} />
                        <span>Consultores</span>
                    </div>
                </nav>
            </div>

            {/* LOGOTIPO DA SOFTINSA NO RODAPÉ */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '8px', marginTop: '32px' }}>
                <div style={{ 
                    backgroundColor: '#ffffff', 
                    padding: '8px 24px', 
                    borderRadius: '4px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <span style={{ fontWeight: 'bold', color: '#1d4ed8', fontSize: '16px', letterSpacing: '0.5px' }}>
                        SOFT<span style={{ color: '#06b6d4' }}>I</span>NSA
                    </span>
                </div>
            </div>
        </div>
    );
}

export default LeftSidebarTM;