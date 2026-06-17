import { useLocation, useNavigate } from 'react-router-dom';
import { BiUserCircle, BiChevronRight, BiLayout, BiMedal, BiGroup } from 'react-icons/bi';

function LeftSidebarTM() {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;

    // Função auxiliar para verificar se a rota atual está ativa
    const isActive = (path) => currentPath === path;

    // Estilos baseados no design da imagem image_8add60.png
    const sidebarStyle = {
        width: '260px',
        backgroundColor: '#f8f9fa',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        borderRight: '1px solid #e9ecef',
        fontFamily: 'system-ui, sans-serif'
    };

    const itemStyle = (active) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: '12px',
        cursor: 'pointer',
        backgroundColor: active ? '#f1f3f5' : 'transparent',
        border: active ? '1px solid #ced4da' : '1px solid transparent',
        color: active ? '#212529' : '#495057',
        fontWeight: active ? '500' : '400',
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
                        <BiChevronRight size={16} style={{ opacity: 0.5 }} />
                        <BiLayout size={18} />
                        <span>Página Inicial</span>
                    </div>

                    {/* Menu Pai: Badges */}
                    <div style={itemStyle(false)} style={{ ...itemStyle(false), cursor: 'default' }}>
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
                        <BiChevronRight size={16} style={{ opacity: 0.5 }} />
                        <BiGroup size={18} />
                        <span>Consultores</span>
                    </div>
                </nav>
            </div>

            {/* LOGOTIPO DA SOFTINSA NO RODAPÉ */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '8px' }}>
                <div style={{ 
                    backgroundColor: '#ffffff', 
                    padding: '8px 24px', 
                    borderRadius: '4px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {/* Substitui pelo teu elemento <img> real se preferires */}
                    <span style={{ fontWeight: 'bold', color: '#1d4ed8', fontSize: '16px', letterSpacing: '0.5px' }}>
                        SOFT<span style={{ color: '#06b6d4' }}>I</span>NSA
                    </span>
                </div>
            </div>
        </div>
    );
}

export default LeftSidebarTM;