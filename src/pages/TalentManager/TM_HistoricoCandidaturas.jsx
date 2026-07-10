import React, { useState, useEffect } from "react";
import { Card, Button, Form, InputGroup, Row, Col, Spinner, Badge } from "react-bootstrap";
import { BiArrowBack, BiSearch, BiFilter, BiSort, BiUser, BiBook, BiShow } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

import Header from "../../components/TM_Header.jsx";
import RightSidebar from "../../components/TM_RightBar.jsx";
import LeftBarTM from "../../components/LeftBarTM.jsx";
import api from "../../services/api.js";

function HistoricoCandidaturasTM() {
    const navigate = useNavigate();
    const [candidaturas, setCandidaturas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para os filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [searchConsultor, setSearchConsultor] = useState("");
    const [sortBy, setSortBy] = useState("Mais Recentes");

    useEffect(() => {
        const fetchHistorico = async () => {
            try {
                // 1. CHAMA A TUA NOVA ROTA
                const response = await api.get('/candidaturas/tm/historico');
                
                // 2. MAPEAR COM OS DADOS REAIS DA BD
                const dadosMapeados = response.data.map(item => ({
                    id: item.id_candidatura_pedido,
                    consultor: { 
                        nome: item.nome_consultor, 
                        cargo: "consultor", 
                        email: item.email_consultor 
                    },
                    badge: { 
                        titulo: item.nome_badge, 
                        descricao: item.descricao_badge, 
                        categoria: item.categoria_badge 
                    },
                    status: item.estado_candidatura_pedido, 
                    estado_validacao: item.estado_candidatura_pedido, // No histórico, o estado da BD é o que conta
                    dias_passados: item.dias_passados,
                    data_solicitacao: item.data_formatada // Data vinda já formatada do controller
                }));

                setCandidaturas(dadosMapeados);
                setLoading(false);
            } catch (error) {
                console.error("Erro ao carregar dados da BD:", error);
                setError("Não foi possível carregar as candidaturas.");
                setLoading(false);
            }
        };

        fetchHistorico();
    }, []);

    const getStatusStyle = (status) => {
        const s = status?.toUpperCase() || "";
        if (s.includes("REJEITAD")) return { bg: "#fce8e8", text: "#dc3545", icon: "✕", label: "Recusado" };
        if (s.includes("APROVAD")) return { bg: "#e6f8ea", text: "#198754", icon: "✓", label: "Aprovado" };
        if (s.includes("AVALIACAO") || s.includes("PENDENTE")) return { bg: "#fff3cd", text: "#ffc107", icon: "...", label: "Em Avaliação" };
        return { bg: "#f8f9fa", text: "#6c757d", icon: "-", label: status };
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#f4f5f7' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#f4f5f7', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <LeftBarTM />

                <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
                    <Button variant="link" className="text-decoration-none text-secondary p-0 mb-3 d-flex align-items-center gap-2" onClick={() => navigate(-1)}>
                        <BiArrowBack size={20} /> Voltar
                    </Button>

                    <div className="mb-4">
                        <h4 className="fw-bold mb-0">Histórico de Candidaturas</h4>
                        <small className="text-muted">Total de {candidaturas.length} candidaturas</small>
                    </div>

                    {error && (
                        <div className="alert alert-danger shadow-sm rounded-3">{error}</div>
                    )}

                    <Row className="mb-4 align-items-end g-3">
                        <Col lg={4}>
                            <InputGroup>
                                <InputGroup.Text className="bg-white border-end-0">
                                    <BiSearch className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control 
                                    type="text" placeholder="Buscar badge..." className="border-start-0 ps-0 bg-white"
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col lg={3}>
                            <Form.Label className="text-muted small mb-1 d-flex align-items-center gap-1"><BiFilter /> Filtrar por</Form.Label>
                            <Form.Select className="bg-white" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                <option value="">Todos os Estados</option>
                                <option value="APROVADO">Aprovado</option>
                                <option value="REJEITADO">Recusado</option>
                                <option value="PENDENTE">Pendente</option>
                            </Form.Select>
                        </Col>
                        <Col lg={3}>
                            <Form.Label className="text-muted small mb-1 d-flex align-items-center gap-1"><BiFilter /> Buscar Consultor</Form.Label>
                            <Form.Control 
                                type="text" placeholder="Nome do consultor..." className="bg-white"
                                value={searchConsultor} onChange={(e) => setSearchConsultor(e.target.value)}
                            />
                        </Col>
                    </Row>

                    <div className="d-flex flex-column gap-4">
                        {candidaturas
                            .filter(c => c.badge.titulo.toLowerCase().includes(searchTerm.toLowerCase()))
                            .filter(c => c.consultor.nome.toLowerCase().includes(searchConsultor.toLowerCase()))
                            .filter(c => filterStatus === "" || c.status.toUpperCase().includes(filterStatus))
                            .map((candidatura) => {
                                const statusStyle = getStatusStyle(candidatura.status);
                                
                                return (
                                    <Card key={candidatura.id} className="border-0 shadow-sm rounded-4 overflow-hidden">
                                        <Card.Body className="p-4">
                                            
                                            <div className="d-flex align-items-center gap-3 mb-4">
                                                <div style={{ width: 45, height: 45, borderRadius: '50%', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <BiUser size={24} className="text-secondary" />
                                                </div>
                                                <div className="lh-sm">
                                                    <div className="fw-semibold text-dark">{candidatura.consultor.nome}</div>
                                                    <small className="text-muted">{candidatura.consultor.cargo}</small><br/>
                                                    <small className="text-muted">{candidatura.consultor.email}</small>
                                                </div>
                                            </div>

                                            <Row className="align-items-center">
                                                <Col lg={9}>
                                                    <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ backgroundColor: '#f5f8ff', border: '1px solid #e5edff' }}>
                                                        <div style={{ width: 40, height: 40, backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0 }}>
                                                            <BiBook size={24} className="text-secondary" />
                                                        </div>
                                                        <div>
                                                            <div className="text-primary fw-semibold mb-1">{candidatura.badge.titulo}</div>
                                                            <p className="text-muted small mb-2" style={{ fontSize: 13 }}>{candidatura.badge.descricao}</p>
                                                            <Badge bg="primary" style={{ backgroundColor: '#e5edff', color: '#0d6efd', fontWeight: 500 }} className="text-primary bg-opacity-10 border border-primary border-opacity-25 rounded-pill px-3 py-1">
                                                                {candidatura.badge.categoria}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </Col>
                                                
                                                <Col lg={3} className="d-flex flex-column gap-2 mt-3 mt-lg-0">
                                                    <div 
                                                        className="w-100 text-center py-2 rounded-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                                                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, fontSize: 14 }}
                                                    >
                                                        <span style={{ fontSize: 12 }}>{statusStyle.icon}</span> {statusStyle.label}
                                                    </div>
                                                    <Button 
                                                        variant="light" 
                                                        className="w-100 d-flex align-items-center justify-content-center gap-2 border shadow-sm"
                                                        onClick={() => navigate(`/tm/detalhes-historico/${candidatura.id}`)}
                                                    >
                                                        <BiShow size={18} /> Ver Detalhes
                                                    </Button>
                                                </Col>
                                            </Row>

                                            <div className="d-flex gap-4 mt-4 pt-3 border-top text-muted small">
                                                <span>Submetido há: {candidatura.dias_passados} dias</span>
                                                <span>Estado Interno: {candidatura.estado_validacao}</span>
                                            </div>

                                        </Card.Body>
                                    </Card>
                                );
                        })}
                        
                        {candidaturas.length === 0 && !loading && !error && (
                            <div className="text-center text-muted p-5 bg-white rounded-4 shadow-sm">
                                Nenhuma candidatura encontrada.
                            </div>
                        )}
                    </div>
                </div>

                <RightSidebar />
            </div>
        </div>
    );
}

export default HistoricoCandidaturasTM;