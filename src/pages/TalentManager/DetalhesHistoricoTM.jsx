import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Row, Col, Spinner, Badge, Accordion } from "react-bootstrap";
import { BiArrowBack, BiUser, BiBook, BiMessageDetail, BiTask, BiFile, BiDownload } from "react-icons/bi";

import Header from "../../components/TM_Header.jsx";
import RightSidebar from "../../components/TM_RightBar.jsx";
import LeftBarTM from "../../components/LeftBarTM.jsx";
import api from "../../services/api.js";

function DetalhesHistoricoTM() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [detalhes, setDetalhes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetalhes = async () => {
            try {
                // Rota correspondente no backend para ir buscar os dados reais por ID
                const response = await api.get(`/candidaturas/tm/detalhes/${id}`);
                setDetalhes(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Erro ao carregar os detalhes da candidatura:", err);
                setError("Não foi possível carregar os detalhes desta candidatura.");
                setLoading(false);
            }
        };

        if (id) fetchDetalhes();
    }, [id]);

    const getStatusBadge = (status) => {
        const s = status?.toUpperCase() || "";
        if (s.includes("REJEITAD") || s.includes("RECUSAD")) {
            return { bg: "#fce8e8", text: "#dc3545", label: "Recusado" };
        }
        if (s.includes("APROVAD")) {
            return { bg: "#e6f8ea", text: "#198754", label: "Aprovado" };
        }
        return { bg: "#fff3cd", text: "#ffc107", label: "Em Avaliação" };
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#f4f5f7' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (error || !detalhes) {
        return (
            <div className="p-4 alert alert-danger m-5 shadow-sm rounded-3">{error || "Candidatura não encontrada."}</div>
        );
    }

    const currentStatus = getStatusBadge(detalhes.estado_candidatura);

    return (
        <div style={{ backgroundColor: '#f4f5f7', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <LeftBarTM />

                <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
                    
                    {/* TOP BAR: Voltar & Exportar */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <Button variant="link" className="text-decoration-none text-secondary p-0 d-flex align-items-center gap-2" onClick={() => navigate(-1)}>
                            <BiArrowBack size={20} /> Voltar
                        </Button>
                        <Button variant="outline-secondary" className="bg-white shadow-sm rounded-3 btn-sm px-3 text-dark border">
                            Exportar para Excel/PDF
                        </Button>
                    </div>

                    {/* CARD PRINCIPAL DE DETALHES */}
                    <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                        <Card.Body className="p-4">
                            
                            {/* Perfil do Consultor */}
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <div style={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BiUser size={26} className="text-secondary" />
                                </div>
                                <div className="lh-sm">
                                    <div className="fw-bold text-dark fs-5">{detalhes.consultor_nome}</div>
                                    <small className="text-muted d-block mb-1">Consultor</small>
                                    <small className="text-muted">{detalhes.consultor_email}</small>
                                </div>
                            </div>

                            {/* Badge Solicitado */}
                            <div className="d-flex align-items-center gap-3 p-3 rounded-3 mb-4" style={{ backgroundColor: '#f5f8ff', border: '1px solid #e5edff' }}>
                                <div style={{ width: 40, height: 40, backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexShrink: 0 }}>
                                    <BiBook size={24} className="text-secondary" />
                                </div>
                                <div className="w-100">
                                    <div className="text-primary fw-semibold mb-1">{detalhes.badge_nome}</div>
                                    <p className="text-muted small mb-2" style={{ fontSize: 13 }}>{detalhes.badge_descricao}</p>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <Badge bg="primary" style={{ backgroundColor: '#e5edff', color: '#0d6efd', fontWeight: 500 }} className="text-primary bg-opacity-10 border border-primary border-opacity-25 rounded-pill px-3 py-1">
                                            {detalhes.badge_categoria}
                                        </Badge>
                                        <small className="text-muted small">Solicitado a: {detalhes.data_submissao_formatada}</small>
                                    </div>
                                </div>
                            </div>

                            {/* SECÇÃO: Comentário do Avaliador (Se existir avaliação feita) */}
                            {detalhes.avaliador_nome && (
                                <div className="mb-4">
                                    <div className="d-flex align-items-center gap-2 mb-2 text-secondary fw-semibold small">
                                        <BiMessageDetail size={18} /> Comentário
                                    </div>
                                    <div className="p-3 rounded-3 border bg-light" style={{ fontSize: 14 }}>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <small className="text-muted d-block" style={{ fontSize: 11 }}>
                                                    {detalhes.estado_candidatura === 'REJEITADO' ? 'Rejeitado por Talent Manager' : 'Aprovado por Talent Manager'}
                                                </small>
                                                <strong className="text-dark">{detalhes.avaliador_nome}</strong>
                                                <span className="text-muted small ms-3">{detalhes.avaliador_email}</span>
                                            </div>
                                        </div>
                                        <p className="text-muted text-start fst-italic mb-2">"{detalhes.comentarios_tm}"</p>
                                        <div className="d-flex gap-4 border-top pt-2 mt-2 text-muted" style={{ fontSize: 12 }}>
                                            <span>Estado: Fechado</span>
                                            <span>Avaliado em: {detalhes.data_conclusao_formatada}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SECÇÃO: Requisitos e Evidências */}
                            <div className="mb-4">
                                <div className="d-flex align-items-center gap-2 mb-3 text-secondary fw-semibold small">
                                    <BiTask size={18} /> Requisitos
                                </div>

                                <Accordion defaultActiveKey="0" className="custom-requirements-accordion">
                                    {detalhes.requisitos && detalhes.requisitos.map((req, index) => {
                                        const reqStatus = getStatusBadge(req.estado_evidencia || 'PENDENTE');
                                        return (
                                            <Accordion.Item eventKey={String(index)} key={req.id_requisitos} className="border rounded-3 mb-2 overflow-hidden shadow-sm">
                                                <Accordion.Header>
                                                    <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                                                        <span className="fw-semibold text-dark">
                                                            Requisito {index + 1} - {req.titulo || req.nome_requisito}
                                                        </span>
                                                        <Badge style={{ backgroundColor: reqStatus.bg, color: reqStatus.text, fontWeight: 600, fontSize: 12 }} className="px-2.5 py-1">
                                                            {reqStatus.label}
                                                        </Badge>
                                                    </div>
                                                </Accordion.Header>
                                                <Accordion.Body className="bg-white border-top text-start">
                                                    <div className="mb-3">
                                                        <strong className="d-block text-dark small mb-1">Descrição</strong>
                                                        <p className="text-muted small">{req.descricao_requisito || "Sem descrição disponível."}</p>
                                                    </div>
                                                    
                                                    <div className="mb-3">
                                                        <strong className="d-block text-dark small mb-1">Evidência apresentada</strong>
                                                        <p className="text-muted small">{req.descricao_evidencia || "Nenhuma descrição textual fornecida."}</p>
                                                    </div>

                                                    {req.nome_ficheiro && (
                                                        <div>
                                                            <strong className="d-block text-dark small mb-2">Documentos</strong>
                                                            <div className="d-flex align-items-center justify-content-between border rounded-3 p-2 bg-light">
                                                                <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                                    <BiFile size={24} className="text-secondary flex-shrink-0" />
                                                                    <div className="lh-sm text-truncate">
                                                                        <div className="text-dark small fw-medium text-truncate">{req.nome_ficheiro}</div>
                                                                        <small className="text-muted" style={{ fontSize: 11 }}>{req.formato_ficheiro || 'PDF'}</small>
                                                                    </div>
                                                                </div>
                                                                <Button variant="link" href={req.caminho_ficheiro} target="_blank" className="text-primary text-decoration-none small p-0 fw-semibold flex-shrink-0">
                                                                    Visualizar
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Accordion.Body>
                                            </Accordion.Item>
                                        );
                                    })}
                                </Accordion>
                            </div>

                            {/* Banner de Estado Inferior */}
                            <div className="mt-4 pt-3 border-top text-center">
                                <div className="text-muted small mb-2">
                                    Data de Expiração: {detalhes.estado_candidatura === 'REJEITADO' ? 'Recusado sem data' : 'N/A'}
                                </div>
                                <div 
                                    className="w-100 py-2.5 rounded-3 fw-bold text-center"
                                    style={{ backgroundColor: currentStatus.bg, color: currentStatus.text, fontSize: 15 }}
                                >
                                    {detalhes.estado_candidatura === 'REJEITADO' ? '✕ Recusado' : currentStatus.label}
                                </div>
                            </div>

                        </Card.Body>
                    </Card>

                </div>

                <RightSidebar />
            </div>
        </div>
    );
}

export default DetalhesHistoricoTM;