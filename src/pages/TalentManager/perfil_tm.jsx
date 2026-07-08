import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBadgeCheck,
  BiBarChartAlt2,
  BiBriefcase,
  BiCalendar,
  BiCheck,
  BiEnvelope,
  BiPhone,
  BiTimeFive,
  BiUser,
  BiUserCheck,
  BiUserCircle,
  BiX,
} from "react-icons/bi";

import {
  useNavigate,
} from "react-router-dom";

import Header from "../../components/Header.jsx";
import TmLeftSidebar from "../../components/tm_left_sidebar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";

import api from "../../services/api.js";

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
   FUNÇÕES AUXILIARES
========================================================= */

function formatarData(data) {
  if (!data) {
    return "Não disponível";
  }

  const date = new Date(data);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Não disponível";
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

function formatarDataHora(data) {
  if (!data) {
    return "Não disponível";
  }

  const date = new Date(data);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Não disponível";
  }

  return date.toLocaleString(
    "pt-PT",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatarEstado(valor) {
  if (!valor) {
    return "Não definido";
  }

  return String(valor)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letra) =>
        letra.toUpperCase()
    );
}

/* =========================================================
   PÁGINA
========================================================= */

function PerfilTm() {
  const navigate =
    useNavigate();

  const [dados, setDados] =
    useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function carregarPerfil() {
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
          `/tm/${idUtilizador}/definicoes`
        );

      setDados(
        response.data || null
      );
    } catch (err) {
      console.error(
        "Erro ao carregar perfil do Talent Manager:",
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

      setDados(null);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar o perfil."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const taxaAprovacao =
    useMemo(() => {
      const avaliadas = Number(
        dados?.candidaturas_avaliadas ||
          0
      );

      const aprovadas = Number(
        dados?.candidaturas_aprovadas ||
          0
      );

      if (avaliadas === 0) {
        return 0;
      }

      return Math.round(
        (aprovadas / avaliadas) *
          100
      );
    }, [dados]);

  const taxaRejeicao =
    useMemo(() => {
      const avaliadas = Number(
        dados?.candidaturas_avaliadas ||
          0
      );

      const rejeitadas = Number(
        dados?.candidaturas_rejeitadas ||
          0
      );

      if (avaliadas === 0) {
        return 0;
      }

      return Math.round(
        (rejeitadas / avaliadas) *
          100
      );
    }, [dados]);

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
            <div>
              <h1 style={tituloPagina}>
                O meu Perfil
              </h1>

              <div style={subtituloPagina}>
                Informações da conta de
                Talent Manager
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/tm/definicoes"
                )
              }
              style={editarButton}
            >
              Editar informações
            </button>
          </div>

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
          )}

          {isLoading ? (
            <div style={mensagemBox}>
              A carregar perfil...
            </div>
          ) : dados ? (
            <>
              <section style={perfilCard}>
                <div style={identidadeArea}>
                  <div style={avatar}>
                    <BiUserCircle
                      size={92}
                      color="#6092bf"
                    />
                  </div>

                  <div style={nomeUtilizador}>
                    {dados.nome_completo ||
                      "Talent Manager"}
                  </div>

                  <div style={cargoUtilizador}>
                    Talent Manager
                  </div>

                  <div
                    style={{
                      ...estadoChip,

                      background:
                        String(
                          dados.estado_tm ||
                            ""
                        )
                          .toUpperCase()
                          .includes(
                            "ATIVO"
                          )
                          ? "#dcfce7"
                          : "#fee2e2",

                      color:
                        String(
                          dados.estado_tm ||
                            ""
                        )
                          .toUpperCase()
                          .includes(
                            "ATIVO"
                          )
                          ? "#15803d"
                          : "#b91c1c",
                    }}
                  >
                    {formatarEstado(
                      dados.estado_tm
                    )}
                  </div>
                </div>

                <div style={informacoesArea}>
                  <h2 style={tituloCard}>
                    Informações pessoais
                  </h2>

                  <div style={informacoesGrid}>
                    <InfoItem
                      icon={
                        <BiUser
                          size={19}
                        />
                      }
                      label="Nome completo"
                      value={
                        dados.nome_completo
                      }
                    />

                    <InfoItem
                      icon={
                        <BiEnvelope
                          size={19}
                        />
                      }
                      label="Email"
                      value={dados.email}
                    />

                    <InfoItem
                      icon={
                        <BiPhone
                          size={19}
                        />
                      }
                      label="Contacto"
                      value={
                        dados.contacto ||
                        "Não disponível"
                      }
                    />

                    <InfoItem
                    icon={<BiBriefcase size={19} />}
                    label="Tipo de utilizador"
                    value="Talent Manager"
                    />

                    <InfoItem
                      icon={
                        <BiUserCheck
                          size={19}
                        />
                      }
                      label="Estado da conta"
                      value={formatarEstado(
                        dados.estado_conta
                      )}
                    />

                    <InfoItem
                      icon={
                        <BiCalendar
                          size={19}
                        />
                      }
                      label="Data de criação"
                      value={formatarData(
                        dados.data_criacao_conta
                      )}
                    />

                    <InfoItem
                      icon={
                        <BiTimeFive
                          size={19}
                        />
                      }
                      label="Último acesso"
                      value={formatarDataHora(
                        dados.ultimo_login
                      )}
                    />

                    <InfoItem
                      icon={
                        <BiUser
                          size={19}
                        />
                      }
                      label="Identificador"
                      value={
                        dados.id_utilizador
                      }
                    />
                  </div>
                </div>
              </section>

              <section style={funcaoCard}>
                <h2 style={tituloCard}>
                  Informações profissionais
                </h2>

                <div style={funcaoGrid}>
                  <InfoProfissional
                    icon={
                      <BiBriefcase
                        size={23}
                      />
                    }
                    label="Especialização"
                    value={
                      dados.especializacao_tm ||
                      "Não definida"
                    }
                  />

                  <InfoProfissional
                    icon={
                      <BiUserCheck
                        size={23}
                      />
                    }
                    label="Estado de Talent Manager"
                    value={formatarEstado(
                      dados.estado_tm
                    )}
                  />

                  <InfoProfissional
                    icon={
                      <BiUser
                        size={23}
                      />
                    }
                    label="Consultores acompanhados"
                    value={
                      dados.numero_consultores_acompanhados ||
                      0
                    }
                  />
                </div>
              </section>

              <section style={estatisticasCard}>
                <h2 style={tituloCard}>
                  Resumo da atividade
                </h2>

                <div style={estatisticasGrid}>
                  <EstatisticaCard
                    icon={
                      <BiBarChartAlt2
                        size={27}
                      />
                    }
                    valor={
                      dados.candidaturas_avaliadas ||
                      0
                    }
                    label="Candidaturas avaliadas"
                  />

                  <EstatisticaCard
                    icon={
                      <BiCheck
                        size={29}
                      />
                    }
                    valor={
                      dados.candidaturas_aprovadas ||
                      0
                    }
                    label="Candidaturas aprovadas"
                  />

                  <EstatisticaCard
                    icon={
                      <BiX size={29} />
                    }
                    valor={
                      dados.candidaturas_rejeitadas ||
                      0
                    }
                    label="Candidaturas rejeitadas"
                  />

                  <EstatisticaCard
                    icon={
                      <BiBadgeCheck
                        size={28}
                      />
                    }
                    valor={`${taxaAprovacao}%`}
                    label="Taxa de aprovação"
                  />
                </div>
              </section>

              <section style={desempenhoCard}>
                <h2 style={tituloCard}>
                  Desempenho das avaliações
                </h2>

                <div style={barraItem}>
                  <div style={barraCabecalho}>
                    <span>
                      Candidaturas aprovadas
                    </span>

                    <strong>
                      {taxaAprovacao}%
                    </strong>
                  </div>

                  <div style={barraFundo}>
                    <div
                      style={{
                        ...barraAprovadas,
                        width:
                          `${taxaAprovacao}%`,
                      }}
                    />
                  </div>
                </div>

                <div style={barraItem}>
                  <div style={barraCabecalho}>
                    <span>
                      Candidaturas rejeitadas
                    </span>

                    <strong>
                      {taxaRejeicao}%
                    </strong>
                  </div>

                  <div style={barraFundo}>
                    <div
                      style={{
                        ...barraRejeitadas,
                        width:
                          `${taxaRejeicao}%`,
                      }}
                    />
                  </div>
                </div>
              </section>
            </>
          ) : (
            <div style={mensagemBox}>
              Talent Manager não encontrado.
            </div>
          )}
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function InfoItem({
  icon,
  label,
  value,
}) {
  return (
    <div style={infoItem}>
      <div style={infoIcon}>
        {icon}
      </div>

      <div style={infoTexto}>
        <div style={infoLabel}>
          {label}
        </div>

        <div style={infoValue}>
          {value ||
            "Não disponível"}
        </div>
      </div>
    </div>
  );
}

