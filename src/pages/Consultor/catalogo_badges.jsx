import { useState, useEffect } from "react";
import { Button, Spinner, Form } from "react-bootstrap";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { BiMedal, BiGrid, BiMenu } from "react-icons/bi";

import Header from "../../components/header.jsx";
import RightSidebar from "../../components/right_sidebar.jsx";
import LeftSidebar from "../../components/left_sidebar.jsx";
import api from "../../services/api.js";
import BadgeImage from "../../components/badge_image.jsx";
import { obterBonusBadge, removerBadgesDuplicados,} from "../../utils/badgeBonus.js";

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
        const todos = removerBadgesDuplicados(
          Array.isArray(todosRes.data) ? todosRes.data : []
        );

        const conquistados = removerBadgesDuplicados(
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
            onAnterior={() =>
              setPaginaAtual((pagina) =>
                Math.max(1, pagina - 1)
              )
            }
            onProxima={() =>
              setPaginaAtual((pagina) =>
                Math.min(
                  totalPaginas,
                  pagina + 1
                )
              )
            }
            onSelecionarPagina={
              setPaginaAtual
            }
          />

          <div
            className="
              d-flex
              justify-content-center
              mt-4
              mb-4
            "
          >
            <Button
              variant="light"
              className="
                d-flex
                align-items-center
                justify-content-center
                gap-2
              "
              style={{
                minWidth: 175,
                height: 40,

                border:
                  "1px solid #d6dbe1",

                borderRadius: 8,

                background:
                  "#f8f9fa",

                color:
                  "#344054",

                fontSize: 14,
                fontWeight: 500,

                boxShadow:
                  "0 1px 2px rgba(0,0,0,0.04)",
              }}
              onClick={() =>
                navigate(
                  "/meus_badges"
                )
              }
            >
              <BiMedal size={18} />

              Os seus Badges
            </Button>
          </div>
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
  onSelecionarPagina,
}) {
  if (totalPaginas <= 1) {
    return null;
  }

  const disabledAnterior =
    paginaAtual === 1;

  const disabledProxima =
    paginaAtual ===
    totalPaginas;

  const criarPaginasVisiveis =
    () => {
      /*
       * Até cinco páginas:
       * apresenta todas.
       */
      if (totalPaginas <= 5) {
        return Array.from(
          {
            length:
              totalPaginas,
          },
          (_, index) =>
            index + 1
        );
      }

      /*
       * Muitas páginas:
       * mantém a atual ao centro.
       */
      if (paginaAtual <= 3) {
        return [
          1,
          2,
          3,
          4,
          "...",
          totalPaginas,
        ];
      }

      if (
        paginaAtual >=
        totalPaginas - 2
      ) {
        return [
          1,
          "...",
          totalPaginas - 3,
          totalPaginas - 2,
          totalPaginas - 1,
          totalPaginas,
        ];
      }

      return [
        1,
        "...",
        paginaAtual - 1,
        paginaAtual,
        paginaAtual + 1,
        "...",
        totalPaginas,
      ];
    };

  const paginasVisiveis =
    criarPaginasVisiveis();

  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "center",
        marginTop: 24,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: "white",
          border:
            "1px solid #dfe3e8",
          borderRadius: 9,
          padding: 5,
          boxShadow:
            "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <button
          type="button"
          onClick={onAnterior}
          disabled={
            disabledAnterior
          }
          aria-label="Página anterior"
          style={{
            ...paginationButton,

            color:
              disabledAnterior
                ? "#cbd0d6"
                : "#5f6b7a",

            cursor:
              disabledAnterior
                ? "not-allowed"
                : "pointer",

            background:
              disabledAnterior
                ? "#fafafa"
                : "white",
          }}
        >
          ‹
        </button>

        {paginasVisiveis.map(
          (
            pagina,
            index
          ) => {
            if (
              pagina === "..."
            ) {
              return (
                <div
                  key={`ellipsis-${index}`}
                  style={{
                    width: 30,
                    height: 32,
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    color:
                      "#8a94a3",
                    fontSize: 13,
                  }}
                >
                  ...
                </div>
              );
            }

            const ativa =
              Number(pagina) ===
              Number(
                paginaAtual
              );

            return (
              <button
                key={pagina}
                type="button"
                onClick={() =>
                  onSelecionarPagina(
                    pagina
                  )
                }
                aria-current={
                  ativa
                    ? "page"
                    : undefined
                }
                style={{
                  ...paginationButton,

                  background:
                    ativa
                      ? "#e8edf3"
                      : "white",

                  color:
                    ativa
                      ? "#1f2937"
                      : "#667085",

                  borderColor:
                    ativa
                      ? "#d6dce4"
                      : "transparent",

                  fontWeight:
                    ativa
                      ? 700
                      : 500,

                  cursor:
                    "pointer",
                }}
              >
                {pagina}
              </button>
            );
          }
        )}

        <div
          style={{
            minWidth: 42,
            padding:
              "0 6px",
            textAlign:
              "center",
            color:
              "#667085",
            fontSize:
              12,
            fontWeight:
              500,
          }}
        >
          {paginaAtual}/
          {totalPaginas}
        </div>

        <button
          type="button"
          onClick={onProxima}
          disabled={
            disabledProxima
          }
          aria-label="Página seguinte"
          style={{
            ...paginationButton,

            color:
              disabledProxima
                ? "#cbd0d6"
                : "#5f6b7a",

            cursor:
              disabledProxima
                ? "not-allowed"
                : "pointer",

            background:
              disabledProxima
                ? "#fafafa"
                : "white",
          }}
        >
          ›
        </button>
      </div>
    </div>
  );
}

