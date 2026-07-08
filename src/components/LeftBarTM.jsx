import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildUploadUrl } from '../services/api.js';
import { 
    BiUserCircle, 
    BiChevronRight, 
    BiLayout, 
    BiMedal, 
    BiGroup,
    BiFileBlank,      // Ícone para Solicitação
    BiHistory,        // Ícone para Histórico
    BiAlarmExclamation, // Ícone para Expiração
    BiBarChartAlt2    // Ícone para Relatórios
} from 'react-icons/bi';

function LeftSidebarTM() {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;

    // 🚀 ESTADO PARA CARREGAR O UTILIZADOR LOGADO
    const [user, setUser] = useState(null);

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

    // Função para verificar com precisão se a rota está ativa
    const isActive = (path) => currentPath === path || currentPath.startsWith(path + '/');

    // Estilos estruturais da Sidebar
    const sidebarStyle = {
        width: '260px',
        backgroundColor: '#f8f9fa',
        minHeight: 'calc(100vh - 65px)', 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        borderRight: '1px solid #e9ecef',
        fontFamily: 'system-ui, sans-serif',
        flexShrink: 0 
    };

    // Estilo dos Menus Principais
    const itemStyle = (active) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        borderRadius: '12px',
        cursor: 'pointer',
        backgroundColor: active ? '#e9ecef' : 'transparent', 
        border: active ? '1px solid #dee2e6' : '1px solid transparent',
        color: active ? '#0d6efd' : '#495057', 
        fontWeight: active ? '600' : '400',
        fontSize: '14px',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        marginBottom: '4px'
    });

    // 🔄 NOVO ESTILO MELHORADO PARA OS SUBMENUS (Parecido ao principal, mas com recuo hierárquico)
    const subItemStyle = (active) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        marginLeft: '24px', // Cria o efeito de recuo hierárquico
        borderRadius: '10px',
        cursor: 'pointer',
        backgroundColor: active ? 'rgba(13, 110, 253, 0.08)' : 'transparent', // Fundo azul clarinho discreto
        border: active ? '1px solid rgba(13, 110, 253, 0.15)' : '1px solid transparent',
        color: active ? '#0d6efd' : '#6c757d',
        fontWeight: active ? '600' : '400',
        fontSize: '13px',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        marginBottom: '4px'
    });

    return (
        <div style={sidebarStyle}>
            {/* PARTE SUPERIOR DO MENU */}
            <div>
                {/* Perfil Dinâmico do Utilizador Conectado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', paddingLeft: '8px' }}>
                    <div style={{ 
                        width: '38px', 
                        height: '38px', 
                        borderRadius: '50%', 
                        backgroundColor: '#dee2e6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        overflow: 'hidden', // Garante que a imagem fica redonda
                        border: '1px solid #dee2e6'
                    }}>
                        {/* 📸 SE HOUVER FOTO_PERFIL MOSTRA A IMAGEM, CASO CONTRÁRIO MOSTRA O ÍCONE DEFAULT */}
                        {user?.foto_perfil ? (
                            <img 
                                src={buildUploadUrl(user.foto_perfil)} 
                                alt="Foto de perfil" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <BiUserCircle size={24} color="#495057" />
                        )}
                    </div>
                    
                    {/* Exibe o Nome Real + Cargo */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', fontSize: '14px', color: '#212529', lineHeight: '1.2' }}>
                            {user?.nome_completo || "Talent Manager"}
                        </span>
                        <span style={{ fontSize: '11px', color: '#6c757d' }}>Talent Manager</span>
                    </div>
                </div>

                {/* Título da Secção */}
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', paddingLeft: '8px' }}>
                    Pages
                </div>

                {/* LINKS DO MENU */}
                <nav>
                    {/* Página Inicial */}
                    <div style={itemStyle(isActive('/talent_manager'))} onClick={() => navigate('/talent_manager')}>
                        <BiChevronRight size={16} style={{ opacity: isActive('/talent_manager') ? 1 : 0.5 }} />
                        <BiLayout size={18} />
                        <span>Página Inicial</span>
                    </div>

                    {/* Badges */}
                    <div 
                        style={itemStyle(isActive('/tm/CatalogoBadges'))} 
                        onClick={() => navigate('/tm/CatalogoBadges')}
                    >
                        <BiChevronRight size={16} style={{ opacity: isActive('/tm/CatalogoBadges') ? 1 : 0.5 }} />
                        <BiMedal size={18} />
                        <span>Badges</span>
                    </div>

                    {/* Consultores */}
                    <div style={{ ...itemStyle(isActive('/tm/Consultores')), marginTop: '8px' }} onClick={() => navigate('/tm/Consultores')}>
                        <BiChevronRight size={16} style={{ opacity: isActive('/tm/Consultores') ? 1 : 0.5 }} />
                        <BiGroup size={18} />
                        <span>Consultores</span>
                    </div>

                    
                    <div style={subItemStyle(isActive('/tm/Solicitacoes'))} onClick={() => navigate('/tm/Solicitacoes')}>
                        <BiFileBlank size={16} style={{ opacity: isActive('/tm/Solicitacoes') ? 1 : 0.6 }} />
                        <span>Solicitação de Badges</span>
                    </div>
                    
                    <div style={subItemStyle(isActive('/tm/HistoricoCandidaturas'))} onClick={() => navigate('/tm/HistoricoCandidaturas')}>
                        <BiHistory size={16} style={{ opacity: isActive('/tm/HistoricoCandidaturas') ? 1 : 0.6 }} />
                        <span>Histórico de Candidaturas</span>
                    </div>
                    
                    <div style={subItemStyle(isActive('/tm/ExpiracaoBadges'))} onClick={() => navigate('/tm/ExpiracaoBadges')}>
                        <BiAlarmExclamation size={16} style={{ opacity: isActive('/tm/ExpiracaoBadges') ? 1 : 0.6 }} />
                        <span>Badges em Expiração</span>
                    </div>
                    
                    <div style={subItemStyle(isActive('/tm/Relatorios'))} onClick={() => navigate('/tm/Relatorios')}>
                        <BiBarChartAlt2 size={16} style={{ opacity: isActive('/tm/Relatorios') ? 1 : 0.6 }} />
                        <span>Relatórios</span>
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