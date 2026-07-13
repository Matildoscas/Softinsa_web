import { useEffect, useMemo, useState } from "react";
import { BiBadge, BiEnvelope, BiRefresh, BiSearch, BiTimeFive, BiUserCircle } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

import api from "../../services/api.js";
import Header from "../../components/Header.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";

function obterUtilizadorGuardado() {
  const guardado = localStorage.getItem("user");

  if (!guardado) {
    return null;
  }

  try {
    return JSON.parse(guardado);
  } catch {
    return null;
  }
}

function normalizarEstado(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function formatarEstadoHumano(valor) {
  const textoOriginal = String(valor || "").trim();
  const estado = normalizarEstado(valor);

  if (!estado) {
    return "Sem estado";
  }

  const mapa = {
    EM_VALIDACAO_TM: "Talent Manager a validar",
    EM_VALIDACAO_SLL: "Service Line Leader a validar",
    AGUARDA_VALIDACAO_TM: "A aguardar validação do Talent Manager",
    AGUARDA_VALIDACAO_SLL: "A aguardar validação do Service Line Leader",
    AGUARDANDO_TM: "A aguardar avaliação do Talent Manager",
    AGUARDANDO_SLL: "A aguardar avaliação do Service Line Leader",
    EM_VALIDACAO: "Em validação",
    PENDENTE: "Pendente",
    APROVADO: "Aprovado",
    APROVADA: "Aprovada",
    APROVADO_FINAL: "Aprovado em definitivo",
    REJEITADO: "Rejeitado",
    REJEITADO_TM: "Candidatura rejeitada",
    REJEITADO_SLL: "Candidatura rejeitada",
    RECUSADO: "Recusado",
    DESISTIDA: "Desistida",
    DESISTIDO: "Desistida",
    CANCELADO: "Cancelado",
    FINALIZADO: "Concluído",
    CONCLUIDO: "Concluído",
    HISTORICO: "Concluído",
  };

  if (mapa[estado]) {
    return mapa[estado];
  }

  return textoOriginal
    .replace(/_/g, " ")
    .replace(/\bTM\b/g, "Talent Manager")
    .replace(/\bSLL\b/g, "Service Line Leader")
    .toLowerCase()
    .replace(/^\w/, (letra) => letra.toUpperCase());
}

function formatarDataHora(data) {
  if (!data) {
    return "-";
  }

  const date = new Date(data);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function chipEstado(estado) {
  const valor = normalizarEstado(estado);
  const labelHumana = formatarEstadoHumano(estado);

  if (valor.includes("APROV")) {
    return { label: labelHumana, bg: "#dcfce7", color: "#166534", border: "#bbf7d0" };
  }

  if (valor.includes("REJEIT") || valor.includes("RECUS")) {
    return { label: labelHumana, bg: "#fee2e2", color: "#991b1b", border: "#fecaca" };
  }

  if (valor.includes("AGUARDA") || valor.includes("PEND")) {
    return { label: labelHumana, bg: "#fef3c7", color: "#92400e", border: "#fde68a" };
  }

  return { label: labelHumana, bg: "#e5e7eb", color: "#475569", border: "#cbd5e1" };
}

function estadoEtapaRequisito(requisito, chaveEstado) {
  const evidencias = Array.isArray(requisito?.evidencias) ? requisito.evidencias : [];

  if (evidencias.length === 0) {
    return "SEM_EVIDENCIA";
  }

  const estados = evidencias.map((evidencia) => normalizarEstado(evidencia?.[chaveEstado] || "PENDENTE"));

  if (estados.some((estado) => estado.includes("REJEIT") || estado.includes("RECUS"))) {
    return "REJEITADO";
  }

  if (estados.every((estado) => estado.includes("APROV") || estado.includes("VALID"))) {
    return "APROVADO";
  }

  return "PENDENTE";
}

function candidaturaEstaFinalizada(item) {
  if (candidaturaEstaDesistida(item)) {
    return true;
  }

  return candidaturaEstaObtida(item);
}

function candidaturaEstaObtida(item) {
  const estado = normalizarEstado(item?.estado_geral || item?.estado_final);
  const fase = normalizarEstado(item?.fase_geral);

  return estado.includes("APROV") && (estado.includes("FINAL") || fase.includes("HISTORICO") || fase.includes("FINALIZ") || fase.includes("CONCLUID"));
}

function candidaturaEstaEmProcesso(item) {
  return !candidaturaEstaFinalizada(item);
}

function candidaturaTemRejeicaoEmEvidencias(item) {
  return (
    Number(item?.evidencias_rejeitadas_tm || 0) > 0 ||
    Number(item?.evidencias_rejeitadas_sll || 0) > 0
  );
}

function candidaturaEstaDesistida(item) {
  const estado = normalizarEstado(item?.estado_geral || item?.estado_final);
  const fase = normalizarEstado(item?.fase_geral);

  return (
    estado.includes("DESIST") ||
    fase.includes("DESIST") ||
    estado.includes("CANCEL") ||
    fase.includes("CANCEL")
  );
}

function candidaturaEstaRejeitada(item) {
  if (candidaturaEstaDesistida(item) || candidaturaEstaObtida(item)) {
    return false;
  }

  if (candidaturaTemRejeicaoEmEvidencias(item)) {
    return true;
  }

  const estado = normalizarEstado(item?.estado_geral || item?.estado_final);
  const fase = normalizarEstado(item?.fase_geral);

  return (
    estado.includes("REJEIT") ||
    estado.includes("RECUS") ||
    fase.includes("REJEIT") ||
    fase.includes("RECUS")
  );
}

function estadoGeralVisivel(item) {
  if (candidaturaEstaRejeitada(item)) {
    return "REJEITADA";
  }

  return item?.estado_geral || item?.estado_final || "-";
}

function faseGeralVisivel(item) {
  if (candidaturaEstaRejeitada(item)) {
    return "REJEITADA";
  }

  return item?.fase_geral || "-";
}

function extrairMotivoRejeicao(detalhe) {
  return (
    String(
      detalhe?.candidatura?.comentarios_tm ||
        detalhe?.candidatura?.motivo_estado_final ||
        detalhe?.candidatura?.comentarios_sll ||
        ""
    ).trim() ||
    "A candidatura foi rejeitada."
  );
}

function EstadoChip({ titulo, valor }) {
  const chip = chipEstado(valor);

  return (
    <div style={estadoBloco}>
      <div style={estadoTitulo}>{titulo}</div>
      <span
        style={{
          ...estadoChip,
          background: chip.bg,
          color: chip.color,
          border: `1px solid ${chip.border}`,
        }}
      >
        {chip.label}
      </span>
    </div>
  );
}

function EstadoPrincipalChip({ titulo, valor }) {
  const chip = chipEstado(valor);

  return (
    <div
      style={{
        ...estadoBloco,
        padding: 16,
        minHeight: 86,
        background: chip.bg,
        border: `1px solid ${chip.border}`,
      }}
    >
      <div style={estadoTitulo}>{titulo}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: chip.color }}>{chip.label}</div>
    </div>
  );
}

