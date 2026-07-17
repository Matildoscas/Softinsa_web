import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Spinner, Form } from "react-bootstrap";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { 
  BiArrowBack,
  BiTimeFive,
  BiHistory,
  BiBadge, 
  BiEnvelope, 
  BiRefresh, 
  BiSearch, 
  BiUserCircle, 
  BiFilterAlt, 
  BiSort,
  BiMedal, 
  BiInfoCircle 
} from "react-icons/bi";

// Componentes estruturais do teu ecossistema
import Header from "../../components/Header.jsx";
import TmLeftSidebar from "../../components/TM_LeftBar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";
import api from "../../services/api.js";

function SolicitacaoBadges() {
  const navigate = useNavigate();

  const [candidaturas, setCandidaturas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros
  const [filtroAmbito, setFiltroAmbito] = useState("MinhaArea"); 
  const [pesquisa, setPesquisa] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const textoVoltar = location.state?.textoVoltar || "Voltar atrás";

  const lidarComVoltar = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/tm");
    }
  };

  // Procurar candidaturas pendentes e em progresso diretamente do Backend
  useEffect(() => {
    setLoading(true);
    
    api.get("/candidaturas/tm/candidaturas") 
      .then((res) => {
        setCandidaturas(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Erro ao carregar dados da tabela candidatura_pedido:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // PIPELINE DE FILTRAGEM E ORDENAÇÃO (Processado no Frontend após receber da BD)
  const candidaturasProcessadas = candidaturas
    .filter((c) => {
      // 1. Filtro por Texto (Consultor ou Nome do Badge)
      const nomeConsultor = String(c.nome_consultor || c.nome || "").toLowerCase();
      const nomeBadge = String(c.nome_badge || c.badge_nome || "").toLowerCase();
      const termo = pesquisa.toLowerCase();
      const matchTexto = nomeConsultor.includes(termo) || nomeBadge.includes(termo);

      // 2. Filtro por Estado de Validação (Por avaliar / Em avaliação)
      const estadoCandidatura = c.estado_validacao || c.estado || "Por avaliar";
      const matchEstado = filtroEstado === "Todos" ? true : estadoCandidatura === filtroEstado;

      return matchTexto && matchEstado;
    })
    .sort((a, b) => {
      // ORDENAÇÃO SOLICITADA: Mais perto de acabar em cima
      const progressoA = Number(a.evidencias_avaliadas || a.progresso || 0);
      const progressoB = Number(b.evidencias_avaliadas || b.progresso || 0);

      return progressoB - progressoA; 
    });

  return (
    <div style={pageLayout}>
      {/* Barra Lateral do Gestor */}
      <TmLeftSidebar />

      <div style={mainContentWrapper}>
        <Header />

        <div style={bodyWrapper}>
          <main style={centerContent}>
            
            {/* Botão Voltar */}
            <button type="button" onClick={lidarComVoltar} style={voltarButton}>
            <BiArrowBack size={18} />
              {textoVoltar}
          </button>

            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ fontWeight: "700", margin: 0, color: "#111827" }}>
                Solicitação de Badges
              </h4>
              <small style={{ color: "#4b5563", fontSize: "13px" }}>
                Tem {candidaturasProcessadas.length} candidaturas na lista atual
              </small>
            </div>

            {/* BARRA DE FILTROS RECONFIGURADA */}
            <div style={filterBar}>
              
              {/* Filtro por Estado de Avaliação */}
              <div style={filterGroup}>
                <label style={filterLabel}>Filtrar por Estado</label>
                <Form.Select 
                  style={{ ...filterInput, width: "190px" }}
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="Todos">Todos os Estados</option>
                  <option value="Por avaliar">Por avaliar</option>
                  <option value="Em avaliação">Em avaliação</option>
                </Form.Select>
              </div>

              {/* Procura por Texto (Consultor / Badge) */}
              <div style={{ ...filterGroup, flex: 1 }}>
                <label style={filterLabel}>Buscar Consultor ou Badge</label>
                <div style={searchWrapper}>
                  <BiSearch style={searchIcon} size={18} />
                  <input
                    type="text"
                    placeholder="Introduza o nome do consultor ou do badge..."
                    style={searchInput}
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                  />
                </div>
              </div>

              {/* Indicador de Ordenação Ativa */}
              <div style={filterGroup}>
                <label style={filterLabel}>Ordenação Padrão</label>
                <div style={sortingBadge}>
                  ↑ Mais avançadas primeiro
                </div>
              </div>
            </div>

            {/* LISTAGEM DINÂMICA DA TABELA candidatura_pedido */}
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : candidaturasProcessadas.length === 0 ? (
              <div style={emptyState}>
                Nenhum pedido de candidatura corresponde aos filtros selecionados.
              </div>
            ) : (
              <div style={listContainer}>
                {candidaturasProcessadas.map((pedido) => {
                  const idPedido = pedido.id_candidatura_pedido || pedido.id;
                  
                  return (
                    <CandidaturaCardUniversal
                      key={idPedido}
                      dados={pedido}
                      role = "tm"
                      onClick={() => navigate(`/tm/avaliacao-solicitacao/${idPedido}`)}
                    />
                  );
                })}
              </div>
            )}

            {/* Atalhos de Rodapé */}
            <div style={bottomLinks}>
              <div style={linkItem} onClick={() => navigate("/tm/expiracao")}>
                <BiTimeFive size={16} /> Ver Badges com expiração próxima
              </div>
              <div style={linkItem} onClick={() => navigate("/tm/HistoricoCandidaturas")}>
                <BiHistory size={16} /> Ver Histórico de candidaturas
              </div>
            </div>

          </main>

          <TmRightSidebar />
        </div>
      </div>
    </div>
  );
}

function CandidaturaCardUniversal({ dados, onClick, role = "tm" }) {
  // 1. Normalização dos dados do Consultor (Funciona para TM e SLL)
  const nome = dados.nome_consultor || dados.nome_utilizador || dados.nome_completo || "Consultor";
  const email = dados.email_consultor || dados.email || "";
  
  // 2. Tempo/Data de Submissão
  const tempoTexto = dados.dias_passados !== undefined 
    ? `Submetido há ${dados.dias_passados} dias`
    : `Solicitado em ${dados.data_rececao_sll || dados.data_submissao || ""}`;

  // 3. Informações do Badge
  const badgeNome = dados.nome_badge || dados.nome || "Badge Especificado";
  const areaNome = dados.nome_area || dados.service_line || dados.area || "";
  const nivel = dados.codigo_nivel || null;

  // 4. Tratamento da Imagem do Badge (com o domínio do Render se necessário)
  const imagemPath = dados.imagem_badge || dados.badge_imagem || dados.imagem;
  const badgeImagemUrl = imagemPath
    ? (imagemPath.startsWith("http") ? imagemPath : `https://softinsa-api.onrender.com${imagemPath}`)
    : null;

  // 5. Estado e Progresso (Mecanismo do TM)
  const estado = dados.estado_validacao || dados.estado_candidatura_pedido || dados.estado || "Por avaliar";
  const isEmAvaliacao = estado === "Em avaliação" || estado === "EM_AVALIACAO";

  const totalEvidencias = Number(dados.total_evidencias || 0);
  const evidenciasAvalia = Number(dados.evidencias_avaliadas || 0);
  const temProgresso = totalEvidencias > 0 || dados.progresso !== undefined;
  
  const percentagemProgresso = totalEvidencias > 0 
    ? Math.round((evidenciasAvalia / totalEvidencias) * 100)
    : Number(dados.progresso || 0);

  return (
    <div style={styles.card}>
      
      {/* Coluna 1: Perfil do Consultor */}
      <div style={styles.userSection}>
        <div style={styles.avatarCircle}>
          <BiUserCircle size={40} color="#6092bf" />
        </div>
        <div style={styles.userTextGroup}>
          <div style={styles.userName}>{nome}</div>
          <div style={styles.userEmail}>
            <BiEnvelope size={13} style={{ marginRight: "4px" }} />
            {email}
          </div>
          <div style={styles.submissionDate}>{tempoTexto}</div>
        </div>
      </div>

      {/* Coluna 2: Informação do Badge, Nível e Área */}
      <div style={styles.infoSection}>
        <div style={styles.badgeHeader}>
          <div style={styles.badgeIconWrapper}>
            {badgeImagemUrl ? (
              <img src={badgeImagemUrl} alt={badgeNome} style={styles.badgeImg} />
            ) : (
              <BiMedal size={32} color="#2563EB" />
            )}
          </div>
          <div>
            <div style={styles.badgeTitle}>
              {badgeNome}
              {nivel && <span style={styles.nivelBadge}>Nível {nivel}</span>}
            </div>
            {areaNome && <div style={styles.serviceLine}>{areaNome}</div>}
          </div>
        </div>

        {/* Só mostra a barra de progresso se houver dados de evidências (comum no TM) */}
        {temProgresso && (
          <div style={styles.progressContainer}>
            <div style={styles.progressHeader}>
              <span style={styles.progressLabel}>Progresso de Avaliação</span>
              <span style={styles.progressValue}>{percentagemProgresso}%</span>
            </div>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${percentagemProgresso}%` }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Coluna 3: Estado, Ferramentas de Debug e Ações */}
      <div style={styles.actionSection}>
        <div style={styles.topActions}>
          <span style={{
            ...styles.statusTag,
            backgroundColor: isEmAvaliacao ? "#FFedd5" : "#Fce7f3",
            color: isEmAvaliacao ? "#C2410c" : "#Be185d",
          }}>
            {estado}
          </span>
          
          {/* Se o componente Debug do SLL existir nos teus imports, ele renderiza aqui de forma limpa */}
          {typeof DebugBadgePanel !== "undefined" && (
            <DebugBadgePanel badge={dados} variant="solicitacao" />
          )}
        </div>
        
        <button type="button" style={styles.btnAction} onClick={onClick}>
          {role === "sll" ? (
            <>
              <BiShow size={16} style={{ marginRight: "6px" }} />
              Ver Detalhes
            </>
          ) : isEmAvaliacao ? (
            "Continuar Avaliação"
          ) : (
            "Avaliar"
          )}
        </button>
      </div>

    </div>
  );
}

// ================= ESTILOS CONFIGURADOS (CSS-in-JS) =================
const pageLayout = { display: "flex", minHeight: "100vh", backgroundColor: "#f7f7f7" };
const mainContentWrapper = { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 };
const bodyWrapper = { display: "flex", flex: 1, overflow: "hidden" };
const centerContent = { flex: 1, padding: "28px 32px", overflowY: "auto" };

const filterBar = { display: "flex", gap: "16px", marginBottom: "28px", alignItems: "flex-end", flexWrap: "wrap" };
const filterGroup = { display: "flex", flexDirection: "column", gap: "6px" };
const filterLabel = { fontSize: "13px", fontWeight: "500", color: "#374151" };
const filterInput = { borderRadius: "10px", fontSize: "14px", border: "1px solid #dee2e6", height: "42px", backgroundColor: "#fff" };

const searchWrapper = { position: "relative", width: "100%" };
const searchIcon = { position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" };
const searchInput = { width: "100%", height: "42px", padding: "8px 12px 8px 42px", borderRadius: "10px", border: "1px solid #dee2e6", fontSize: "14px", outline: "none" };

const sortingBadge = { height: "42px", display: "flex", alignItems: "center", padding: "0 16px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", fontSize: "13px", color: "#1e40af", fontWeight: "500" };

const listContainer = { display: "flex", flexDirection: "column", gap: "14px" };
const emptyState = { textAlign: "center", padding: "40px 0", color: "#6b7280", border: "1px dashed #ced4da", borderRadius: "12px", backgroundColor: "#fff" };

const cardStyle = { backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "20px", display: "flex", alignItems: "center", gap: "24px" };

const userSection = { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "160px", flexShrink: 0 };
const avatarCircle = { width: "54px", height: "54px", borderRadius: "50%", backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" };
const userName = { fontSize: "14px", fontWeight: "700", color: "#111827" };
const userEmail = { fontSize: "11px", color: "#6b7280", wordBreak: "break-all" };

const infoSection = { flex: 1, display: "flex", flexDirection: "column", gap: "12px" };
const badgeHeader = { display: "flex", gap: "12px", alignItems: "center" };
const badgeTitle = { fontSize: "15px", fontWeight: "600", color: "#2563EB" };
const serviceLine = { fontSize: "12px", color: "#4b5563" };

const progressContainer = { width: "100%", maxWidth: "340px" };
const progressLabel = { fontSize: "12px", fontWeight: "500", color: "#4b5563" };
const progressBarBg = { height: "7px", backgroundColor: "#e5e7eb", borderRadius: "10px", overflow: "hidden" };
const progressBarFill = { height: "100%", backgroundColor: "#2563EB", borderRadius: "10px" };
const submissionDate = { fontSize: "11px", color: "#9ca3af", marginTop: "4px" };

const actionSection = { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px", minWidth: "160px" };
const statusTag = { padding: "4px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "700" };

const btnAvaliar = { padding: "8px 22px", borderRadius: "8px", border: "none", backgroundColor: "#2563EB", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer" };
const btnContinuar = { padding: "8px 22px", borderRadius: "8px", border: "1px solid #2563EB", backgroundColor: "#fff", color: "#2563EB", fontSize: "13px", fontWeight: "600", cursor: "pointer" };

const bottomLinks = { marginTop: "32px", display: "flex", gap: "24px", borderTop: "1px solid #e5e7eb", paddingTop: "16px" };
const linkItem = { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#4b5563", cursor: "pointer" };
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

const badgeImagem = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: "50%",
};

const badgeImgStyle = {
    width: "34px",
    height: "34px",
    objectFit: "contain",
    borderRadius: "4px"
  };

const styles = {
  card: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "16px 24px",
    marginBottom: "16px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
    border: "1px solid #f1f5f9",
    gap: "24px",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: "250px",
    flex: "1",
  },
  avatarCircle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f4f8",
    borderRadius: "50%",
    padding: "6px",
  },
  userTextGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  userName: {
    fontWeight: "600",
    color: "#1e293b",
    fontSize: "15px",
  },
  userEmail: {
    display: "flex",
    alignItems: "center",
    color: "#64748b",
    fontSize: "13px",
  },
  submissionDate: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "2px",
  },
  infoSection: {
    flex: "2",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    minWidth: "300px",
  },
  badgeHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  badgeIconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
  },
  badgeImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  badgeTitle: {
    fontWeight: "600",
    color: "#0f172a",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  nivelBadge: {
    fontSize: "11px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    padding: "2px 8px",
    borderRadius: "20px",
    fontWeight: "500",
  },
  serviceLine: {
    fontSize: "12px",
    color: "#64748b",
  },
  progressContainer: {
    width: "100%",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    marginBottom: "4px",
  },
  progressLabel: {
    color: "#64748b",
  },
  progressValue: {
    fontWeight: "600",
    color: "#2563eb",
  },
  progressBarBg: {
    width: "100%",
    height: "6px",
    backgroundColor: "#f1f5f9",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },
  actionSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "12px",
    minWidth: "180px",
    flex: "1",
  },
  topActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusTag: {
    fontSize: "12px",
    fontWeight: "500",
    padding: "4px 10px",
    borderRadius: "6px",
    textTransform: "capitalize",
  },
  btnAction: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    color: "#ffffff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    width: "100%",
    transition: "background 0.2s",
  }
};

export default SolicitacaoBadges;