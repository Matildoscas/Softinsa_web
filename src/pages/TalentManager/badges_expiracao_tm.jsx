import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBell,
  BiCheck,
  BiFilterAlt,
  BiMedal,
  BiSearch,
  BiShow,
  BiSortAlt2,
  BiTimeFive,
  BiUserCircle,
} from "react-icons/bi";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "../../services/api.js";

import Header from "../../components/header.jsx";
import TmLeftSidebar from "../../components/tm_left_sidebar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";

/* =========================================================
   UTILIZADOR
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
   NORMALIZAÇÃO
========================================================= */

function normalizarBadge(
  badge,
  index
) {
  return {
    id_badge_atribuido:
      badge.id_badge_atribuido ||
      index,

    id_badge_modelo:
      badge.id_badge_modelo ||
      null,

    id_consultor:
      badge.id_consultor ||
      null,

    nome_completo:
      badge.nome_completo ||
      "Consultor",

    email:
      badge.email ||
      "Sem email",

    nome_badge:
      badge.nome_badge ||
      "Badge sem nome",

    descricao_badge_modelo:
      badge.descricao_badge_modelo ||
      "Sem descrição.",

    nome_nivel:
      badge.nome_nivel ||
      "Sem nível",

    nome_area:
      badge.nome_area_badge ||
      badge.nome_area_consultor ||
      "Sem área",

    nome_serviceline:
      badge.nome_serviceline ||
      "Sem Service Line",

    pontos: Number(
      badge.pontos || 0
    ),

    imagem:
      badge.imagem ||
      null,

    data_atribuicao:
      badge.data_atribuicao ||
      null,

    data_validade:
      badge.data_validade ||
      null,

    dias_restantes:
      Number(
        badge.dias_restantes || 0
      ),
  };
}

/* =========================================================
   DATAS E URGÊNCIA
========================================================= */