function EstadoRequisitoChip({ titulo, valor }) {
  const chip = chipEstado(valor);

  return (
    <div style={estadoRequisitoBloco}>
      <div style={estadoRequisitoTitulo}>{titulo}</div>
      <span
        style={{
          ...estadoChip,
          background: chip.bg,
          color: chip.color,
          border: `1px solid ${chip.border}`,
        }}
      >
        {chip.label}
      </span>
    </div>
  );
}

function LinhaTimeline({ label, data }) {
  return (
    <div style={timelineLinha}>
      <div style={timelineLabel}>{label}</div>
      <div style={timelineValor}>{formatarDataHora(data)}</div>
    </div>
  );
}

export default function StatusCandidaturasConsultor() {
  const navigate = useNavigate();

  const [lista, setLista] = useState([]);
  const [selecionada, setSelecionada] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [modoLista, setModoLista] = useState("EM_PROCESSO");
  const [pesquisa, setPesquisa] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetalhe, setIsLoadingDetalhe] = useState(false);
  const [isAExecutarAcao, setIsAExecutarAcao] = useState(false);
  const [erro, setErro] = useState("");

  const utilizador = obterUtilizadorGuardado();
  const idUtilizador = utilizador?.id_utilizador || utilizador?.ID_UTILIZADOR || utilizador?.id;

  async function carregarLista() {
    if (!idUtilizador) {
      setErro("Não foi possível identificar o consultor.");
      setIsLoading(false);
      return [];
    }

    try {
      setIsLoading(true);
      setErro("");

      const response = await api.get(`/candidaturas/${idUtilizador}/status-candidaturas`);
      const candidaturas = Array.isArray(response.data?.candidaturas) ? response.data.candidaturas : [];
      setLista(candidaturas);
      return candidaturas;
    } catch (err) {
      setErro(err.response?.data?.error || "Não foi possível carregar o progresso das candidaturas.");
      setLista([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }

  async function carregarDetalhe(idCandidatura) {
    if (!idUtilizador || !idCandidatura) {
      setDetalhe(null);
      return;
    }

    try {
      setIsLoadingDetalhe(true);
      const response = await api.get(`/candidaturas/${idUtilizador}/status-candidaturas/${idCandidatura}`);
      setDetalhe(response.data || null);
    } catch (err) {
      setDetalhe(null);
      setErro(err.response?.data?.error || "Não foi possível carregar o detalhe da candidatura.");
    } finally {
      setIsLoadingDetalhe(false);
    }
  }

  async function atualizarPagina() {
    const candidaturaSelecionada = selecionada;
    const candidaturasAtualizadas = await carregarLista();

    if (
      candidaturaSelecionada &&
      candidaturasAtualizadas.some((item) => item.id_candidatura_pedido === candidaturaSelecionada)
    ) {
      await carregarDetalhe(candidaturaSelecionada);
    }
  }

  async function desistirCandidaturaSelecionada() {
    const candidatura = detalhe?.candidatura;

    if (!idUtilizador || !candidatura?.id_candidatura_pedido) {
      return;
    }

    const confirmou = window.confirm(
      "Queres desistir desta candidatura rejeitada? Esta candidatura será removida do teu progresso."
    );

    if (!confirmou) {
      return;
    }

    try {
      setIsAExecutarAcao(true);
      setErro("");

      await api.patch(`/candidaturas/${candidatura.id_candidatura_pedido}/desistir`, {
        id_utilizador: idUtilizador,
      });

      await atualizarPagina();
    } catch (err) {
      setErro(err.response?.data?.error || "Não foi possível desistir da candidatura.");
    } finally {
      setIsAExecutarAcao(false);
    }
  }

  useEffect(() => {
    carregarLista();
  }, []);

  useEffect(() => {
    if (selecionada) {
      carregarDetalhe(selecionada);
    }
  }, [selecionada]);

  const listaPorModo = useMemo(() => {
    if (modoLista === "FINALIZADAS") {
      return lista.filter(candidaturaEstaFinalizada);
    }

    return lista.filter(candidaturaEstaEmProcesso);
  }, [lista, modoLista]);

  useEffect(() => {
    if (listaPorModo.length === 0) {
      setSelecionada(null);
      setDetalhe(null);
      return;
    }

    if (!listaPorModo.some((item) => item.id_candidatura_pedido === selecionada)) {
      setSelecionada(listaPorModo[0].id_candidatura_pedido);
    }
  }, [listaPorModo, selecionada]);

  const listaFiltrada = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) {
      return listaPorModo;
    }

    return listaPorModo.filter((item) =>
      String(item.nome_badge || "").toLowerCase().includes(termo) ||
      String(item.nome_area || "").toLowerCase().includes(termo) ||
      String(item.nome_serviceline || "").toLowerCase().includes(termo) ||
      String(item.estado_geral || "").toLowerCase().includes(termo) ||
      String(item.fase_geral || "").toLowerCase().includes(termo)
    );
  }, [listaPorModo, pesquisa]);

  const candidaturaSelecionadaRejeitada = candidaturaEstaRejeitada(detalhe?.candidatura);
  const candidaturaSelecionadaDesistida = candidaturaEstaDesistida(detalhe?.candidatura);
  const mostrarAcoesRejeicao =
    modoLista === "EM_PROCESSO" &&
    candidaturaSelecionadaRejeitada &&
    !candidaturaSelecionadaDesistida &&
    !candidaturaEstaFinalizada(detalhe?.candidatura);
  const estadoVisivelDetalhe = estadoGeralVisivel(detalhe?.candidatura);
  const faseVisivelDetalhe = faseGeralVisivel(detalhe?.candidatura);

  const motivoRejeicao = extrairMotivoRejeicao(detalhe);

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <LeftSidebar />

        <main style={conteudo}>
          <div style={topoBarra}>
            <button type="button" onClick={() => navigate("/pag_consultor")} style={voltarBtn}>
              Voltar
            </button>

            <button type="button" onClick={atualizarPagina} style={refreshBtn}>
              <BiRefresh size={16} />
              Atualizar
            </button>
          </div>

          <h1 style={titulo}>Progresso das Candidaturas</h1>
          <div style={subtitulo}>Acompanha, passo a passo, em que fase está cada candidatura aos teus badges.</div>

          <div style={tabsBox}>
            <button
              type="button"
              onClick={() => setModoLista("EM_PROCESSO")}
              style={{
                ...tabBtn,
                ...(modoLista === "EM_PROCESSO" ? tabBtnAtivo : null),
              }}
            >
              Em processo ({lista.filter(candidaturaEstaEmProcesso).length})
            </button>

            <button
              type="button"
              onClick={() => setModoLista("FINALIZADAS")}
              style={{
                ...tabBtn,
                ...(modoLista === "FINALIZADAS" ? tabBtnAtivo : null),
              }}
            >
              Concluídas ({lista.filter(candidaturaEstaFinalizada).length})
            </button>
          </div>

          <div style={pesquisaBox}>
            <BiSearch size={16} color="#64748b" />
            <input
              value={pesquisa}
              onChange={(event) => setPesquisa(event.target.value)}
              placeholder="Pesquisar por badge, área, service line ou estado..."
              style={pesquisaInput}
            />
          </div>

          {erro && <div style={erroBox}>{erro}</div>}

          <div style={gridPrincipal}>
            <section style={listaPanel}>
              <div style={panelTitulo}>Vista Geral ({listaFiltrada.length})</div>

              {isLoading ? (
                <div style={mensagemBox}>A carregar candidaturas...</div>
              ) : listaFiltrada.length === 0 ? (
                <div style={mensagemBox}>
                  {modoLista === "FINALIZADAS"
                    ? "Não existem candidaturas finalizadas para mostrar."
                    : "Não existem candidaturas em processo para mostrar."}
                </div>
              ) : (
                <div style={listaCards}>
                  {listaFiltrada.map((item) => {
                    const ativa = selecionada === item.id_candidatura_pedido;
                    const estadoVisivel = estadoGeralVisivel(item);
                    const faseVisivel = faseGeralVisivel(item);
                    const geral = chipEstado(estadoVisivel);

                    return (
                      <button
                        key={item.id_candidatura_pedido}
                        type="button"
                        onClick={() => setSelecionada(item.id_candidatura_pedido)}
                        style={{
                          ...cardBotao,
                          border: ativa ? "1px solid #3b82f6" : "1px solid #e5e7eb",
                          background: ativa ? "#eff6ff" : "#fff",
                        }}
                      >
                        <div style={linhaTopoCard}>
                          <div style={nomeLinha}>
                            <BiTimeFive size={18} color="#64748b" />
                            <span>{item.nome_badge}</span>
                          </div>

                          <span
                            style={{
                              ...estadoChip,
                              background: geral.bg,
                              color: geral.color,
                              border: `1px solid ${geral.border}`,
                            }}
                          >
                            {formatarEstadoHumano(estadoVisivel)}
                          </span>
                        </div>

                        <div style={badgeLinha}>
                          <BiBadge size={15} color="#2563eb" />
                          <span>{item.nome_serviceline || item.nome_area || "Sem classificação"}</span>
                        </div>

                        <div style={emailLinha}>
                          <BiEnvelope size={14} color="#6b7280" />
                          <span>{item.email}</span>
                        </div>

                        <div style={metaLinha}>Etapa: <strong>{formatarEstadoHumano(faseVisivel)}</strong></div>
                        <div style={metaLinha}>
                          Evidências decididas: <strong>Talent Manager {item.evidencias_decididas_tm}/{item.total_evidencias}</strong> · <strong>Service Line Leader {item.evidencias_decididas_sll}/{item.total_evidencias}</strong>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section style={detalhePanel}>
              <div style={panelTitulo}>Detalhe de Status</div>

              {isLoadingDetalhe ? (
                <div style={mensagemBox}>A carregar detalhe...</div>
              ) : !detalhe ? (
                <div style={mensagemBox}>Seleciona uma candidatura para ver o detalhe.</div>
              ) : (
                <>
                  <div style={secaoDetalhe}>
                    <div style={secaoTitulo}>Estado da candidatura</div>
                    <div style={estadoPrincipalWrapper}>
                      <EstadoPrincipalChip titulo="Estado geral" valor={estadoVisivelDetalhe} />
                    </div>
                    <div style={estadoGridFases}>
                      <EstadoChip titulo="Pedido" valor={detalhe.candidatura?.estado_candidatura_pedido} />
                      <EstadoChip titulo="Avaliação do Talent Manager" valor={detalhe.candidatura?.estado_candidaturatm} />
                      <EstadoChip titulo="Avaliação do Service Line Leader" valor={detalhe.candidatura?.estado_candidaturasll} />
                    </div>
                    <div style={estadoRodapeGrid}>
                      <EstadoChip titulo="Etapa" valor={faseVisivelDetalhe} />
                      <EstadoChip titulo="Resultado concluído" valor={detalhe.candidatura?.estado_final} />
                    </div>

                    {mostrarAcoesRejeicao && (
                      <div style={rejeicaoBox}>
                        <div style={rejeicaoTitulo}>Candidatura rejeitada</div>
                        <div style={rejeicaoTexto}>
                          Esta candidatura foi rejeitada. Podes abrir o badge para voltar a submeter evidências ou desistir desta candidatura para a remover do progresso.
                        </div>
                        <div style={acoesRejeicaoLinha}>
                          <button
                            type="button"
                            onClick={() => navigate(`/badge-detalhe/${detalhe.candidatura?.id_badge_modelo}`)}
                            style={abrirBadgeButton}
                            disabled={isAExecutarAcao}
                          >
                            Abrir badge
                          </button>
                          <button
                            type="button"
                            onClick={desistirCandidaturaSelecionada}
                            style={desistirButton}
                            disabled={isAExecutarAcao}
                          >
                            Desistir candidatura
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={secaoDetalhe}>
                    <div style={secaoTitulo}>Linha temporal</div>
                    <LinhaTimeline label="Submissão" data={detalhe.candidatura?.data_submissao} />
                    <LinhaTimeline label="Receção pelo Talent Manager" data={detalhe.candidatura?.data_rececao_tm} />
                    <LinhaTimeline label="Conclusão pelo Talent Manager" data={detalhe.candidatura?.data_conclusao_tm} />
                    <LinhaTimeline label="Receção pelo Service Line Leader" data={detalhe.candidatura?.data_rececao_sll} />
                    <LinhaTimeline label="Conclusão pelo Service Line Leader" data={detalhe.candidatura?.data_conclusao_sll} />
                    <LinhaTimeline label="Avaliação final pelo Service Line Leader" data={detalhe.candidatura?.data_avaliacao_sll} />
                    <LinhaTimeline label="Entrada em concluído" data={detalhe.candidatura?.data_entrada_historico} />
                  </div>

                  <div style={secaoDetalhe}>
                    <div style={secaoTitulo}>Requisitos e estado atual</div>
                    <div style={requisitosLista}>
                      {(detalhe.requisitos || []).map((req) => (
                        <div key={req.id_requisitos} style={requisitoLinha}>
                          <div style={requisitoNome}>{req.titulo || req.nome_requisito}</div>
                          <div style={requisitoEstadosLinha}>
                            <EstadoRequisitoChip titulo="Talent Manager" valor={estadoEtapaRequisito(req, "estado_evidencia_tm")} />
                            <EstadoRequisitoChip titulo="Service Line Leader" valor={estadoEtapaRequisito(req, "estado_evidencia_sll")} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {candidaturaSelecionadaRejeitada && (
                    <div style={motivoRejeicaoResumo}>
                      <div style={motivoRejeicaoLabel}>Motivo da rejeição</div>
                      <div style={motivoRejeicaoTexto}>{motivoRejeicao}</div>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

const pagina = {
  minHeight: "100vh",
  background: "#f3f4f6",
  display: "flex",
  flexDirection: "column",
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
  padding: "22px 30px 40px",
};

const topoBarra = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const voltarBtn = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  cursor: "pointer",
  padding: 0,
  fontSize: 14,
};

const refreshBtn = {
  border: "1px solid #cbd5e1",
  background: "white",
  color: "#1f2937",
  padding: "8px 12px",
  borderRadius: 9,
  cursor: "pointer",
  display: "inline-flex",
  gap: 7,
  alignItems: "center",
  fontSize: 13,
};

const titulo = {
  margin: "10px 0 4px",
  fontSize: 22,
  fontWeight: 800,
  color: "#111827",
};

const subtitulo = {
  color: "#64748b",
  marginBottom: 14,
};

const tabsBox = {
  display: "flex",
  gap: 8,
  marginBottom: 12,
};

const tabBtn = {
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#334155",
  padding: "7px 11px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const tabBtnAtivo = {
  border: "1px solid #3b82f6",
  background: "#eff6ff",
  color: "#1d4ed8",
};

const pesquisaBox = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  padding: "0 12px",
  height: 44,
  marginBottom: 16,
};

const pesquisaInput = {
  flex: 1,
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 13,
};

const erroBox = {
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 13,
  marginBottom: 14,
};

const gridPrincipal = {
  display: "grid",
  gridTemplateColumns: "minmax(360px, 0.9fr) minmax(460px, 1.1fr)",
  gap: 14,
};

const listaPanel = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
};

const detalhePanel = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
};

const panelTitulo = {
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 10,
};

const mensagemBox = {
  background: "#f8fafc",
  border: "1px dashed #cbd5e1",
  color: "#64748b",
  borderRadius: 10,
  padding: 16,
  fontSize: 13,
};

const listaCards = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const cardBotao = {
  textAlign: "left",
  borderRadius: 11,
  padding: 10,
  cursor: "pointer",
};

const linhaTopoCard = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};

const nomeLinha = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
  color: "#1f2937",
};

const badgeLinha = {
  marginTop: 7,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  color: "#2563eb",
  fontSize: 12,
  fontWeight: 600,
};

const emailLinha = {
  marginTop: 6,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  color: "#475569",
  fontSize: 12,
};

const metaLinha = {
  marginTop: 6,
  fontSize: 12,
  color: "#334155",
};

const estadoChip = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  padding: "4px 10px",
  whiteSpace: "nowrap",
};

const secaoDetalhe = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 10,
  marginBottom: 10,
};

const secaoTitulo = {
  fontSize: 13,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 8,
};

const estadoPrincipalWrapper = {
  marginBottom: 10,
};

const estadoGridFases = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(120px, 1fr))",
  gap: 8,
  marginBottom: 8,
};

const estadoRodapeGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(140px, 1fr))",
  gap: 8,
};

const estadoBloco = {
  border: "1px solid #e5e7eb",
  borderRadius: 9,
  padding: 8,
  background: "#f8fafc",
};

const estadoTitulo = {
  fontSize: 11,
  color: "#64748b",
  marginBottom: 6,
  fontWeight: 700,
  textTransform: "uppercase",
};

const timelineLinha = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  padding: "6px 0",
  borderBottom: "1px dashed #e2e8f0",
};

const timelineLabel = {
  fontSize: 12,
  color: "#334155",
  fontWeight: 600,
};

const timelineValor = {
  fontSize: 12,
  color: "#0f172a",
};

const requisitosLista = {
  display: "flex",
  flexDirection: "column",
  gap: 7,
};

const requisitoLinha = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  border: "1px solid #e5e7eb",
  borderRadius: 9,
  padding: "7px 9px",
};

const requisitoEstadosLinha = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const estadoRequisitoBloco = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 4,
};

