import { useState, useEffect } from "react";
import { Card, Button, Row, Col, Spinner } from 'react-bootstrap';
import { BiMedal, BiUserCircle, BiTime, BiGroup, BiBriefcase, BiMenu } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js'; 

// Importação dos componentes estruturais (Atualizado para incluir o novo SidebarTM)
import Header from '../../components/Header.jsx';
import RightSidebar from '../../components/RightSidebar.jsx';
import LeftSidebarTM from '../../components/LeftBarTM.jsx';

function DashboardTM() {
    const navigate = useNavigate();
    
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Estados dinâmicos que recebem os dados simulados/reais do SQL
    const [topConsultores, setTopConsultores] = useState([]);
    const [statsTM, setStatsTM] = useState({
        consultores_online: 0,
        badges_totais: 0,
        sll_online: 0,
        badges_atribuidos_mes: 0,
        candidaturas_ativas: 0,
        candidaturas_por_ver: 0,
        total_consultores: 0,
        crescimento_consultores: "0%"
    });
    const [areaFocada, setAreaFocada] = useState({ nome: "Carregando...", total: 0 });
    const [dadosGrafico, setDadosGrafico] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        
        if (!storedUser) {
            setLoading(false);
            navigate('/login');
            return; 
        }

        try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            
            // 🚀 CARREGAMENTO DOS DADOS DO TEU SCRIPT SQL (Via Fallback Seguro)
            setTimeout(() => {
                setTopConsultores([
                    { id: 5, nome: "Eduardo Ramos", area: "LowCode (Outsystems)", email: "eduardo@softinsa.pt", badges: 3 },
                    { id: 6, nome: "Filipa Santos", area: "DevSecOps & IT Automation", email: "filipa@softinsa.pt", badges: 1 }
                ]);

                setStatsTM({
                    consultores_online: 5, 
                    badges_totais: 15,     
                    sll_online: 2,
                    badges_atribuidos_mes: 6, 
                    candidaturas_ativas: 3,   
                    candidaturas_por_ver: 1,  
                    total_consultores: 12,
                    crescimento_consultores: "+8%"
                });

                setAreaFocada({ 
                    nome: "LowCode (Outsystems)", 
                    total: 5 
                });

                setDadosGrafico([
                    { label: "LowCode", value: 5, color: "#0d6efd", max: 15 },
                    { label: "DevSecOps", value: 4, color: "#4ade80", max: 15 },
                    { label: "Talent Mgmt", value: 3, color: "#000000", max: 15 }
                ]);

                setLoading(false);
            }, 300); // Carrega rapidamente em 300ms

        } catch (parseError) {
            console.error("Erro ao ler o utilizador do localStorage:", parseError);
            navigate('/login');
        }
    }, [navigate]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#f0f2f5' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                
                {/* 🔄 Sidebar Dinâmico com destaque de rota ativa adicionado aqui */}
                <LeftSidebarTM />

                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                    
                    {/* TOP BANNER AZUL */}
                    <Card className="border-0 mb-4 shadow-sm" style={{ background: '#0d6efd', borderRadius: 16 }}>
                        <Card.Body className="p-4 d-flex justify-content-between align-items-center text-white">
                            <div>
                                <h4 className="fw-semibold mb-4" style={{ textAlign: 'left' }}>
                                    Bom dia, {user?.nome_completo || "Talent Manager"}!
                                </h4>
                                <div className="d-flex gap-4">
                                    <TopStatBox icon={<BiUserCircle size={24}/>} title="Consultores" value={`${statsTM.consultores_online} consultores online`} />
                                    <TopStatBox icon={<BiMedal size={24}/>} title="Badges" value={`Tem ${statsTM.badges_totais} badges`} />
                                    <TopStatBox icon={<BiBriefcase size={24}/>} title="Service Line Liders" value={`${statsTM.sll_online} sll online`} />
                                </div>
                            </div>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <BiUserCircle size={55} color="white" />
                            </div>
                        </Card.Body>
                    </Card>

                    {/* CABEÇALHO DA ÁREA */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h5 className="mb-0 fw-bold">Área: {areaFocada.nome}</h5>
                            <small className="text-muted">Tem {areaFocada.total} consultores</small>
                        </div>
                        <Button variant="outline-secondary" size="sm" className="d-flex align-items-center gap-2 rounded-3 bg-white">
                            <BiMenu /> Ver Todos
                        </Button>
                    </div>

                    <Row className="mb-4">
                        {/* LISTA TOP 3 CONSULTORES */}
                        <Col lg={8}>
                            <h6 className="mb-3 fw-bold text-secondary">Top 3 este mês:</h6>
                            {topConsultores.length > 0 ? (
                                topConsultores.map((consultor) => (
                                    <ConsultorCard key={consultor.id} data={consultor} />
                                ))
                            ) : (
                                <p className="text-muted small">Nenhum consultor com badges atribuídos este mês.</p>
                            )}
                        </Col>

                        {/* CARDS DE ESTATÍSTICAS (DIREITA) */}
                        <Col lg={4} className="d-flex flex-column gap-3 mt-4 mt-lg-0 pt-lg-4">
                            <RightStatCard 
                                icon={<BiMedal size={30} color="white" />} 
                                iconBg="#000"
                                value={statsTM.badges_atribuidos_mes} 
                                text="Badges atribuídos este mês" 
                            />
                            <RightStatCard 
                                icon={<BiTime size={30} color="black" />} 
                                iconBg="transparent"
                                borderIcon={true}
                                value={statsTM.candidaturas_ativas} 
                                text={<span>Candidaturas ativas <br/><span className="text-danger">{statsTM.candidaturas_por_ver} por ver</span></span>} 
                            />
                            <RightStatCard 
                                icon={<BiGroup size={30} color="black" />} 
                                iconBg="transparent"
                                borderIcon={true}
                                value={statsTM.total_consultores} 
                                text={<span>Consultores <br/><span className="text-success">{statsTM.crescimento_consultores} este mês</span></span>} 
                            />
                        </Col>
                    </Row>

                    {/* GRÁFICO DE BARRAS DINÂMICO */}
                    <h6 className="mb-4 fw-bold text-secondary">Total de consultores em cada área</h6>
                    <div className="bg-white p-4 rounded-4 border shadow-sm d-flex align-items-end justify-content-around" style={{ height: 250 }}>
                        {dadosGrafico.length > 0 ? (
                            dadosGrafico.map((col, index) => (
                                <BarColumn key={index} label={col.label} value={col.value} color={col.color || "#8fb4f9"} max={col.max || 15} />
                            ))
                        ) : (
                            <p className="text-muted w-100 text-center mb-0">Sem dados de distribuição por área.</p>
                        )}
                    </div>

                </div>

                <RightSidebar />
            </div>
        </div>
    );
}

