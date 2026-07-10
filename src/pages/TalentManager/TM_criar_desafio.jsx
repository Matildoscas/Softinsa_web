import { useEffect, useMemo, useState } from "react";

import { Alert, Button, Form, Spinner } from "react-bootstrap";

import {
  BiArrowBack,
  BiBadge,
  BiBriefcase,
  BiCalendar,
  BiCheckCircle,
  BiEnvelope,
  BiGift,
  BiMedal,
  BiPhone,
  BiStar,
  BiTargetLock,
  BiUserCircle,
} from "react-icons/bi";

import { useLocation, useNavigate } from "react-router-dom";

import api from "../../services/api.js";

import Header from "../../components/Header.jsx";
import TmLeftSidebar from "../../components/tm_left_sidebar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function obterUtilizadorGuardado() {
  const guardado = localStorage.getItem("user");

  if (!guardado) {
    return null;
  }

  try {
    return JSON.parse(guardado);
  } catch (err) {
    console.error("Erro ao ler utilizador:", err);

    return null;
  }
}

function obterIdUtilizador() {
  const utilizador = obterUtilizadorGuardado();

  return (
    utilizador?.id_utilizador ||
    utilizador?.ID_UTILIZADOR ||
    utilizador?.id ||
    null
  );
}

function normalizarConsultor(consultor) {
  return {
    ...consultor,

    id_utilizador: consultor.id_utilizador,

    nome_completo: consultor.nome_completo || "Consultor",

    email: consultor.email || "Não disponível",

    contacto: consultor.contacto || "Não disponível",

    nome_area: consultor.nome_area || "Sem área definida",

    nome_serviceline: consultor.nome_serviceline || "Sem Service Line",

    nome_nivel:
      consultor.nome_nivel || consultor.nivel_atual || "Não disponível",

    total_badges: Number(
      consultor.total_badges || consultor.badges_conquistados_total || 0,
    ),

    pontos_atuais: Number(consultor.pontos_atuais || 0),

    candidatura_submetidas_total: Number(
      consultor.candidatura_submetidas_total ||
        consultor.total_candidaturas ||
        0,
    ),

    estado_conta: consultor.estado_conta || "ATIVO",

    online: Boolean(consultor.online),

    data_criacao_conta: consultor.data_criacao_conta || null,

    data_entrada_empresa: consultor.data_entrada_empresa || null,
  };
}

