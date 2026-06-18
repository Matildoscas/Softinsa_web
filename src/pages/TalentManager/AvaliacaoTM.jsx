import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Accordion, Button, Spinner, Form } from "react-bootstrap";

function AvaliarCandidatura() {
  const { id } = useParams(); // Pega o id_candidatura_pedido vindo da URL
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comentarios, setComentarios] = useState("");

  useEffect(() => {
    api.get(`/api/candidaturas/tm/candidatura/${id}`)
      .then(res => setDados(res.data))
      .catch(err => console.error("Erro ao carregar candidatura:", err))
      .finally(() => setLoading(false));
  }, [id]);

  // 🛠️ TRANQUE DE SEGURANÇA: Percorre todos os requisitos e verifica se algum ainda está PENDENTE
  const todasEvidenciasAvaliadas = dados?.requisitos.every(req => {
    if (!req.evidencia) return true; // Se não tem evidência associada, ignora ou valida por omissão
    return req.evidencia.estado === "APROVADO" || req.evidencia.estado === "REJEITADO";
  });

  // Ação ao clicar em APROVAR ou REJEITAR uma única evidência dentro do Accordion
  const handleAvaliarEvidencia = (idEvidencia, novoEstado) => {
    api.post("/api/candidaturas/tm/avaliar-evidencia", { id_evidencia: idEvidencia, estado: novoEstado })
      .then(() => {
        // Atualiza o estado local imediatamente para pintar a tag no ecrã e reavaliar o botão final
        setDados(prev => ({
          ...prev,
          requisitos: prev.requisitos.map(r => 
            r.evidencia?.id === idEvidencia 
              ? { ...r, evidencia: { ...r.evidencia, estado: novoEstado } } 
              : r
          )
        }));
      })
      .catch(err => alert("Erro ao atualizar evidência"));
  };

  // Submissão final para a tabela candidatura_tm
  const handleFinalizarBadge = (statusVeredito) => {
    api.post("/api/candidaturas/tm/finalizar-avaliacao", {
      id_candidatura_pedido: dados.id_candidatura_pedido,
      estado: statusVeredito, // 'APROVADO' ou 'REJEITADO'
      comentarios: comentarios
    })
    .then(() => {
      alert(`Candidatura enviada com sucesso para o Service Line Leader!`);
      navigate("/tm/solicitacoes"); // Volta para a listagem
    })
    .catch(err => console.error(err));
  };

  if (loading) return <Spinner animation="border" />;
  if (!dados) return <div>Candidatura não encontrada.</div>;

  return (
    <div className="p-4">
      {/* Cabeçalho com dados do Consultor e do Badge */}
      <h3>Validar Badge: {dados.badge.nome}</h3>
      <p>Consultor: {dados.consultor.nome} ({dados.consultor.email})</p>

      {/* Accordion dos Requisitos (Renderiza exatamente como no teu Mockup) */}
      <Accordion defaultActiveKey="0" className="mb-4">
        {dados.requisitos.map((req, index) => (
          <Accordion.Item eventKey={String(index)} key={req.id_requisito}>
            <Accordion.Header>
              <strong>Requisito {index + 1}</strong> - {req.nome}
              <span className={`ms-3 badge ${req.evidencia?.estado === 'APROVADO' ? 'bg-success' : req.evidencia?.estado === 'REJEITADO' ? 'bg-danger' : 'bg-warning'}`}>
                {req.evidencia?.estado || 'PENDENTE'}
              </span>
            </Accordion.Header>
            <Accordion.Body>
              <p>{req.descricao}</p>
              {req.evidencia ? (
                <div className="border p-3 bg-light rounded">
                  <h6>Evidência Apresentada:</h6>
                  <p className="small italic">"{req.evidencia.descricao}"</p>
                  <a href={`${api.defaults.baseURL}${req.evidencia.caminho}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary mb-3">
                    📄 Visualizar {req.evidencia.nome_ficheiro}
                  </a>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => handleAvaliarEvidencia(req.evidencia.id, "APROVADO")}>
                      ✓ Validar Evidência
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleAvaliarEvidencia(req.evidencia.id, "REJEITADO")}>
                      ✕ Rejeitar Evidência
                    </Button>
                  </div>
                </div>
              ) : <p className="text-muted">Nenhuma evidência submetida.</p>}
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>

      {/* Caixa de Comentários do TM */}
      <Form.Group className="mb-3">
        <Form.Label>Comentários de Avaliação (Opcional):</Form.Label>
        <Form.Control as="textarea" rows={3} value={comentarios} onChange={(e) => setComentarios(e.target.value)} placeholder="Introduza notas sobre a avaliação que ficarão registadas na tabela candidatura_tm..." />
      </Form.Group>

      {/* 🏁 BOTÃO FINAL: Fica bloqueado (disabled) até que a verificação de segurança retorne true */}
      <div className="d-flex gap-3">
        <Button 
          variant="success" 
          disabled={!todasEvidenciasAvaliadas} 
          onClick={() => handleFinalizarBadge("APROVADO")}
        >
          ✓ Validar Badge (Enviar ao SLL)
        </Button>
        <Button 
          variant="danger" 
          disabled={!todasEvidenciasAvaliadas} 
          onClick={() => handleFinalizarBadge("REJEITADO")}
        >
          ✕ Rejeitar Candidatura Completa
        </Button>
      </div>
      {!todasEvidenciasAvaliadas && (
        <small className="text-danger d-block mt-2">
          * Deve responder a todas as evidências acima antes de poder concluir a validação do Badge.
        </small>
      )}
    </div>
  );
}

export default AvaliarCandidatura;