function formatarData(data) {
  if (!data) {
    return "Sem data";
  }

  const date = new Date(data);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Sem data";
  }

  return date.toLocaleDateString(
    "pt-PT",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function obterUrgencia(
  diasRestantes
) {
  const dias =
    Number(diasRestantes);

  if (dias <= 7) {
    return {
      texto:
        dias === 0
          ? "Expira hoje"
          : dias === 1
            ? "Expira amanhã"
            : `Expira em ${dias} dias`,

      background: "#fee2e2",
      color: "#dc2626",
      border: "#fca5a5",
    };
  }

  if (dias <= 30) {
    return {
      texto:
        `Expira em ${dias} dias`,

      background: "#fef3c7",
      color: "#a16207",
      border: "#fde68a",
    };
  }

  return {
    texto:
      `Expira em ${dias} dias`,

    background: "#dbeafe",
    color: "#2563eb",
    border: "#93c5fd",
  };
}

/* =========================================================
   PÁGINA
========================================================= */

function BadgesExpiracaoTm() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [badges, setBadges] =
    useState([]);

  const [
    permissoes,
    setPermissoes,
  ] = useState({
    pode_notificar_consultor:
      false,

    pode_ver_detalhes:
      false,

    pode_notificar_tm_rh:
      false,
  });

  const [
    talentManagerRh,
    setTalentManagerRh,
  ] = useState(null);

  const [
    especializacao,
    setEspecializacao,
  ] = useState("");

  const [pesquisa, setPesquisa] =
    useState("");

  const [
    pesquisaConsultor,
    setPesquisaConsultor,
  ] = useState("");

  const [
    filtroPrazo,
    setFiltroPrazo,
  ] = useState("90");

  const [
    ordenacao,
    setOrdenacao,
  ] = useState(
    "MAIS_PROXIMOS"
  );

  const [
    acaoEmCurso,
    setAcaoEmCurso,
  ] = useState("");

  const [
    mensagensCards,
    setMensagensCards,
  ] = useState({});

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    carregarBadges();
  }, []);

  async function carregarBadges() {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    if (!idUtilizador) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      const response =
        await api.get(
          `/tm/${idUtilizador}/expiracao?dias=90`
        );

      const dados =
        response.data || {};

      setEspecializacao(
        dados.talentManager
          ?.especializacao_tm ||
          ""
      );

      setPermissoes({
        pode_notificar_consultor:
          Boolean(
            dados.permissoes
              ?.pode_notificar_consultor
          ),

        pode_ver_detalhes:
          Boolean(
            dados.permissoes
              ?.pode_ver_detalhes
          ),

        pode_notificar_tm_rh:
          Boolean(
            dados.permissoes
              ?.pode_notificar_tm_rh
          ),
      });

      setTalentManagerRh(
        dados.talentManagerRh ||
        null
      );

      const lista =
        Array.isArray(dados.badges)
          ? dados.badges.map(
              normalizarBadge
            )
          : [];

      setBadges(lista);
    } catch (err) {
      console.error(
        "Erro ao carregar badges em expiração:",
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

      setBadges([]);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar os badges em expiração."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const badgesFiltrados =
    useMemo(() => {
      let resultado = [
        ...badges,
      ];

      const texto =
        pesquisa
          .trim()
          .toLowerCase();

      if (texto) {
        resultado =
          resultado.filter(
            (badge) =>
              badge.nome_badge
                .toLowerCase()
                .includes(texto) ||
              badge.nome_area
                .toLowerCase()
                .includes(texto) ||
              badge.nome_serviceline
                .toLowerCase()
                .includes(texto) ||
              badge
                .descricao_badge_modelo
                .toLowerCase()
                .includes(texto)
          );
      }

      const consultor =
        pesquisaConsultor
          .trim()
          .toLowerCase();

      if (consultor) {
        resultado =
          resultado.filter(
            (badge) =>
              badge.nome_completo
                .toLowerCase()
                .includes(consultor) ||
              badge.email
                .toLowerCase()
                .includes(consultor)
          );
      }

      const limite =
        Number(filtroPrazo);

      if (
        Number.isFinite(limite)
      ) {
        resultado =
          resultado.filter(
            (badge) =>
              badge.dias_restantes <=
              limite
          );
      }

      resultado.sort(
        (a, b) => {
          if (
            ordenacao ===
            "MAIS_DISTANTES"
          ) {
            return (
              b.dias_restantes -
              a.dias_restantes
            );
          }

          if (
            ordenacao ===
            "CONSULTOR_ASC"
          ) {
            return a.nome_completo.localeCompare(
              b.nome_completo,
              "pt"
            );
          }

          if (
            ordenacao ===
            "BADGE_ASC"
          ) {
            return a.nome_badge.localeCompare(
              b.nome_badge,
              "pt"
            );
          }

          return (
            a.dias_restantes -
            b.dias_restantes
          );
        }
      );

      return resultado;
    }, [
      badges,
      pesquisa,
      pesquisaConsultor,
      filtroPrazo,
      ordenacao,
    ]);

  async function notificarConsultor(
    badge
  ) {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    try {
      setAcaoEmCurso(
        `CONSULTOR-${badge.id_badge_atribuido}`
      );

      setErro("");

      const response =
        await api.post(
          `/tm/${idUtilizador}/expiracao/${badge.id_badge_atribuido}/notificar-consultor`
        );

      setMensagensCards(
        (anteriores) => ({
          ...anteriores,

          [badge.id_badge_atribuido]:
            response.data?.message ||
            "Consultor notificado.",
        })
      );
    } catch (err) {
      console.error(
        "Erro ao notificar consultor:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível notificar o consultor."
      );
    } finally {
      setAcaoEmCurso("");
    }
  }

  async function notificarTmRh(
    badge
  ) {
    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    try {
      setAcaoEmCurso(
        `RH-${badge.id_badge_atribuido}`
      );

      setErro("");

      const response =
        await api.post(
          `/tm/${idUtilizador}/expiracao/${badge.id_badge_atribuido}/notificar-rh`
        );

      setMensagensCards(
        (anteriores) => ({
          ...anteriores,

          [badge.id_badge_atribuido]:
            response.data?.message ||
            "Talent Manager de Recursos Humanos notificado.",
        })
      );
    } catch (err) {
      console.error(
        "Erro ao notificar TM de RH:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível notificar o Talent Manager de Recursos Humanos."
      );
    } finally {
      setAcaoEmCurso("");
    }
  }

  function verDetalhes(badge) {
    navigate(
        `/tm/expiracao/${badge.id_badge_atribuido}`,
        {
        state: {
            voltarPara: location.pathname,
            textoVoltar:
            "Voltar aos badges em expiração",
        },
        }
    );
    }

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <TmLeftSidebar />

        <main style={conteudo}>
          <button
            type="button"
            onClick={() =>
              navigate("/tm")
            }
            style={voltarButton}
          >
            <BiArrowBack size={18} />
            Voltar
          </button>

          <div style={separador} />

          <div style={cabecalhoPagina}>
            <h1 style={titulo}>
              Badges em Expiração
            </h1>

            <div style={subtitulo}>
              Total de{" "}
              {badgesFiltrados.length}{" "}
              {badgesFiltrados.length ===
              1
                ? "badge"
                : "badges"}
            </div>

            {especializacao && (
              <div
                style={
                  especializacaoTexto
                }
              >
                Especialização:{" "}
                <strong>
                  {especializacao}
                </strong>
              </div>
            )}

            {permissoes
              .pode_notificar_tm_rh &&
              talentManagerRh && (
                <div style={responsavelRh}>
                  Responsável de Recursos
                  Humanos:{" "}
                  <strong>
                    {
                      talentManagerRh
                        .nome_completo
                    }
                  </strong>
                </div>
              )}
          </div>

          {/* PESQUISA */}

          <div style={pesquisaBox}>
            <BiSearch
              size={19}
              color="#94a3b8"
            />

            <input
              type="text"
              value={pesquisa}
              onChange={(event) =>
                setPesquisa(
                  event.target.value
                )
              }
              placeholder="Buscar por badge, área ou Service Line..."
              style={pesquisaInput}
            />
          </div>

          {/* FILTROS */}

          <div style={filtrosContainer}>
            <div style={filtroCampo}>
              <label style={filtroLabel}>
                <BiFilterAlt
                  size={16}
                />
                Prazo de expiração
              </label>

              <select
                value={filtroPrazo}
                onChange={(event) =>
                  setFiltroPrazo(
                    event.target.value
                  )
                }
                style={inputFiltro}
              >
                <option value="7">
                  Próximos 7 dias
                </option>

                <option value="30">
                  Próximos 30 dias
                </option>

                <option value="60">
                  Próximos 60 dias
                </option>

                <option value="90">
                  Próximos 90 dias
                </option>
              </select>
            </div>

            <div style={filtroCampo}>
              <label style={filtroLabel}>
                <BiSearch size={16} />
                Buscar consultor
              </label>

              <input
                type="text"
                value={
                  pesquisaConsultor
                }
                onChange={(event) =>
                  setPesquisaConsultor(
                    event.target.value
                  )
                }
                placeholder="Nome ou email do consultor..."
                style={inputFiltro}
              />
            </div>

            <div style={filtroCampo}>
              <label style={filtroLabel}>
                <BiSortAlt2
                  size={16}
                />
                Ordenar por
              </label>

              <select
                value={ordenacao}
                onChange={(event) =>
                  setOrdenacao(
                    event.target.value
                  )
                }
                style={inputFiltro}
              >
                <option value="MAIS_PROXIMOS">
                  Expiram primeiro
                </option>

                <option value="MAIS_DISTANTES">
                  Expiram mais tarde
                </option>

                <option value="CONSULTOR_ASC">
                  Consultor A-Z
                </option>

                <option value="BADGE_ASC">
                  Badge A-Z
                </option>
              </select>
            </div>
          </div>

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
          )}

          {isLoading ? (
            <div style={mensagemBox}>
              A carregar badges em
              expiração...
            </div>
          ) : badgesFiltrados.length >
            0 ? (
            <div style={lista}>
              {badgesFiltrados.map(
                (badge) => (
                  <BadgeExpiracaoCard
                    key={
                      badge.id_badge_atribuido
                    }
                    badge={badge}
                    permissoes={
                      permissoes
                    }
                    mensagem={
                      mensagensCards[
                        badge
                          .id_badge_atribuido
                      ]
                    }
                    acaoEmCurso={
                      acaoEmCurso
                    }
                    onNotificarConsultor={() =>
                      notificarConsultor(
                        badge
                      )
                    }
                    onNotificarRh={() =>
                      notificarTmRh(
                        badge
                      )
                    }
                    onDetalhes={() =>
                      verDetalhes(
                        badge
                      )
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div style={mensagemBox}>
              Não existem badges dentro
              do prazo selecionado.
            </div>
          )}
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   CARD
========================================================= */

function BadgeExpiracaoCard({
  badge,
  permissoes,
  mensagem,
  acaoEmCurso,
  onNotificarConsultor,
  onNotificarRh,
  onDetalhes,
}) {
  const urgencia =
    obterUrgencia(
      badge.dias_restantes
    );

  const aNotificarConsultor =
    acaoEmCurso ===
    `CONSULTOR-${badge.id_badge_atribuido}`;

  const aNotificarRh =
    acaoEmCurso ===
    `RH-${badge.id_badge_atribuido}`;

  return (
    <article style={card}>
      <div style={consultorArea}>
        <div style={avatar}>
          <BiUserCircle
            size={54}
            color="#6092bf"
          />
        </div>

        <div style={nomeConsultor}>
          {badge.nome_completo}
        </div>

        <div style={cargoConsultor}>
          Consultor
        </div>

        <div style={emailConsultor}>
          {badge.email}
        </div>
      </div>

      <div style={badgeArea}>
        <div style={badgeImagemBox}>
          {badge.imagem ? (
            <img
              src={badge.imagem}
              alt={badge.nome_badge}
              style={badgeImagem}
            />
          ) : (
            <BiMedal
              size={31}
              color="#2563eb"
            />
          )}
        </div>

        <div style={badgeInfo}>
          <div style={badgeNome}>
            {badge.nome_badge}

            {badge.nome_nivel &&
              badge.nome_nivel !==
                "Sem nível" &&
              ` - ${badge.nome_nivel}`}
          </div>

          <div style={badgeDescricao}>
            {
              badge
                .descricao_badge_modelo
            }
          </div>

          <div style={chipsLinha}>
            <span style={areaChip}>
              {badge.nome_area}
            </span>

            <span
              style={serviceLineChip}
            >
              {
                badge
                  .nome_serviceline
              }
            </span>
          </div>

          <div style={dataAtribuicao}>
            Atribuído em{" "}
            {formatarData(
              badge.data_atribuicao
            )}
          </div>
        </div>
      </div>

      <div style={acoesArea}>
        <div
          style={{
            ...urgenciaBox,
            background:
              urgencia.background,
            color: urgencia.color,
            border:
              `1px solid ${urgencia.border}`,
          }}
        >
          <BiTimeFive size={17} />

          <div>
            <div style={urgenciaTexto}>
              {urgencia.texto}
            </div>

            <div style={dataValidade}>
              {formatarData(
                badge.data_validade
              )}
            </div>
          </div>
        </div>

        {permissoes
          .pode_notificar_consultor && (
          <button
            type="button"
            onClick={
              onNotificarConsultor
            }
            disabled={
              aNotificarConsultor
            }
            style={notificarButton}
          >
            <BiBell size={17} />

            {aNotificarConsultor
              ? "A notificar..."
              : "Notificar Consultor"}
          </button>
        )}

        {permissoes
          .pode_notificar_tm_rh && (
          <button
            type="button"
            onClick={onNotificarRh}
            disabled={
              aNotificarRh
            }
            style={notificarRhButton}
          >
            <BiBell size={17} />

            {aNotificarRh
              ? "A notificar..."
              : "Notificar TM de RH"}
          </button>
        )}

        {permissoes
          .pode_ver_detalhes && (
          <button
            type="button"
            onClick={onDetalhes}
            style={detalhesButton}
          >
            <BiShow size={17} />
            Ver Detalhes
          </button>
        )}

        {mensagem && (
          <div style={sucessoCard}>
            <BiCheck size={15} />
            {mensagem}
          </div>
        )}
      </div>
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

const cabecalhoPagina = {
  marginBottom: 22,
};

const titulo = {
  margin: 0,
  color: "#111827",
  fontSize: 21,
  fontWeight: 800,
};

const subtitulo = {
  marginTop: 3,
  color: "#475569",
  fontSize: 12,
};

const especializacaoTexto = {
  marginTop: 5,
  color: "#64748b",
  fontSize: 11,
};

const responsavelRh = {
  display: "inline-flex",
  marginTop: 7,
  padding: "6px 10px",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 7,
  color: "#2563eb",
  fontSize: 10,
};

const pesquisaBox = {
  width: "100%",
  minHeight: 50,
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: "0 16px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 16,
  boxShadow:
    "0 2px 5px rgba(15,23,42,0.05)",
};

const pesquisaInput = {
  flex: 1,
  minWidth: 0,
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#111827",
  fontSize: 13,
};

const filtrosContainer = {
  width: "100%",
  boxSizing: "border-box",
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: 16,
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 28,
  boxShadow:
    "0 2px 5px rgba(15,23,42,0.05)",
};

const filtroCampo = {
  display: "flex",
  flexDirection: "column",
  gap: 7,
  minWidth: 0,
};

const filtroLabel = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#475569",
  fontSize: 12,
  fontWeight: 600,
};

const inputFiltro = {
  width: "100%",
  height: 42,
  boxSizing: "border-box",
  border: "1px solid #dbe3ef",
  borderRadius: 9,
  background: "white",
  padding: "0 11px",
  outline: "none",
  color: "#111827",
  fontSize: 12,
};

const lista = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 20,
};

const card = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 190,
  display: "grid",
  gridTemplateColumns:
    "190px minmax(0, 1fr) 240px",
  gap: 22,
  alignItems: "center",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "18px 20px",
  boxShadow:
    "0 2px 7px rgba(15,23,42,0.05)",
};

const consultorArea = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
};

const avatar = {
  width: 63,
  height: 63,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const nomeConsultor = {
  marginTop: 7,
  color: "#111827",
  fontSize: 13,
  fontWeight: 600,
  textAlign: "center",
};

const cargoConsultor = {
  marginTop: 2,
  color: "#64748b",
  fontSize: 10,
};

const emailConsultor = {
  marginTop: 2,
  color: "#64748b",
  fontSize: 10,
  textAlign: "center",
  overflowWrap: "anywhere",
};

const badgeArea = {
  minWidth: 0,
  minHeight: 130,
  boxSizing: "border-box",
  display: "grid",
  gridTemplateColumns:
    "60px minmax(0, 1fr)",
  gap: 16,
  alignItems: "center",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 10,
  padding: "14px 16px",
};

const badgeImagemBox = {
  width: 57,
  height: 57,
  borderRadius: "50%",
  background: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const badgeImagem = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
};

const badgeInfo = {
  minWidth: 0,
};

const badgeNome = {
  color: "#2563eb",
  fontSize: 14,
  fontWeight: 600,
};

const badgeDescricao = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 11,
  lineHeight: 1.45,
};

const chipsLinha = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  flexWrap: "wrap",
  marginTop: 7,
};

const areaChip = {
  display: "inline-flex",
  background: "#dbeafe",
  color: "#2563eb",
  padding: "4px 8px",
  borderRadius: 4,
  fontSize: 9,
};

const serviceLineChip = {
  display: "inline-flex",
  background: "#e0e7ff",
  color: "#4338ca",
  padding: "4px 8px",
  borderRadius: 4,
  fontSize: 9,
};

const dataAtribuicao = {
  marginTop: 8,
  color: "#64748b",
  fontSize: 9,
};

const acoesArea = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const urgenciaBox = {
  minHeight: 48,
  borderRadius: 9,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "8px 12px",
  textAlign: "center",
};

const urgenciaTexto = {
  fontSize: 12,
  fontWeight: 700,
};

const dataValidade = {
  marginTop: 2,
  fontSize: 9,
};

const notificarButton = {
  minHeight: 42,
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 14px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow:
    "0 2px 5px rgba(37,99,235,0.20)",
};

const notificarRhButton = {
  minHeight: 42,
  border: "1px solid #2563eb",
  borderRadius: 8,
  background: "#dbeafe",
  color: "#1d4ed8",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 14px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const detalhesButton = {
  minHeight: 41,
  border: "1px solid #94a3b8",
  borderRadius: 8,
  background: "#cbd5e1",
  color: "#1e293b",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 13px",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
};

const sucessoCard = {
  display: "flex",
  alignItems: "flex-start",
  gap: 5,
  border: "1px solid #bbf7d0",
  borderRadius: 7,
  background: "#f0fdf4",
  color: "#166534",
  padding: "7px 9px",
  fontSize: 9,
  lineHeight: 1.4,
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

const mensagemBox = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#64748b",
};

export default BadgesExpiracaoTm;