import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Spinner, Modal, Form } from 'react-bootstrap';
import { 
  BiArrowBack,
  BiBadge, 
  BiEnvelope, 
  BiRefresh, 
  BiSearch, 
  BiUserCircle, 
  BiFilterAlt, 
  BiSort, 
  BiInfoCircle 
} from "react-icons/bi";

import Header from "../../components/TM_Header.jsx";
import TmLeftSidebar from "../../components/TM_LeftBar.jsx";
import TmRightSidebar from "../../components/TM_RightBar.jsx";
import api from "../../services/api.js";

function AvaliacaoSolicitacaoTM() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const location = useLocation();

  // Estados principais
  const [candidatura, setCandidatura] = useState(null);
  const [requisitos, setRequisitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [idExpandido, setIdExpandido] = useState(null);
  const [atualizarDados, setAtualizarDados] = useState(0);
  const [erroGuardarDecisoes, setErroGuardarDecisoes] = useState("");

  // Controlar loadings das ações assíncronas
  const [avaliandoId, setAvaliandoId] = useState(null); 
  const [finalizando, setFinalizando] = useState(false); 

  // 🎯 NOVOS ESTADOS: Para controlar o Pop-up (Modal) de Rejeição
  const [showModal, setShowModal] = useState(false);
  const [textoComentario, setTextoComentario] = useState("");
  const [modalConfig, setModalConfig] = useState({ tipo: "", idEvidencia: null, idCandidaturaPedido: null });

  const textoVoltar = location.state?.textoVoltar || "Voltar atrás";

  const lidarComVoltar = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/tm");
    }
  };

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        const response = await api.get(`/candidaturas/pedido/${id}`);
        console.log(response.data);

        const dados = response.data;

        if (!dados) {
          setError("Nenhum dado encontrado.");
          setLoading(false);
          return;
        }

        setCandidatura({
          consultor: dados.consultor,

          badge: {
            id: dados.id_badge_modelo,
            nome: dados.nome_badge,
            descricao: dados.descricao_badge,
            categoria: "Tecnologia",
            dataSolicitacao: new Date(dados.data_submisao)
            .toLocaleDateString("pt-PT")
          }
        });

        const requisitosTratados = dados.requisitos.map((requisito, index) => ({
          id: requisito.id_requisitos || index,
          titulo: requisito.nome_requisito,
          descricao: requisito.descricao_requisito,
          evidencias: Array.isArray(requisito.evidencias)
            ? requisito.evidencias.map((evidencia) => ({
                idEvidencia: evidencia.id_evidencia,
                idCandidaturaPedido: evidencia.id_candidatura_pedido,
                estado: evidencia.estado_evidencia_tm || "PENDENTE",
                evidenciaTexto: evidencia.descricao_evidencia,
                documento: evidencia.nome_ficheiro,
                caminhoFicheiro: evidencia.caminho_ficheiro,
              }))
            : [],
        }));

        setRequisitos(requisitosTratados);
        setErroGuardarDecisoes("");
        
        if (requisitosTratados.length > 0 && !idExpandido) {
          setIdExpandido(requisitosTratados[0].id);
        }

        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar detalhe da candidatura:", err);
        setError("Não foi possível carregar os dados desta avaliação.");
        setLoading(false);
      }
    }

    carregarDados();
  }, [id, atualizarDados]);

  const toggleAccordion = (idReq) => {
    setIdExpandido(prevId => prevId === idReq ? null : idReq);
  };

  const obterEvidenciasRequisito = (requisito) => {
    return Array.isArray(requisito?.evidencias)
      ? requisito.evidencias
      : [];
  };

  const obterEstadoEfetivoEvidencia = (evidencia) =>
    evidencia?.estado || "PENDENTE";

  const atualizarEstadoLocalEvidencia = (idEvidencia, estado, comentario = "") => {
    setRequisitos((prev) =>
      prev.map((requisito) => ({
        ...requisito,
        evidencias: obterEvidenciasRequisito(requisito).map((evidencia) =>
          String(evidencia.idEvidencia) === String(idEvidencia)
            ? {
                ...evidencia,
                estado,
                comentarioTm: comentario,
              }
            : evidencia,
        ),
      })),
    );

    setErroGuardarDecisoes("");
  };

  const handleVisualizarFicheiro = (caminhoFicheiro) => {
    if (!caminhoFicheiro) return;
    const urlBase = api.defaults.baseURL 
      ? api.defaults.baseURL.split('/api')[0] 
      : 'http://localhost:3000'; 
    const urlFicheiro = `${urlBase}${caminhoFicheiro}`;
    window.open(urlFicheiro, '_blank');
  };

  // ACEITAR EVIDÊNCIA 
  const handleAceitarEvidencia = async (idEvidencia, idCandidaturaPedido) => {
    if (!idEvidencia || idEvidencia === 'SEM_EVIDENCIA') return;

    try {
      setAvaliandoId(idEvidencia);
      await api.post("/candidaturas/tm/avaliar-evidencia", {
        id_v_evidencia: idEvidencia,
        id_evidencia: idEvidencia,
        id_candidatura_pedido: idCandidaturaPedido || Number(id),
        estado: "APROVADO",
      });

      atualizarEstadoLocalEvidencia(idEvidencia, 'APROVADO');
    } catch (err) {
      console.error("Erro ao aceitar evidência:", err);
      setErroGuardarDecisoes(err.response?.data?.error || "Não foi possível guardar a aprovação da evidência.");
    } finally {
      setAvaliandoId(null);
    }
  };

  const handleDesfazerEvidencia = async (idEvidencia, idCandidaturaPedido) => {
    if (!idEvidencia || idEvidencia === 'SEM_EVIDENCIA') return;

    try {
      setAvaliandoId(idEvidencia);
      await api.post("/candidaturas/tm/avaliar-evidencia", {
        id_v_evidencia: idEvidencia,
        id_evidencia: idEvidencia,
        id_candidatura_pedido: idCandidaturaPedido || Number(id),
        estado: "PENDENTE",
      });

      atualizarEstadoLocalEvidencia(idEvidencia, 'PENDENTE', '');
    } catch (err) {
      console.error("Erro ao desfazer avaliação da evidência:", err);
      setErroGuardarDecisoes(err.response?.data?.error || "Não foi possível desfazer a avaliação da evidência.");
    } finally {
      setAvaliandoId(null);
    }
  };

  // 🎯 REJEITAR EVIDÊNCIA: Agora apenas abre o Pop-up
  const handleRejeitarEvidencia = (idEvidencia, idCandidaturaPedido) => {
    if (!idEvidencia || idEvidencia === 'SEM_EVIDENCIA') return;

    setModalConfig({
      tipo: "EVIDENCIA",
      idEvidencia,
      idCandidaturaPedido
    });
    setTextoComentario("");
    setShowModal(true);
  };

  // 🎯 REJEITAR CANDIDATURA GLOBAL: Agora apenas abre o Pop-up
  const handleRejeitarCandidaturaGlobal = () => {
    if (!peloMenosUmRejeitado) return;

    setModalConfig({
      tipo: "GLOBAL",
      idEvidencia: null,
      idCandidaturaPedido: Number(id)
    });
    setTextoComentario("");
    setShowModal(true);
  };

  // 🎯 SUBMISSÃO DO POP-UP: Centraliza a lógica de envio
  const lidarComConfirmarRejeicao = async () => {
    if (!textoComentario.trim()) {
      alert("É obrigatório deixar uma justificação/comentário para a rejeição.");
      return;
    }

    setShowModal(false);

    try {
      if (modalConfig.tipo === "EVIDENCIA") {
        setAvaliandoId(modalConfig.idEvidencia);
        await api.post("/candidaturas/tm/avaliar-evidencia", {
          id_v_evidencia: modalConfig.idEvidencia,
          id_evidencia: modalConfig.idEvidencia,
          id_candidatura_pedido: modalConfig.idCandidaturaPedido || Number(id),
          estado: "REJEITADA",
          comentarios: textoComentario.trim(),
        });

        atualizarEstadoLocalEvidencia(
          modalConfig.idEvidencia,
          'REJEITADA',
          textoComentario.trim(),
        );

      } else if (modalConfig.tipo === "GLOBAL") {
        setFinalizando(true);

        await api.post("/candidaturas/tm/finalizar-avaliacao", {
          id_candidatura_pedido: Number(id),
          estado: "REJEITADO", 
          comentarios: textoComentario.trim()
        });
        navigate('/tm/Solicitacoes');
      }
    } catch (err) {
      console.error("Erro ao submeter rejeição:", err);
      setErroGuardarDecisoes(err.response?.data?.error || err.message || "Não foi possível guardar a rejeição.");
    } finally {
      setAvaliandoId(null);
      setFinalizando(false);
    }
  };

  const normalizarEstadoAvaliacao = (estado) => {
    const valor = String(estado || "").trim().toUpperCase();
    if (["APROVADA", "APROVADO", "APROVADO_TM", "VALIDADA", "VALIDADO"].includes(valor)) return "APROVADA";
    if (["REJEITADA", "REJEITADO", "RECUSADA", "RECUSADO"].includes(valor)) return "REJEITADA";
    if (valor === "PENDENTE") return "PENDENTE";
    return "SEM_EVIDENCIA";
  };

  const obterEstadoRequisito = (requisito) => {
    const evidencias = obterEvidenciasRequisito(requisito);

    if (evidencias.length === 0) {
      return "SEM_EVIDENCIA";
    }

    const estados = evidencias.map((evidencia) =>
      normalizarEstadoAvaliacao(
        obterEstadoEfetivoEvidencia(evidencia),
      ),
    );

    if (estados.some((estado) => estado === "REJEITADA")) {
      return "REJEITADA";
    }

    if (estados.every((estado) => estado === "APROVADA")) {
      return "APROVADA";
    }

    return "PENDENTE";
  };

  // Cálculos de Progresso
  const totalRequisitos = requisitos.length;
  const avaliadosCount = requisitos.filter((r) => {
    const estado = obterEstadoRequisito(r);
    return estado === "APROVADA" || estado === "REJEITADA";
  }).length;

  const todosAprovados = requisitos.length > 0 && requisitos.every((r) => {
    return obterEstadoRequisito(r) === "APROVADA";
  });

  const peloMenosUmRejeitado = requisitos.length > 0 && requisitos.some((r) => {
    return obterEstadoRequisito(r) === "REJEITADA";
  });

  const percentagemProgresso = totalRequisitos > 0 ? (avaliadosCount / totalRequisitos) * 100 : 0;

  const obterEstiloEstado = (estado) => {
    const st = normalizarEstadoAvaliacao(estado);
    if (st === "PENDENTE") return { bg: "#fff3cd", text: "#664d03", label: "PENDENTE" };
    if (st === "APROVADA") return { bg: "#d1e7dd", text: "#0f5132", label: "APROVADO POR TM" };
    if (st === "REJEITADA") return { bg: "#f8d7da", text: "#842029", label: "REJEITADO" };
    return { bg: "#e9ecef", text: "#495057", label: "SEM EVIDÊNCIA" };
  };

  // SUBMISSÃO FINAL DE SUCESSO
  const finalizarValidacaoBadge = async () => {
    if (!todosAprovados) return;
    try {
      setFinalizando(true); 

      await api.post("/candidaturas/tm/finalizar-avaliacao", {
        id_candidatura_pedido: Number(id), 
        estado: "APROVADO", 
        comentarios: "Todos os requisitos foram validados e aprovados com sucesso."
      });
      navigate('/tm/Solicitacoes'); 
    } catch (err) {
      console.error("Erro ao finalizar badge:", err);
      setErroGuardarDecisoes(err.response?.data?.error || err.message || "Não foi possível finalizar a avaliação.");
    } finally {
      setFinalizando(false); 
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#f0f2f5', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">A carregar detalhes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', color: 'red', fontWeight: 'bold' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <TmLeftSidebar />

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          <button type="button" onClick={lidarComVoltar} style={voltarButton}>
            <BiArrowBack size={18} />
              {textoVoltar}
          </button>

          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* CARD: PERFIL DO CONSULTOR */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e9ecef' }}>
              <h5 style={{ color: '#495057', fontWeight: '600', marginBottom: '20px' }}>Perfil do Consultor</h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', minWidth: '140px' }}>
                  <div style={{ width: '70px', height: '70px', backgroundColor: '#e9ecef', borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>👤</div>
                  <h6 style={{ fontWeight: '700', marginBottom: '4px', color: '#212529' }}>{candidatura.consultor.nome}</h6>
                  <span style={{ fontSize: '11px', backgroundColor: '#e7f1ff', color: '#0d6efd', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>Consultor</span>
                </div>

                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '13px' }}>
                  <div>
                    <div style={{ color: '#adb5bd', fontSize: '11px', fontWeight: '500' }}>Email</div>
                    <div style={{ fontWeight: '600', color: '#495057', wordBreak: 'break-all' }}>{candidatura.consultor.email}</div>
                  </div>
                  <div>
                    <div style={{ color: '#adb5bd', fontSize: '11px', fontWeight: '500' }}>Data de Entrada</div>
                    <div style={{ fontWeight: '600', color: '#495057' }}>{candidatura.consultor.dataContratacao}</div>
                  </div>
                  <div>
                    <div style={{ color: '#adb5bd', fontSize: '11px', fontWeight: '500' }}>Area do consultor</div>
                    <div style={{ fontWeight: '600', color: '#495057' }}>{candidatura.consultor.departamento}</div>
                  </div>
                  <div>
                    <div style={{ color: '#adb5bd', fontSize: '11px', fontWeight: '500' }}>Badges Conquistados</div>
                    <div style={{ fontWeight: '600', color: '#495057' }}>{candidatura.consultor.badgesConquistados} badges</div>
                    <button
                      onClick={() => navigate(`/tm/consultores/${candidatura.consultor.id}`)}
                      style={{ marginTop: '8px', display: 'block', background: 'none', border: '1px solid #0d6efd', color: '#0d6efd', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Ver Perfil Completo
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD: INFORMAÇÃO DO BADGE */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '55px', height: '55px', backgroundColor: '#e7f1ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>📘</div>
                <div>
                  <h6 style={{ fontWeight: '700', margin: '0 0 4px 0', color: '#212529' }}>{candidatura.badge.nome}</h6>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#6c757d' }}>{candidatura.badge.descricao}</p>
                  <span style={{ fontSize: '11px', backgroundColor: '#e7f1ff', color: '#0d6efd', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>{candidatura.badge.categoria}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#adb5bd', fontWeight: '500' }}>Solicitado em {candidatura.badge.dataSolicitacao}</p>
                <button
                  onClick={() => navigate(`/tm/badges/${candidatura.badge.id}`)}
                  style={{ background: 'none', border: '1px solid #6c757d', color: '#495057', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Ver Detalhes do Badge
                </button>
              </div>
            </div>

            {/* LISTA DE REQUISITOS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requisitos.map((req) => {
                const estadoRequisito = obterEstadoRequisito(req);
                const configEstado = obterEstiloEstado(estadoRequisito);
                const evidencias = obterEvidenciasRequisito(req);
                const temEvidenciaReal = evidencias.length > 0;

                return (
                  <div key={req.id} style={{ backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e9ecef', overflow: 'hidden' }}>
                    
                    <div 
                      onClick={() => toggleAccordion(req.id)}
                      style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', backgroundColor: '#f8f9fa' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#212529' }}>{req.titulo}</span>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                          {evidencias.length} evidência(s)
                        </span>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '700', backgroundColor: configEstado.bg, color: configEstado.text }}>
                          {configEstado.label}
                        </span>
                      </div>
                      <span style={{ color: '#adb5bd', fontSize: '12px' }}>{idExpandido === req.id ? '▲' : '▼'}</span>
                    </div>

                    {idExpandido === req.id && (
                      <div style={{ padding: '20px', borderTop: '1px solid #f1f3f5', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: '#495057', marginBottom: '6px' }}>Descrição do Requisito</div>
                          <p style={{ color: '#6c757d', margin: 0, lineHeight: '1.5' }}>{req.descricao || "Sem descrição disponível."}</p>
                        </div>

                        {temEvidenciaReal ? (
                          <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              {evidencias.map((evidencia, index) => {
                                const estadoEvidencia = normalizarEstadoAvaliacao(
                                  obterEstadoEfetivoEvidencia(evidencia),
                                );
                                const estaAvaliandoEste = avaliandoId === evidencia.idEvidencia;

                                return (
                                  <div key={evidencia.idEvidencia || index} style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '10px', padding: '12px' }}>
                                    <div style={{ fontWeight: '700', color: '#334155', fontSize: '12px', marginBottom: '8px' }}>
                                      Evidência {index + 1}
                                    </div>

                                    {evidencia.evidenciaTexto && (
                                      <div style={{ marginBottom: '10px' }}>
                                        <div style={{ fontWeight: '700', color: '#495057', marginBottom: '6px' }}>Descrição da evidência</div>
                                        <p style={{ color: '#495057', backgroundColor: '#ffffff', padding: '12px', borderRadius: '8px', margin: 0, border: '1px solid #e9ecef' }}>
                                          {evidencia.evidenciaTexto}
                                        </p>
                                      </div>
                                    )}

                                    {evidencia.documento && (
                                      <div>
                                        <div style={{ fontWeight: '700', color: '#495057', marginBottom: '8px' }}>Documento</div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span>📄</span>
                                            <div>
                                              <div style={{ fontWeight: '600', color: '#495057', fontSize: '12px' }}>{evidencia.documento}</div>
                                            </div>
                                          </div>
                                          <button 
                                            onClick={() => handleVisualizarFicheiro(evidencia.caminhoFicheiro)}
                                            style={{ background: 'none', border: 'none', color: '#0d6efd', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                          >
                                            Visualizar
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '10px', paddingTop: '10px', flexWrap: 'wrap' }}>
                                      <button 
                                        onClick={() => handleAceitarEvidencia(evidencia.idEvidencia, evidencia.idCandidaturaPedido)}
                                        disabled={finalizando || estaAvaliandoEste}
                                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: finalizando || estaAvaliandoEste ? 'not-allowed' : 'pointer', backgroundColor: estadoEvidencia === 'APROVADA' ? '#198754' : '#0d6efd', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', opacity: finalizando || estaAvaliandoEste ? 0.6 : 1 }}
                                      >
                                        {estaAvaliandoEste ? 'A guardar...' : estadoEvidencia === 'APROVADA' ? '✓ Aprovada' : '✓ Validar Evidência'}
                                      </button>

                                      <button 
                                        onClick={() => handleRejeitarEvidencia(evidencia.idEvidencia, evidencia.idCandidaturaPedido)}
                                        disabled={finalizando || estaAvaliandoEste}
                                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: finalizando || estaAvaliandoEste ? 'not-allowed' : 'pointer', backgroundColor: estadoEvidencia === 'REJEITADA' ? '#dc3545' : '#e9ecef', color: estadoEvidencia === 'REJEITADA' ? '#ffffff' : '#495057', opacity: finalizando || estaAvaliandoEste ? 0.6 : 1 }}
                                      >
                                        {estadoEvidencia === 'REJEITADA' ? '✕ Rejeitada' : '✕ Rejeitar Evidência'}
                                      </button>

                                      {estadoEvidencia !== 'PENDENTE' && (
                                        <button 
                                          onClick={() => handleDesfazerEvidencia(evidencia.idEvidencia, evidencia.idCandidaturaPedido)}
                                          disabled={finalizando || estaAvaliandoEste}
                                          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '700', cursor: finalizando || estaAvaliandoEste ? 'not-allowed' : 'pointer', backgroundColor: '#ffffff', color: '#475569', opacity: finalizando || estaAvaliandoEste ? 0.6 : 1 }}
                                        >
                                          Desfazer
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div style={{ color: '#dc3545', backgroundColor: '#fff5f5', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', fontWeight: '500', fontSize: '12px' }}>
                            ⚠️ O consultor ainda não anexou nenhuma evidência para este requisito.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CARD INFERIOR: PROGRESSO E SUBMISSÃO DINÂMICA */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e9ecef', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {erroGuardarDecisoes && (
                <div style={{ color: '#b91c1c', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', fontWeight: '600' }}>
                  {erroGuardarDecisoes}
                </div>
              )}

              <div>
                <h6 style={{ fontWeight: '700', color: '#212529', margin: '0 0 4px 0' }}>Progresso de Avaliação</h6>
                <small style={{ color: '#adb5bd', fontWeight: '600' }}>{avaliadosCount} / {totalRequisitos} requisitos avaliados</small>
              </div>

              <div style={{ width: '100%', backgroundColor: '#e9ecef', borderRadius: '10px', height: '10px', maxWidth: '400px', margin: '0 auto', overflow: 'hidden' }}>
                <div style={{ backgroundColor: peloMenosUmRejeitado ? '#dc3545' : '#0d6efd', height: '100%', width: `${percentagemProgresso}%`, transition: 'width 0.3s ease' }}></div>
              </div>

              <div style={{ paddingTop: '10px' }}>
                {peloMenosUmRejeitado ? (
                  <button
                    onClick={handleRejeitarCandidaturaGlobal}
                    disabled={finalizando}
                    style={{
                      width: '100%', maxWidth: '400px', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '700', transition: '0.2s',
                      backgroundColor: !finalizando ? '#dc3545' : '#e9ecef',
                      color: !finalizando ? '#ffffff' : '#adb5bd',
                      cursor: !finalizando ? 'pointer' : 'not-allowed',
                      display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                    }}
                  >
                    {finalizando ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        A Rejeitar Candidatura...
                      </>
                    ) : '✕ Rejeitar Candidatura'}
                  </button>
                ) : (
                  <button
                    onClick={finalizarValidacaoBadge}
                    disabled={!todosAprovados || finalizando}
                    style={{
                      width: '100%', maxWidth: '400px', padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '700', transition: '0.2s',
                      backgroundColor: todosAprovados && !finalizando ? '#198754' : '#e9ecef',
                      color: todosAprovados && !finalizando ? '#ffffff' : '#adb5bd',
                      cursor: todosAprovados && !finalizando ? 'pointer' : 'not-allowed',
                      display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                    }}
                  >
                    {finalizando ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        A Atribuir Badge...
                      </>
                    ) : '✓ Validar e Atribuir Badge'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
        <TmRightSidebar />
      </div>

      {/* ================= 🎯 POP-UP MODAL DO BOOTSTRAP ADICIONADO ================= */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa' }}>
          <Modal.Title style={{ fontSize: '16px', fontWeight: '700', color: '#212529' }}>
            {modalConfig.tipo === "EVIDENCIA" ? "✕ Rejeitar Evidência" : "✕ Rejeitar Candidatura Global"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label style={{ fontSize: '13px', fontWeight: '600', color: '#495057' }}>
              {modalConfig.tipo === "EVIDENCIA" 
                ? "Por favor, introduza o motivo detalhado da rejeição desta evidência (ficará guardado no histórico do requisito):" 
                : "Insira a justificação global de encerramento. Esta mensagem será enviada como notificação direta para o Consultor:"
              }
            </Form.Label>
            <Form.Control 
              as="textarea" 
              rows={4} 
              value={textoComentario}
              onChange={(e) => setTextoComentario(e.target.value)}
              placeholder="Escreve aqui a tua justificação..."
              style={{ fontSize: '13px', borderRadius: '8px' }}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: '#f8f9fa' }}>
          <Button variant="secondary" onClick={() => setShowModal(false)} style={{ fontSize: '12px', fontWeight: '600', borderRadius: '6px' }}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={lidarComConfirmarRejeicao} style={{ fontSize: '12px', fontWeight: '600', borderRadius: '6px' }}>
            Confirmar Rejeição
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}

const voltarButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: 0,
  fontSize: 14,
  cursor: "pointer",
};

export default AvaliacaoSolicitacaoTM;