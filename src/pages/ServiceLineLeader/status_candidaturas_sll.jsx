import { useEffect, useMemo, useState } from "react";
import { BiBadge, BiSort, BiEnvelope, BiRefresh, BiSearch, BiUserCircle } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

import api from "../../services/api.js";
import Header from "../../components/Header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";

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
  return String(valor || "").trim().toUpperCase();
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

  if (valor.includes("APROV")) {
    return { label: estado || "APROVADO", bg: "#dcfce7", color: "#166534", border: "#bbf7d0" };
  }

  if (valor.includes("REJEIT") || valor.includes("RECUS")) {
    return { label: estado || "REJEITADO", bg: "#fee2e2", color: "#991b1b", border: "#fecaca" };
  }

  if (valor.includes("AGUARDA") || valor.includes("PEND")) {
    return { label: estado || "PENDENTE", bg: "#fef3c7", color: "#92400e", border: "#fde68a" };
  }

  return { label: estado || "-", bg: "#e5e7eb", color: "#475569", border: "#cbd5e1" };
}

function estadoEtapaRequisito(requisito, chaveEstado) {
  const evidencias = Array.isArray(requisito?.evidencias)
    ? requisito.evidencias
    : [];

  if (evidencias.length === 0) {
    return "SEM_EVIDENCIA";
  }

  const estados = evidencias.map((evidencia) =>
    normalizarEstado(evidencia?.[chaveEstado] || "PENDENTE")
  );

  if (
    estados.some(
      (estado) =>
        estado.includes("REJEIT") ||
        estado.includes("RECUS")
    )
  ) {
    return "REJEITADO";
  }

  if (
    estados.every(
      (estado) =>
        estado.includes("APROV") ||
        estado.includes("VALID")
    )
  ) {
    return "APROVADO";
  }

  return "PENDENTE";
}

function candidaturaEstaFinalizada(item) {
  if (candidaturaEstaCancelada(item)) {
    return true;
  }

  return candidaturaEstaObtida(item);
}

function candidaturaEstaObtida(item) {
  const estado = normalizarEstado(item?.estado_geral || item?.estado_final);
  const fase = normalizarEstado(item?.fase_geral);

  return (
    estado.includes("APROV") &&
    (
      estado.includes("FINAL") ||
      fase.includes("HISTORICO") ||
      fase.includes("FINALIZ") ||
      fase.includes("CONCLUID")
    )
  );
}

function candidaturaEstaConcluida(item) {
  return candidaturaEstaFinalizada(item);
}

function candidaturaEstaCancelada(item) {
  const estado = normalizarEstado(item?.estado_geral || item?.estado_final);
  const fase = normalizarEstado(item?.fase_geral);

  return (
    estado.includes("CANCEL") ||
    fase.includes("CANCEL")
  );
}

