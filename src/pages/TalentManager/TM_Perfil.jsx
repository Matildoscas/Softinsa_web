import { useState, useEffect } from "react";
import { Card, Button, Spinner } from 'react-bootstrap';
import { BiLoader, BiHistory, BiUserCircle, BiClipboard, BiCheckShield, BiMenu, BiBadgeCheck, BiXCircle } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import api, { buildUploadUrl } from '../../services/api.js'; 

// Componentes Estruturais Adaptados ao Contexto do TM
import Header from "../../components/Header.jsx";
import TmLeftSidebar from "../../components/TM_LeftBar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";

function TM_Perfil() {
    const navigate = useNavigate();

    // Estados Reais interligados com a Base de Dados
    const [user, setUser] = useState(null);
    const [totalPendentes, setTotalPendentes] = useState(0);
    const [historicoAvaliacoes, setHistoricoAvaliacoes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setLoading(true);
            
            // 📡 Procurar dados usando a nova rota de histórico pessoal
            Promise.all([
                api.get("/candidaturas/tm/candidaturas"),
                api.get("/candidaturas/tm/historico-pessoal") // 🌟 ROTA ATUALIZADA AQUI!
            ]).then(([pendentesRes, historicoRes]) => {
                const dadosPendentes = Array.isArray(pendentesRes.data) ? pendentesRes.data : [];
                const dadosHistoricoPessoal = Array.isArray(historicoRes.data) ? historicoRes.data : [];
                
                // O histórico já vem filtrado da BD, não precisas de fazer .filter() no front!
                const historicoFiltrado = dadosHistoricoPessoal;

                // 2️⃣ SEGREDO DOS PENDENTES: Mapeamos os IDs de candidaturas que o TM JÁ validou
                const idsAvaliadosPorMim = new Set(
                    historicoFiltrado.map(h => h.id_candidatura_pedido)
                );

                // Se o TM já avaliou, removemos da lista de "Pedidos Pendentes de Ação" dele
                const pendentesReaisParaEsteTM = dadosPendentes.filter(p => {
                    const idCandidatura = p.id_candidatura_pedido || p.id_pedido || p.id;
                    return !idsAvaliadosPorMim.has(idCandidatura);
                });
                
                setTotalPendentes(pendentesReaisParaEsteTM.length);
                setHistoricoAvaliacoes(historicoFiltrado);
                setLoading(false);
            }).catch(err => {
                console.error("Erro ao carregar métricas de perfil do TM:", err);
                setLoading(false);
            });
        }
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <TmLeftSidebar />

                {/* Main Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    
                    {/* Welcome Card Alterado para o azul Corporativo #0d6efd */}
                    <Card className="border-0 mb-4" style={{ background: '#0d6efd', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Card.Body className="p-4 d-flex justify-content-between align-items-center text-white">
                            <div>
                                <h5 className="fw-bold mb-1" style={{ textAlign: 'left', fontSize: '22px' }}>
                                    {user?.nome_completo || "Talent Manager"}
                                </h5>
                                <div style={{ fontSize: '13px', opacity: 0.8, textAlign: 'left', marginBottom: '20px' }}>
                                    Talent Manager
                                </div>
                                
                                <div className="d-flex gap-2">
                                    <div style={cardStyleBase}>
                                        <BiClipboard size={22} color="#ffffff"/>
                                        <div>
                                            <div style={{ fontSize: 10, opacity: 0.9 }}>Pedidos Pendentes</div>
                                            <div style={{ fontWeight: 600 }}>{totalPendentes} solicitações</div>
                                        </div>
                                    </div>
                                    <div style={cardStyleBase}>
                                        <BiCheckShield size={22} color="#ffffff"/>
                                        <div>
                                            <div style={{ fontSize: 10, opacity: 0.9 }}>Histórico Validado</div>
                                            <div style={{ fontWeight: 600 }}>{historicoAvaliacoes.length} decisões</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Foto de Perfil Dinâmica vinda do LocalStorage/BD */}
                            <div style={{ 
                                width: 85, 
                                height: 85, 
                                borderRadius: '50%', 
                                background: 'rgba(255,255,255,0.2)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                overflow: 'hidden',
                                border: '2px solid rgba(255,255,255,0.4)' 
                            }}>
                                {user?.foto_perfil ? (
                                    <img src={buildUploadUrl(user.foto_perfil)} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <BiUserCircle size={60} color="rgba(255,255,255,0.9)" />
                                )}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Botões de Ação Rápida Operacional */}
                    <div className="text-center mb-4 d-flex justify-content-start gap-2">
                        <Button onClick={() => navigate('/tm/Solicitacoes')} variant="white" className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2" style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
                            <BiLoader size={18} color="#0d6efd" /> Gerir Solicitações
                        </Button>
                        <Button onClick={() => navigate('/tm/HistoricoCandidaturas')} variant="white" className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2" style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
                            <BiHistory size={18} color="#475569" /> Histórico Geral
                        </Button>
                    </div>

                    {/* Lista das Últimas Ações Realizadas pelo Renato */}
                    <BadgeSection title="Registo Recente de Avaliações" sub="As suas últimas decisões registadas no sistema:">
                        {historicoAvaliacoes.length > 0 ? (
                            historicoAvaliacoes.slice(0, 5).map((item, index) => (
                                <HistoricoAvaliacaoCard
                                    key={index}
                                    consultor={item.nome_consultor || item.nome_utilizador || item.consultor || "Consultor Softinsa"}
                                    badgeName={item.nome_badge || item.badge || "Badge Corporativo"}
                                    status={item.estado || item.status || "Pendente"}
                                    date={item.data_avaliacao || item.data_submissao || item.data_validacao}
                                />
                            ))
                        ) : (
                            <div className="text-center py-5 bg-white border rounded-3 text-muted">
                                <BiBadgeCheck size={32} className="mb-2" color="#cbd5e1" />
                                <p style={{ fontSize: '13px', margin: 0 }}>Nenhuma decisão registada sob o seu perfil de avaliador.</p>
                            </div>
                        )}
                    </BadgeSection>
                </div>

                <TmRightSidebar />
            </div>
        </div>
    );
}

