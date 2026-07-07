import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner } from 'react-bootstrap';

import Header from "../../components/TM_Header.jsx";
import RightSidebar from "../../components/TM_RightBar.jsx";
import LeftBarTM from "../../components/LeftBarTM.jsx";
import api from "../../services/api.js";

function AvaliacaoSolicitacaoTM() {
  const { id } = useParams(); 
  const navigate = useNavigate();

  // Estados principais
  const [candidatura, setCandidatura] = useState(null);
  const [requisitos, setRequisitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [idExpandido, setIdExpandido] = useState(null);
  const [atualizarDados, setAtualizarDados] = useState(0);

  // NOVOS ESTADOS: Controlar loadings das ações assíncronas
  const [avaliandoId, setAvaliandoId] = useState(null); // Guarda o ID da evidência em processamento
  const [finalizando, setFinalizando] = useState(false); // Controla o loading do botão final do Badge

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        const response = await api.get(`/candidaturas/pedido/${id}`);
        const linhasBD = response.data;

        if (!linhasBD || linhasBD.length === 0) {
          setError("Nenhum dado encontrado para esta solicitação.");
          setLoading(false);
          return;
        }
        
        const primeiraLinha = linhasBD[0];

        setCandidatura({
          consultor: {
            id: primeiraLinha.id_consultor,
            nome: primeiraLinha.nome_consultor,
            email: primeiraLinha.email_consultor,
            dataContratacao: primeiraLinha.data_contratacao || "Não disponível", 
            departamento: primeiraLinha.departamento || "Technology Consulting",
            badgesConquistados: primeiraLinha.badges_conquistados || 0
          },
          badge: {
            id: primeiraLinha.id_badge,
            nome: primeiraLinha.nome_badge,
            descricao: primeiraLinha.descricao_badge,
            categoria: primeiraLinha.categoria_badge || "Tecnologia",
            dataSolicitacao: new Date(primeiraLinha.data_submisao).toLocaleDateString('pt-PT')
          }
        });

        const requisitosTratados = linhasBD.map(linha => ({
          id: linha.id_requisitos,                    
          idEvidencia: linha.id_evidencia,            
          idCandidaturaPedido: linha.id_candidatura_pedido, 
          titulo: linha.nome_requisito,
          descricao: linha.descricao_requisito,
          evidenciaTexto: linha.descricao_evidencia,
          documento: linha.nome_ficheiro,
          caminhoFicheiro: linha.caminho_ficheiro, // Guardamos o caminho para poder visualizar
          estado: linha.estado_evidencia_tm || 'SEM_EVIDENCIA'
        }));

        setRequisitos(requisitosTratados);
        
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

  // NOVA FUNÇÃO: Abrir o ficheiro armazenado no backend numa nova aba
  const handleVisualizarFicheiro = (nomeFicheiro) => {
    if (!nomeFicheiro) return;
    // Descobre o domínio base da API (ex: http://localhost:3000) e aponta para a pasta pública de uploads
    const urlBase = api.defaults.baseURL ? api.defaults.baseURL.split('/api')[0] : 'http://localhost:3000';
    const urlFicheiro = `${urlBase}/uploads/${nomeFicheiro}`;
    window.open(urlFicheiro, '_blank');
  };

  // ACEITAR EVIDÊNCIA (Com bloqueio de duplo clique)
  const handleAceitarEvidencia = async (idEvidencia) => {
    if (!idEvidencia || idEvidencia === 'SEM_EVIDENCIA') return;
    try {
      setAvaliandoId(idEvidencia); // Ativa o loading para este botão específico
      await api.post("/candidaturas/tm/avaliar-evidencia", {
        id_evidencia: idEvidencia,
        estado_evidencia_tm: "APROVADO"
      });
      
      setAtualizarDados(prev => prev + 1); 
    } catch (err) {
      console.error(err);
      alert("Erro ao aceitar a evidência.");
    } finally {
      setAvaliandoId(null); // Liberta o loading
    }
  };

  // REJEITAR EVIDÊNCIA
  const handleRejeitarEvidencia = async (idEvidencia, idCandidaturaPedido) => {
    if (!idEvidencia || idEvidencia === 'SEM_EVIDENCIA') return;

    const motivo = prompt("Por favor, introduza o motivo da rejeição desta evidência:");
    if (motivo === null) return; 
    if (!motivo.trim()) {
      alert("É obrigatório deixar um comentário para rejeitar a evidência.");
      return;
    }

    try {
      setAvaliandoId(idEvidencia); // Ativa o loading
      await api.post("/candidaturas/tm/avaliar-evidencia", {
        id_evidencia: idEvidencia,
        estado_evidencia_tm: "REJEITADA",
        id_candidatura_pedido: idCandidaturaPedido,
        comentarios: motivo
      });
      
      setAtualizarDados(prev => prev + 1); 
    } catch (err) {
      console.error(err);
      alert("Erro ao rejeitar a evidência.");
    } finally {
      setAvaliandoId(null); // Liberta o loading
    }
  };

  // Cálculos de Progresso
  const totalRequisitos = requisitos.length;
  const avaliadosCount = requisitos.filter(r => {
    const st = r.estado?.toUpperCase();
    return st === 'APROVADO' || st === 'APROVADA' || st === 'REJEITADO' || st === 'REJEITADA';
  }).length;

  const todosAprovados = requisitos.length > 0 && requisitos.every(r => {
    const st = r.estado?.toUpperCase();
    return st === 'APROVADO' || st === 'APROVADA';
  });

  const percentagemProgresso = totalRequisitos > 0 ? (avaliadosCount / totalRequisitos) * 100 : 0;

  const obterEstiloEstado = (estado) => {
    const st = estado?.toUpperCase();
    if (st === 'PENDENTE') return { bg: '#fff3cd', text: '#664d03', label: 'PENDENTE' };
    if (st === 'APROVADO' || st === 'APROVADA') return { bg: '#d1e7dd', text: '#0f5132', label: 'APROVADO' };
    if (st === 'REJEITADA' || st === 'REJEITADO') return { bg: '#f8d7da', text: '#842029', label: 'REJEITADO' };
    return { bg: '#e9ecef', text: '#495057', label: 'SEM EVIDÊNCIA' };
  };

  // SUBMISSÃO FINAL (Com tratamento do Erro 404 corrigido para /pedido/)
  const finalizarValidacaoBadge = async () => {
  if (!todosAprovados) return;
  
  try {
    setFinalizando(true); 
    
    await api.post("/candidaturas/tm/finalizar-avaliacao", {
      id_candidatura_pedido: Number(id), 
      estado_evidencia_tm: "APROVADO",        
      comentarios: "Todos os requisitos foram validados e aprovados com sucesso."
    });

    navigate('/tm/Solicitacoes'); 
  } catch (err) {
    console.error("Erro ao finalizar badge:", err);

    const mensagemErroBackend = err.response?.data?.error || err.message;
    alert(`Erro no Servidor: ${mensagemErroBackend}`);
    
  } finally {
    setFinalizando(false); // Desativa o loading
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
        <LeftBarTM />

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: '#6c757d', fontSize: '14px', marginBottom: '20px', cursor: 'pointer', fontWeight: '500' }}
          >
            ← Voltar para as solicitações
          </button>

          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* ================= CARD: PERFIL DO CONSULTOR ================= */}
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
                    <div style={{ color: '#adb5bd', fontSize: '11px', fontWeight: '500' }}>Data de Contratação</div>
                    <div style={{ fontWeight: '600', color: '#495057' }}>{candidatura.consultor.dataContratacao}</div>
                  </div>
                  <div>
                    <div style={{ color: '#adb5bd', fontSize: '11px', fontWeight: '500' }}>Departamento</div>
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

            {/* ================= CARD: INFORMAÇÃO DO BADGE ================= */}
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
                  onClick={() => navigate(`/tm/badge/${candidatura.badge.id}`)}
                  style={{ background: 'none', border: '1px solid #6c757d', color: '#495057', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Ver Detalhes do Badge
                </button>
              </div>
            </div>

            {/* ================= LISTA DE REQUISITOS ================= */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {requisitos.map((req) => {
                const configEstado = obterEstiloEstado(req.estado);
                const temEvidenciaReal = req.idEvidencia && req.estado !== 'SEM_EVIDENCIA';
                const estaAvaliandoEste = avaliandoId === req.idEvidencia;

                return (
                  <div key={req.id} style={{ backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e9ecef', overflow: 'hidden' }}>
                    
                    <div 
                      onClick={() => toggleAccordion(req.id)}
                      style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', backgroundColor: '#f8f9fa' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#212529' }}>{req.titulo}</span>
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
                            {req.evidenciaTexto && (
                              <div>
                                <div style={{ fontWeight: '700', color: '#495057', marginBottom: '6px' }}>Evidência apresentada</div>
                                <p style={{ color: '#495057', backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '8px', margin: 0, border: '1px solid #e9ecef' }}>
                                  {req.evidenciaTexto}
                                </p>
                              </div>
                            )}

                            {req.documento && (
                              <div>
                                <div style={{ fontWeight: '700', color: '#495057', marginBottom: '8px' }}>Documentos</div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8f9fa', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e9ecef', maxWidth: '400px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span>📄</span>
                                    <div>
                                      <div style={{ fontWeight: '600', color: '#495057', fontSize: '12px' }}>{req.documento}</div>
                                    </div>
                                  </div>
                                  {/* CORREÇÃO: Função de visualizar adicionada ao clique */}
                                  <button 
                                    onClick={() => handleVisualizarFicheiro(req.documento)}
                                    style={{ background: 'none', border: 'none', color: '#0d6efd', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                  >
                                    Visualizar
                                  </button>
                                </div>
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', paddingTop: '10px' }}>
                              {req.estado?.toUpperCase() === 'PENDENTE' ? (
                                <>
                                  <button 
                                    onClick={() => handleAceitarEvidencia(req.idEvidencia)}
                                    disabled={avaliandoId !== null}
                                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer', backgroundColor: '#0d6efd', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}
                                  >
                                    {estaAvaliandoEste ? (
                                      <>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        A processar...
                                      </>
                                    ) : '✓ Validar Evidência'}
                                  </button>
                                  <button 
                                    onClick={() => handleRejeitarEvidencia(req.idEvidencia, req.idCandidaturaPedido)}
                                    disabled={avaliandoId !== null}
                                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer', backgroundColor: '#e9ecef', color: '#495057' }}
                                  >
                                    ✕ Rejeitar Evidência
                                  </button>
                                </>
                              ) : (
                                <div style={{ fontStyle: 'italic', color: '#6c757d', fontSize: '12px', marginTop: '4px' }}>
                                  Ação concluída para esta evidência ({req.estado?.toLowerCase()}).
                                </div>
                              )}
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

            {/* ================= CARD INFERIOR: PROGRESSO E SUBMISSÃO ================= */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e9ecef', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <h6 style={{ fontWeight: '700', color: '#212529', margin: '0 0 4px 0' }}>Progresso de Avaliação</h6>
                <small style={{ color: '#adb5bd', fontWeight: '600' }}>{avaliadosCount} / {totalRequisitos} Requisitos Avaliados</small>
              </div>

              <div style={{ width: '100%', backgroundColor: '#e9ecef', borderRadius: '10px', height: '10px', maxWidth: '400px', margin: '0 auto', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#0d6efd', height: '100%', width: `${percentagemProgresso}%`, transition: 'width 0.3s ease' }}></div>
              </div>

              <div style={{ paddingTop: '10px' }}>
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
              </div>
            </div>

          </div>
        </div>
        <RightSidebar />
      </div>
    </div>
  );
}

export default AvaliacaoSolicitacaoTM;