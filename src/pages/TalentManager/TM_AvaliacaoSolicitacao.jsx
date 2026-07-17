import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Form, Modal } from "react-bootstrap";
import {
  BiArrowBack,
  BiBadge,
  BiBriefcase,
  BiCalendar,
  BiCheckCircle,
  BiChevronDown,
  BiChevronUp,
  BiEnvelope,
  BiFile,
  BiLinkExternal,
  BiMedal,
  BiRefresh,
  BiUserCircle,
  BiXCircle,
} from "react-icons/bi";

import Header from "../../components/Header.jsx";
import TmLeftSidebar from "../../components/TM_LeftBar.jsx";
import TmRightSidebar from "../../components/TM_RightBar.jsx";
import api from "../../services/api.js";

function AvaliacaoSolicitacaoTM() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [candidatura, setCandidatura] = useState(null);
  const [requisitos, setRequisitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [idExpandido, setIdExpandido] = useState(null);
  const [erroGuardarDecisoes, setErroGuardarDecisoes] = useState("");

  const [avaliandoId, setAvaliandoId] = useState(null);
  const [finalizando, setFinalizando] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [textoComentario, setTextoComentario] = useState("");
  const [modalConfig, setModalConfig] = useState({
    tipo: "",
    idEvidencia: null,
    idCandidaturaPedido: null,
  });

  const textoVoltar = location.state?.textoVoltar || "Voltar para as solicitações";

  useEffect(() => {
    carregarDados();
  }, [id]);

  async function carregarDados() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/candidaturas/pedido/${id}`);
      const dados = response.data;

      if (!dados) {
        setError("Nenhum dado encontrado.");
        return;
      }

      setCandidatura({
        consultor: dados.consultor || {},
        badge: {
          id: dados.id_badge_modelo,
          nome: dados.nome_badge,
          descricao: dados.descricao_badge,
          categoria: "Tecnologia",
          dataSolicitacao: new Date(dados.data_submisao).toLocaleDateString("pt-PT"),
        },
      });

      const requisitosTratados = Array.isArray(dados.requisitos)
        ? dados.requisitos.map((requisito, index) => ({
            id: requisito.id_requisitos || index + 1,
            titulo: requisito.nome_requisito || `Requisito ${index + 1}`,
            descricao: requisito.descricao_requisito || "Sem descrição.",
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
          }))
        : [];

      setRequisitos(requisitosTratados);
      setErroGuardarDecisoes("");

      if (requisitosTratados.length > 0) {
        setIdExpandido(requisitosTratados[0].id);
      }
    } catch (err) {
      console.error("Erro ao carregar detalhe da candidatura:", err);
      setError("Não foi possível carregar os dados desta avaliação.");
    } finally {
      setLoading(false);
    }
  }

  const lidarComVoltar = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/tm");
  };

  const toggleAccordion = (idReq) => {
    setIdExpandido((prevId) => (prevId === idReq ? null : idReq));
  };

  const obterEvidenciasRequisito = (requisito) => {
    return Array.isArray(requisito?.evidencias) ? requisito.evidencias : [];
  };

  const obterEstadoEfetivoEvidencia = (evidencia) => evidencia?.estado || "PENDENTE";

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
    if (!caminhoFicheiro) {
      return;
    }

    const urlBase = api.defaults.baseURL
      ? api.defaults.baseURL.split("/api")[0]
      : "http://localhost:3000";

    const urlFicheiro = `${urlBase}${caminhoFicheiro}`;
    window.open(urlFicheiro, "_blank");
  };

  const handleAceitarEvidencia = async (idEvidencia, idCandidaturaPedido) => {
    if (!idEvidencia || idEvidencia === "SEM_EVIDENCIA") {
      return;
    }

    try {
      setAvaliandoId(idEvidencia);

      await api.post("/candidaturas/tm/avaliar-evidencia", {
        id_v_evidencia: idEvidencia,
        id_evidencia: idEvidencia,
        id_candidatura_pedido: idCandidaturaPedido || Number(id),
        estado: "APROVADO",
      });

      atualizarEstadoLocalEvidencia(idEvidencia, "APROVADO");
    } catch (err) {
      console.error("Erro ao aceitar evidência:", err);
      setErroGuardarDecisoes(
        err.response?.data?.error || "Não foi possível guardar a aprovação da evidência.",
      );
    } finally {
      setAvaliandoId(null);
    }
  };

  const handleDesfazerEvidencia = async (idEvidencia, idCandidaturaPedido) => {
    if (!idEvidencia || idEvidencia === "SEM_EVIDENCIA") {
      return;
    }

    try {
      setAvaliandoId(idEvidencia);

      await api.post("/candidaturas/tm/avaliar-evidencia", {
        id_v_evidencia: idEvidencia,
        id_evidencia: idEvidencia,
        id_candidatura_pedido: idCandidaturaPedido || Number(id),
        estado: "PENDENTE",
      });

      atualizarEstadoLocalEvidencia(idEvidencia, "PENDENTE", "");
    } catch (err) {
      console.error("Erro ao desfazer avaliação da evidência:", err);
      setErroGuardarDecisoes(
        err.response?.data?.error || "Não foi possível desfazer a avaliação da evidência.",
      );
    } finally {
      setAvaliandoId(null);
    }
  };

  const handleRejeitarEvidencia = (idEvidencia, idCandidaturaPedido) => {
    if (!idEvidencia || idEvidencia === "SEM_EVIDENCIA") {
      return;
    }

    setModalConfig({
      tipo: "EVIDENCIA",
      idEvidencia,
      idCandidaturaPedido,
    });

    setTextoComentario("");
    setShowModal(true);
  };

  const handleRejeitarCandidaturaGlobal = () => {
    if (!peloMenosUmRejeitado) {
      return;
    }

    setModalConfig({
      tipo: "GLOBAL",
      idEvidencia: null,
      idCandidaturaPedido: Number(id),
    });

    setTextoComentario("");
    setShowModal(true);
  };

  const lidarComConfirmarRejeicao = async () => {
    if (!textoComentario.trim()) {
      alert("É obrigatório deixar uma justificação para a rejeição.");
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
          "REJEITADA",
          textoComentario.trim(),
        );
      } else if (modalConfig.tipo === "GLOBAL") {
        setFinalizando(true);

        await api.post("/candidaturas/tm/finalizar-avaliacao", {
          id_candidatura_pedido: Number(id),
          estado: "REJEITADO",
          comentarios: textoComentario.trim(),
        });

        navigate("/tm/Solicitacoes");
      }
    } catch (err) {
      console.error("Erro ao submeter rejeição:", err);
      setErroGuardarDecisoes(
        err.response?.data?.error || err.message || "Não foi possível guardar a rejeição.",
      );
    } finally {
      setAvaliandoId(null);
      setFinalizando(false);
    }
  };

  const normalizarEstadoAvaliacao = (estado) => {
    const valor = String(estado || "").trim().toUpperCase();

    if (["APROVADA", "APROVADO", "APROVADO_TM", "VALIDADA", "VALIDADO"].includes(valor)) {
      return "APROVADA";
    }

    if (["REJEITADA", "REJEITADO", "RECUSADA", "RECUSADO"].includes(valor)) {
      return "REJEITADA";
    }

    if (valor === "PENDENTE") {
      return "PENDENTE";
    }

    return "SEM_EVIDENCIA";
  };

  const obterEstadoRequisito = (requisito) => {
    const evidencias = obterEvidenciasRequisito(requisito);

    if (evidencias.length === 0) {
      return "SEM_EVIDENCIA";
    }

    const estados = evidencias.map((evidencia) =>
      normalizarEstadoAvaliacao(obterEstadoEfetivoEvidencia(evidencia)),
    );

    if (estados.some((estado) => estado === "REJEITADA")) {
      return "REJEITADA";
    }

    if (estados.every((estado) => estado === "APROVADA")) {
      return "APROVADA";
    }

    return "PENDENTE";
  };

  const totalRequisitos = requisitos.length;

  const totalComEvidenciaSubmetida = requisitos.filter((requisito) => {
    return obterEvidenciasRequisito(requisito).length > 0;
  }).length;

  const avaliadosCount = requisitos.filter((requisito) => {
    const estado = obterEstadoRequisito(requisito);
    return estado === "APROVADA" || estado === "REJEITADA";
  }).length;

  const todosAprovados =
    requisitos.length > 0 &&
    requisitos.every((requisito) => obterEstadoRequisito(requisito) === "APROVADA");

  const peloMenosUmRejeitado =
    requisitos.length > 0 &&
    requisitos.some((requisito) => obterEstadoRequisito(requisito) === "REJEITADA");

  const percentagemProgresso =
    totalRequisitos > 0 ? (avaliadosCount / totalRequisitos) * 100 : 0;

  const obterEstiloEstado = (estado) => {
    const st = normalizarEstadoAvaliacao(estado);

    if (st === "PENDENTE") {
      return { bg: "#fef3c7", text: "#92400e", border: "#fde68a", label: "PENDENTE" };
    }

    if (st === "APROVADA") {
      return { bg: "#dcfce7", text: "#166534", border: "#bbf7d0", label: "APROVADO POR TM" };
    }

    if (st === "REJEITADA") {
      return { bg: "#fee2e2", text: "#991b1b", border: "#fecaca", label: "REJEITADO" };
    }

    return { bg: "#e2e8f0", text: "#334155", border: "#cbd5e1", label: "SEM EVIDÊNCIA" };
  };

  const obterEstadoCandidaturaVisual = (estado) => {
    const valor = String(estado || "").trim().toUpperCase();

    if (valor.includes("REJEIT") || valor.includes("RECUS")) {
      return {
        label: "Rejeitada",
        background: "#fee2e2",
        color: "#991b1b",
        border: "#fecaca",
      };
    }

    if (valor.includes("APROV") || valor.includes("VALID")) {
      return {
        label: "Aprovada",
        background: "#dcfce7",
        color: "#166534",
        border: "#bbf7d0",
      };
    }

    return {
      label: "Aguardar validação do Talent Manager",
      background: "#dbeafe",
      color: "#1e3a8a",
      border: "#bfdbfe",
    };
  };

  const finalizarValidacaoBadge = async () => {
    if (!todosAprovados) {
      return;
    }

    try {
      setFinalizando(true);

      await api.post("/candidaturas/tm/finalizar-avaliacao", {
        id_candidatura_pedido: Number(id),
        estado: "APROVADO",
        comentarios: "Todos os requisitos foram validados e aprovados com sucesso.",
      });

      navigate("/tm/Solicitacoes");
    } catch (err) {
      console.error("Erro ao finalizar badge:", err);
      setErroGuardarDecisoes(
        err.response?.data?.error || err.message || "Não foi possível finalizar a avaliação.",
      );
    } finally {
      setFinalizando(false);
    }
  };

  if (loading) {
    return (
      <div style={loadingPagina}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">A carregar detalhes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pagina}>
        <Header />
        <div style={erroPagina}>{error}</div>
      </div>
    );
  }

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <TmLeftSidebar />

        <main style={conteudo}>
          <button type="button" onClick={lidarComVoltar} style={voltarButton}>
            <BiArrowBack size={18} />
            {textoVoltar}
          </button>

          <div style={conteudoInterno}>
            <section style={perfilCard}>
              <div style={cardTitulo}>Perfil do consultor</div>

              <div style={perfilConteudo}>
                <div style={perfilPrincipal}>
                  <div style={avatar}>
                    <BiUserCircle size={34} color="#2563eb" />
                  </div>

                  <div>
                    <div style={nomeConsultor}>{candidatura.consultor?.nome || "-"}</div>
                    <div style={cargoBadge}>Consultor</div>
                  </div>
                </div>

                <div style={perfilDetalhes}>
                  <InfoPerfil icon={<BiEnvelope size={14} />} label="Email" value={candidatura.consultor?.email} />
                  <InfoPerfil icon={<BiCalendar size={14} />} label="Data de entrada" value={candidatura.consultor?.dataContratacao} />
                  <InfoPerfil icon={<BiBriefcase size={14} />} label="Área do consultor" value={candidatura.consultor?.departamento} />
                  <InfoPerfil
                    icon={<BiMedal size={14} />}
                    label="Badges conquistados"
                    value={`${candidatura.consultor?.badgesConquistados || 0} badges`}
                  />
                </div>
              </div>

              <button
                onClick={() => navigate(`/tm/consultores/${candidatura.consultor?.id}`)}
                style={acaoSecundariaBtn}
              >
                Ver perfil completo
              </button>
            </section>

            <section style={badgeCard}>
              <div style={badgeImagemBox}>
                <BiBadge size={30} color="#2563eb" />
              </div>

              <div style={badgeInfo}>
                <h2 style={badgeNome}>{candidatura.badge?.nome || "Badge"}</h2>
                <p style={badgeDescricao}>{candidatura.badge?.descricao || "Sem descricao."}</p>

                <div style={badgeMeta}>
                  <span style={metaBadge}>{candidatura.badge?.categoria || "Categoria"}</span>
                  <span style={metaBadge}>Solicitado em {candidatura.badge?.dataSolicitacao || "-"}</span>
                </div>

                <button
                  onClick={() => navigate(`/tm/badges/${candidatura.badge?.id}`)}
                  style={badgeDetalhesBtn}
                >
                  Ver detalhes do badge
                </button>
              </div>
            </section>

            <div style={cabecalhoRequisitos}>
              <div>
                <h2 style={tituloRequisitos}>Requisitos e evidências</h2>
                <div style={subtituloRequisitos}>
                  {totalComEvidenciaSubmetida} de {totalRequisitos} requisitos com evidência submetida
                </div>
              </div>

              <div style={estadoLateralBox}>
                <EstadoCandidatura
                  estado={
                    todosAprovados
                      ? "APROVADA"
                      : peloMenosUmRejeitado
                        ? "REJEITADA"
                        : "PENDENTE"
                  }
                  resolverVisual={obterEstadoCandidaturaVisual}
                />
              </div>
            </div>

            {requisitos.length > 0 ? (
              requisitos.map((req) => {
                const estadoRequisito = obterEstadoRequisito(req);
                const configEstado = obterEstiloEstado(estadoRequisito);
                const evidencias = obterEvidenciasRequisito(req);
                const temEvidenciaReal = evidencias.length > 0;

                return (
                  <article key={req.id} style={requisitoCard}>
                    <button type="button" onClick={() => toggleAccordion(req.id)} style={requisitoHeader}>
                      <div style={requisitoHeaderInfo}>
                        <span style={codigoRequisito}>R{String(req.id).padStart(2, "0")}</span>
                        <span style={separadorTitulo}> — </span>
                        <span style={tituloRequisito}>{req.titulo}</span>
                      </div>

                      <div style={headerDireita}>
                        <span
                          style={{
                            ...estadoChip,
                            backgroundColor: configEstado.bg,
                            color: configEstado.text,
                          }}
                        >
                          {configEstado.label}
                        </span>

                        <span style={miniInfoChip}>{evidencias.length} evidência(s)</span>

                        {idExpandido === req.id ? (
                          <BiChevronUp size={20} color="#64748b" />
                        ) : (
                          <BiChevronDown size={20} color="#64748b" />
                        )}
                      </div>
                    </button>

                    {idExpandido === req.id && (
                      <div style={requisitoBody}>
                        <InfoBloco
                          titulo="Descrição do requisito"
                          texto={req.descricao || "Sem descrição disponível."}
                        />

                        {temEvidenciaReal ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {evidencias.map((evidencia, index) => {
                              const estadoEvidencia = normalizarEstadoAvaliacao(
                                obterEstadoEfetivoEvidencia(evidencia),
                              );

                              const estaAvaliandoEste = avaliandoId === evidencia.idEvidencia;

                              return (
                                <div key={evidencia.idEvidencia || index} style={evidenciaRow}>
                                  <div style={evidenciaEsquerda}>
                                    <div style={evidenciaNome}>Evidência {index + 1}</div>

                                    {evidencia.documento && (
                                      <div style={documentoCard}>
                                        <div style={documentoInfo}>
                                          <div style={documentoIcon}>
                                            <BiFile size={16} />
                                          </div>
                                          <div style={documentoNome}>{evidencia.documento}</div>
                                        </div>

                                        <span
                                          style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            padding: "2px 9px",
                                            borderRadius: 20,
                                            background: estadoEvidencia === "APROVADA" ? "#dcfce7" : estadoEvidencia === "REJEITADA" ? "#fee2e2" : "#fef3c7",
                                            color: estadoEvidencia === "APROVADA" ? "#166534" : estadoEvidencia === "REJEITADA" ? "#991b1b" : "#92400e",
                                            border: estadoEvidencia === "APROVADA" ? "1px solid #bbf7d0" : estadoEvidencia === "REJEITADA" ? "1px solid #fecaca" : "1px solid #fde68a",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          {obterEstiloEstado(estadoEvidencia).label}
                                        </span>

                                        <button
                                          onClick={() => handleVisualizarFicheiro(evidencia.caminhoFicheiro)}
                                          style={visualizarButton}
                                        >
                                          <BiLinkExternal size={15} />
                                          Visualizar
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  <div style={evidenciaDireita}>
                                    <button
                                      onClick={() =>
                                        handleAceitarEvidencia(
                                          evidencia.idEvidencia,
                                          evidencia.idCandidaturaPedido,
                                        )
                                      }
                                      disabled={finalizando || estaAvaliandoEste}
                                      style={{
                                        ...evidenciaMiniBtn,
                                        background: estadoEvidencia === "APROVADA" ? "#15803d" : "#fff",
                                        border: "1px solid #15803d",
                                        color: estadoEvidencia === "APROVADA" ? "#fff" : "#15803d",
                                        opacity: finalizando || estaAvaliandoEste ? 0.6 : 1,
                                        cursor:
                                          finalizando || estaAvaliandoEste ? "not-allowed" : "pointer",
                                      }}
                                      title="Aprovar"
                                    >
                                      <BiCheckCircle size={14} />
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleRejeitarEvidencia(
                                          evidencia.idEvidencia,
                                          evidencia.idCandidaturaPedido,
                                        )
                                      }
                                      disabled={finalizando || estaAvaliandoEste}
                                      style={{
                                        ...evidenciaMiniBtn,
                                        background: estadoEvidencia === "REJEITADA" ? "#dc2626" : "#fff",
                                        border: "1px solid #dc2626",
                                        color: estadoEvidencia === "REJEITADA" ? "#fff" : "#dc2626",
                                        opacity: finalizando || estaAvaliandoEste ? 0.6 : 1,
                                        cursor:
                                          finalizando || estaAvaliandoEste ? "not-allowed" : "pointer",
                                      }}
                                      title="Rejeitar"
                                    >
                                      <BiXCircle size={14} />
                                    </button>

                                    {estadoEvidencia !== "PENDENTE" && (
                                      <button
                                        onClick={() =>
                                          handleDesfazerEvidencia(
                                            evidencia.idEvidencia,
                                            evidencia.idCandidaturaPedido,
                                          )
                                        }
                                        disabled={finalizando || estaAvaliandoEste}
                                        style={{
                                          ...evidenciaMiniBtn,
                                          opacity: finalizando || estaAvaliandoEste ? 0.6 : 1,
                                          cursor:
                                            finalizando || estaAvaliandoEste ? "not-allowed" : "pointer",
                                        }}
                                        title="Desfazer"
                                      >
                                        <BiRefresh size={14} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p style={textoVazio}>
                            O consultor ainda não anexou nenhuma evidência para este requisito.
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            ) : (
              <div style={mensagemBox}>Este pedido ainda não possui requisitos.</div>
            )}

            <div style={requisitoAvaliacaoBox}>
              {erroGuardarDecisoes && <p style={erroDecisao}>{erroGuardarDecisoes}</p>}

              <div>
                <h6 style={tituloProgresso}>Progresso de avaliação</h6>
                <small style={subtituloProgresso}>
                  {avaliadosCount} / {totalRequisitos} requisitos avaliados
                </small>
              </div>

              <div style={progressoTrilho}>
                <div
                  style={{
                    ...progressoBarra,
                    backgroundColor: peloMenosUmRejeitado ? "#ef4444" : "#2563eb",
                    width: `${percentagemProgresso}%`,
                  }}
                />
              </div>

              <div style={requisitoAvaliacaoBotoes}>
                {peloMenosUmRejeitado ? (
                  <button
                    onClick={handleRejeitarCandidaturaGlobal}
                    disabled={finalizando}
                    style={{
                      ...decisaoBtn,
                      backgroundColor: !finalizando ? "#dc2626" : "#e5e7eb",
                      color: !finalizando ? "#fff" : "#94a3b8",
                      cursor: !finalizando ? "pointer" : "not-allowed",
                    }}
                  >
                    {finalizando ? "A rejeitar candidatura..." : "Rejeitar candidatura"}
                  </button>
                ) : (
                  <button
                    onClick={finalizarValidacaoBadge}
                    disabled={!todosAprovados || finalizando}
                    style={{
                      ...decisaoBtn,
                      backgroundColor: todosAprovados && !finalizando ? "#16a34a" : "#e5e7eb",
                      color: todosAprovados && !finalizando ? "#fff" : "#94a3b8",
                      cursor: todosAprovados && !finalizando ? "pointer" : "not-allowed",
                    }}
                  >
                    {finalizando ? "A atribuir badge..." : "Validar e atribuir badge"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        <TmRightSidebar />
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton style={{ backgroundColor: "#f8fafc" }}>
          <Modal.Title style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            {modalConfig.tipo === "EVIDENCIA"
              ? "Rejeitar evidência"
              : "Rejeitar candidatura global"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group>
            <Form.Label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
              {modalConfig.tipo === "EVIDENCIA"
                ? "Introduz o motivo detalhado da rejeição desta evidência:"
                : "Insere a justificação global de encerramento para o consultor:"}
            </Form.Label>

            <Form.Control
              as="textarea"
              rows={4}
              value={textoComentario}
              onChange={(e) => setTextoComentario(e.target.value)}
              placeholder="Escreve aqui a tua justificação..."
              style={{ fontSize: 13, borderRadius: 8 }}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer style={{ backgroundColor: "#f8fafc" }}>
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
            style={{ fontSize: 12, fontWeight: 600, borderRadius: 6 }}
          >
            Cancelar
          </Button>

          <Button
            variant="danger"
            onClick={lidarComConfirmarRejeicao}
            style={{ fontSize: 12, fontWeight: 600, borderRadius: 6 }}
          >
            Confirmar rejeição
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function InfoPerfil({ icon, label, value }) {
  return (
    <div style={infoPerfil}>
      <div style={infoPerfilIcon}>{icon}</div>

      <div>
        <div style={infoPerfilLabel}>{label}</div>
        <div style={infoPerfilValor}>{value || "-"}</div>
      </div>
    </div>
  );
}

function InfoBloco({ titulo, texto }) {
  return (
    <div style={blocoInformacao}>
      <h3 style={blocoTitulo}>{titulo}</h3>
      <p style={textoNormal}>{texto || "-"}</p>
    </div>
  );
}

function EstadoCandidatura({ estado, resolverVisual }) {
  const visual = resolverVisual(estado);

  return (
    <div
      style={{
        ...estadoCandidatura,
        background: visual.background,
        color: visual.color,
        borderColor: visual.border,
      }}
    >
      {visual.label}
    </div>
  );
}

const pagina = {
  minHeight: "100vh",
  background: "#f3f4f6",
  display: "flex",
  flexDirection: "column",
};

const loadingPagina = {
  backgroundColor: "#f0f2f5",
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const erroPagina = {
  display: "flex",
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  color: "#dc2626",
  fontWeight: 700,
};

const corpo = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const conteudo = {
  flex: 1,
  minWidth: 0,
  overflowY: "auto",
  padding: "22px 30px 60px",
};

const conteudoInterno = {
  maxWidth: 980,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 0,
};

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
  marginBottom: 22,
};

const perfilCard = {
  background: "white",
  border: "1px solid #bfdbfe",
  borderRadius: 13,
  padding: "18px 22px",
  marginBottom: 18,
};

const cardTitulo = {
  fontSize: 14,
  fontWeight: 700,
  color: "#334155",
  marginBottom: 16,
};

const perfilConteudo = {
  display: "grid",
  gridTemplateColumns: "minmax(230px, 0.7fr) minmax(350px, 1.3fr)",
  gap: 34,
  alignItems: "center",
};

const perfilPrincipal = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
};

const avatar = {
  width: 80,
  height: 80,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const nomeConsultor = {
  fontSize: 17,
  fontWeight: 700,
  color: "#111827",
};

const cargoBadge = {
  marginTop: 7,
  display: "inline-flex",
  padding: "5px 14px",
  borderRadius: 999,
  fontSize: 11,
  color: "#1e40af",
  background: "#eff6ff",
};

const perfilDetalhes = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 18,
};

const infoPerfil = {
  display: "flex",
  alignItems: "flex-start",
  gap: 9,
};

const infoPerfilIcon = {
  color: "#64748b",
  marginTop: 2,
};

const infoPerfilLabel = {
  fontSize: 10,
  color: "#94a3b8",
};

const infoPerfilValor = {
  marginTop: 2,
  fontSize: 12,
  fontWeight: 600,
  color: "#334155",
  wordBreak: "break-word",
};

const acaoSecundariaBtn = {
  marginTop: 12,
  border: "1px solid #dbe3ef",
  background: "#fff",
  color: "#334155",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
};

const badgeCard = {
  background: "white",
  border: "1px solid #bfdbfe",
  borderRadius: 13,
  padding: "18px 22px",
  marginBottom: 20,
  display: "grid",
  gridTemplateColumns: "76px minmax(0, 1fr)",
  alignItems: "center",
  gap: 18,
};

const badgeImagemBox = {
  width: 72,
  height: 72,
  borderRadius: "50%",
  background: "#eff6ff",
  border: "2px solid #dbeafe",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const badgeInfo = {
  minWidth: 0,
};

const badgeNome = {
  margin: 0,
  color: "#111827",
  fontSize: 17,
  fontWeight: 800,
};

const badgeDescricao = {
  margin: "7px 0 0",
  color: "#475569",
  fontSize: 12,
  lineHeight: 1.55,
};

const badgeMeta = {
  marginTop: 12,
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 9,
};

const badgeDetalhesBtn = {
  marginTop: 10,
  border: "1px solid #dbe3ef",
  background: "#fff",
  color: "#334155",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
};

const metaBadge = {
  display: "inline-flex",
  padding: "5px 11px",
  borderRadius: 999,
  fontSize: 10,
  color: "#334155",
  background: "#f1f5f9",
};

const cabecalhoRequisitos = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 13,
};

const tituloRequisitos = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
  color: "#111827",
};

const subtituloRequisitos = {
  marginTop: 3,
  fontSize: 11,
  color: "#64748b",
};

const estadoLateralBox = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 8,
};

const estadoChip = {
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
};

const estadoCandidatura = {
  display: "flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "7px 13px",
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const miniInfoChip = {
  padding: "3px 7px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  color: "#475569",
  background: "#e2e8f0",
};

const requisitoCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  overflow: "hidden",
  marginBottom: 13,
};

const requisitoHeader = {
  width: "100%",
  border: "none",
  background: "white",
  padding: "15px 18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  textAlign: "left",
  cursor: "pointer",
};

const requisitoHeaderInfo = {
  minWidth: 0,
};

const codigoRequisito = {
  fontSize: 13,
  fontWeight: 800,
  color: "#111827",
};

const separadorTitulo = {
  color: "#94a3b8",
};

const tituloRequisito = {
  fontSize: 13,
  fontWeight: 600,
  color: "#475569",
};

const headerDireita = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexShrink: 0,
};

const requisitoBody = {
  borderTop: "1px solid #e5e7eb",
  background: "#fafbfc",
  padding: "16px 18px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const evidenciaRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "7px 10px",
  borderRadius: 8,
  background: "#fff",
  border: "1px solid #e5e7eb",
};

const evidenciaEsquerda = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  flex: 1,
  minWidth: 0,
};

const evidenciaNome = {
  fontSize: 12,
  color: "#374151",
  fontWeight: 500,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 220,
};

const evidenciaDireita = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  flexShrink: 0,
};

const evidenciaMiniBtn = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#64748b",
  cursor: "pointer",
  padding: 0,
};

const blocoInformacao = {
  marginBottom: 17,
};

const blocoTitulo = {
  margin: "0 0 7px",
  fontSize: 12,
  color: "#111827",
  fontWeight: 800,
};

const textoNormal = {
  margin: 0,
  color: "#475569",
  fontSize: 12,
  lineHeight: 1.6,
};

const textoVazio = {
  margin: 0,
  color: "#94a3b8",
  fontSize: 12,
};

const documentoCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 9,
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
};

const documentoInfo = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 0,
};

const documentoIcon = {
  color: "#475569",
  display: "flex",
};

const documentoNome = {
  fontSize: 12,
  color: "#334155",
  fontWeight: 700,
  wordBreak: "break-word",
};

const visualizarButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 11,
  cursor: "pointer",
  flexShrink: 0,
};

const mensagemBox = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#475569",
  fontSize: 14,
};

const requisitoAvaliacaoBox = {
  marginTop: 14,
  paddingTop: 14,
  borderTop: "1px solid #e5e7eb",
};

const erroDecisao = {
  color: "#dc2626",
  fontSize: 13,
  margin: 0,
};

const tituloProgresso = {
  fontWeight: 700,
  color: "#0f172a",
  margin: "0 0 4px",
};

const subtituloProgresso = {
  color: "#64748b",
  fontWeight: 600,
};

const progressoTrilho = {
  width: "100%",
  maxWidth: 420,
  backgroundColor: "#e2e8f0",
  borderRadius: 999,
  height: 10,
  overflow: "hidden",
};

const progressoBarra = {
  height: "100%",
  transition: "width 0.3s ease",
};

const requisitoAvaliacaoBotoes = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const decisaoBtn = {
  minWidth: 240,
  border: "none",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 800,
};

export default AvaliacaoSolicitacaoTM;