function InfoProfissional({
  icon,
  label,
  value,
}) {
  return (
    <div style={profissionalItem}>
      <div style={profissionalIcon}>
        {icon}
      </div>

      <div>
        <div style={profissionalLabel}>
          {label}
        </div>

        <div style={profissionalValue}>
          {value}
        </div>
      </div>
    </div>
  );
}

function EstatisticaCard({
  icon,
  valor,
  label,
}) {
  return (
    <div style={estatisticaItem}>
      <div style={estatisticaIcon}>
        {icon}
      </div>

      <div style={estatisticaValor}>
        {valor}
      </div>

      <div style={estatisticaLabel}>
        {label}
      </div>
    </div>
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
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 22,
};

const tituloPagina = {
  margin: 0,
  color: "#111827",
  fontSize: 22,
  fontWeight: 800,
};

const subtituloPagina = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 12,
};

const editarButton = {
  minHeight: 40,
  border: "1px solid #2563eb",
  borderRadius: 8,
  background: "white",
  color: "#2563eb",
  padding: "8px 17px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const perfilCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "22px 24px",
  display: "grid",
  gridTemplateColumns:
    "230px minmax(0, 1fr)",
  gap: 35,
  marginBottom: 20,
};

const identidadeArea = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  borderRight:
    "1px solid #e2e8f0",
  paddingRight: 28,
};

