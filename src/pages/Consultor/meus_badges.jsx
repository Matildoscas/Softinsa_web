import { useState, useEffect } from "react";
import { Button, Spinner, Form } from "react-bootstrap";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { BiMedal, BiGrid, BiMenu } from "react-icons/bi";

import Header from "../../components/Header.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import api from "../../services/api.js";
import BadgeImage from "../../components/badge_image.jsx";
import DebugBadgePanel from "../../components/DebugBadgePanel.jsx";
import {
  obterBonusBadge,
  obterPontosTotaisBadge,
  removerBadgesDuplicados,
} from "../../utils/badgeBonus.js";

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function obterCodigoNivelBadge(badge) {
  const codigoDireto =
    badge.codigo_nivel ||
    badge.CODIGO_NIVEL ||
    badge.nivel_codigo ||
    "";

  if (codigoDireto) {
    return normalizarTexto(codigoDireto);
  }

  const nomeNivel =
    badge.nome_nivel ||
    badge.NOME_NIVEL ||
    badge.nivel ||
    badge.nomeNivel ||
    "";

  const nome = normalizarTexto(nomeNivel);

  if (["A", "JUNIOR"].includes(nome)) return "A";
  if (["B", "INTERMEDIO"].includes(nome)) return "B";
  if (["C", "SENIOR"].includes(nome)) return "C";
  if (["D", "ESPECIALISTA"].includes(nome)) return "D";

  if (
    [
      "E",
      "LIDER DE CONHECIMENTO",
      "LEADER OF KNOWLEDGE",
      "KNOWLEDGE LEADER",
    ].includes(nome)
  ) {
    return "E";
  }

  const idNivel = Number(badge.id_nivel || badge.ID_NIVEL || 0);

  if (idNivel >= 1 && idNivel <= 5) {
    return ["", "A", "B", "C", "D", "E"][idNivel];
  }

  const pontosBase = Number(badge.pontos || 0);

  if (pontosBase === 50) return "A";
  if (pontosBase === 100) return "B";
  if (pontosBase === 150) return "C";
  if (pontosBase === 200) return "D";
  if (pontosBase === 300) return "E";

  return "";
}

function badgeEhEspecial(badge) {
  return obterCodigoNivelBadge(badge) === "E";
}

function badgeEhComum(badge) {
  return ["A", "B", "C", "D"].includes(
    obterCodigoNivelBadge(badge)
  );
}

