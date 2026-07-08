import {
  useEffect,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBriefcase,
  BiCheck,
  BiEnvelope,
  BiSave,
  BiUser,
} from "react-icons/bi";

import {
  useNavigate,
} from "react-router-dom";

import Header from "../../components/Header.jsx";
import TmLeftSidebar from "../../components/tm_left_sidebar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";

import api from "../../services/api.js";

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
   PÁGINA
========================================================= */

function DefinicoesTm() {
  const navigate =
    useNavigate();

  const [dados, setDados] =
    useState(null);

  const [
    nomeCompleto,
    setNomeCompleto,
  ] = useState("");

  const [
    contacto,
    setContacto,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  const [mensagem, setMensagem] =
    useState("");

  useEffect(() => {
    carregarDefinicoes();
  }, []);

  async function carregarDefinicoes() {
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

      const informacao =
        response.data || {};

      setDados(informacao);

      setNomeCompleto(
        informacao.nome_completo ||
        ""
      );

      setContacto(
        informacao.contacto ||
        ""
      );
    } catch (err) {
      console.error(
        "Erro ao carregar definições do TM:",
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
          "Não foi possível carregar as definições."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function guardarDefinicoes(
    event
  ) {
    event.preventDefault();

    const utilizador =
      obterUtilizadorGuardado();

    const idUtilizador =
      utilizador?.id_utilizador ||
      utilizador?.ID_UTILIZADOR ||
      utilizador?.id;

    if (!nomeCompleto.trim()) {
      setErro(
        "O nome completo é obrigatório."
      );

      return;
    }

    try {
      setIsSaving(true);
      setErro("");
      setMensagem("");

      const response =
        await api.put(
          `/tm/${idUtilizador}/definicoes`,
          {
            nome_completo:
              nomeCompleto.trim(),

            contacto:
              contacto.trim(),
          }
        );

      const utilizadorAtualizado =
        response.data?.utilizador ||
        {};

      setDados(
        utilizadorAtualizado
      );

      setMensagem(
        response.data?.message ||
          "Definições atualizadas com sucesso."
      );

      const utilizadorGuardado =
        obterUtilizadorGuardado();

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...utilizadorGuardado,

          nome_completo:
            utilizadorAtualizado
              .nome_completo,

          contacto:
            utilizadorAtualizado
              .contacto,
        })
      );
    } catch (err) {
      console.error(
        "Erro ao guardar definições:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível guardar as definições."
      );
    } finally {
      setIsSaving(false);
    }
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
              Definições da Conta
            </h1>

            <div style={subtitulo}>
              Consulta e atualiza os dados da sua
              conta de Talent Manager
            </div>
          </div>

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
          )}

          {mensagem && (
            <div style={sucessoBox}>
              <BiCheck size={17} />
              {mensagem}
            </div>
          )}

          {isLoading ? (
            <div style={mensagemBox}>
              A carregar definições...
            </div>
          ) : dados ? (
            <>
              <form
                onSubmit={
                  guardarDefinicoes
                }
                style={formularioCard}
              >
                <h2 style={tituloCard}>
                  Dados pessoais
                </h2>

                <div style={formularioGrid}>
                  <div style={campo}>
                    <label style={label}>
                      <BiUser size={16} />
                      Nome completo
                    </label>

                    <input
                      type="text"
                      value={nomeCompleto}
                      onChange={(event) =>
                        setNomeCompleto(
                          event.target.value
                        )
                      }
                      style={input}
                    />
                  </div>

                  <div style={campo}>
                    <label style={label}>
                      <BiEnvelope
                        size={16}
                      />
                      Email
                    </label>

                    <input
                      type="text"
                      value={
                        dados.email || ""
                      }
                      disabled
                      style={inputDesativado}
                    />
                  </div>

                  <div style={campo}>
                    <label style={label}>
                      <BiUser size={16} />
                      Contacto
                    </label>

                    <input
                      type="text"
                      value={contacto}
                      onChange={(event) =>
                        setContacto(
                          event.target.value
                        )
                      }
                      placeholder="Contacto telefónico"
                      style={input}
                    />
                  </div>

                  <div style={campo}>
                    <label style={label}>
                      <BiBriefcase
                        size={16}
                      />
                      Especialização
                    </label>

                    <input
                      type="text"
                      value={
                        dados.especializacao_tm ||
                        ""
                      }
                      disabled
                      style={inputDesativado}
                    />
                  </div>

                  <div style={campo}>
                    <label style={label}>
                      Estado da conta
                    </label>

                    <input
                      type="text"
                      value={
                        dados.estado_conta ||
                        "Não definido"
                      }
                      disabled
                      style={inputDesativado}
                    />
                  </div>

                  <div style={campo}>
                    <label style={label}>
                      Estado de Talent Manager
                    </label>

                    <input
                      type="text"
                      value={
                        dados.estado_tm ||
                        "Não definido"
                      }
                      disabled
                      style={inputDesativado}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    ...guardarButton,

                    opacity:
                      isSaving
                        ? 0.65
                        : 1,
                  }}
                >
                  <BiSave size={18} />

                  {isSaving
                    ? "A guardar..."
                    : "Guardar alterações"}
                </button>
              </form>

              <section style={estatisticasCard}>
                <h2 style={tituloCard}>
                  Resumo da atividade
                </h2>

                <div style={estatisticasGrid}>
                  <Estatistica
                    valor={
                      dados.numero_consultores_acompanhados ||
                      0
                    }
                    label="Consultores acompanhados"
                  />

                  <Estatistica
                    valor={
                      dados.candidaturas_avaliadas ||
                      0
                    }
                    label="Candidaturas avaliadas"
                  />

                  <Estatistica
                    valor={
                      dados.candidaturas_aprovadas ||
                      0
                    }
                    label="Candidaturas aprovadas"
                  />

                  <Estatistica
                    valor={
                      dados.candidaturas_rejeitadas ||
                      0
                    }
                    label="Candidaturas rejeitadas"
                  />
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
   ESTATÍSTICA
