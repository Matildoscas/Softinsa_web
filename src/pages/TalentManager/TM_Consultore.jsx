import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Spinner, Form } from "react-bootstrap";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { BiSearch, BiUser, BiSolidFilePdf, BiSpreadsheet } from "react-icons/bi";

// Componentes estruturais do teu ecossistema
import Header from "../../components/TM_Header.jsx";
import RightSidebar from "../../components/TM_RightBar.jsx";
import LeftBarTM from "../../components/LeftBarTM.jsx";
import api from "../../services/api.js";

function TM_consultores() {
  const navigate = useNavigate();

  // Estados dos Dados
  const [consultores, setConsultores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [areaTM, setAreaTM] = useState("");

  // Estados dos Filtros e Pesquisa
  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [ordenacao, setOrdenacao] = useState("nome-az");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    const userData = JSON.parse(storedUser);
    // Extrai a Service Line / Área do TM (ajusta a chave se na BD for outro nome, ex: nome_area ou id_area)
    const minhaArea = userData.area || userData.service_line || "LowCode (Outsystems)";
    setAreaTM(minhaArea);

    setLoading(true);

    // 📡 Faz o pedido à API filtrando pela área do TM conectado
    api.get(`/utilizadores/tm/area/${encodeURIComponent(minhaArea)}`)
      .then((res) => {
        setConsultores(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Erro ao carregar consultores da área:", err);
        // Fallback de teste caso queiras ver dados fictícios se a API falhar:
        /* setConsultores([
          { id: 1, nome: "Ana Maria", cargo: "Consultor", email: "ana.maria@empresa.com", area: minhaArea, badges_count: 12, status: "Online" },
          { id: 2, nome: "Bruno Silva", cargo: "Consultor", email: "bruno.silva@empresa.com", area: minhaArea, badges_count: 8, status: "Offline" }
        ]);
        */
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Pipeline de Filtros e Ordenação Dinâmica
  const consultoresFiltrados = consultores
    .filter((c) => {
      const nome = c.nome || "";
      const email = c.email || "";
      const matchTexto = 
        nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
        email.toLowerCase().includes(pesquisa.toLowerCase());

      const matchStatus = filtroStatus ? c.status === filtroStatus : true;

      return matchTexto && matchStatus;
    })
    .sort((a, b) => {
      if (ordenacao === "nome-za") return b.nome.localeCompare(a.nome, "pt-PT");
      if (ordenacao === "badges-desc") return b.badges_count - a.badges_count;
      return a.nome.localeCompare(b.nome, "pt-PT"); // Padrão: A-Z
    });

  // Funções para os botões de relatórios (Exemplos estruturais)
  const exportarPDF = (consultorId) => {
    console.log(`A gerar PDF para o consultor: ${consultorId}`);
  };

  const exportarExcel = (consultorId) => {
    console.log(`A gerar Excel para o consultor: ${consultorId}`);
  };

  return (
    <div style={pageLayout}>
      {/* 1. BARRA LATERAL ESQUERDA (TM) */}
      <LeftBarTM />

      {/* CONTEÚDO PRINCIPAL DIREITO */}
      <div style={mainContentWrapper}>
        <Header />

        <div style={bodyWrapper}>
          <main style={centerContent}>
            {/* Botão Voltar */}
            <Button
              variant="link"
              className="d-flex align-items-center text-decoration-none p-0 mb-3"
              style={{ color: "#4A5568", fontSize: "1.05rem" }}
              onClick={() => navigate("/talent_manager")}
            >
              <HiOutlineArrowLeft className="me-1" />
              <span>Voltar</span>
            </Button>

            {/* Cabeçalho de Área */}
            <div className="mb-4">
              <h4 className="fw-bold mb-1">Área: {areaTM}</h4>
              <div style={{ fontSize: 14, color: "#4b5563" }}>
                Total de {consultoresFiltrados.length} consultores
              </div>
            </div>

            {/* Zona Dinâmica de Filtros (Igual à Imagem) */}
            <div style={filterBarContainer}>
              {/* Barra de Pesquisa */}
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={searchWrapper}>
                  <BiSearch size={18} color="#adb5bd" style={searchIcon} />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={pesquisa}
                    onChange={(e) => setPesquisa(e.target.value)}
                    style={searchInput}
                  />
                </div>
              </div>

              {/* Filtros Dropdown */}
              <div className="d-flex gap-3 flex-wrap">
                <div>
                  <Form.Select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    style={filterInput}
                  >
                    <option value="">Filtrar por (Status)</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </Form.Select>
                </div>

                <div>
                  <Form.Select style={filterInput} defaultValue="">
                    <option value="">Palavras Chave</option>
                  </Form.Select>
                </div>

                <div>
                  <Form.Select
                    value={ordenacao}
                    onChange={(e) => setOrdenacao(e.target.value)}
                    style={filterInput}
                  >
                    <option value="nome-az">Ordenar por: A-Z</option>
                    <option value="nome-za">Ordenar por: Z-A</option>
                    <option value="badges-desc">Mais Badges</option>
                  </Form.Select>
                </div>
              </div>
            </div>

            {/* Renderização da Lista de Consultores */}
            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : consultoresFiltrados.length === 0 ? (
              <div className="text-center py-5 text-muted bg-white rounded-3 border">
                Nenhum consultor encontrado para esta área ou filtros selecionados.
              </div>
            ) : (
              <div style={cardsContainer}>
                {consultoresFiltrados.map((c) => (
                  <div key={c.id || c.id_utilizador} style={consultorCard}>
                    {/* Bloco de Perfil à Esquerda */}
                    <div style={profileSection}>
                      <div style={avatarWrapper}>
                        <div style={avatarCircle}>
                          <BiUser size={32} color="#6b7280" />
                        </div>
                        <span style={{ 
                          ...statusIndicator, 
                          backgroundColor: c.status?.toLowerCase() === "online" ? "#22c55e" : "#9ca3af" 
                        }}></span>
                      </div>
                      
                      <div style={infoTextWrapper}>
                        <h5 style={consultorName}>{c.nome}</h5>
                        <div style={consultorRole}>{c.cargo || "Consultor"}</div>
                        <div style={consultorEmail}>{c.email}</div>
                        <div style={consultorArea}>Área : {c.area || areaTM}</div>
                      </div>
                    </div>

                    {/* Bloco Central de Badges */}
                    <div style={badgesSummaryBox}>
                      <div style={badgeLabel}>Badges Conquistados</div>
                      <div style={badgeCountText}>{c.badges_count || 0} badges</div>
                    </div>

                    {/* Bloco de Ações à Direita */}
                    <div style={actionButtonsGroup}>
                      <Button 
                        variant="outline-primary" 
                        style={btnPerfilCompleto}
                        onClick={() => navigate(`/tm/consultor/${c.id || c.id_utilizador}`)}
                      >
                        Ver Perfil Completo
                      </Button>
                      
                      <Button 
                        variant="light" 
                        style={btnReport} 
                        onClick={() => exportarPDF(c.id || c.id_utilizador)}
                      >
                        <BiSolidFilePdf size={16} className="me-1" color="#4b5563" /> Gerar PDF
                      </Button>

                      <Button 
                        variant="light" 
                        style={btnReport} 
                        onClick={() => exportarExcel(c.id || c.id_utilizador)}
                      >
                        <BiSpreadsheet size={16} className="me-1" color="#4b5563" /> Gerar Excel
                      </Button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </main>

          {/* Barra Lateral Direita Reutilizável */}
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}

// ================= STYLES (CSS-in-JS fiel à tua Maquete) =================

const pageLayout = { display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "system-ui, sans-serif" };
const mainContentWrapper = { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 };
const bodyWrapper = { display: "flex", flex: 1, overflow: "hidden" };
const centerContent = { flex: 1, overflowY: "auto", padding: "24px 32px" };

const filterBarContainer = { display: "flex", justifyContent: "between", alignItems: "center", gap: "16px", marginBottom: "24px", flexWrap: "wrap" };
const filterInput = { width: 170, height: 40, borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "14px", color: "#64748b" };

const searchWrapper = { position: "relative", width: "100%", maxWidth: "320px" };
const searchIcon = { position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" };
const searchInput = { width: "100%", height: 40, padding: "8px 12px 8px 38px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" };

const cardsContainer = { display: "flex", flexDirection: "column", gap: "16px" };
const consultorCard = { background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" };

const profileSection = { display: "flex", alignItems: "center", gap: "18px", flex: "1 1 300px" };
const avatarWrapper = { position: "relative", display: "inline-block" };
const avatarCircle = { width: 56, height: 56, borderRadius: "50%", background: "#f1f5f9", display: "flex", justifyContent: "center", alignItems: "center" };
const statusIndicator = { position: "absolute", bottom: 2, left: 2, width: 14, height: 14, borderRadius: "50%", border: "2px solid white" };

const infoTextWrapper = { display: "flex", flexDirection: "column", gap: "2px" };
const consultorName = { fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: 0 };
const consultorRole = { fontSize: "13px", color: "#64748b" };
const consultorEmail = { fontSize: "13px", color: "#64748b" };
const consultorArea = { fontSize: "12px", color: "#475569", marginTop: "4px" };

const badgesSummaryBox = { display: "flex", flexDirection: "column", justifyContent: "center", minWidth: "140px" };
const badgeLabel = { fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: "600", letterSpacing: "0.5px" };
const badgeCountText = { fontSize: "14px", fontWeight: "600", color: "#334155" };

const actionButtonsGroup = { display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" };
const btnPerfilCompleto = { borderRadius: "8px", fontSize: "13px", fontWeight: "500", padding: "8px 16px" };
const btnReport = { borderRadius: "8px", fontSize: "13px", fontWeight: "500", padding: "8px 14px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", display: "flex", alignItems: "center" };

export default TM_consultores;