const estadoRequisitoTitulo = {
  fontSize: 10,
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
};

const requisitoNome = {
  fontSize: 12,
  color: "#1f2937",
  fontWeight: 600,
};

const rejeicaoBox = {
  marginTop: 10,
  border: "1px solid #fecaca",
  background: "#fff1f2",
  borderRadius: 10,
  padding: 12,
};

const rejeicaoTitulo = {
  fontSize: 13,
  fontWeight: 800,
  color: "#9f1239",
  marginBottom: 6,
};

const rejeicaoTexto = {
  fontSize: 13,
  color: "#7f1d1d",
  lineHeight: 1.45,
};

const acoesRejeicaoLinha = {
  marginTop: 10,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const abrirBadgeButton = {
  marginTop: 10,
  border: "none",
  background: "#1d4ed8",
  color: "white",
  borderRadius: 9,
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const desistirButton = {
  marginTop: 10,
  border: "1px solid #f43f5e",
  background: "#fff1f2",
  color: "#be123c",
  borderRadius: 9,
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const motivoRejeicaoResumo = {
  marginTop: 10,
  border: "1px solid #fecaca",
  background: "#fff7f7",
  borderRadius: 10,
  padding: 12,
};

const motivoRejeicaoLabel = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  color: "#be123c",
  marginBottom: 4,
};

const motivoRejeicaoTexto = {
  fontSize: 13,
  color: "#7f1d1d",
  lineHeight: 1.45,
};

const motivoRejeicaoSubtexto = {
  marginTop: 6,
  fontSize: 12,
  color: "#991b1b",
};

const motivoRejeicaoLista = {
  marginTop: 8,
  fontSize: 12,
  color: "#7f1d1d",
  display: "grid",
  gap: 4,
};