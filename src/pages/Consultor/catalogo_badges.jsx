import { useState, useEffect } from "react";
import { Button, Spinner, Form } from "react-bootstrap";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { BiMedal, BiGrid, BiMenu } from "react-icons/bi";

import Header from "../../components/Header.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import api from "../../services/api.js";

function CatalogoBadgesPage() {
  const navigate = useNavigate();

  const [badges, setBadges] = useState([]);
  const [conquistadosIds, setConquistadosIds] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [areaFiltro, setAreaFiltro] = useState("");
  const [ordenacaoArea, setOrdenacaoArea] = useState("az");
  const [conquistados, setConquistados] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const badgesPorPagina = 5;

  const removerDuplicados = (lista) => {
    const mapa = new Map();

    lista.forEach((badge) => {
      const id = String(badge.id || badge.id_badge_modelo);
      if (!mapa.has(id)) mapa.set(id, { ...badge });
    });

    return Array.from(mapa.values());
  };

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
        const todos = removerDuplicados(
          Array.isArray(todosRes.data) ? todosRes.data : []
        );

        const conquistados = removerDuplicados(
          Array.isArray(conquistadosRes.data) ? conquistadosRes.data : []
        );

        setBadges(todos);
        setConquistados(conquistados);
        setConquistadosIds(
          conquistados.map((b) => Number(b.id || b.id_badge_modelo))
        );
        setPendentes(Array.isArray(pendentesRes.data) ? pendentesRes.data : []);
      })
      .catch((err) => {
        console.error("Erro ao carregar catálogo:", err);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const getPendenteDoBadge = (badgeId) => {
    return pendentes.find(
      (p) => Number(p.id_badge_modelo) === Number(badgeId)
    );
  };

  const badgesFiltrados = badges
  .filter((b) => {
    const areaBadge = b.nome_area || b.nome_areas || b.area || "";

    const matchArea = areaFiltro
      ? areaBadge === areaFiltro
      : true;

    const matchNivel = nivelFiltro
      ? Number(b.id_nivel) === Number(nivelFiltro)
      : true;

    return matchArea && matchNivel;
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

  const totalPaginas = Math.ceil(badgesFiltrados.length / badgesPorPagina);

  const inicio = (paginaAtual - 1) * badgesPorPagina;
  const fim = inicio + badgesPorPagina;

  const badgesPaginaAtual = badgesFiltrados.slice(inicio, fim);

  useEffect(() => {
    setPaginaAtual(1);
  }, [areaFiltro, nivelFiltro, ordenacaoArea]);

  const areasDisponiveis = [
    ...new Set(
        badges
        .map((b) => b.nome_area || b.nome_areas || b.area)
        .filter(Boolean)
    ),
    ].sort((a, b) => a.localeCompare(b, "pt-PT"));

    const getConquistadoDoBadge = (badgeId) => {
      return conquistados.find(
        (b) => Number(b.id || b.id_badge_modelo) === Number(badgeId)
      );
    };

  return (
    <div style={{ backgroundColor: "#f7f7f7", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <LeftSidebar />

        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <Button
            variant="link"
            className="d-flex align-items-center text-decoration-none p-0 mb-2"
            style={{ color: "#4A5568", fontSize: "1.05rem" }}
            onClick={() => navigate("/pag_consultor")}
          >
            <HiOutlineArrowLeft className="me-1" />
            <span>Voltar</span>
          </Button>

          <hr className="my-2" />

          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h5 className="fw-bold mb-0">Catálogo de Badges</h5>
              <div style={{ fontSize: 13, color: "#4b5563" }}>
                Há {badgesFiltrados.length} Badges disponíveis
              </div>
            </div>

            <div className="d-flex gap-3">
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
                        <option key={area} value={area}>
                        {area}
                        </option>
                    ))}
                    </Form.Select>

                    <Form.Select
                        value={ordenacaoArea}
                        onChange={(e) => setOrdenacaoArea(e.target.value)}
                        style={{ ...filterInput, width: 130 }}
                        >
                        <option value="az">Área A-Z</option>
                        <option value="za">Área Z-A</option>
                    </Form.Select>
                </div>
                </div>

              <div>
                <div style={filterLabel}>↕ Filtrar por Nível</div>
                <Form.Select
                  value={nivelFiltro}
                  onChange={(e) => setNivelFiltro(e.target.value)}
                  style={filterInput}
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

          <PaginacaoCatalogo
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            onAnterior={() => setPaginaAtual((p) => Math.max(1, p - 1))}
            onProxima={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
          />

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

        <RightSidebar />
      </div>
    </div>

    
  );
}

function PaginacaoCatalogo({
  paginaAtual,
  totalPaginas,
  onAnterior,
  onProxima,
}) {
  if (totalPaginas <= 1) return null;

  const disabledAnterior = paginaAtual === 1;
  const disabledProxima = paginaAtual === totalPaginas;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 5,
        marginTop: 26,
        marginBottom: 18,
      }}
    >
      <button
        onClick={onAnterior}
        disabled={disabledAnterior}
        style={{
          ...paginationButton,
          opacity: disabledAnterior ? 0.45 : 1,
          cursor: disabledAnterior ? "not-allowed" : "pointer",
        }}
      >
        {"<"}
      </button>

      <div style={paginationCurrent}>
        {paginaAtual}
      </div>

      <div
        style={{
          fontSize: 20,
          color: "#2f3d4f",
          minWidth: 58,
          textAlign: "center",
          fontWeight: 500,
        }}
      >
        {paginaAtual}/{totalPaginas}
      </div>

      <button
        onClick={onProxima}
        disabled={disabledProxima}
        style={{
          ...paginationButton,
          opacity: disabledProxima ? 0.45 : 1,
          cursor: disabledProxima ? "not-allowed" : "pointer",
        }}
      >
        {">"}
      </button>
    </div>
  );
}

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
  
  const corEstado = conquistado
    ? "#2E7D32"
    : pendente
      ? "#EF6C00"
      : "#3b4a60";

  return (
    <div style={{...badgeCard, cursor: "pointer", }} onClick={onClick}    >
      <div style={badgeContent}>
        <div style={badgeIcon}>🏅</div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: "#111827" }}>
            {nome}
          </div>

          <div style={{ fontSize: 12, color: "#344563", marginTop: 4 }}>
            {descricao}
            {area && (
                <div style={{ fontSize: 12, color: "#4470AF", marginTop: 3 }}>
                    {area}
                </div>
                )}
          </div>
        </div>

        <div style={pointsBox}>
          <div style={{ fontSize: 10, fontWeight: 600 }}>Pontos</div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{pontos}</div>
        </div>
      </div>

      <div style={{ ...statusBar, color: corEstado }}>
        {estadoTexto}
      </div>
    </div>
  );
}

