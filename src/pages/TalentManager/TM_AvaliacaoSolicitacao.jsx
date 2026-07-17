import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, Form, Modal } from "react-bootstrap";
import {
  BiArrowBack,
  BiBadge,
  BiCheckCircle,
  BiChevronDown,
  BiChevronUp,
  BiLinkExternal,
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
      return { bg: "#fef9c3", text: "#854d0e", label: "PENDENTE" };
    }

    if (st === "APROVADA") {
      return { bg: "#dcfce7", text: "#166534", label: "APROVADO POR TM" };
    }

    if (st === "REJEITADA") {
      return { bg: "#fee2e2", text: "#991b1b", label: "REJEITADO" };
    }

    return { bg: "#e2e8f0", text: "#334155", label: "SEM EVIDÊNCIA" };
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
                  <InfoPerfil label="Email" value={candidatura.consultor?.email} />
                  <InfoPerfil label="Data de entrada" value={candidatura.consultor?.dataContratacao} />
                  <InfoPerfil label="Área do consultor" value={candidatura.consultor?.departamento} />
                  <InfoPerfil
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
              </div>

              <div style={{ marginLeft: "auto" }}>
                <button
                  onClick={() => navigate(`/tm/badges/${candidatura.badge?.id}`)}
                  style={acaoSecundariaBtn}
                >
                  Ver detalhes do badge
                </button>
              </div>
            </section>

            <div style={cabecalhoRequisitos}>
              <div>
                <h2 style={tituloRequisitos}>Requisitos e evidências</h2>
                <div style={subtituloRequisitos}>
                  {avaliadosCount} de {totalRequisitos} requisitos avaliados
                </div>
              </div>

              <div style={estadoLateralBox}>
                <span
                  style={{
                    ...estadoChip,
                    background: peloMenosUmRejeitado ? "#fee2e2" : "#dbeafe",
                    color: peloMenosUmRejeitado ? "#991b1b" : "#1e40af",
                  }}
                >
                  {peloMenosUmRejeitado
                    ? "Com rejeições"
                    : todosAprovados
                      ? "Pronto para decisão"
                      : "Em avaliação"}
                </span>
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
                        <span style={separadorTitulo}>|</span>
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

                                    {evidencia.evidenciaTexto && (
                                      <InfoBloco
                                        titulo="Descrição da evidência"
                                        texto={evidencia.evidenciaTexto}
                                      />
                                    )}

                                    {evidencia.documento && (
                                      <div style={documentoCard}>
                                        <div style={documentoInfo}>
                                          <div style={documentoIcon}>DOC</div>
                                          <div style={documentoNome}>{evidencia.documento}</div>
                                        </div>

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
                                        background: estadoEvidencia === "APROVADA" ? "#ecfdf5" : "#fff",
                                        borderColor:
                                          estadoEvidencia === "APROVADA" ? "#10b981" : "#cbd5e1",
                                        color:
                                          estadoEvidencia === "APROVADA" ? "#047857" : "#334155",
                                        opacity: finalizando || estaAvaliandoEste ? 0.6 : 1,
                                        cursor:
                                          finalizando || estaAvaliandoEste ? "not-allowed" : "pointer",
                                      }}
                                    >
                                      <BiCheckCircle size={16} />
                                      {estaAvaliandoEste ? "A guardar..." : "Aprovar"}
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
                                        background: estadoEvidencia === "REJEITADA" ? "#fef2f2" : "#fff",
                                        borderColor:
                                          estadoEvidencia === "REJEITADA" ? "#ef4444" : "#cbd5e1",
                                        color:
                                          estadoEvidencia === "REJEITADA" ? "#b91c1c" : "#334155",
                                        opacity: finalizando || estaAvaliandoEste ? 0.6 : 1,
                                        cursor:
                                          finalizando || estaAvaliandoEste ? "not-allowed" : "pointer",
                                      }}
                                    >
                                      <BiXCircle size={16} />
                                      Rejeitar
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
                                      >
                                        <BiRefresh size={16} />
                                        Desfazer
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

function InfoPerfil({ label, value }) {
  return (
    <div style={infoPerfil}>
      <div style={infoPerfilLabel}>{label}</div>
      <div style={infoPerfilValor}>{value || "-"}</div>
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
  overflowY: "auto",
  padding: "22px 30px 60px",
};

const conteudoInterno = {
  maxWidth: 980,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 14,
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
  marginBottom: 12,
};

const perfilCard = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: "18px 20px",
  boxShadow: "0 1px 4px rgba(15, 23, 42, 0.06)",
};