function MeusBadgesPage() {
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
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const badgesPorPagina = 5;

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
        ])
        .then(([todosRes, conquistadosRes]) => {
            const todos = removerBadgesDuplicados(
            Array.isArray(todosRes.data) ? todosRes.data : []
            );

            const conquistadosRaw = removerBadgesDuplicados(
            Array.isArray(conquistadosRes.data) ? conquistadosRes.data : []
            );

            const conquistadosComArea = conquistadosRaw.map((badgeConquistado) => {
            const badgeId = Number(
                badgeConquistado.id || badgeConquistado.id_badge_modelo
            );

            const badgeCatalogo = todos.find(
                (b) => Number(b.id || b.id_badge_modelo) === badgeId
            );

            return {
                ...badgeCatalogo,
                ...badgeConquistado,
                nome_area:
                badgeConquistado.nome_area ||
                badgeCatalogo?.nome_area ||
                badgeCatalogo?.nome_areas ||
                badgeCatalogo?.area ||
                "",
            };
            });

            setBadges(conquistadosComArea);
            setConquistados(conquistadosComArea);

            setConquistadosIds(
            conquistadosComArea.map((b) => Number(b.id || b.id_badge_modelo))
            );

            setPendentes([]);
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
      ? codigoNivel === nivelFiltro
      : true;

    const codigoNivel = obterCodigoNivelBadge(b);

    const matchTipo =
      tipoFiltro === "comuns"
        ? badgeEhComum(b)
        : tipoFiltro === "especiais"
          ? badgeEhEspecial(b)
          : true;

    return matchArea && matchNivel && matchTipo;
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
  const semBadgesConquistados = badges.length === 0;

  useEffect(() => {
    setPaginaAtual(1);
  }, [areaFiltro, nivelFiltro, ordenacaoArea, tipoFiltro]);

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

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "28px 32px",
            display: "flex",
            flexDirection: "column",
          }}
        >
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
              <h5 className="fw-bold mb-0">Todos os seus badges conquistados</h5>
              <div style={{ fontSize: 13, color: "#4b5563" }}>
                Tem {badgesFiltrados.length} Badges
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
                  <option value="A">Nível A</option>
                  <option value="B">Nível B</option>
                  <option value="C">Nível C</option>
                  <option value="D">Nível D</option>
                  <option value="E">Nível E</option>
                </Form.Select>
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {badgesPaginaAtual.map((badge, index) => {
              const badgeId = Number(badge.id || badge.id_badge_modelo);
              const conquistadoBadge = badge;
              const conquistado = true;
              const pendente = null;

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

            {semBadgesConquistados && (
              <div
                style={{
                  border: "1px dashed #cbd5e1",
                  background: "#f8fafc",
                  color: "#64748b",
                  borderRadius: 10,
                  padding: 16,
                  fontSize: 13,
                }}
              >
                Ainda não tens badges conquistados.
              </div>
            )}

            {!semBadgesConquistados && badgesFiltrados.length === 0 && (
              <div
                style={{
                  border: "1px dashed #cbd5e1",
                  background: "#f8fafc",
                  color: "#64748b",
                  borderRadius: 10,
                  padding: 16,
                  fontSize: 13,
                }}
              >
                Não existem badges para os filtros selecionados.
              </div>
            )}

            <PaginacaoCatalogo
              paginaAtual={paginaAtual}
              totalPaginas={totalPaginas}
              onAnterior={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              onProxima={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
            />
          </div>

          <div
            className="
              d-flex
              justify-content-center
              gap-2
              mb-4
              flex-wrap
            "
            style={{ marginTop: "auto", paddingTop: 16 }}
          >
            <Button
              variant="light"
              className="
                d-flex
                align-items-center
                justify-content-center
                gap-2
              "
              style={obterEstiloBotaoFiltro(
                tipoFiltro === "comuns"
              )}
              onClick={() =>
                setTipoFiltro(
                  tipoFiltro === "comuns"
                    ? "todos"
                    : "comuns"
                )
              }
            >
              <BiMedal size={17} />
              Badges Comuns
            </Button>

            <Button
              variant="light"
              className="
                d-flex
                align-items-center
                justify-content-center
                gap-2
              "
              style={obterEstiloBotaoFiltro(
                tipoFiltro === "especiais"
              )}
              onClick={() =>
                setTipoFiltro(
                  tipoFiltro === "especiais"
                    ? "todos"
                    : "especiais"
                )
              }
            >
              <BiMedal size={17} />
              Badges Especiais
            </Button>

            <Button
              variant="light"
              className="
                d-flex
                align-items-center
                justify-content-center
                gap-2
              "
              style={bottomButtonStyle}
              onClick={() =>
                navigate("/catalogo-badges")
              }
            >
              <BiGrid size={17} />
              Catálogo de Badges
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
    Number(
      badge.pontos ||
      0
    );

  const area =
    badge.nome_area ||
    badge.nome_areas ||
    badge.area ||
    "";

  const {
    ganhouBonus,
    pontosExtra,
  } = obterBonusBadge(
    conquistadoBadge ||
    badge
  );

  const bonusAtivo =
    conquistado &&
    ganhouBonus;

  const pontosTotais =
    bonusAtivo
      ? obterPontosTotaisBadge(
          conquistadoBadge ||
            badge
        )
      : pontos;

  const pendenteTemEvidencias =
    Number(
      pendente?.total_evidencias_submetidas ||
        pendente?.total_evidencias_enviadas ||
        pendente?.total_evidencias ||
        0
    ) > 0 ||
    Boolean(
      pendente?.data_submissao
    );

  const estadoPendente =
    String(
      pendente?.estado_catalogo ||
        pendente?.estado_candidatura_pedido ||
        pendente?.estado_validacao ||
        ""
    )
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase();

  const estadoPendenteLegivel =
    pendente
      ? estadoPendente.includes(
          "REJEIT"
        ) || estadoPendente.includes(
          "RECUS"
        )
          ? "Candidatura rejeitada"
          : estadoPendente.includes(
          "CANDIDATURA_EFETUADA"
        )
        ? "Candidatura efetuada"
        : estadoPendente.includes(
            "CANDIDATURA_INICIADA"
          )
          ? "Candidatura iniciada"
          : pendenteTemEvidencias ||
              estadoPendente.includes("PENDENTE") ||
              estadoPendente.includes("VALIDAC")
            ? "Candidatura efetuada"
            : "Candidatura iniciada"
      : "";

  const estadoBase =
    conquistado
      ? conquistadoBadge
          ?.data_atribuicao
        ? `Conquistado a ${new Date(
            conquistadoBadge.data_atribuicao
          ).toLocaleDateString(
            "pt-PT"
          )}`
        : "Conquistado recentemente"
      : pendente
        ? estadoPendenteLegivel
        : "Por Conquistar";

  const estadoTexto =
    bonusAtivo &&
    pontosExtra > 0
      ? `${estadoBase} • Recebeste +${pontosExtra} pontos extra`
      : estadoBase;

  const corEstado =
    bonusAtivo
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

        cursor:
          "pointer",

        background:
          bonusAtivo
            ? "#fffef8"
            : "white",

        border:
          bonusAtivo
            ? "2px solid #d4af37"
            : badgeCard.border,

        boxShadow:
          bonusAtivo
            ? "0 0 0 3px rgba(212,175,55,0.12)"
            : "none",
      }}
      onClick={onClick}
    >
      <div
        style={
          badgeContent
        }
      >
        <BadgeImage
          badge={badge}
          size={72}
          background={
            bonusAtivo
              ? "#fff7d6"
              : "#eff6ff"
          }
          borderColor={
            bonusAtivo
              ? "#d4af37"
              : "#dbeafe"
          }
        />

        <div
          style={{
            flex: 1,
          }}
        >
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                9,

              flexWrap:
                "wrap",
            }}
          >
            <div
              style={{
                fontSize:
                  15,

                fontWeight:
                  600,

                color:
                  "#111827",
              }}
            >
              {nome}
            </div>

            {bonusAtivo && (
              <span
                style={{
                  background:
                    "#fff7d6",

                  color:
                    "#9a6b00",

                  border:
                    "1px solid #f0d36b",

                  borderRadius:
                    999,

                  padding:
                    "3px 9px",

                  fontSize:
                    11,

                  fontWeight:
                    700,
                }}
              >
                Desafio concluído
              </span>
            )}
          </div>

          <div
            style={{
              fontSize:
                12,

              color:
                "#344563",

              marginTop:
                4,
            }}
          >
            {descricao}

            {area && (
              <div
                style={{
                  fontSize:
                    12,

                  color:
                    "#4470AF",

                  marginTop:
                    3,
                }}
              >
                {area}
              </div>
            )}

            <DebugBadgePanel badge={badge} />
          </div>
        </div>

        <div
          style={{
            ...pointsBox,

            border:
              bonusAtivo
                ? "1.5px solid #d4af37"
                : pointsBox.border,

            background:
              bonusAtivo
                ? "#fffdf4"
                : "white",

            minWidth:
              bonusAtivo
                ? 82
                : 52,
          }}
        >
          <div
            style={{
              fontSize:
                10,

              fontWeight:
                600,

              color:
                bonusAtivo
                  ? "#9a6b00"
                  : "#111827",
            }}
          >
            Pontos
          </div>

          <div
            style={{
              fontSize:
                17,

              fontWeight:
                700,
            }}
          >
            {pontosTotais}
          </div>

          {bonusAtivo &&
            pontosExtra >
              0 && (
              <div
                style={{
                  marginTop:
                    2,

                  fontSize:
                    11,

                  fontWeight:
                    700,

                  color:
                    "#d4a017",

                  whiteSpace:
                    "nowrap",
                }}
              >
                +
                {
                  pontosExtra
                }{" "}
                extra
              </div>
            )}
        </div>
      </div>

      <div
        style={{
          ...statusBar,

          color:
            corEstado,

          background:
            bonusAtivo
              ? "#fffdf4"
              : statusBar.background,

          fontWeight:
            bonusAtivo
              ? 600
              : 400,
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

const bottomButtonStyle = {
  minWidth: 180,
  height: 40,
  padding: "0 16px",

  border: "1px solid #d6dbe1",
  borderRadius: 8,

  background: "#f8f9fa",
  color: "#344054",

  fontSize: 14,
  fontWeight: 500,

  boxShadow:
    "0 1px 2px rgba(0, 0, 0, 0.05)",

  transition:
    "background-color 0.15s ease, border-color 0.15s ease",
};

function obterEstiloBotaoFiltro(
  ativo
) {
  return {
    ...bottomButtonStyle,

    background: ativo
      ? "#e8edf3"
      : "#f8f9fa",

    borderColor: ativo
      ? "#c7d0db"
      : "#d6dbe1",

    color: ativo
      ? "#1f2937"
      : "#344054",

    fontWeight: ativo
      ? 600
      : 500,
  };
}

export default MeusBadgesPage;