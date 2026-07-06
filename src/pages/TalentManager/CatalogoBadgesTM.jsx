import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Spinner, Form } from "react-bootstrap";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { BiMedal, BiSearch, BiChevronDown } from "react-icons/bi";

// Componentes estruturais do teu projeto
import Header from "../../components/TM_Header.jsx";
import RightSidebar from "../../components/TM_RightBar.jsx";
import LeftBarTM from "../../components/LeftBarTM.jsx";
import api from "../../services/api.js";

function CatalogoBadges() {
  const navigate = useNavigate();

  // Estados dos Dados
  const [badges, setBadges] = useState([]);
  const [conquistados, setConquistados] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros e Paginação
  const [pesquisa, setPesquisa] = useState("");
  const [areaFiltro, setAreaFiltro] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState("");
  const [ordenacaoArea, setOrdenacaoArea] = useState("az");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const badgesPorPagina = 5;

  // Função Utilitária para evitar duplicados da API
  const removerDuplicados = (lista) => {
    const mapa = new Map();
    lista.forEach((badge) => {
      const id = String(badge.id || badge.id_badge_modelo);
      if (!mapa.has(id)) mapa.set(id, { ...badge });
    });
    return Array.from(mapa.values());
  };

  // Carregamento de Dados Iniciais com Proteção de Rota
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    const userData = JSON.parse(storedUser);
    const userId = userData.id_utilizador || userData.ID_UTILIZADOR;

    setLoading(true);

    Promise.all([
      api.get("/badges/todos"),
      api.get(`/badges/conquistados/${userId}`),
      api.get(`/certificados/pendentes/${userId}`),
    ])
      .then(([todosRes, conquistadosRes, pendentesRes]) => {
        const todos = removerDuplicados(Array.isArray(todosRes.data) ? todosRes.data : []);
        const conquistadosDados = removerDuplicados(Array.isArray(conquistadosRes.data) ? conquistadosRes.data : []);

        setBadges(todos);
        setConquistados(conquistadosDados);
        setPendentes(Array.isArray(pendentesRes.data) ? pendentesRes.data : []);
      })
      .catch((err) => {
        console.error("Erro ao carregar catálogo:", err);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Helpers para identificar estados de validação por Badge
  const getPendenteDoBadge = (badgeId) => {
    return pendentes.find((p) => Number(p.id_badge_modelo) === Number(badgeId));
  };

  const getConquistadoDoBadge = (badgeId) => {
    return conquistados.find((b) => Number(b.id || b.id_badge_modelo) === Number(badgeId));
  };

  // Reset da página quando os filtros mudam
  useEffect(() => {
    setPaginaAtual(1);
  }, [pesquisa, areaFiltro, nivelFiltro, ordenacaoArea]);

  // Construção Dinâmica da lista de Áreas para o Select
  const areasDisponiveis = [
    ...new Set(badges.map((b) => b.nome_area || b.nome_areas || b.area).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "pt-PT"));

  // Pipeline de Filtros e Ordenação (Texto + Área + Nível)
  const badgesFiltrados = badges
    .filter((b) => {
      const areaBadge = b.nome_area || b.nome_areas || b.area || "";
      const nomeBadge = b.nome || b.nome_badge || "";
      const descBadge = b.descricao || b.descricao_badge_modelo || "";

      const matchTexto = 
        nomeBadge.toLowerCase().includes(pesquisa.toLowerCase()) ||
        descBadge.toLowerCase().includes(pesquisa.toLowerCase());

      const matchArea = areaFiltro ? areaBadge === areaFiltro : true;
      const matchNivel = nivelFiltro ? Number(b.id_nivel) === Number(nivelFiltro) : true;

      return matchTexto && matchArea && matchNivel;
    })
    .sort((a, b) => {
      const areaA = String(a.nome_area || a.nome_areas || a.area || "");
      const areaB = String(b.nome_area || b.nome_areas || b.area || "");
      const nomeA = String(a.nome || a.nome_badge || "");
      const nomeB = String(b.nome || b.nome_badge || "");

      if (ordenacaoArea === "za") {
        const compareArea = areaB.localeCompare(areaA, "pt-PT");
        if (compareArea !== 0) return compareArea;
        return nomeB.localeCompare(nomeA, "pt-PT");
      }

      const compareArea = areaA.localeCompare(areaB, "pt-PT");
      if (compareArea !== 0) return compareArea;
      return nomeA.localeCompare(nomeB, "pt-PT");
    });

  // Lógica de Paginação por fatiamento de Array
  const totalPaginas = Math.ceil(badgesFiltrados.length / badgesPorPagina);
  const inicio = (paginaAtual - 1) * badgesPorPagina;
  const fim = inicio + badgesPorPagina;
  const badgesPaginaAtual = badgesFiltrados.slice(inicio, fim);

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
              className="d-flex align-items-center text-decoration-none p-0 mb-2"
              style={{ color: "#4A5568", fontSize: "1.05rem" }}
              onClick={() => navigate("/talent_manager")}
            >
              <HiOutlineArrowLeft className="me-1" />
              <span>Voltar</span>
            </Button>

            <hr className="my-2" />

            {/* Cabeçalho do Catálogo */}
            <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
              <div>
                <h5 className="fw-bold mb-0">Catálogo de Badges</h5>
                <div style={{ fontSize: 13, color: "#4b5563" }}>
                  Há {badgesFiltrados.length} Badges disponíveis
                </div>
              </div>

              {/* Zona Dinâmica de Filtros */}
              <div className="d-flex gap-3 flex-wrap">
                {/* Barra de Pesquisa por Texto */}
                <div>
                  <div style={filterLabel}>Buscar Badge</div>
                  <div style={searchWrapper}>
                    <BiSearch size={18} color="#adb5bd" style={searchIcon} />
                    <input
                      type="text"
                      placeholder="Pesquisar por nome..."
                      value={pesquisa}
                      onChange={(e) => setPesquisa(e.target.value)}
                      style={searchInput}
                    />
                  </div>
                </div>

                {/* Filtro por Área */}
                <div>
                  <div style={filterLabel}>Filtrar por Área</div>
                  <div className="d-flex gap-2">
                    <Form.Select
                      value={areaFiltro}
                      onChange={(e) => setAreaFiltro(e.target.value)}
                      style={filterInput}
                    >
                      <option value="">Todas as áreas</option>
                      {areasDisponiveis.map((area) => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </Form.Select>

                    <Form.Select
                      value={ordenacaoArea}
                      onChange={(e) => setOrdenacaoArea(e.target.value)}
                      style={{ ...filterInput, width: 110 }}
                    >
                      <option value="az">A-Z</option>
                      <option value="za">Z-A</option>
                    </Form.Select>
                  </div>
                </div>

                {/* Filtro por Nível */}
                <div>
                  <div style={filterLabel}>↕ Filtrar por Nível</div>
                  <Form.Select
                    value={nivelFiltro}
                    onChange={(e) => setNivelFiltro(e.target.value)}
                    style={{ ...filterInput, width: 140 }}
                  >
                    <option value="">Todos</option>
                    <option value="1">Nível A</option>
                    <option value="2">Nível B</option>
                    <option value="3">Nível C</option>
                    <option value="4">Nível D</option>
                    <option value="5">Nível E</option>
                  </Form.Select>
                </div>
              </div>
            </div>

            {/* Conteúdo Dinâmico / Renderização das Linhas */}
            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : badgesPaginaAtual.length === 0 ? (
              <div className="text-center py-5 text-muted">
                Nenhum badge encontrado para os filtros selecionados.
              </div>
            ) : (
              <div>
                {badgesPaginaAtual.map((badge, index) => {
                  const badgeId = Number(badge.id || badge.id_badge_modelo);
                  const conquistadoBadge = getConquistadoDoBadge(badgeId);
                  const conquistado = !!conquistadoBadge;
                  const pendente = getPendenteDoBadge(badgeId);

                  return (
                    <CatalogoBadgeRow
                      key={badgeId || index}
                      badge={badge}
                      conquistado={conquistado}
                      conquistadoBadge={conquistadoBadge}
                      pendente={pendente}
                      onClick={() => navigate(`/badge-detalhe/${badgeId}`)}
                    />
                  );
                })}

                {/* Paginação */}
                <PaginacaoCatalogo
                  paginaAtual={paginaAtual}
                  totalPaginas={totalPaginas}
                  onAnterior={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  onProxima={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                />
              </div>
            )}

            {/* Ação Inferior */}
            <div className="d-flex justify-content-center mt-5 mb-4">
              <Button
                variant="white"
                className="rounded-pill px-4 shadow-sm border d-flex align-items-center gap-2"
                style={{ fontSize: 16, fontWeight: 500, minWidth: 200 }}
                onClick={() => navigate("/meus_badges")}
              >
                <BiMedal size={20} />
                Os seus Badges
              </Button>
            </div>

            <hr />
          </main>

          {/* Barra Lateral Direita Reutilizável */}
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}

// Sub-componente de Paginação Isolado
function PaginacaoCatalogo({ paginaAtual, totalPaginas, onAnterior, onProxima }) {
  if (totalPaginas <= 1) return null;

  const disabledAnterior = paginaAtual === 1;
  const disabledProxima = paginaAtual === totalPaginas;

  return (
    <div style={paginationWrapper}>
      <button onClick={onAnterior} disabled={disabledAnterior} style={{ ...paginationButton, opacity: disabledAnterior ? 0.45 : 1, cursor: disabledAnterior ? "not-allowed" : "pointer" }}>
        {"<"}
      </button>

      <div style={paginationCurrent}>{paginaAtual}</div>

      <div style={paginationFraction}>
        {paginaAtual}/{totalPaginas}
      </div>

      <button onClick={onProxima} disabled={disabledProxima} style={{ ...paginationButton, opacity: disabledProxima ? 0.45 : 1, cursor: disabledProxima ? "not-allowed" : "pointer" }}>
        {">"}
      </button>
    </div>
  );
}

// Sub-componente que renderiza cada linha do card
function CatalogoBadgeRow({ badge, conquistado, conquistadoBadge, pendente, onClick }) {
  const nome = badge.nome || badge.nome_badge || "Badge";
  const descricao = badge.descricao || badge.descricao_badge_modelo || "";
  const pontos = badge.pontos || 0;
  const area = badge.nome_area || badge.nome_areas || badge.area || "";

  const estadoTexto = conquistado
    ? conquistadoBadge?.data_atribuicao
      ? `Conquistado a ${new Date(conquistadoBadge.data_atribuicao).toLocaleDateString("pt-PT")}`
      : "Conquistado recentemente"
    : pendente
      ? pendente.estado_validacao || "A aguardar validação"
      : "Por Conquistar";

  const corEstado = conquistado ? "#2E7D32" : pendente ? "#EF6C00" : "#3b4a60";

  return (
    <div style={{ ...badgeCard, cursor: "pointer" }} onClick={onClick}>
      <div style={badgeContent}>
        <div style={badgeIcon}>🏅</div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "#111827" }}>{nome}</div>
          <div style={{ fontSize: 12, color: "#344563", marginTop: 4 }}>
            {descricao}
            {area && <div style={{ fontSize: 12, color: "#4470AF", marginTop: 3 }}>{area}</div>}
          </div>
        </div>

        <div style={pointsBox}>
          <div style={{ fontSize: 10, fontWeight: 600 }}>Pontos</div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{pontos}</div>
        </div>
      </div>

      <div style={{ ...statusBar, color: corEstado }}>{estadoTexto}</div>
    </div>
  );
}

// ================= STYLES (CSS-in-JS & Layout) =================

const pageLayout = { display: "flex", minHeight: "100vh", backgroundColor: "#f7f7f7", fontFamily: "system-ui, sans-serif" };
const mainContentWrapper = { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 };
const bodyWrapper = { display: "flex", flex: 1, overflow: "hidden" };
const centerContent = { flex: 1, overflowY: "auto", padding: "28px 32px" };

const filterLabel = { fontSize: 13, color: "#374151", marginBottom: 6 };
const filterInput = { width: 220, height: 42, borderRadius: 10, border: "1px solid #dbeafe" };

const searchWrapper = { position: "relative", width: 220 };
const searchIcon = { position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" };
const searchInput = { width: "100%", height: 42, padding: "8px 12px 8px 38px", borderRadius: "10px", border: "1px solid #dbeafe", fontSize: "14px", outline: "none", boxSizing: "border-box" };

const badgeCard = { background: "white", border: "1px solid #dbe3ef", borderRadius: 10, marginBottom: 14, overflow: "hidden" };
const badgeContent = { padding: "18px 12px", display: "flex", alignItems: "center", gap: 18 };
const badgeIcon = { width: 72, height: 72, borderRadius: "50%", background: "#eef6ff", display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0, fontSize: 28 };
const pointsBox = { border: "1.5px solid #4470AF", borderRadius: 12, padding: "8px 10px", minWidth: 52, textAlign: "center", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" };
const statusBar = { borderTop: "1px solid #e5e7eb", textAlign: "center", padding: "6px 0", fontSize: 12, background: "#fbfdff" };

const paginationWrapper = { display: "flex", justifyContent: "center", alignItems: "center", gap: 5, marginTop: 26, marginBottom: 18 };
const paginationButton = { width: 45, height: 45, border: "none", borderRadius: 18, background: "#e9eef5", color: "#2f3d4f", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" };
const paginationCurrent = { width: 45, height: 45, borderRadius: 18, background: "#e1e7ef", color: "#2f3d4f", fontSize: 20, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center" };
const paginationFraction = { fontSize: 20, color: "#2f3d4f", minWidth: 58, textAlign: "center", fontWeight: 500 };

export default CatalogoBadges;