import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Spinner, Form } from "react-bootstrap";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { BiSearch, BiUserCircle, BiTimeFive, BiHistory } from "react-icons/bi";

// Componentes estruturais do teu ecossistema
import Header from "../../components/Header.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";
import LeftBarTM from "../../components/LeftBarTM.jsx";
import api from "../../services/api.js";

function SolicitacaoBadges() {
  const navigate = useNavigate();

  // Estado que armazena as linhas vindas da tabela 'candidatura_pedido'
  const [candidaturas, setCandidaturas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros (Conforme pedido: Estado + Texto)
  const [filtroEstado, setFiltroEstado] = useState("Todos"); // "Todos", "Por avaliar", "Em avaliação"
  const [pesquisa, setPesquisa] = useState("");

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
      // Mapeia de acordo com as strings exatas que guardas na tua BD (ex: 'Por avaliar', 'Em avaliação' ou 'Pendente')
      const estadoCandidatura = c.estado_validacao || c.estado || "Por avaliar";
      const matchEstado = filtroEstado === "Todos" ? true : estadoCandidatura === filtroEstado;

      return matchTexto && matchEstado;
    })
    .sort((a, b) => {
      // ORDENAÇÃO SOLICITADA: Mais perto de acabar em cima (Maior número de evidências já avaliadas / maior progresso)
      // Se a tua BD já devolver a percentagem ou contagem de evidências:
      const progressoA = Number(a.evidencias_avaliadas || a.progresso || 0);
      const progressoB = Number(b.evidencias_avaliadas || b.progresso || 0);

      return progressoB - progressoA; // Ordem decrescente (Maior progresso no topo)
    });

  return (
    <div style={pageLayout}>
      {/* Barra Lateral do Gestor */}
      <LeftBarTM />

      <div style={mainContentWrapper}>
        <Header />

        <div style={bodyWrapper}>
          <main style={centerContent}>
            
            {/* Botão Voltar */}
            <Button
              variant="link"
              className="d-flex align-items-center text-decoration-none p-0 mb-3"
              style={{ color: "#4A5568", fontSize: "14px" }}
              onClick={() => navigate(-1)}
            >
              <HiOutlineArrowLeft className="me-1" /> Voltar
            </Button>

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
                  // Chave primária do pedido na tua base de dados
                  const idPedido = pedido.id_candidatura_pedido || pedido.id;
                  
                  return (
                    <CandidaturaPedidoRow
                      key={idPedido}
                      pedido={pedido}
                      onClick={() => navigate(`/tm/avaliar/${idPedido}`)}
                    />
                  );
                })}
              </div>
            )}

            {/* Atalhos de Rodapé */}
            <div style={bottomLinks}>
              <div style={linkItem}>
                <BiTimeFive size={16} /> Ver Badges com expiração próxima
              </div>
              <div style={linkItem} onClick={() => navigate("/tm/historico")}>
                <BiHistory size={16} /> Ver Histórico de candidaturas
              </div>
            </div>

          </main>

          <RightSidebar />
        </div>
      </div>
    </div>
  );
}

// COMPONENTE ISOLADO PARA CADA LINHA DA TABELA candidatura_pedido
function CandidaturaPedidoRow({ pedido, onClick }) {
  // Tratamento preventivo de nomes de propriedades vindas do SQL Join
  const consultorNome = pedido.nome_consultor || pedido.nome_utilizador || "Consultor";
  const consultorEmail = pedido.email_consultor || pedido.email || "";
  const badgeNome = pedido.nome_badge || pedido.nome || "Badge Especificado";
  const areaNome = pedido.nome_area || pedido.service_line || pedido.area || "";
  const diasPassados = pedido.dias_passados || 0;
  
  // Estado de Validação
  const estado = pedido.estado_validacao || pedido.estado || "Por avaliar";
  const isEmAvaliacao = estado === "Em avaliação";

  // Cálculo Dinâmico do Progresso baseado nas evidências da BD
  // Podes passar diretamente o valor calculado do SQL ou computá-lo aqui:
  const totalEvidencias = Number(pedido.total_evidencias || 0);
  const evidenciasAvalia = Number(pedido.evidencias_avaliadas || 0);
  const percentagemProgresso = totalEvidencias > 0 
    ? Math.round((evidenciasAvalia / totalEvidencias) * 100)
    : Number(pedido.progresso || 0);

  return (
    <div style={cardStyle}>
      {/* Coluna 1: Dados do Candidato */}
      <div style={userSection}>
        <div style={avatarCircle}>
          <BiUserCircle size={38} color="#64748B" />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={userName}>{consultorNome}</div>
          <div style={userEmail}>{consultorEmail}</div>
        </div>
      </div>

      {/* Coluna 2: Informação do Badge e Progresso de Evidências */}
      <div style={infoSection}>
        <div style={badgeHeader}>
          <span style={{ fontSize: "22px" }}>🏅</span>
          <div>
            <div style={badgeTitle}>{badgeNome}</div>
            <div style={serviceLine}>{areaNome}</div>
          </div>
        </div>

        <div style={progressContainer}>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span style={progressLabel}>Progresso de Avaliação</span>
            <span style={{ fontSize: "11px", fontWeight: "600", color: "#2563EB" }}>
              {percentagemProgresso}%
            </span>
          </div>
          <div style={progressBarBg}>
            <div style={{ ...progressBarFill, width: `${percentagemProgresso}%` }}></div>
          </div>
          <div style={submissionDate}>
            {totalEvidencias > 0 && `Evidências: ${evidenciasAvalia}/${totalEvidencias} • `}
            Submetido há {diasPassados} dias
          </div>
        </div>
      </div>

      {/* Coluna 3: Ações e Estado Visual */}
      <div style={actionSection}>
        <span
          style={{
            ...statusTag,
            backgroundColor: isEmAvaliacao ? "#FFedd5" : "#Fce7f3",
            color: isEmAvaliacao ? "#C2410c" : "#Be185d",
          }}
        >
          {estado}
        </span>
        
        <button 
          style={isEmAvaliacao ? btnContinuar : btnAvaliar} 
          onClick={onClick}
        >
          {isEmAvaliacao ? "Continuar Avaliação" : "Avaliar"}
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

export default SolicitacaoBadges;