import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  BiArrowBack, 
  BiBadge, 
  BiBriefcase, 
  BiFile, 
  BiFilterAlt, 
  BiSearch, 
  BiSortAlt2, 
  BiSpreadsheet, 
  BiUserCircle, 
  BiPlus, 
  BiTargetLock 
} from "react-icons/bi";

// Componentes estruturais do ecossistema
import Header from "../../components/Header.jsx";
import TmLeftSidebar from "../../components/TM_LeftBar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../services/api.js";


/* =========================================================
   FUNÇÕES AUXILIARES E NORMALIZAÇÃO DE DADOS
========================================================= */
function obterUtilizadorGuardado() {
  const guardado = localStorage.getItem("user");
  if (!guardado) return null;
  try {
    return JSON.parse(guardado);
  } catch (err) {
    console.error("Erro ao ler utilizador:", err);
    return null;
  }
}

function normalizarConsultor(consultor, index) {
  // Suporta chaves de ambas as APIs (v1 e v2) para evitar quebras de sincronismo
  const onlineStatus = typeof consultor.online === "boolean" 
    ? consultor.online 
    : consultor.status?.toLowerCase() === "online";

  return {
    id_utilizador: consultor.id_utilizador || consultor.id || index,
    nome_completo: consultor.nome_completo || consultor.nome || "Consultor",
    email: consultor.email || "Sem email",
    contacto: consultor.contacto || "",
    nome_area: consultor.nome_area || consultor.area || "Sem área definida",
    nome_serviceline: consultor.nome_serviceline || "Sem Service Line",
    total_badges: Number(consultor.total_badges || consultor.badges_count || 0),
    online: onlineStatus,
    estado_conta: consultor.estado_conta || "ATIVO",
    data_criacao_conta: consultor.data_criacao_conta || null,
    data_entrada_empresa: consultor.data_entrada_empresa || null,
  };
}

