import {
  useEffect,
  useState,
} from "react";

import {
  BiArrowBack,
  BiChevronDown,
  BiChevronUp,
  BiLinkExternal,
  BiMedal,
} from "react-icons/bi";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api.js";
import DebugBadgePanel from "../../components/DebugBadgePanel.jsx";

import Header from "../../components/TM_Header.jsx";
import TmLeftSidebar from "../../components/TM_LeftBar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";

const CODIGOS_NIVEIS = [
  "A",
  "B",
  "C",
  "D",
  "E",
];

/* =========================================================
   UTILIZADOR AUTENTICADO
========================================================= */

function obterUtilizadorGuardado() {
  const guardado =
    localStorage.getItem("user");

  if (!guardado) {
    return null;
  }

  try {
    return JSON.parse(guardado);
  } catch (err) {
    console.error(
      "Erro ao ler utilizador:",
      err
    );

    return null;
  }
}

/* =========================================================
   NÍVEL
========================================================= */

function obterCodigoNivel(badge) {
  if (badge?.codigo_nivel) {
    return String(
      badge.codigo_nivel
    ).toUpperCase();
  }

  const nome = String(
    badge?.nome_nivel || ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toUpperCase();

  const mapa = {
    A: "A",
    JUNIOR: "A",

    B: "B",
    INTERMEDIO: "B",

    C: "C",
    SENIOR: "C",

    D: "D",
    ESPECIALISTA: "D",

    E: "E",

    "LIDER DE CONHECIMENTO":
      "E",
  };

  return (
    mapa[nome] ||
    CODIGOS_NIVEIS[
      Number(
        badge?.id_nivel
      ) - 1
    ] ||
    ""
  );
}

/* =========================================================
   NORMALIZAÇÃO
========================================================= */

function normalizarLinks(links) {
  if (!Array.isArray(links)) {
    return [];
  }

  return links
    .map((link) => {
      if (
        typeof link ===
        "string"
      ) {
        return link;
      }

      return link?.url || "";
    })
    .filter(Boolean);
}

function normalizarRequisito(
  requisito,
  index
) {
  return {
    id:
      requisito.id_requisitos ||
      requisito.id ||
      index + 1,

    codigo:
      requisito.nome_requisito ||
      `Requisito ${index + 1}`,

    titulo:
      requisito.titulo ||
      requisito.nome_requisito ||
      "Requisito",

    descricao:
      requisito.descricao_requisito ||
      requisito.descricao ||
      "Sem descrição.",

    links:
      normalizarLinks(
        requisito.links
      ),
  };
}

function normalizarBadge(badge) {
  return {
    id_badge_modelo:
      badge.id_badge_modelo ||
      badge.id ||
      "",

    nome_badge:
      badge.nome_badge ||
      badge.nome ||
      "Badge sem nome",

    descricao_badge_modelo:
      badge.descricao_badge_modelo ||
      badge.descricao ||
      "Sem descrição disponível.",

    imagem:
      badge.imagem ||
      badge.imagem_url ||
      null,

    id_nivel:
      badge.id_nivel ||
      null,

    nome_nivel:
      badge.nome_nivel ||
      "Sem nível",

    codigo_nivel:
      badge.codigo_nivel ||
      "",

    nome_area:
      badge.nome_area ||
      badge.nome_areas ||
      "Sem área associada",

    nome_serviceline:
      badge.nome_serviceline ||
      "Sem Service Line",

    pontos: Number(
      badge.pontos || 0
    ),

    numero_requisitos:
      Number(
        badge.numero_requisitos ||
          0
      ),

    tipo_badge:
      badge.tipo_badge ||
      "NORMAL",

    tempo_expiracao:
      badge.tempo_expiracao ||
      null,

    debug: badge.debug || null,

    requisitos:
      Array.isArray(
        badge.requisitos
      )
        ? badge.requisitos.map(
            normalizarRequisito
          )
        : [],
  };
}

/* =========================================================
   PÁGINA
========================================================= */

function InformacaoBadgeTm() {
  const navigate =
    useNavigate();
  const location = useLocation();

  const {
    idBadge,
  } = useParams();

  const [badge, setBadge] =
    useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [erro, setErro] =
    useState("");

  const voltarPara =
    location.state?.voltarPara ||
    "/tm/badges";

  const textoVoltar =
    location.state?.textoVoltar ||
    "Voltar ao catálogo";

  useEffect(() => {
    carregarBadge();
  }, [idBadge]);

  async function carregarBadge() {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    if (!idUtilizador) {
      setErro(
        "Não foi possível identificar o Talent Manager."
      );

      setIsLoading(false);
      return;
    }

    if (!idBadge) {
      setErro(
        "Não foi possível identificar o badge."
      );

      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      const response =
        await api.get(
          `/tm/${idUtilizador}/badges/${idBadge}`
        );

      const badgeRecebido =
        response.data?.badge;

      if (!badgeRecebido) {
        setBadge(null);

        setErro(
          "Badge não encontrado."
        );

        return;
      }

      setBadge(
        normalizarBadge(
          badgeRecebido
        )
      );
    } catch (err) {
      console.error(
        "Erro ao carregar informação do badge:",
        err
      );

      console.error(
        "STATUS:",
        err.response?.status
      );

      console.error(
        "BODY:",
        err.response?.data
      );

      setBadge(null);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar o badge."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const codigoNivel =
    obterCodigoNivel(badge);

  const badgeEspecial =
    String(
      badge?.tipo_badge || ""
    ).toUpperCase() ===
    "ESPECIAL";

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <TmLeftSidebar />

        <main style={conteudo}>
          <button
            type="button"
            onClick={() =>
              navigate(voltarPara)
            }
            style={voltarButton}
          >
            <BiArrowBack size={18} />

            {textoVoltar}
          </button>

          <div style={separador} />

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
          )}

          {isLoading ? (
            <div style={loadingBox}>
              A carregar informação do
              badge...
            </div>
          ) : badge ? (
            <>
              <section
                style={{
                  ...heroCard,

                  border: badgeEspecial
                    ? "1px solid #f59e0b"
                    : "1px solid #bfdbfe",

                  background:
                    badgeEspecial
                      ? "#fff8e1"
                      : "white",
                }}
              >
                <div
                  style={{
                    ...imagemCircle,

                    background:
                      badgeEspecial
                        ? "#ff8a00"
                        : "#eff6ff",

                    border:
                      badgeEspecial
                        ? "3px solid #f59e0b"
                        : "3px solid #dbeafe",
                  }}
                >
                  {badge.imagem ? (
                    <img
                      src={badge.imagem}
                      alt={
                        badge.nome_badge
                      }
                      style={imagemBadge}
                    />
                  ) : (
                    <BiMedal
                      size={54}
                      color={
                        badgeEspecial
                          ? "white"
                          : "#2563eb"
                      }
                    />
                  )}
                </div>

                <h1 style={nomeBadge}>
                  {badge.nome_badge}
                </h1>

                <div
                  style={serviceLineTexto}
                >
                  Service Line:{" "}
                  {
                    badge
                      .nome_serviceline
                  }
                </div>

                <div style={areaTexto}>
                  Área:{" "}
                  {badge.nome_area}
                </div>

                <div
                  style={informacoesHero}
                >
                  <span
                    style={infoHeroBadge}
                  >
                    {badge.pontos} pontos
                  </span>

                  <span
                    style={infoHeroBadge}
                  >
                    {
                      badge
                        .numero_requisitos
                    }{" "}
                    requisitos
                  </span>

                  <span
                    style={{
                      ...infoHeroBadge,

                      background:
                        badgeEspecial
                          ? "#ff8a00"
                          : "#eff6ff",

                      color:
                        badgeEspecial
                          ? "white"
                          : "#2563eb",
                    }}
                  >
                    {badgeEspecial
                      ? "Especial"
                      : badge.nome_nivel}
                  </span>
                </div>
              </section>

              <section style={sectionCard}>
                <h2 style={sectionTitle}>
                  Descrição
                </h2>

                <p style={descricaoTexto}>
                  {
                    badge
                      .descricao_badge_modelo
                  }
                </p>

                <DebugBadgePanel badge={badge} />
              </section>

              <section style={sectionCard}>
                <h2 style={sectionTitle}>
                  Nível
                </h2>

                {badgeEspecial ? (
                  <div
                    style={
                      badgeEspecialBox
                    }
                  >
                    Este é um badge
                    especial e não está
                    associado à progressão
                    normal dos níveis A–E.
                  </div>
                ) : (
                  <>
                    <div
                      style={
                        niveisContainer
                      }
                    >
                      {CODIGOS_NIVEIS.map(
                        (codigo) => {
                          const ativo =
                            codigo ===
                            codigoNivel;

                          return (
                            <div
                              key={
                                codigo
                              }
                              style={{
                                ...nivelCard,

                                border:
                                  ativo
                                    ? "2px solid #2563eb"
                                    : "1px solid #dbe3ef",

                                background:
                                  ativo
                                    ? "#eff6ff"
                                    : "white",

                                boxShadow:
                                  ativo
                                    ? "0 3px 10px rgba(37,99,235,0.18)"
                                    : "0 2px 5px rgba(15,23,42,0.08)",
                              }}
                            >
                              <div
                                style={{
                                  ...nivelCircle,

                                  background:
                                    ativo
                                      ? "#2563eb"
                                      : "#e5e7eb",

                                  color:
                                    ativo
                                      ? "white"
                                      : "#374151",
                                }}
                              >
                                {codigo}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>

                    <div
                      style={
                        nomeNivelTexto
                      }
                    >
                      Nível atual:{" "}
                      <strong>
                        {
                          badge
                            .nome_nivel
                        }
                      </strong>
                    </div>
                  </>
                )}
              </section>

              <section>
                <h2
                  style={
                    requisitosTitulo
                  }
                >
                  Requisitos do Badge
                </h2>

                {badge.requisitos
                  .length > 0 ? (
                  badge.requisitos.map(
                    (
                      requisito,
                      index
                    ) => (
                      <RequisitoCard
                        key={
                          requisito.id
                        }
                        requisito={
                          requisito
                        }
                        abertoInicial={
                          index === 0
                        }
                      />
                    )
                  )
                ) : (
                  <div
                    style={sectionCard}
                  >
                    <div
                      style={semDados}
                    >
                      Este badge ainda não
                      possui requisitos
                      registados.
                    </div>
                  </div>
                )}
              </section>
            </>
          ) : (
            !erro && (
              <div style={loadingBox}>
                Badge não encontrado.
              </div>
            )
          )}
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   REQUISITO
========================================================= */

function RequisitoCard({
  requisito,
  abertoInicial,
}) {
  const [aberto, setAberto] =
    useState(
      abertoInicial
    );

  return (
    <article style={requisitoCard}>
      <button
        type="button"
        onClick={() =>
          setAberto(
            (valorAtual) =>
              !valorAtual
          )
        }
        style={requisitoHeader}
      >
        <div
          style={
            requisitoHeaderText
          }
        >
          <span
            style={
              requisitoCodigo
            }
          >
            {requisito.codigo}
          </span>

          <span
            style={
              requisitoSeparador
            }
          >
            —
          </span>

          <span
            style={
              requisitoTitulo
            }
          >
            {requisito.titulo}
          </span>
        </div>

        {aberto ? (
          <BiChevronUp
            size={22}
            color="#64748b"
          />
        ) : (
          <BiChevronDown
            size={22}
            color="#64748b"
          />
        )}
      </button>

      {aberto && (
        <div style={requisitoBody}>
          <p
            style={
              requisitoDescricao
            }
          >
            {requisito.descricao}
          </p>

          {requisito.links.length >
            0 && (
            <div
              style={
                linksContainer
              }
            >
              {requisito.links.map(
                (url, index) => (
                  <a
                    key={`${url}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={
                      linkRequisito
                    }
                  >
                    <BiLinkExternal
                      size={15}
                    />

                    {url}
                  </a>
                )
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

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
  padding: "22px 30px 60px",
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

const separador = {
  height: 1,
  background: "#d1d5db",
  margin: "16px 0 20px",
};

const heroCard = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 14,
  padding: "28px 24px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginBottom: 18,
  boxShadow:
    "0 3px 8px rgba(15,23,42,0.08)",
};

const imagemCircle = {
  width: 118,
  height: 118,
  borderRadius: "50%",
  padding: 7,
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const imagemBadge = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  borderRadius: "50%",
};

const nomeBadge = {
  margin: "14px 0 0",
  fontSize: 21,
  fontWeight: 800,
  color: "#111827",
  textAlign: "center",
};

const serviceLineTexto = {
  marginTop: 6,
  color: "#2563eb",
  fontSize: 13,
  fontWeight: 600,
};

const areaTexto = {
  marginTop: 3,
  color: "#94a3b8",
  fontSize: 12,
};

const informacoesHero = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 9,
  flexWrap: "wrap",
  marginTop: 14,
};

const infoHeroBadge = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 29,
  borderRadius: 999,
  padding: "5px 12px",
  background: "#f1f5f9",
  color: "#475569",
  fontSize: 11,
  fontWeight: 600,
};

const sectionCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #bfdbfe",
  borderRadius: 13,
  padding: "18px 22px",
  marginBottom: 18,
};

const sectionTitle = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: "#111827",
};

const descricaoTexto = {
  margin: "9px 0 0",
  fontSize: 13,
  color: "#475569",
  lineHeight: 1.65,
};

const niveisContainer = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginTop: 14,
  flexWrap: "wrap",
};

const nivelCard = {
  width: 68,
  height: 68,
  borderRadius: 11,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const nivelCircle = {
  width: 47,
  height: 47,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 19,
  fontWeight: 800,
};

const nomeNivelTexto = {
  marginTop: 14,
  fontSize: 12,
  color: "#64748b",
};

const badgeEspecialBox = {
  marginTop: 14,
  background: "#fff8e1",
  border: "1px solid #f59e0b",
  borderRadius: 10,
  padding: "13px 15px",
  color: "#92400e",
  fontSize: 13,
  lineHeight: 1.5,
};

const requisitosTitulo = {
  margin: "4px 0 12px",
  fontSize: 16,
  fontWeight: 700,
  color: "#111827",
};

const requisitoCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 11,
  overflow: "hidden",
  marginBottom: 12,
};

const requisitoHeader = {
  width: "100%",
  border: "none",
  background: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  padding: "15px 18px",
  cursor: "pointer",
  textAlign: "left",
};

const requisitoHeaderText = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 5,
};

const requisitoCodigo = {
  color: "#111827",
  fontSize: 13,
  fontWeight: 800,
};

const requisitoSeparador = {
  color: "#94a3b8",
};

const requisitoTitulo = {
  color: "#334155",
  fontSize: 13,
  fontWeight: 600,
};

const requisitoBody = {
  borderTop: "1px solid #e5e7eb",
  background: "#f8fafc",
  padding: "13px 18px 16px",
};

const requisitoDescricao = {
  margin: 0,
  color: "#475569",
  fontSize: 13,
  lineHeight: 1.6,
};

const linksContainer = {
  marginTop: 10,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 7,
};

const linkRequisito = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  color: "#2563eb",
  fontSize: 12,
  textDecoration: "underline",
  wordBreak: "break-all",
};

const loadingBox = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#64748b",
};

const erroBox = {
  background: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: 12,
  color: "#991b1b",
  marginBottom: 18,
  fontSize: 13,
};

const semDados = {
  color: "#64748b",
  fontSize: 13,
};

export default InformacaoBadgeTm;