// Componentes auxiliares de UI preservados
function TopStatBox({ icon, title, value }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.15)', padding: '10px 16px', borderRadius: 10 }}>
            <div>{icon}</div>
            <div>
                <div style={{ fontSize: 11, opacity: 0.9 }}>{title}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
            </div>
        </div>
    );
}

function ConsultorCard({ data }) {
    return (
        <Card className="mb-3 border-0 shadow-sm rounded-4">
            <Card.Body className="p-3 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                    <div style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BiUserCircle size={30} className="text-secondary" />
                    </div>
                    <div>
                        <div className="fw-bold mb-0">{data.nome} <span className="text-muted fw-normal ms-2" style={{fontSize: 13}}>✉ {data.email}</span></div>
                        <small className="text-muted">{data.area}</small>
                    </div>
                </div>
                <div className="text-end">
                    <div className="text-primary fw-bold mb-1" style={{ fontSize: 14 }}>
                        <BiMedal /> {data.badges} badges
                    </div>
                    <a href={`/perfil/${data.id}`} className="text-decoration-none small" style={{ fontSize: 12 }}>Ver perfil</a>
                </div>
            </Card.Body>
        </Card>
    );
}

function RightStatCard({ icon, iconBg, borderIcon, value, text }) {
    return (
        <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="d-flex align-items-center p-3 gap-3">
                <div style={{ 
                    width: 60, height: 60, borderRadius: 12, backgroundColor: iconBg, 
                    border: borderIcon ? '2px solid #000' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                    {icon}
                </div>
                <div className="text-center w-100">
                    <h4 className="fw-bold mb-0">{value}</h4>
                    <small className="text-muted fw-semibold" style={{ fontSize: 13, display: 'block', lineHeight: '1.2' }}>{text}</small>
                </div>
            </Card.Body>
        </Card>
    );
}

function BarColumn({ label, value, color, max }) {
    const heightPercent = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="d-flex flex-column align-items-center" style={{ width: '25%' }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 10 }}>{value}</div>
            <div style={{ width: 40, height: 150, display: 'flex', alignItems: 'flex-end', backgroundColor: '#f8f9fa', borderRadius: '8px 8px 0 0' }}>
                <div style={{ width: '100%', height: `${heightPercent}%`, backgroundColor: color, borderRadius: '8px 8px 0 0', transition: 'height 0.5s' }}></div>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 10, textAlign: 'center' }}>{label}</div>
        </div>
    );
}

export default DashboardTM;