const filterLabel = {
  fontSize: 13,
  color: "#374151",
  marginBottom: 6,
};

const filterInput = {
  width: 260,
  height: 42,
  borderRadius: 10,
  border: "1px solid #dbeafe",
};

const badgeCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  marginBottom: 14,
  overflow: "hidden",
};

const badgeContent = {
  padding: "18px 12px",
  display: "flex",
  alignItems: "center",
  gap: 18,
};

const badgeIcon = {
  width: 72,
  height: 72,
  borderRadius: "50%",
  background: "#eef6ff",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexShrink: 0,
  fontSize: 28,
};

const pointsBox = {
  border: "1.5px solid #4470AF",
  borderRadius: 12,
  padding: "8px 10px",
  minWidth: 52,
  textAlign: "center",
  boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
};

const statusBar = {
  borderTop: "1px solid #e5e7eb",
  textAlign: "center",
  padding: "6px 0",
  fontSize: 12,
  background: "#fbfdff",
};

const paginationButton = {
  width: 45,
  height: 45,
  border: "none",
  borderRadius: 18,
  background: "#e9eef5",
  color: "#2f3d4f",
  fontSize: 20,
  fontWeight: 400,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const paginationCurrent = {
  width: 45,
  height: 45,
  borderRadius: 18,
  background: "#e1e7ef",
  color: "#2f3d4f",
  fontSize: 20,
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default CatalogoBadgesPage;