function candidaturaEstaRejeitada(item) {
  if (candidaturaEstaCancelada(item) || candidaturaEstaObtida(item)) {
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

function candidaturaEstaAprovada(item) {
  return candidaturaEstaObtida(item) && !candidaturaEstaRejeitada(item) && !candidaturaEstaCancelada(item);
}

function obterMotivoCancelamento(status) {
  return String(
    status?.motivo_cancelamento ||
      status?.motivo_estado_final ||
      ""
  ).trim();
}

function candidaturaEstaEmProcesso(item) {
  return !candidaturaEstaFinalizada(item);
}

function candidaturaMostravelNoStatus(item) {
  return !candidaturaEstaRejeitada(item);
}

function candidaturaTemRejeicaoEmEvidencias(item) {
  return (
    Number(item?.evidencias_rejeitadas_tm || 0) > 0 ||
    Number(item?.evidencias_rejeitadas_sll || 0) > 0
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
      <div style={{ fontSize: 18, fontWeight: 800, color: chip.color }}>
        {chip.label}
      </div>
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

export default function StatusCandidaturasSll() {
  const navigate = useNavigate();

  const [serviceLine, setServiceLine] = useState(null);
  const [lista, setLista] = useState([]);
  const [selecionada, setSelecionada] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [modoLista, setModoLista] = useState("EM_PROCESSO");
  const [subModoConcluidos, setSubModoConcluidos] = useState("TODAS");
  
  const [ordenarPor, setOrdenarPor] = useState("data_desc"); 

  const [pesquisa, setPesquisa] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetalhe, setIsLoadingDetalhe] = useState(false);
  const [erro, setErro] = useState("");

  const utilizador = obterUtilizadorGuardado();
  const idUtilizador = utilizador?.id_utilizador || utilizador?.ID_UTILIZADOR || utilizador?.id;

  async function carregarLista() {
    if (!idUtilizador) {
      setErro("Não foi possível identificar o Service Line Leader.");
      setIsLoading(false);
      return [];
    }

    try {
      setIsLoading(true);
      setErro("");

      const response = await api.get(`/sll/${idUtilizador}/status-candidaturas`);

      setServiceLine(response.data.serviceLine || null);
      const candidaturas = Array.isArray(response.data.candidaturas) ? response.data.candidaturas : [];
      setLista(candidaturas);
      return candidaturas;
    } catch (err) {
      setErro(err.response?.data?.error || "Não foi possível carregar o estado das candidaturas.");
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
      const response = await api.get(`/sll/${idUtilizador}/status-candidaturas/${idCandidatura}`);
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

  useEffect(() => {
    carregarLista();
  }, []);

  useEffect(() => {
    if (selecionada) {
      carregarDetalhe(selecionada);
    }
  }, [selecionada]);

  const listaPorModo = useMemo(() => {
    const listaVisivel = lista.filter(candidaturaMostravelNoStatus);

    if (modoLista === "CONCLUIDOS") {
      const concluidas = listaVisivel.filter(candidaturaEstaConcluida);

      if (subModoConcluidos === "APROVADAS") {
        return concluidas.filter(candidaturaEstaAprovada);
      }

      if (subModoConcluidos === "CANCELADAS") {
        return concluidas.filter(candidaturaEstaCancelada);
      }

      return concluidas;
    }

    return listaVisivel.filter(candidaturaEstaEmProcesso);
  }, [lista, modoLista, subModoConcluidos]);

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
      String(item.nome_completo || "").toLowerCase().includes(termo) ||
      String(item.email || "").toLowerCase().includes(termo) ||
      String(item.nome_badge || "").toLowerCase().includes(termo) ||
      String(item.estado_geral || "").toLowerCase().includes(termo) ||
      String(item.fase_geral || "").toLowerCase().includes(termo)
    );
  }, [listaPorModo, pesquisa]);

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <SllLeftSidebar />

        <main style={conteudo}>
          <div style={topoBarra}>
            <button type="button" onClick={() => navigate("/sll")} style={voltarBtn}>Voltar</button>

            <button type="button" onClick={atualizarPagina} style={refreshBtn}>
              <BiRefresh size={16} />
              Atualizar
            </button>
          </div>

          <h1 style={titulo}>Status de Candidaturas</h1>
          <div style={subtitulo}>
            Service Line: <strong>{serviceLine?.nome_serviceline || "Service Line"}</strong>
          </div>

          <div style={filtroEscopoBarra}>
                      <div style={filtroGrupo}>
                        <BiSort size={16} color="#475569" />
                        <span style={filtroTextoLabel}>Ordenar por:</span>
                        <select 
                          value={ordenarPor} 
                          onChange={(e) => setOrdenarPor(e.target.value)} 
                          style={selectEstilo}
                        >
                          <option value="data_desc">Mais Recentes (Data Submissão)</option>
                          <option value="data_asc">Mais Antigas (Data Submissão)</option>
                          <option value="nome_az">Nome do Consultor (A-Z)</option>
                        </select>
                      </div>
                    </div>

          <div style={tabsBox}>
            <button
              type="button"
              onClick={() => {
                setModoLista("EM_PROCESSO");
              }}
              style={{
                ...tabBtn,
                ...(modoLista === "EM_PROCESSO" ? tabBtnAtivo : null),
              }}
            >
              Em Processo ({lista.filter(candidaturaMostravelNoStatus).filter(candidaturaEstaEmProcesso).length})
            </button>

            <button
              type="button"
              onClick={() => {
                setModoLista("CONCLUIDOS");
              }}
              style={{
                ...tabBtn,
                ...(modoLista === "CONCLUIDOS" ? tabBtnAtivo : null),
              }}
            >
              Concluídos ({lista.filter(candidaturaMostravelNoStatus).filter(candidaturaEstaConcluida).length})
            </button>
          </div>

          {modoLista === "CONCLUIDOS" && (
            <div style={subTabsBox}>
              <button
                type="button"
                onClick={() => setSubModoConcluidos("TODAS")}
                style={{
                  ...subTabBtn,
                  ...(subModoConcluidos === "TODAS" ? subTabBtnAtivo : null),
                }}
              >
                Todas ({lista.filter(candidaturaMostravelNoStatus).filter(candidaturaEstaConcluida).length})
              </button>

              <button
                type="button"
                onClick={() => setSubModoConcluidos("APROVADAS")}
                style={{
                  ...subTabBtn,
                  ...(subModoConcluidos === "APROVADAS" ? subTabBtnAtivo : null),
                }}
              >
                Aprovadas ({lista.filter(candidaturaMostravelNoStatus).filter(candidaturaEstaAprovada).length})
              </button>

              <button
                type="button"
                onClick={() => setSubModoConcluidos("CANCELADAS")}
                style={{
                  ...subTabBtn,
                  ...(subModoConcluidos === "CANCELADAS" ? subTabBtnAtivo : null),
                }}
              >
                Canceladas ({lista.filter(candidaturaMostravelNoStatus).filter(candidaturaEstaCancelada).length})
              </button>
            </div>
          )}

          <div style={pesquisaBox}>
            <BiSearch size={16} color="#64748b" />
            <input
              value={pesquisa}
              onChange={(event) => setPesquisa(event.target.value)}
              placeholder="Pesquisar por consultor, badge, fase ou estado..."
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
                  {modoLista === "CONCLUIDOS"
                    ? "Não existem candidaturas concluídas para mostrar."
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
                            <BiUserCircle size={20} color="#64748b" />
                            <span>{item.nome_completo}</span>
                          </div>

                          <span
                            style={{
                              ...estadoChip,
                              background: geral.bg,
                              color: geral.color,
                              border: `1px solid ${geral.border}`,
                            }}
                          >
                            {estadoVisivel}
                          </span>
                        </div>

                        <div style={badgeLinha}>
                          <BiBadge size={15} color="#2563eb" />
                          <span>{item.nome_badge}</span>
                        </div>

                        <div style={emailLinha}>
                          <BiEnvelope size={14} color="#6b7280" />
                          <span>{item.email}</span>
                        </div>

                        <div style={metaLinha}>
                          Fase: <strong>{faseVisivel}</strong>
                        </div>

                        <div style={metaLinha}>
                          Evidências TM/SLL: <strong>{item.evidencias_decididas_tm}/{item.total_evidencias}</strong> · <strong>{item.evidencias_decididas_sll}/{item.total_evidencias}</strong>
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
                  {candidaturaEstaCancelada(detalhe?.status) && obterMotivoCancelamento(detalhe?.status) && (
                    <div style={motivoCancelamentoBox}>
                      <div style={motivoCancelamentoTitulo}>Motivo de cancelamento</div>
                      <div style={motivoCancelamentoTexto}>{obterMotivoCancelamento(detalhe?.status)}</div>
                    </div>
                  )}

                  <div style={secaoDetalhe}>
                    <div style={secaoTitulo}>Estados Explícitos por Fase</div>
                    <div style={estadoPrincipalWrapper}>
                      <EstadoPrincipalChip titulo="Estado Geral" valor={detalhe.status?.estado_geral} />
                    </div>
                    <div style={estadoGridFases}>
                      <EstadoChip titulo="Estado do Pedido" valor={detalhe.status?.estado_candidatura_pedido} />
                      <EstadoChip titulo="Estado TM" valor={detalhe.status?.estado_candidaturatm} />
                      <EstadoChip titulo="Estado SLL" valor={detalhe.status?.estado_candidaturasll} />
                    </div>
                    <div style={estadoRodapeGrid}>
                      <EstadoChip titulo="Etapa do Processo" valor={detalhe.status?.fase_geral} />
                      <EstadoChip titulo="Resultado Histórico" valor={detalhe.status?.estado_final} />
                    </div>
                  </div>

                  <div style={secaoDetalhe}>
                    <div style={secaoTitulo}>Linha Temporal</div>
                    <LinhaTimeline label="Submissão" data={detalhe.status?.data_submissao} />
                    <LinhaTimeline label="Receção TM" data={detalhe.status?.data_rececao_tm} />
                    <LinhaTimeline label="Conclusão TM" data={detalhe.status?.data_conclusao_tm} />
                    <LinhaTimeline label="Receção SLL" data={detalhe.status?.data_rececao_sll} />
                    <LinhaTimeline label="Conclusão SLL" data={detalhe.status?.data_conclusao_sll} />
                    <LinhaTimeline label="Avaliação SLL (Histórico)" data={detalhe.status?.data_avaliacao_sll} />
                    <LinhaTimeline label="Entrada no Histórico" data={detalhe.status?.data_entrada_historico} />
                  </div>

                  <div style={secaoDetalhe}>
                    <div style={secaoTitulo}>Requisitos e Estado Atual</div>
                    <div style={requisitosLista}>
                      {(detalhe.requisitos || []).map((req) => (
                        <div key={req.id_requisitos} style={requisitoLinha}>
                          <div style={requisitoNome}>{req.titulo || req.nome_requisito}</div>
                          <div style={requisitoEstadosLinha}>
                            <EstadoRequisitoChip
                              titulo="TM"
                              valor={estadoEtapaRequisito(req, "estado_evidencia_tm")}
                            />

                            <EstadoRequisitoChip
                              titulo="SLL"
                              valor={estadoEtapaRequisito(req, "estado_evidencia_sll")}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </main>

        <SllRightSidebar />
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

const subTabsBox = {
  display: "flex",
  gap: 8,
  marginBottom: 12,
  flexWrap: "wrap",
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

const subTabBtn = {
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#334155",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
};

const subTabBtnAtivo = {
  border: "1px solid #0ea5e9",
  background: "#e0f2fe",
  color: "#0369a1",
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

const motivoCancelamentoBox = {
  border: "1px solid #fbcfe8",
  background: "#fff1f2",
  color: "#831843",
  borderRadius: 10,
  padding: "10px 12px",
  marginBottom: 10,
};

const motivoCancelamentoTitulo = {
  fontSize: 12,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.2,
  marginBottom: 4,
};

const motivoCancelamentoTexto = {
  fontSize: 13,
  lineHeight: 1.45,
  whiteSpace: "pre-wrap",
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

const filtroEscopoBarra = { display: "flex", gap: 24, background: "white", border: "1px solid #dbe3ef", borderRadius: 10, padding: "10px 14px", marginBottom: 12, alignItems: "center", flexWrap: "wrap" };
const filtroGrupo = { display: "flex", alignItems: "center", gap: 8 };
const filtroTextoLabel = { fontSize: 13, fontWeight: 600, color: "#475569" };
const selectEstilo = { padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, color: "#1f2937", outline: "none", background: "#f8fafc", cursor: "pointer" };