const cardTitulo = {
  fontSize: 13,
  fontWeight: 700,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: 0.3,
  marginBottom: 14,
};

const perfilConteudo = {
  display: "flex",
  gap: 18,
  flexWrap: "wrap",
  alignItems: "center",
};

const perfilPrincipal = {
  minWidth: 220,
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const avatar = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const nomeConsultor = {
  fontSize: 18,
  color: "#0f172a",
  fontWeight: 800,
  lineHeight: 1.2,
};

const cargoBadge = {
  marginTop: 4,
  display: "inline-flex",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  color: "#1e40af",
  background: "#dbeafe",
};

const perfilDetalhes = {
  flex: 1,
  minWidth: 280,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};

const infoPerfil = {
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "10px 12px",
  background: "#fff",
};

const infoPerfilLabel = {
  fontSize: 11,
  color: "#64748b",
  fontWeight: 700,
  marginBottom: 4,
};

const infoPerfilValor = {
  fontSize: 13,
  color: "#0f172a",
  fontWeight: 600,
  wordBreak: "break-word",
};

const acaoSecundariaBtn = {
  marginTop: 12,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#334155",
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const badgeCard = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: "16px 18px",
  display: "flex",
  alignItems: "center",
  gap: 14,
  boxShadow: "0 1px 4px rgba(15, 23, 42, 0.06)",
};

const badgeImagemBox = {
  width: 56,
  height: 56,
  borderRadius: 12,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const badgeInfo = {
  minWidth: 0,
};

const badgeNome = {
  margin: 0,
  fontSize: 19,
  color: "#0f172a",
  fontWeight: 800,
};

const badgeDescricao = {
  margin: "6px 0 0",
  color: "#475569",
  fontSize: 13,
};

const badgeMeta = {
  marginTop: 10,
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const metaBadge = {
  display: "inline-flex",
  padding: "4px 9px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  color: "#334155",
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
};

const cabecalhoRequisitos = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-end",
  marginTop: 4,
};

const tituloRequisitos = {
  margin: 0,
  color: "#0f172a",
  fontSize: 20,
  fontWeight: 800,
};

const subtituloRequisitos = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 12,
  fontWeight: 600,
};

const estadoLateralBox = {
  display: "flex",
  alignItems: "center",
};

const estadoChip = {
  padding: "5px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
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
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  background: "#fff",
  overflow: "hidden",
  boxShadow: "0 1px 4px rgba(15, 23, 42, 0.04)",
};

const requisitoHeader = {
  width: "100%",
  border: "none",
  background: "#f8fafc",
  padding: "12px 14px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "pointer",
};

const requisitoHeaderInfo = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const codigoRequisito = {
  fontSize: 11,
  fontWeight: 800,
  color: "#334155",
};

const separadorTitulo = {
  color: "#94a3b8",
};

const tituloRequisito = {
  fontSize: 14,
  fontWeight: 700,
  color: "#0f172a",
};

const headerDireita = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const requisitoBody = {
  padding: "14px",
  borderTop: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const evidenciaRow = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: "10px 12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  background: "#fff",
};

const evidenciaEsquerda = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const evidenciaNome = {
  fontSize: 13,
  fontWeight: 800,
  color: "#0f172a",
};

const evidenciaDireita = {
  minWidth: 140,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const evidenciaMiniBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "#fff",
  color: "#334155",
  fontSize: 12,
  fontWeight: 700,
  padding: "8px 10px",
};

const blocoInformacao = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const blocoTitulo = {
  margin: 0,
  fontSize: 12,
  color: "#334155",
  fontWeight: 800,
};

const textoNormal = {
  margin: 0,
  color: "#475569",
  fontSize: 13,
  lineHeight: 1.5,
};

const textoVazio = {
  margin: 0,
  fontSize: 13,
  color: "#b91c1c",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: "10px 12px",
};

const documentoCard = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "9px 10px",
  background: "#f8fafc",
};

const documentoInfo = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
};

const documentoIcon = {
  fontSize: 11,
  color: "#475569",
  fontWeight: 800,
};

const documentoNome = {
  fontSize: 12,
  color: "#0f172a",
  fontWeight: 700,
  wordBreak: "break-word",
};

const visualizarButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  fontWeight: 700,
  fontSize: 12,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  cursor: "pointer",
};

const mensagemBox = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  background: "#fff",
  padding: "14px 16px",
  color: "#475569",
  fontSize: 14,
};

const requisitoAvaliacaoBox = {
  border: "1px solid #dbeafe",
  borderRadius: 14,
  background: "#f8fbff",
  padding: "14px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
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