// Estilos Base Alinhados com a Identidade Visual Corporativa (Ajustados para contrastar com fundo azul)
const cardStyleBase = { 
    background: 'rgba(255,255,255,0.15)', 
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 12, 
    padding: '10px 16px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 10, 
    fontSize: 12, 
    textAlign: 'left'
};

function BadgeSection({ title, sub, children }) {
    return (
        <div className="mb-3" style={{ fontFamily: 'system-ui, sans-serif' }}>
            <div className="d-flex justify-content-between align-items-start mb-3">
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{title}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: '2px' }}>{sub}</div>
                </div>
            </div>
            {children}
        </div>
    );
}

// 🎯 Componente de Auditoria Otimizado com cores dinâmicas (Verde, Amarelo, Vermelho)
function HistoricoAvaliacaoCard({ consultor, badgeName, status, date }) {
    const statusLower = String(status).toLowerCase();
    
    // Estados lógicos de verificação
    const isPendente = statusLower.includes('pend');
    const isRejeitado = statusLower.includes('rejeit') || statusLower.includes('recus') || statusLower.includes('rejeitada');

    // Configuração de cores Padrão (Aprovado / Verde)
    let bgIconColor = '#f0fdf4';
    let borderIconColor = '#bbf7d0';
    let statusBgColor = '#dcfce7';
    let statusTextColor = '#15803d';
    let IconComponent = <BiBadgeCheck size={24} color="#16a34a" />;

    // Ajuste dinâmico se for Pendente (Amarelo)
    if (isPendente) {
        bgIconColor = '#fef9c3';
        borderIconColor = '#fef08a';
        statusBgColor = '#fef9c3';
        statusTextColor = '#854d0e';
        IconComponent = <BiLoader size={24} color="#ca8a04" />;
    } 
    // Ajuste dinâmico se for Rejeitado (Vermelho)
    else if (isRejeitado) {
        bgIconColor = '#fef2f2';
        borderIconColor = '#fecaca';
        statusBgColor = '#fee2e2';
        statusTextColor = '#991b1b';
        IconComponent = <BiXCircle size={24} color="#dc2626" />;
    }
    
    return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 10 }}>
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                
                {/* Ícone Indicador Dinâmico */}
                <div style={{
                    width: 44, height: 44, borderRadius: '50%', 
                    background: bgIconColor,
                    display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
                    border: `1px solid ${borderIconColor}`
                }}>
                    {IconComponent}
                </div>

                {/* Informação Operacional */}
                <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{consultor}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>
                        Processamento do badge: <strong style={{ color: '#334155' }}>{badgeName}</strong>
                    </div>
                </div>

                {/* Badge Visual do Estado Decidido */}
                <div style={{ 
                    borderRadius: '8px', 
                    padding: '6px 12px', 
                    fontSize: '11px', 
                    fontWeight: '700',
                    backgroundColor: statusBgColor,
                    color: statusTextColor,
                    textTransform: 'uppercase'
                }}>
                    {status}
                </div>
            </div>

            {date && (
                <div style={{
                    borderTop: '1px solid #f1f5f9',
                    padding: '8px 16px',
                    backgroundColor: '#f8fafc',
                    textAlign: 'left',
                    fontSize: '11px',
                    color: '#94a3b8'
                }}>
                    Ação registada em: {new Date(date).toLocaleDateString('pt-PT')} às {new Date(date).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}
                </div>
            )}
        </div>
    );
}

export default TM_Perfil;