const avatar = {
  width: 110,
  height: 110,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const nomeUtilizador = {
  marginTop: 12,
  color: "#111827",
  fontSize: 17,
  fontWeight: 700,
  textAlign: "center",
};

const cargoUtilizador = {
  marginTop: 3,
  color: "#64748b",
  fontSize: 12,
};

const estadoChip = {
  marginTop: 9,
  borderRadius: 999,
  padding: "5px 15px",
  fontSize: 10,
  fontWeight: 600,
};

const informacoesArea = {
  minWidth: 0,
};

const tituloCard = {
  margin: "0 0 18px",
  color: "#111827",
  fontSize: 16,
  fontWeight: 700,
};

const informacoesGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 22,
};

const infoItem = {
  minWidth: 0,
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
};

const infoIcon = {
  width: 36,
  height: 36,
  flexShrink: 0,
  borderRadius: 8,
  background: "#eff6ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const infoTexto = {
  minWidth: 0,
};

const infoLabel = {
  color: "#94a3b8",
  fontSize: 10,
};

const infoValue = {
  marginTop: 3,
  color: "#334155",
  fontSize: 12,
  fontWeight: 600,
  overflowWrap: "anywhere",
};

const funcaoCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "20px 22px",
  marginBottom: 20,
};

const funcaoGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: 18,
};

const profissionalItem = {
  minHeight: 90,
  display: "flex",
  alignItems: "center",
  gap: 13,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "14px 16px",
};

const profissionalIcon = {
  width: 46,
  height: 46,
  flexShrink: 0,
  borderRadius: "50%",
  background: "#dbeafe",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const profissionalLabel = {
  color: "#94a3b8",
  fontSize: 10,
};

const profissionalValue = {
  marginTop: 4,
  color: "#111827",
  fontSize: 13,
  fontWeight: 700,
};

const estatisticasCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "20px 22px",
  marginBottom: 20,
};

const estatisticasGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: 16,
};

const estatisticaItem = {
  minHeight: 125,
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  background: "#f8fafc",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 12,
  textAlign: "center",
};

const estatisticaIcon = {
  color: "#2563eb",
  marginBottom: 7,
};

const estatisticaValor = {
  color: "#111827",
  fontSize: 23,
  fontWeight: 800,
};

const estatisticaLabel = {
  marginTop: 5,
  color: "#64748b",
  fontSize: 10,
};

const desempenhoCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "20px 22px",
};

const barraItem = {
  marginBottom: 18,
};

const barraCabecalho = {
  display: "flex",
  alignItems: "center",
  justifyContent:
    "space-between",
  color: "#475569",
  fontSize: 11,
  marginBottom: 7,
};

const barraFundo = {
  width: "100%",
  height: 10,
  borderRadius: 999,
  background: "#e2e8f0",
  overflow: "hidden",
};

const barraAprovadas = {
  height: "100%",
  borderRadius: 999,
  background: "#22c55e",
  transition: "width 0.3s",
};

const barraRejeitadas = {
  height: "100%",
  borderRadius: 999,
  background: "#ef4444",
  transition: "width 0.3s",
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

export default PerfilTm;