function formatarData(data) {
  if (!data) {
    return "Não disponível";
  }

  const texto = String(data);

  if (/^\d{4}$/.test(texto)) {
    return texto;
  }

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return texto;
  }

  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function obterDataMinima() {
  const data = new Date();

  data.setDate(data.getDate() + 1);

  const ano = data.getFullYear();

  const mes = String(data.getMonth() + 1).padStart(2, "0");

  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

/* =========================================================
   PÁGINA
========================================================= */

function CriarDesafioTm() {
  const navigate = useNavigate();

  const location = useLocation();

  const idTm = obterIdUtilizador();

  const idConsultorInicial = location.state?.idConsultor || "";

  const voltarPara = location.state?.voltarPara || "/tm/consultores";

  const [consultores, setConsultores] = useState([]);

  const [badges, setBadges] = useState([]);

  const [idConsultor, setIdConsultor] = useState(idConsultorInicial);

  const [idBadgeModelo, setIdBadgeModelo] = useState("");

  const [dataLimite, setDataLimite] = useState("");

  const [titulo, setTitulo] = useState("");

  const [descricao, setDescricao] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [erro, setErro] = useState("");

  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (!idTm) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    carregarDados();
  }, [idTm]);

  async function carregarDados() {
    try {
      setIsLoading(true);
      setErro("");

      const [respostaConsultores, respostaBadges] = await Promise.all([
        api.get(`/tm/${idTm}/consultores`),

        api.get("/lembretes/badges"),
      ]);

      const listaConsultores = Array.isArray(
        respostaConsultores.data?.consultores,
      )
        ? respostaConsultores.data.consultores.map(normalizarConsultor)
        : [];

      const listaBadges = Array.isArray(respostaBadges.data?.badges)
        ? respostaBadges.data.badges
        : [];

      setConsultores(listaConsultores);

      setBadges(listaBadges);

      if (
        idConsultorInicial &&
        listaConsultores.some(
          (consultor) =>
            String(consultor.id_utilizador) === String(idConsultorInicial),
        )
      ) {
        setIdConsultor(String(idConsultorInicial));
      }
    } catch (err) {
      console.error("Erro ao carregar criação de desafio:", err);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar os consultores e badges.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const consultorSelecionado = useMemo(
    () =>
      consultores.find(
        (consultor) => String(consultor.id_utilizador) === String(idConsultor),
      ) || null,
    [consultores, idConsultor],
  );

  const badgeSelecionado = useMemo(
    () =>
      badges.find(
        (badge) => String(badge.id_badge_modelo) === String(idBadgeModelo),
      ) || null,
    [badges, idBadgeModelo],
  );

  const pontosBase = Number(badgeSelecionado?.pontos || 0);

  const pontosExtra = pontosBase;

  const pontosTotais = pontosBase + pontosExtra;

  function selecionarBadge(event) {
    const novoId = event.target.value;

    setIdBadgeModelo(novoId);

    const badge = badges.find(
      (item) => String(item.id_badge_modelo) === String(novoId),
    );

    if (!badge) {
      setTitulo("");
      setDescricao("");
      return;
    }

    setTitulo(`Concluir o badge ${badge.nome_badge}`);

    setDescricao(
      `Concluir os requisitos e submeter as evidências necessárias para o badge ${badge.nome_badge} dentro do prazo definido.`,
    );
  }

  async function criarDesafio(event) {
    event.preventDefault();

    if (!idConsultor) {
      setErro("Seleciona um consultor.");

      return;
    }

    if (!idBadgeModelo) {
      setErro("Seleciona um badge.");

      return;
    }

    if (!dataLimite) {
      setErro("Seleciona uma data limite.");

      return;
    }

    const dataEscolhida = new Date(`${dataLimite}T23:59:59`);

    if (Number.isNaN(dataEscolhida.getTime()) || dataEscolhida <= new Date()) {
      setErro("A data limite deve ser futura.");

      return;
    }

    try {
      setIsSaving(true);
      setErro("");
      setMensagem("");

      await api.post(`/lembretes/tm/${idTm}`, {
        id_consultor: Number(idConsultor),

        id_badge_modelo: Number(idBadgeModelo),

        titulo: titulo.trim(),

        descricao: descricao.trim(),

        data_limite: dataLimite,
      });

      setMensagem(
        `Desafio enviado com sucesso a ${consultorSelecionado.nome_completo}.`,
      );

      setTimeout(() => {
        navigate(voltarPara, {
          replace: true,
        });
      }, 1200);
    } catch (err) {
      console.error("Erro ao criar desafio:", err);

      setErro(err.response?.data?.error || "Não foi possível criar o desafio.");
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
            onClick={() => navigate(voltarPara)}
            style={voltarButton}
          >
            <BiArrowBack size={18} />
            Voltar à lista de consultores
          </button>

          <div style={separador} />

          <div style={cabecalho}>
            <div style={cabecalhoIcone}>
              <BiTargetLock size={26} />
            </div>

            <div>
              <h1 style={tituloPagina}>Adicionar desafio</h1>

              <div style={subtituloPagina}>
                Define um badge e um prazo para o consultor. O desafio será
                enviado para aceitação.
              </div>
            </div>
          </div>

          {erro && (
            <Alert variant="danger" dismissible onClose={() => setErro("")}>
              {erro}
            </Alert>
          )}

          {mensagem && (
            <Alert variant="success">
              <BiCheckCircle className="me-2" />

              {mensagem}
            </Alert>
          )}

          {isLoading ? (
            <div style={loadingBox}>
              <Spinner animation="border" size="sm" />A carregar dados...
            </div>
          ) : (
            <Form onSubmit={criarDesafio}>
              <section style={secao}>
                <h2 style={tituloSecao}>1. Escolher consultor</h2>

                <Form.Group>
                  <Form.Label>Consultor</Form.Label>

                  <Form.Select
                    value={idConsultor}
                    onChange={(event) => setIdConsultor(event.target.value)}
                  >
                    <option value="">Selecionar consultor</option>

                    {consultores.map((consultor) => (
                      <option
                        key={consultor.id_utilizador}
                        value={consultor.id_utilizador}
                      >
                        {consultor.nome_completo} — {consultor.nome_area}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </section>

              {consultorSelecionado && (
                <section style={secao}>
                  <h2 style={tituloSecao}>Informações do consultor</h2>

                  <div style={perfilCabecalho}>
                    <div style={avatar}>
                      <BiUserCircle size={62} />
                    </div>

                    <div>
                      <div style={nomeConsultor}>
                        {consultorSelecionado.nome_completo}
                      </div>

                      <div style={estadoConsultor}>
                        {consultorSelecionado.online ? "Online" : "Offline"}
                      </div>
                    </div>
                  </div>

                  <div style={informacaoGrid}>
                    <InfoItem
                      icon={<BiEnvelope />}
                      label="Email"
                      value={consultorSelecionado.email}
                    />

                    <InfoItem
                      icon={<BiPhone />}
                      label="Contacto"
                      value={consultorSelecionado.contacto}
                    />

                    <InfoItem
                      icon={<BiBriefcase />}
                      label="Área"
                      value={consultorSelecionado.nome_area}
                    />

                    <InfoItem
                      icon={<BiBriefcase />}
                      label="Service Line"
                      value={consultorSelecionado.nome_serviceline}
                    />

                    <InfoItem
                      icon={<BiMedal />}
                      label="Nível atual"
                      value={consultorSelecionado.nome_nivel}
                    />

                    <InfoItem
                      icon={<BiBadge />}
                      label="Badges conquistados"
                      value={consultorSelecionado.total_badges}
                    />

                    <InfoItem
                      icon={<BiStar />}
                      label="Pontos atuais"
                      value={consultorSelecionado.pontos_atuais}
                    />

                    <InfoItem
                      icon={<BiBadge />}
                      label="Candidaturas"
                      value={consultorSelecionado.candidatura_submetidas_total}
                    />

                    <InfoItem
                      icon={<BiCalendar />}
                      label="Entrada na empresa"
                      value={formatarData(
                        consultorSelecionado.data_entrada_empresa,
                      )}
                    />

                    <InfoItem
                      icon={<BiCalendar />}
                      label="Criação da conta"
                      value={formatarData(
                        consultorSelecionado.data_criacao_conta,
                      )}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline-primary"
                    onClick={() =>
                      navigate(
                        `/tm/consultores/${consultorSelecionado.id_utilizador}`,
                        {
                          state: {
                            voltarPara: "/tm/desafios/novo",

                            textoVoltar: "Voltar ao desafio",
                          },
                        },
                      )
                    }
                  >
                    Ver perfil completo
                  </Button>
                </section>
              )}

              <section style={secao}>
                <h2 style={tituloSecao}>2. Definir o desafio</h2>

                <div style={formGrid}>
                  <Form.Group>
                    <Form.Label>Badge</Form.Label>

                    <Form.Select
                      value={idBadgeModelo}
                      onChange={selecionarBadge}
                      disabled={!idConsultor}
                    >
                      <option value="">Selecionar badge</option>

                      {badges.map((badge) => (
                        <option
                          key={badge.id_badge_modelo}
                          value={badge.id_badge_modelo}
                        >
                          {badge.nome_badge} — {badge.pontos} pontos
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label>Data limite</Form.Label>

                    <Form.Control
                      type="date"
                      min={obterDataMinima()}
                      value={dataLimite}
                      disabled={!idConsultor}
                      onChange={(event) => setDataLimite(event.target.value)}
                    />
                  </Form.Group>
                </div>

                <Form.Group className="mt-3">
                  <Form.Label>Título</Form.Label>

                  <Form.Control
                    type="text"
                    maxLength={200}
                    value={titulo}
                    disabled={!idBadgeModelo}
                    onChange={(event) => setTitulo(event.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mt-3">
                  <Form.Label>Descrição</Form.Label>

                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={descricao}
                    disabled={!idBadgeModelo}
                    onChange={(event) => setDescricao(event.target.value)}
                  />
                </Form.Group>
              </section>

              {badgeSelecionado && (
                <section style={recompensaSecao}>
                  <div style={recompensaIcone}>
                    <BiGift size={30} />
                  </div>

                  <div style={recompensaConteudo}>
                    <h2 style={tituloRecompensa}>Recompensa do desafio</h2>

                    <div style={badgeNome}>{badgeSelecionado.nome_badge}</div>

                    <div style={pontosGrid}>
                      <PontosCard label="Pontos do badge" valor={pontosBase} />

                      <div style={operador}>+</div>

                      <PontosCard
                        label="Bónus do desafio"
                        valor={pontosExtra}
                      />

                      <div style={operador}>=</div>

                      <PontosCard
                        label="Total possível"
                        valor={pontosTotais}
                        destaque
                      />
                    </div>

                    <div style={notaRecompensa}>
                      O total só será atribuído depois da aprovação normal do
                      Talent Manager e do Service Line Leader.
                    </div>
                  </div>
                </section>
              )}

              <div style={acoes}>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSaving}
                  onClick={() => navigate(voltarPara)}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={
                    isSaving || !idConsultor || !idBadgeModelo || !dataLimite
                  }
                >
                  {isSaving ? (
                    <>
                      <Spinner size="sm" className="me-2" />A enviar...
                    </>
                  ) : (
                    <>
                      <BiTargetLock size={18} className="me-2" />
                      Enviar desafio
                    </>
                  )}
                </Button>
              </div>
            </Form>
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

function InfoItem({ icon, label, value }) {
  return (
    <div style={infoItem}>
      <div style={infoIcon}>{icon}</div>

      <div>
        <div style={infoLabel}>{label}</div>

        <div style={infoValor}>{value ?? "Não disponível"}</div>
      </div>
    </div>
  );
}

function PontosCard({ label, valor, destaque = false }) {
  return (
    <div
      style={{
        ...pontosCard,

        ...(destaque ? pontosCardDestaque : {}),
      }}
    >
      <div style={pontosLabel}>{label}</div>

      <div style={pontosValor}>{valor}</div>

      <div style={pontosTexto}>pontos</div>
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
  padding: "22px 30px 70px",
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

const cabecalho = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 24,
};

const cabecalhoIcone = {
  width: 52,
  height: 52,
  borderRadius: 12,
  background: "#dbeafe",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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

const loadingBox = {
  minHeight: 250,
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  color: "#64748b",
};

const secao = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 20,
  marginBottom: 18,
};

const tituloSecao = {
  margin: "0 0 17px",
  color: "#111827",
  fontSize: 16,
  fontWeight: 800,
};

const perfilCabecalho = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 18,
};

const avatar = {
  width: 70,
  height: 70,
  borderRadius: "50%",
  background: "#eff6ff",
  color: "#6092bf",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const nomeConsultor = {
  color: "#111827",
  fontSize: 17,
  fontWeight: 800,
};

const estadoConsultor = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 12,
};

const informacaoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 18,
};

const infoItem = {
  minHeight: 68,
  border: "1px solid #e2e8f0",
  borderRadius: 9,
  padding: "11px 13px",
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const infoIcon = {
  width: 35,
  height: 35,
  borderRadius: 8,
  background: "#eff6ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const infoLabel = {
  color: "#94a3b8",
  fontSize: 10,
  textTransform: "uppercase",
};

const infoValor = {
  marginTop: 3,
  color: "#334155",
  fontSize: 12,
  fontWeight: 600,
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 16,
};

const recompensaSecao = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 12,
  padding: 20,
  display: "flex",
  alignItems: "flex-start",
  gap: 15,
  marginBottom: 18,
};

const recompensaIcone = {
  width: 52,
  height: 52,
  borderRadius: 12,
  background: "white",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const recompensaConteudo = {
  flex: 1,
};

const tituloRecompensa = {
  margin: 0,
  color: "#1e3a8a",
  fontSize: 16,
  fontWeight: 800,
};

const badgeNome = {
  marginTop: 3,
  color: "#2563eb",
  fontSize: 12,
};

const pontosGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 35px 1fr 35px 1fr",
  alignItems: "center",
  gap: 8,
  marginTop: 17,
};

const pontosCard = {
  background: "white",
  border: "1px solid #bfdbfe",
  borderRadius: 10,
  padding: 13,
  textAlign: "center",
};

const pontosCardDestaque = {
  background: "#2563eb",
  color: "white",
};

const pontosLabel = {
  fontSize: 10,
};

const pontosValor = {
  marginTop: 3,
  fontSize: 23,
  fontWeight: 800,
};

const pontosTexto = {
  fontSize: 10,
};

const operador = {
  textAlign: "center",
  color: "#2563eb",
  fontSize: 22,
  fontWeight: 800,
};

const notaRecompensa = {
  marginTop: 13,
  color: "#1e40af",
  fontSize: 11,
};

const acoes = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 20,
};

export default CriarDesafioTm;