function formatarData(data) {
  if (!data) return "Não disponível";
  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return "Não disponível";
  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function limparNomeFicheiro(valor) {
  return String(valor || "consultor")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */
function ListaConsultoresTm() {
  const navigate = useNavigate();
  const location = useLocation();

  // Estados dos Dados
  const [consultores, setConsultores] = useState([]);
  const [especializacao, setEspecializacao] = useState("");
  const [tipoEspecializacao, setTipoEspecializacao] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState("");

  // Estados de Filtros e Pesquisa Avançada (Inspirado na Versão 2)
  const [pesquisa, setPesquisa] = useState("");
  const [filtroArea, setFiltroArea] = useState("TODAS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [ordenacao, setOrdenacao] = useState("NOME_ASC");

  const textoVoltar = location.state?.textoVoltar || "Voltar atrás";

  const lidarComVoltar = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/tm");
    }
  };

  useEffect(() => {
    carregarConsultores();
  }, []);

  async function carregarConsultores() {
    const utilizador = obterUtilizadorGuardado();
    const idUtilizador = utilizador?.id_utilizador || utilizador?.ID_UTILIZADOR || utilizador?.id;

    if (!idUtilizador) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      // Chamada unificada da API da versão 1 (mais rica em metadados)
      const response = await api.get(`/tm/${idUtilizador}/consultores`);
      const dados = response.data || {};

      setEspecializacao(dados.talentManager?.especializacao_tm || dados.talentManager?.area || "");
      setTipoEspecializacao(dados.talentManager?.tipo_especializacao || "");

      const listaRaw = Array.isArray(dados.consultores) ? dados.consultores : (Array.isArray(dados) ? dados : []);
      const listaNormalizada = listaRaw.map(normalizarConsultor);

      setConsultores(listaNormalizada);
    } catch (err) {
      console.error("Erro ao carregar consultores:", err);
      setConsultores([]);
      setErro(err.response?.data?.error || "Não foi possível carregar a lista de consultores.");
    } finally {
      setIsLoading(false);
    }
  }

  // Mapeamento dinâmico de Áreas para o Dropdown
  const areasDisponiveis = useMemo(() => {
    return [...new Set(consultores.map((c) => c.nome_area).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt"));
  }, [consultores]);

  // Pipeline de Filtragem e Ordenação de Alta Performance
  const consultoresFiltrados = useMemo(() => {
    let resultado = [...consultores];
    const texto = pesquisa.trim().toLowerCase();

    if (texto) {
      resultado = resultado.filter(
        (c) =>
          c.nome_completo.toLowerCase().includes(texto) ||
          c.email.toLowerCase().includes(texto) ||
          c.nome_area.toLowerCase().includes(texto) ||
          c.nome_serviceline.toLowerCase().includes(texto)
      );
    }

    if (filtroArea !== "TODAS") {
      resultado = resultado.filter((c) => c.nome_area === filtroArea);
    }

    if (filtroEstado === "ONLINE") {
      resultado = resultado.filter((c) => c.online);
    } else if (filtroEstado === "OFFLINE") {
      resultado = resultado.filter((c) => !c.online);
    }

    resultado.sort((a, b) => {
      if (ordenacao === "NOME_DESC") return b.nome_completo.localeCompare(a.nome_completo, "pt");
      if (ordenacao === "BADGES_DESC") return b.total_badges - a.total_badges;
      if (ordenacao === "BADGES_ASC") return a.total_badges - b.total_badges;
      if (ordenacao === "REGISTO_RECENTE") {
        return new Date(b.data_criacao_conta || 0) - new Date(a.data_criacao_conta || 0);
      }
      return a.nome_completo.localeCompare(b.nome_completo, "pt");
    });

    return resultado;
  }, [consultores, pesquisa, filtroArea, filtroEstado, ordenacao]);

  function obterDescricaoEspecializacao() {
    if (tipoEspecializacao === "RECRUTAMENTO") return "Consultores registados há menos de 1 ano";
    if (tipoEspecializacao === "DESENVOLVIMENTO") return "Consultores registados há 1 ano ou mais";
    if (tipoEspecializacao === "RH_BADGES") return "Todos os consultores da plataforma";
    return "Consultores acompanhados";
  }

  // Navegação e Ações
  const abrirPerfil = (c) => navigate(`/tm/consultores/${c.id_utilizador}`, {
    state: { voltarPara: location.pathname, textoVoltar: "Voltar à lista de consultores" }
  });

  const abrirCriarDesafio = (c = null) => navigate("/tm/desafios/novo", {
    state: { idConsultor: c?.id_utilizador || null, voltarPara: location.pathname }
  });

  // Motores de Exportação de Relatórios Reais
  function gerarPdfConsultor(c) {
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(19);
      pdf.text("Resumo do Consultor", 15, 18);
      pdf.setFontSize(14);
      pdf.setTextColor(37, 99, 235);
      pdf.text(c.nome_completo, 15, 29);
      pdf.setTextColor(17, 24, 39);

      autoTable(pdf, {
        startY: 38,
        head: [["Campo", "Informação"]],
        body: [
          ["Nome", c.nome_completo],
          ["Email", c.email],
          ["Contacto", c.contacto || "Não disponível"],
          ["Área", c.nome_area],
          ["Service Line", c.nome_serviceline],
          ["Badges conquistados", c.total_badges],
          ["Estado", c.online ? "Online" : "Offline"],
          ["Entrada na empresa", formatarData(c.data_entrada_empresa)],
        ],
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [37, 99, 235] },
        columnStyles: { 0: { cellWidth: 60, fontStyle: "bold" } },
      });

      pdf.save(`consultor_${limparNomeFicheiro(c.nome_completo)}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      setErro("Não foi possível gerar o PDF.");
    }
  }

  function gerarExcelConsultor(c) {
    const linhas = [
      ["RESUMO DO CONSULTOR", ""],
      ["Nome", c.nome_completo],
      ["Email", c.email],
      ["Contacto", c.contacto || "Não disponível"],
      ["Área", c.nome_area],
      ["Service Line", c.nome_serviceline],
      ["Badges conquistados", c.total_badges],
      ["Estado", c.online ? "Online" : "Offline"],
      ["Data de entrada", formatarData(c.data_entrada_empresa)],
    ];

    const csv = linhas
      .map((linha) => linha.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `consultor_${limparNomeFicheiro(c.nome_completo)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={styles.pagina}>
      <Header />

      <div style={styles.corpo}>
        <TmLeftSidebar />

        <main style={styles.conteudo}>
          {/* Topo / Voltar */}
          <button type="button" onClick={lidarComVoltar} style={voltarButton}>
            <BiArrowBack size={18} />
              {textoVoltar}
          </button>

          <div style={styles.separador} />

          {/* Cabeçalho de Identificação */}
          <div style={styles.cabecalhoLinha}>
            <div>
              <h1 style={styles.titulo}>Lista de Consultores</h1>
              <div style={styles.subtitulo}>
                Total de {consultoresFiltrados.length} {consultoresFiltrados.length === 1 ? "consultor" : "consultores"}
              </div>
              {especializacao && (
                <div style={styles.especializacaoTexto}>
                  Especialização: <strong>{especializacao}</strong>
                </div>
              )}
              <div style={styles.regraTexto}>{obterDescricaoEspecializacao()}</div>
            </div>

            <button type="button" onClick={() => abrirCriarDesafio()} style={styles.adicionarDesafioTopo}>
              <BiPlus size={19} /> Adicionar desafio 
            </button>
          </div>

          {/* BARRA DE FILTROS HORIZONTAL (Evolução da Versão 2 - Compacta e Elegante) */}
          <div style={styles.filterBarContainer}>
            {/* Input de Pesquisa integrado */}
            <div style={styles.searchWrapper}>
              <BiSearch size={19} color="#94a3b8" />
              <input
                type="text"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Pesquisar por nome, email, área..."
                style={styles.searchInput}
              />
            </div>

            {/* Selectores de Ação Lado a Lado */}
            <div style={styles.filterDropdownsGroup}>
              <div style={styles.selectSelectWrapper}>
                <BiBriefcase size={14} style={styles.selectIcon} />
                <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} style={styles.filterInput}>
                  <option value="TODAS">Todas as áreas</option>
                  {areasDisponiveis.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div style={styles.selectSelectWrapper}>
                <BiFilterAlt size={14} style={styles.selectIcon} />
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={styles.filterInput}>
                  <option value="TODOS">Todos os Estados</option>
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                </select>
              </div>

              <div style={styles.selectSelectWrapper}>
                <BiSortAlt2 size={14} style={styles.selectIcon} />
                <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)} style={styles.filterInput}>
                  <option value="NOME_ASC">Nome: A-Z</option>
                  <option value="NOME_DESC">Nome: Z-A</option>
                  <option value="BADGES_DESC">Mais badges</option>
                  <option value="BADGES_ASC">Menos badges</option>
                  <option value="REGISTO_RECENTE">Registo mais recente</option>
                </select>
              </div>
            </div>
          </div>

          {erro && <div style={styles.erroBox}>{erro}</div>}

          {/* Renderização da Lista de Cards estruturados (Super-Card Versão 1) */}
          {isLoading ? (
            <div style={styles.mensagemBox}>A carregar consultores do ecossistema...</div>
          ) : consultoresFiltrados.length > 0 ? (
            <div style={styles.listaContainer}>
              {consultoresFiltrados.map((consultor) => (
                <ConsultorCard
                  key={consultor.id_utilizador}
                  consultor={consultor}
                  onPerfil={() => abrirPerfil(consultor)}
                  onDesafio={() => abrirCriarDesafio(consultor)}
                  onPdf={() => gerarPdfConsultor(consultor)}
                  onExcel={() => gerarExcelConsultor(consultor)}
                />
              ))}
            </div>
          ) : (
            <div style={styles.mensagemBox}>Nenhum consultor encontrado para os critérios selecionados.</div>
          )}
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   CARD DO CONSULTOR (ESTRUTURA COMPLETA V1)
========================================================= */
function ConsultorCard({ consultor, onPerfil, onDesafio, onPdf, onExcel }) {
  return (
    <article style={styles.card}>
      {/* Coluna 1: Avatar e Status Badge */}
      <div style={styles.perfilArea}>
        <div style={styles.avatarCircle}>
          <BiUserCircle size={52} color="#64748b" />
        </div>
        <div style={styles.estadoLinha}>
          <span
            style={{
              ...styles.estadoChip,
              background: consultor.online ? "#dcfce7" : "#f1f5f9",
              color: consultor.online ? "#16a34a" : "#64748b",
            }}
          >
            {consultor.online ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* Coluna 2: Informações Principais do Consultor */}
      <div style={styles.informacaoArea}>
        <h3 style={styles.nomeConsultor}>{consultor.nome_completo}</h3>
        <div style={styles.cargoConsultor}>Consultor da Tecnologia</div>
        <div style={styles.emailConsultor}>{consultor.email}</div>
        
        <div style={styles.badgesMetaDataLinha}>
          <span style={styles.metaBadge}>Área: {consultor.nome_area}</span>
          <span style={styles.metaBadge}>S.L: {consultor.nome_serviceline}</span>
        </div>

        <button type="button" onClick={onPerfil} style={styles.perfilButton}>
          Ver Perfil Completo
        </button>
      </div>

      {/* Coluna 3: Badges, Metas e Ações de Exportação */}
      <div style={styles.badgesArea}>
        <div style={styles.badgesResumo}>
          <BiBadge size={24} color="#3b82f6" />
          <div>
            <div style={styles.badgesLabel}>Badges Conquistados</div>
            <div style={styles.badgesValor}>
              {consultor.total_badges} {consultor.total_badges === 1 ? "badge" : "badges"}
            </div>
          </div>
        </div>

        <button type="button" onClick={onDesafio} style={styles.desafioButton}>
          <BiTargetLock size={16} /> Atribuir Desafio
        </button>

        <div style={styles.acoesBotoesGroup}>
          <button type="button" onClick={onPdf} style={styles.acaoButton}>
            <BiFile size={15} /> PDF
          </button>
          <button type="button" onClick={onExcel} style={styles.acaoButton}>
            <BiSpreadsheet size={15} /> Excel
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   ESTILOS INTEGRADOS (CSS-IN-JS LIMPO)
========================================================= */
const styles = {
  pagina: {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Inter, system-ui, sans-serif"
  },
  corpo: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  conteudo: {
    flex: 1,
    minWidth: 0,
    overflowY: "auto",
    padding: "24px 32px 60px",
  },
  voltarButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: 0,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  separador: {
    height: 1,
    background: "#e2e8f0",
    margin: "16px 0 24px",
  },
  cabecalhoLinha: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 24,
  },
  titulo: {
    margin: 0,
    color: "#0f172a",
    fontSize: 24,
    fontWeight: 800,
  },
  subtitulo: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 13,
  },
  especializacaoTexto: {
    marginTop: 6,
    color: "#475569",
    fontSize: 12,
  },
  regraTexto: {
    marginTop: 4,
    color: "#2563eb",
    fontSize: 11,
    fontWeight: 600,
  },
  adicionarDesafioTopo: {
    height: 42,
    border: "none",
    borderRadius: 8,
    background: "#2563eb",
    color: "white",
    padding: "0 18px",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(37,99,235,0.15)"
  },
  
  // BARRA DE FILTROS MODERNA (Estilo Versão 2 Horizontal)
  filterBarContainer: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
    flexWrap: "wrap"
  },
  searchWrapper: {
    flex: 1,
    minWidth: "260px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "0 14px",
    height: 40,
  },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#0f172a",
    fontSize: 13,
  },
  filterDropdownsGroup: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap"
  },
  selectSelectWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  selectIcon: {
    position: "absolute",
    left: 12,
    color: "#64748b",
    pointerEvents: "none"
  },
  filterInput: {
    height: 40,
    minWidth: "160px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "white",
    padding: "0 12px 0 32px",
    outline: "none",
    color: "#334155",
    fontSize: 13,
    cursor: "pointer",
  },

  listaContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  // CARD MELHORADO E ESTRUTURADO (Versão 1)
  card: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "20px 24px",
    display: "grid",
    gridTemplateColumns: "100px minmax(0, 1fr) 280px",
    gap: 24,
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.01)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  perfilArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRight: "1px solid #f1f5f9",
    paddingRight: 16
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  estadoLinha: {
    marginTop: 10,
  },
  estadoChip: {
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  informacaoArea: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
  nomeConsultor: {
    margin: 0,
    color: "#0f172a",
    fontSize: 17,
    fontWeight: 700,
  },
  cargoConsultor: {
    marginTop: 2,
    color: "#64748b",
    fontSize: 12,
    fontWeight: 500
  },
  emailConsultor: {
    marginTop: 4,
    color: "#475569",
    fontSize: 12,
  },
  badgesMetaDataLinha: {
    display: "flex",
    gap: 8,
    marginTop: 10,
  },
  metaBadge: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    padding: "3px 8px",
    fontSize: 11,
    color: "#64748b",
  },
  perfilButton: {
    alignSelf: "flex-start",
    marginTop: 14,
    height: 34,
    padding: "0 16px",
    border: "1px solid #cbd5e1",
    borderRadius: 6,
    background: "white",
    color: "#334155",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
    ":hover": { background: "#f8fafc" }
  },
  badgesArea: {
    background: "#f8fafc",
    borderRadius: 8,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  badgesResumo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  badgesLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
  },
  badgesValor: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: 700,
  },
  desafioButton: {
    height: 36,
    border: "none",
    borderRadius: 6,
    background: "#2563eb",
    color: "white",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  acoesBotoesGroup: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  acaoButton: {
    height: 32,
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    background: "white",
    color: "#475569",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },
  erroBox: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#991b1b",
    marginBottom: 16,
    fontSize: 13,
  },
  mensagemBox: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "48px 24px",
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
  },
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
};

export default ListaConsultoresTm;