========================================================= */

function Estatistica({
  valor,
  label,
}) {
  return (
    <div style={estatisticaItem}>
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
  marginBottom: 22,
};

const titulo = {
  margin: 0,
  color: "#111827",
  fontSize: 22,
  fontWeight: 800,
};

const subtitulo = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 12,
};

const formularioCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "20px 22px",
  marginBottom: 20,
};

const tituloCard = {
  margin: "0 0 18px",
  color: "#111827",
  fontSize: 16,
  fontWeight: 700,
};

const formularioGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 20,
};

const campo = {
  minWidth: 0,
};

const label = {
  marginBottom: 7,
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#475569",
  fontSize: 11,
  fontWeight: 600,
};

const input = {
  width: "100%",
  height: 43,
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  background: "white",
  padding: "0 12px",
  color: "#111827",
  outline: "none",
  fontSize: 12,
};

const inputDesativado = {
  ...input,
  background: "#f1f5f9",
  color: "#64748b",
  cursor: "not-allowed",
};

const guardarButton = {
  width: "100%",
  minHeight: 45,
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  marginTop: 24,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const estatisticasCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "20px 22px",
};

const estatisticasGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: 16,
};

const estatisticaItem = {
  minHeight: 105,
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

const estatisticaValor = {
  color: "#2563eb",
  fontSize: 24,
  fontWeight: 800,
};

const estatisticaLabel = {
  marginTop: 5,
  color: "#64748b",
  fontSize: 10,
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

const sucessoBox = {
  background: "#dcfce7",
  border: "1px solid #bbf7d0",
  borderRadius: 10,
  padding: 12,
  color: "#166534",
  marginBottom: 18,
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  gap: 7,
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

export default DefinicoesTm;