function CatalogoBadgeRow({
  badge,
  conquistado,
  conquistadoBadge,
  pendente,
  onClick,
}) {
  const nome =
    badge.nome ||
    badge.nome_badge ||
    "Badge";

  const descricao =
    badge.descricao ||
    badge.descricao_badge_modelo ||
    "";

  const pontos =
    Number(badge.pontos || 0);

  const area =
    badge.nome_area ||
    badge.nome_areas ||
    badge.area ||
    "";

  /*
   * No catálogo, o bónus vem do badge
   * conquistado, não do badge de catálogo.
   */
  const {
    ganhouBonus,
    pontosExtra,
  } = obterBonusBadge(
    conquistadoBadge
  );

  const bonusAtivo =
    conquistado &&
    ganhouBonus;

  const estadoBase = conquistado
    ? conquistadoBadge?.data_atribuicao
      ? `Conquistado a ${new Date(
          conquistadoBadge.data_atribuicao
        ).toLocaleDateString("pt-PT")}`
      : "Conquistado recentemente"
    : pendente
      ? pendente.estado_validacao ||
        "A aguardar validação"
      : "Por Conquistar";

  const estadoTexto =
    bonusAtivo && pontosExtra > 0
      ? `${estadoBase} • +${pontosExtra} pontos extra`
      : estadoBase;

  const corEstado = bonusAtivo
    ? "#9a6b00"
    : conquistado
      ? "#2E7D32"
      : pendente
        ? "#EF6C00"
        : "#3b4a60";

  return (
    <div
      style={{
        ...badgeCard,
        cursor: "pointer",

        border: bonusAtivo
          ? "2px solid #d4af37"
          : badgeCard.border,

        boxShadow: bonusAtivo
          ? "0 0 0 3px rgba(212,175,55,0.12)"
          : "none",
      }}
      onClick={onClick}
    >
      <div style={badgeContent}>
        <BadgeImage
          badge={badge}
          size={72}
        />

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {nome}
            </div>

            {bonusAtivo && (
              <span
                style={{
                  background: "#fff7d6",
                  color: "#9a6b00",
                  border:
                    "1px solid #f0d36b",
                  borderRadius: 999,
                  padding: "3px 9px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                Desafio concluído
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#344563",
              marginTop: 4,
            }}
          >
            {descricao}

            {area && (
              <div
                style={{
                  fontSize: 12,
                  color: "#4470AF",
                  marginTop: 3,
                }}
              >
                {area}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            ...pointsBox,

            border: bonusAtivo
              ? "1.5px solid #d4af37"
              : pointsBox.border,

            background: bonusAtivo
              ? "#fffdf4"
              : "white",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: bonusAtivo
                ? "#9a6b00"
                : "#111827",
            }}
          >
            Pontos
          </div>

          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            {pontos}
          </div>

          {bonusAtivo &&
            pontosExtra > 0 && (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#d4a017",
                  whiteSpace: "nowrap",
                }}
              >
                +{pontosExtra} extra
              </div>
            )}
        </div>
      </div>

      <div
        style={{
          ...statusBar,
          color: corEstado,
          background: bonusAtivo
            ? "#fffdf4"
            : statusBar.background,
        }}
      >
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
  width: 34,
  height: 32,
  border:
    "1px solid transparent",
  borderRadius: 6,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  lineHeight: 1,
  padding: 0,
  transition:
    "background-color 0.15s ease, border-color 0.15s ease",
};

export default CatalogoBadgesPage;