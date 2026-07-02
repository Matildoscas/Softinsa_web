import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Badge,
  Button,
  Form,
  Modal,
  Spinner,
} from "react-bootstrap";

import {
  BiBadgeCheck,
  BiCalendar,
  BiCheckCircle,
  BiEditAlt,
  BiPlus,
  BiTargetLock,
  BiTimeFive,
  BiTrash,
  BiUser,
  BiX,
} from "react-icons/bi";

import {
  HiOutlineArrowLeft,
} from "react-icons/hi";

import {
  useNavigate,
} from "react-router-dom";

import api from "../../services/api.js";

import Header from "../../components/header.jsx";
import RightSidebar from "../../components/right_sidebar.jsx";
import LeftSidebar from "../../components/left_sidebar.jsx";

function construirRotaSubmissaoBadge(
  idBadgeModelo
) {
  return `/submeter-evidencias/${idBadgeModelo}`;
}

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

function obterIdUtilizador() {
  const utilizador =
    obterUtilizadorGuardado();

  return (
    utilizador?.id_utilizador ||
    utilizador?.ID_UTILIZADOR ||
    utilizador?.id ||
    null
  );
}

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function formatarData(data) {
  if (!data) {
    return "Sem prazo";
  }

  const date =
    new Date(data);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Data inválida";
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

function formatarDataInput(data) {
  if (!data) {
    return "";
  }

  const date =
    new Date(data);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const ano =
    date.getFullYear();

  const mes =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const dia =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function normalizarEstado(estado) {
  return String(
    estado || ""
  ).toUpperCase();
}

function obterEstadoVisual(estado) {
  const estadoNormalizado =
    normalizarEstado(estado);

  const estados = {
    AGUARDA_ACEITACAO: {
      texto:
        "Aguarda resposta",
      fundo: "#fef3c7",
      cor: "#92400e",
    },

    PENDENTE: {
      texto: "Pendente",
      fundo: "#dbeafe",
      cor: "#1d4ed8",
    },

    EM_VALIDACAO: {
      texto:
        "Em validação",
      fundo: "#ede9fe",
      cor: "#6d28d9",
    },

    CONCLUIDO: {
      texto: "Concluído",
      fundo: "#dcfce7",
      cor: "#15803d",
    },

    CONCLUIDO_SEM_PREMIO: {
      texto:
        "Concluído sem bónus",
      fundo: "#fef3c7",
      cor: "#92400e",
    },

    ATRASADO: {
      texto: "Atrasado",
      fundo: "#fee2e2",
      cor: "#b91c1c",
    },

    RECUSADO: {
      texto: "Recusado",
      fundo: "#f1f5f9",
      cor: "#475569",
    },

    REJEITADO_VALIDACAO: {
      texto:
        "Candidatura rejeitada",
      fundo: "#fee2e2",
      cor: "#b91c1c",
    },

    CANCELADO: {
      texto: "Cancelado",
      fundo: "#f1f5f9",
      cor: "#475569",
    },
  };

  return (
    estados[
      estadoNormalizado
    ] || {
      texto:
        estadoNormalizado ||
        "Sem estado",
      fundo: "#f1f5f9",
      cor: "#475569",
    }
  );
}

function obterTipoVisual(tipo) {
  const tipoNormalizado =
    String(
      tipo || ""
    ).toUpperCase();

  if (
    tipoNormalizado ===
    "DESAFIO_TM"
  ) {
    return {
      texto: "Desafio do TM",
      icone: (
        <BiTargetLock
          size={16}
        />
      ),
    };
  }

  if (
    tipoNormalizado ===
    "OBJETIVO_BADGE"
  ) {
    return {
      texto:
        "Objetivo de badge",
      icone: (
        <BiBadgeCheck
          size={16}
        />
      ),
    };
  }

  return {
    texto:
      "Lembrete pessoal",
    icone: (
      <BiCalendar
        size={16}
      />
    ),
  };
}

function calcularDiasRestantes(
  lembrete
) {
  if (
    lembrete.dias_restantes !==
      undefined &&
    lembrete.dias_restantes !==
      null
  ) {
    return Number(
      lembrete.dias_restantes
    );
  }

  if (!lembrete.data_limite) {
    return null;
  }

  const fim =
    new Date(
      lembrete.data_limite
    );

  const agora =
    new Date();

  return Math.ceil(
    (
      fim.getTime() -
      agora.getTime()
    ) /
      86400000
  );
}

function obterTextoPrazo(
  lembrete
) {
  const dias =
    calcularDiasRestantes(
      lembrete
    );

  if (dias === null) {
    return "Sem prazo";
  }

  if (dias < 0) {
    const total =
      Math.abs(dias);

    return `${total} ${
      total === 1
        ? "dia"
        : "dias"
    } em atraso`;
  }

  if (dias === 0) {
    return "Termina hoje";
  }

  if (dias === 1) {
    return "Falta 1 dia";
  }

  return `Faltam ${dias} dias`;
}

/* =========================================================
   PÁGINA
========================================================= */

function LembretePage() {
  const navigate =
    useNavigate();

  const idConsultor =
    obterIdUtilizador();

  const [
    lembretes,
    setLembretes,
  ] = useState([]);

  const [
    badgesDisponiveis,
    setBadgesDisponiveis,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    acaoEmCurso,
    setAcaoEmCurso,
  ] = useState("");

  const [erro, setErro] =
    useState("");

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const [
    filtroAtivo,
    setFiltroAtivo,
  ] = useState("TODOS");

  /* Modal de criação */

  const [
    mostrarCriar,
    setMostrarCriar,
  ] = useState(false);

  const [
    tipoCriacao,
    setTipoCriacao,
  ] = useState("PESSOAL");

  const [
    novoLembrete,
    setNovoLembrete,
  ] = useState({
    titulo: "",
    descricao: "",
    data_limite: "",
    id_badge_modelo: "",
    prazo_semanas: "3",
  });

  /* Modal de edição */

  const [
    lembreteEditar,
    setLembreteEditar,
  ] = useState(null);

  const [
    dadosEdicao,
    setDadosEdicao,
  ] = useState({
    titulo: "",
    descricao: "",
    data_limite: "",
  });

  /* Modal de eliminação */

  const [
    lembreteEliminar,
    setLembreteEliminar,
  ] = useState(null);

  /* Modal de recusa */

  const [
    desafioRecusar,
    setDesafioRecusar,
  ] = useState(null);

  const [
    motivoRecusa,
    setMotivoRecusa,
  ] = useState("");

  useEffect(() => {
    if (!idConsultor) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    carregarDados();
  }, [idConsultor]);

  async function carregarDados() {
    try {
      setIsLoading(true);
      setErro("");

      const [
        respostaLembretes,
        respostaBadges,
      ] = await Promise.all([
        api.get(
          `/lembretes/consultor/${idConsultor}`
        ),

        api.get(
          "/lembretes/badges"
        ),
      ]);

      const listaLembretes =
        Array.isArray(
          respostaLembretes
            .data?.todos
        )
          ? respostaLembretes
              .data.todos
          : [];

      const listaBadges =
        Array.isArray(
          respostaBadges
            .data?.badges
        )
          ? respostaBadges
              .data.badges
          : [];

      setLembretes(
        listaLembretes
      );

      setBadgesDisponiveis(
        listaBadges
      );
    } catch (err) {
      console.error(
        "Erro ao carregar lembretes:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar os lembretes."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const propostasTm =
    useMemo(
      () =>
        lembretes.filter(
          (item) =>
            normalizarEstado(
              item.estado_lembrete
            ) ===
            "AGUARDA_ACEITACAO"
        ),
      [lembretes]
    );

  const lembretesSemPropostas =
    useMemo(
      () =>
        lembretes.filter(
          (item) =>
            normalizarEstado(
              item.estado_lembrete
            ) !==
            "AGUARDA_ACEITACAO"
        ),
      [lembretes]
    );

  const lembretesFiltrados =
    useMemo(() => {
      if (
        filtroAtivo ===
        "PENDENTES"
      ) {
        return lembretesSemPropostas.filter(
          (item) =>
            [
              "PENDENTE",
              "EM_VALIDACAO",
            ].includes(
              normalizarEstado(
                item.estado_lembrete
              )
            )
        );
      }

      if (
        filtroAtivo ===
        "CONCLUIDOS"
      ) {
        return lembretesSemPropostas.filter(
          (item) =>
            [
              "CONCLUIDO",
              "CONCLUIDO_SEM_PREMIO",
            ].includes(
              normalizarEstado(
                item.estado_lembrete
              )
            )
        );
      }

      if (
        filtroAtivo ===
        "ATRASADOS"
      ) {
        return lembretesSemPropostas.filter(
          (item) =>
            normalizarEstado(
              item.estado_lembrete
            ) ===
            "ATRASADO"
        );
      }

      if (
        filtroAtivo ===
        "RECUSADOS"
      ) {
        return lembretesSemPropostas.filter(
          (item) =>
            [
              "RECUSADO",
              "REJEITADO_VALIDACAO",
            ].includes(
              normalizarEstado(
                item.estado_lembrete
              )
            )
        );
      }

      return lembretesSemPropostas;
    }, [
      filtroAtivo,
      lembretesSemPropostas,
    ]);

  const badgeSelecionado =
    useMemo(
      () =>
        badgesDisponiveis.find(
          (badge) =>
            String(
              badge.id_badge_modelo
            ) ===
            String(
              novoLembrete
                .id_badge_modelo
            )
        ) || null,
      [
        badgesDisponiveis,
        novoLembrete
          .id_badge_modelo,
      ]
    );

  function abrirModalCriacao() {
    setTipoCriacao(
      "PESSOAL"
    );

    setNovoLembrete({
      titulo: "",
      descricao: "",
      data_limite: "",
      id_badge_modelo: "",
      prazo_semanas: "3",
    });

    setErro("");
    setMensagem("");
    setMostrarCriar(true);
  }

  async function criarLembrete(
    event
  ) {
    event.preventDefault();

    if (
      tipoCriacao ===
      "PESSOAL"
    ) {
      if (
        !novoLembrete.titulo.trim()
      ) {
        setErro(
          "O título é obrigatório."
        );

        return;
      }

      if (
        !novoLembrete
          .data_limite
      ) {
        setErro(
          "Define uma data limite."
        );

        return;
      }
    }

    if (
      tipoCriacao ===
        "OBJETIVO_BADGE" &&
      !novoLembrete
        .id_badge_modelo
    ) {
      setErro(
        "Seleciona um badge."
      );

      return;
    }

    try {
      setIsSaving(true);
      setErro("");
      setMensagem("");

      const payload =
        tipoCriacao ===
        "PESSOAL"
          ? {
              tipo_lembrete:
                "PESSOAL",

              titulo:
                novoLembrete
                  .titulo
                  .trim(),

              descricao:
                novoLembrete
                  .descricao
                  .trim(),

              data_limite:
                novoLembrete
                  .data_limite,
            }
          : {
              tipo_lembrete:
                "OBJETIVO_BADGE",

              id_badge_modelo:
                novoLembrete
                  .id_badge_modelo,

              prazo_semanas:
                Number(
                  novoLembrete
                    .prazo_semanas
                ),

              titulo:
                novoLembrete
                  .titulo
                  .trim() ||
                undefined,

              descricao:
                novoLembrete
                  .descricao
                  .trim() ||
                undefined,
            };

      await api.post(
        `/lembretes/consultor/${idConsultor}`,
        payload
      );

      setMostrarCriar(false);

      setMensagem(
        tipoCriacao ===
        "PESSOAL"
          ? "Lembrete criado com sucesso."
          : "Objetivo de badge criado com sucesso."
      );

      await carregarDados();
    } catch (err) {
      console.error(
        "Erro ao criar lembrete:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível criar o lembrete."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function abrirEdicao(
    lembrete
  ) {
    setLembreteEditar(
      lembrete
    );

    setDadosEdicao({
      titulo:
        lembrete.titulo ||
        "",

      descricao:
        lembrete.descricao ||
        "",

      data_limite:
        formatarDataInput(
          lembrete.data_limite
        ),
    });

    setErro("");
    setMensagem("");
  }

  async function editarLembrete(
    event
  ) {
    event.preventDefault();

    if (
      !dadosEdicao
        .titulo.trim()
    ) {
      setErro(
        "O título é obrigatório."
      );

      return;
    }

    if (
      !dadosEdicao
        .data_limite
    ) {
      setErro(
        "A data limite é obrigatória."
      );

      return;
    }

    try {
      setIsSaving(true);
      setErro("");

      await api.put(
        `/lembretes/consultor/${idConsultor}/${lembreteEditar.id_lembrete}`,
        {
          titulo:
            dadosEdicao
              .titulo
              .trim(),

          descricao:
            dadosEdicao
              .descricao
              .trim(),

          data_limite:
            dadosEdicao
              .data_limite,
        }
      );

      setLembreteEditar(
        null
      );

      setMensagem(
        "Lembrete atualizado com sucesso."
      );

      await carregarDados();
    } catch (err) {
      console.error(
        "Erro ao editar lembrete:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível atualizar o lembrete."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function eliminarLembrete() {
    if (!lembreteEliminar) {
      return;
    }

    try {
      setIsSaving(true);
      setErro("");

      await api.delete(
        `/lembretes/consultor/${idConsultor}/${lembreteEliminar.id_lembrete}`
      );

      setLembreteEliminar(
        null
      );

      setMensagem(
        "Lembrete eliminado com sucesso."
      );

      await carregarDados();
    } catch (err) {
      console.error(
        "Erro ao eliminar lembrete:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível eliminar o lembrete."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function concluirLembrete(
    lembrete
  ) {
    const chaveAcao =
      `concluir-${lembrete.id_lembrete}`;

    try {
      setAcaoEmCurso(
        chaveAcao
      );

      setErro("");
      setMensagem("");

      const response =
        await api.put(
          `/lembretes/consultor/${idConsultor}/${lembrete.id_lembrete}/concluir`
        );

      const resultado =
        response.data;

      if (
        resultado
          .necessita_candidatura
      ) {
        navigate(
          construirRotaSubmissaoBadge(
            resultado
              .id_badge_modelo
          ),
          {
            state: {
              idLembrete:
                resultado
                  .id_lembrete,

              idBadgeModelo:
                resultado
                  .id_badge_modelo,

              voltarPara:
                "/lembretes",

              textoVoltar:
                "Voltar aos lembretes",
            },
          }
        );

        return;
      }

      setMensagem(
        "Lembrete concluído com sucesso."
      );

      await carregarDados();
    } catch (err) {
      console.error(
        "Erro ao concluir lembrete:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível concluir o lembrete."
      );
    } finally {
      setAcaoEmCurso("");
    }
  }

  async function aceitarDesafio(
    lembrete
  ) {
    const chaveAcao =
      `aceitar-${lembrete.id_lembrete}`;

    try {
      setAcaoEmCurso(
        chaveAcao
      );

      setErro("");
      setMensagem("");

      await api.put(
        `/lembretes/consultor/${idConsultor}/${lembrete.id_lembrete}/aceitar`
      );

      setMensagem(
        "Desafio aceite. Foi adicionado aos teus lembretes."
      );

      await carregarDados();
    } catch (err) {
      console.error(
        "Erro ao aceitar desafio:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível aceitar o desafio."
      );
    } finally {
      setAcaoEmCurso("");
    }
  }

  async function recusarDesafio() {
    if (!desafioRecusar) {
      return;
    }

    const chaveAcao =
      `recusar-${desafioRecusar.id_lembrete}`;

    try {
      setAcaoEmCurso(
        chaveAcao
      );

      setErro("");
      setMensagem("");

      await api.put(
        `/lembretes/consultor/${idConsultor}/${desafioRecusar.id_lembrete}/recusar`,
        {
          motivo:
            motivoRecusa.trim(),
        }
      );

      setDesafioRecusar(
        null
      );

      setMotivoRecusa("");

      setMensagem(
        "Desafio recusado."
      );

      await carregarDados();
    } catch (err) {
      console.error(
        "Erro ao recusar desafio:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível recusar o desafio."
      );
    } finally {
      setAcaoEmCurso("");
    }
  }

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <LeftSidebar />

        <main style={conteudo}>
          <button
            type="button"
            onClick={() =>
              navigate(
                "/pag_consultor"
              )
            }
            style={voltarButton}
          >
            <HiOutlineArrowLeft
              size={19}
            />

            Voltar
          </button>

          <div style={separador} />

          <div style={cabecalhoPagina}>
            <div>
              <h1 style={tituloPagina}>
                Lembretes e Objetivos
              </h1>

              <div style={subtituloPagina}>
                Organiza os teus objetivos,
                acompanha prazos e aceita
                desafios propostos pelo
                Talent Manager.
              </div>
            </div>

            <Button
              type="button"
              onClick={
                abrirModalCriacao
              }
              style={adicionarButton}
            >
              <BiPlus size={20} />
              Adicionar lembrete
            </Button>
          </div>

          {erro && (
            <Alert
              variant="danger"
              dismissible
              onClose={() =>
                setErro("")
              }
            >
              {erro}
            </Alert>
          )}

          {mensagem && (
            <Alert
              variant="success"
              dismissible
              onClose={() =>
                setMensagem("")
              }
            >
              {mensagem}
            </Alert>
          )}

          {isLoading ? (
            <div style={loadingBox}>
              <Spinner
                animation="border"
                size="sm"
              />

              <span>
                A carregar lembretes...
              </span>
            </div>
          ) : (
            <>
              <section style={resumoGrid}>
                <ResumoCard
                  valor={
                    lembretesSemPropostas.filter(
                      (item) =>
                        [
                          "PENDENTE",
                          "EM_VALIDACAO",
                        ].includes(
                          normalizarEstado(
                            item.estado_lembrete
                          )
                        )
                    ).length
                  }
                  label="Pendentes"
                  icon={
                    <BiTimeFive
                      size={23}
                    />
                  }
                />

                <ResumoCard
                  valor={
                    propostasTm.length
                  }
                  label="Propostas do TM"
                  icon={
                    <BiTargetLock
                      size={23}
                    />
                  }
                />

                <ResumoCard
                  valor={
                    lembretesSemPropostas.filter(
                      (item) =>
                        [
                          "CONCLUIDO",
                          "CONCLUIDO_SEM_PREMIO",
                        ].includes(
                          normalizarEstado(
                            item.estado_lembrete
                          )
                        )
                    ).length
                  }
                  label="Concluídos"
                  icon={
                    <BiCheckCircle
                      size={23}
                    />
                  }
                />

                <ResumoCard
                  valor={
                    lembretesSemPropostas.filter(
                      (item) =>
                        normalizarEstado(
                          item.estado_lembrete
                        ) ===
                        "ATRASADO"
                    ).length
                  }
                  label="Atrasados"
                  icon={
                    <BiCalendar
                      size={23}
                    />
                  }
                />
              </section>

              {propostasTm.length >
                0 && (
                <section
                  style={
                    propostasSection
                  }
                >
                  <div
                    style={
                      tituloSectionRow
                    }
                  >
                    <div>
                      <h2
                        style={
                          tituloSection
                        }
                      >
                        Propostas do Talent
                        Manager
                      </h2>

                      <div
                        style={
                          subtituloSection
                        }
                      >
                        Aceita ou recusa os
                        desafios antes de os
                        adicionares aos teus
                        objetivos.
                      </div>
                    </div>

                    <Badge bg="warning">
                      {
                        propostasTm.length
                      }{" "}
                      {propostasTm.length ===
                      1
                        ? "proposta"
                        : "propostas"}
                    </Badge>
                  </div>

                  <div
                    style={
                      listaLembretes
                    }
                  >
                    {propostasTm.map(
                      (lembrete) => (
                        <LembreteCard
                          key={
                            lembrete.id_lembrete
                          }
                          lembrete={
                            lembrete
                          }
                          isProposta
                          acaoEmCurso={
                            acaoEmCurso
                          }
                          onAceitar={() =>
                            aceitarDesafio(
                              lembrete
                            )
                          }
                          onRecusar={() => {
                            setDesafioRecusar(
                              lembrete
                            );

                            setMotivoRecusa(
                              ""
                            );

                            setErro("");
                          }}
                        />
                      )
                    )}
                  </div>
                </section>
              )}

              <section style={listaSection}>
                <div
                  style={
                    tituloSectionRow
                  }
                >
                  <div>
                    <h2
                      style={
                        tituloSection
                      }
                    >
                      Os meus lembretes
                    </h2>

                    <div
                      style={
                        subtituloSection
                      }
                    >
                      Consulta, edita ou
                      conclui os teus
                      objetivos.
                    </div>
                  </div>
                </div>

                <div style={filtros}>
                  <FiltroButton
                    ativo={
                      filtroAtivo ===
                      "TODOS"
                    }
                    onClick={() =>
                      setFiltroAtivo(
                        "TODOS"
                      )
                    }
                  >
                    Todos
                  </FiltroButton>

                  <FiltroButton
                    ativo={
                      filtroAtivo ===
                      "PENDENTES"
                    }
                    onClick={() =>
                      setFiltroAtivo(
                        "PENDENTES"
                      )
                    }
                  >
                    Pendentes
                  </FiltroButton>

                  <FiltroButton
                    ativo={
                      filtroAtivo ===
                      "CONCLUIDOS"
                    }
                    onClick={() =>
                      setFiltroAtivo(
                        "CONCLUIDOS"
                      )
                    }
                  >
                    Concluídos
                  </FiltroButton>

                  <FiltroButton
                    ativo={
                      filtroAtivo ===
                      "ATRASADOS"
                    }
                    onClick={() =>
                      setFiltroAtivo(
                        "ATRASADOS"
                      )
                    }
                  >
                    Atrasados
                  </FiltroButton>

                  <FiltroButton
                    ativo={
                      filtroAtivo ===
                      "RECUSADOS"
                    }
                    onClick={() =>
                      setFiltroAtivo(
                        "RECUSADOS"
                      )
                    }
                  >
                    Rejeitados
                  </FiltroButton>
                </div>

                {lembretesFiltrados.length ===
                0 ? (
                  <div style={vazioBox}>
                    <BiCalendar
                      size={37}
                      color="#94a3b8"
                    />

                    <div style={vazioTitulo}>
                      Não existem lembretes
                      nesta categoria
                    </div>

                    <div style={vazioTexto}>
                      Podes criar um novo
                      lembrete ou objetivo
                      através do botão acima.
                    </div>
                  </div>
                ) : (
                  <div
                    style={
                      listaLembretes
                    }
                  >
                    {lembretesFiltrados.map(
                      (lembrete) => (
                        <LembreteCard
                          key={
                            lembrete.id_lembrete
                          }
                          lembrete={
                            lembrete
                          }
                          acaoEmCurso={
                            acaoEmCurso
                          }
                          onEditar={() =>
                            abrirEdicao(
                              lembrete
                            )
                          }
                          onConcluir={() =>
                            concluirLembrete(
                              lembrete
                            )
                          }
                          onEliminar={() => {
                            setLembreteEliminar(
                              lembrete
                            );

                            setErro("");
                          }}
                        />
                      )
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </main>

        <RightSidebar />
      </div>

      {/* ===================================================
          MODAL CRIAR
      =================================================== */}

      <Modal
        show={mostrarCriar}
        onHide={() =>
          !isSaving &&
          setMostrarCriar(false)
        }
        centered
        size="lg"
      >
        <Form
          onSubmit={
            criarLembrete
          }
        >
          <Modal.Header
            closeButton
          >
            <Modal.Title>
              Adicionar lembrete
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div style={tipoCriacaoGrid}>
              <button
                type="button"
                onClick={() =>
                  setTipoCriacao(
                    "PESSOAL"
                  )
                }
                style={{
                  ...tipoCriacaoCard,

                  ...(tipoCriacao ===
                  "PESSOAL"
                    ? tipoCriacaoCardAtivo
                    : {}),
                }}
              >
                <BiCalendar
                  size={26}
                />

                <strong>
                  Lembrete pessoal
                </strong>

                <span>
                  Define um título,
                  descrição e prazo.
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setTipoCriacao(
                    "OBJETIVO_BADGE"
                  )
                }
                style={{
                  ...tipoCriacaoCard,

                  ...(tipoCriacao ===
                  "OBJETIVO_BADGE"
                    ? tipoCriacaoCardAtivo
                    : {}),
                }}
              >
                <BiBadgeCheck
                  size={26}
                />

                <strong>
                  Objetivo de badge
                </strong>

                <span>
                  Escolhe um badge e um
                  prazo em semanas.
                </span>
              </button>
            </div>

            {tipoCriacao ===
            "PESSOAL" ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Título
                  </Form.Label>

                  <Form.Control
                    type="text"
                    maxLength={200}
                    placeholder="Ex.: Concluir formação de Flutter"
                    value={
                      novoLembrete.titulo
                    }
                    onChange={(
                      event
                    ) =>
                      setNovoLembrete(
                        (anterior) => ({
                          ...anterior,

                          titulo:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Descrição
                  </Form.Label>

                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Descreve o objetivo que pretendes concluir."
                    value={
                      novoLembrete
                        .descricao
                    }
                    onChange={(
                      event
                    ) =>
                      setNovoLembrete(
                        (anterior) => ({
                          ...anterior,

                          descricao:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>
                    Prazo para concluir
                  </Form.Label>

                  <Form.Control
                    type="date"
                    value={
                      novoLembrete
                        .data_limite
                    }
                    onChange={(
                      event
                    ) =>
                      setNovoLembrete(
                        (anterior) => ({
                          ...anterior,

                          data_limite:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />
                </Form.Group>
              </>
            ) : (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Badge a concluir
                  </Form.Label>

                  <Form.Select
                    value={
                      novoLembrete
                        .id_badge_modelo
                    }
                    onChange={(
                      event
                    ) =>
                      setNovoLembrete(
                        (anterior) => ({
                          ...anterior,

                          id_badge_modelo:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  >
                    <option value="">
                      Selecionar badge
                    </option>

                    {badgesDisponiveis.map(
                      (badge) => (
                        <option
                          key={
                            badge.id_badge_modelo
                          }
                          value={
                            badge.id_badge_modelo
                          }
                        >
                          {
                            badge.nome_badge
                          }{" "}
                          —{" "}
                          {
                            badge.pontos
                          }{" "}
                          pontos
                        </option>
                      )
                    )}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Prazo
                  </Form.Label>

                  <Form.Select
                    value={
                      novoLembrete
                        .prazo_semanas
                    }
                    onChange={(
                      event
                    ) =>
                      setNovoLembrete(
                        (anterior) => ({
                          ...anterior,

                          prazo_semanas:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  >
                    <option value="1">
                      1 semana
                    </option>

                    <option value="2">
                      2 semanas
                    </option>

                    <option value="3">
                      3 semanas
                    </option>

                    <option value="4">
                      4 semanas
                    </option>

                    <option value="6">
                      6 semanas
                    </option>

                    <option value="8">
                      8 semanas
                    </option>

                    <option value="12">
                      12 semanas
                    </option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Título personalizado
                    <span style={opcional}>
                      {" "}
                      — opcional
                    </span>
                  </Form.Label>

                  <Form.Control
                    type="text"
                    placeholder={
                      badgeSelecionado
                        ? `Concluir o badge ${badgeSelecionado.nome_badge}`
                        : "O sistema gera automaticamente"
                    }
                    value={
                      novoLembrete.titulo
                    }
                    onChange={(
                      event
                    ) =>
                      setNovoLembrete(
                        (anterior) => ({
                          ...anterior,

                          titulo:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>
                    Descrição personalizada
                    <span style={opcional}>
                      {" "}
                      — opcional
                    </span>
                  </Form.Label>

                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="O sistema gera automaticamente uma descrição."
                    value={
                      novoLembrete
                        .descricao
                    }
                    onChange={(
                      event
                    ) =>
                      setNovoLembrete(
                        (anterior) => ({
                          ...anterior,

                          descricao:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                  />
                </Form.Group>

                {badgeSelecionado && (
                  <div style={badgeInfoModal}>
                    <BiBadgeCheck
                      size={24}
                    />

                    <div>
                      <strong>
                        {
                          badgeSelecionado.nome_badge
                        }
                      </strong>

                      <div>
                        {
                          badgeSelecionado.pontos
                        }{" "}
                        pontos após a aprovação
                        normal do TM e SLL.
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              type="button"
              disabled={isSaving}
              onClick={() =>
                setMostrarCriar(
                  false
                )
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Spinner
                    size="sm"
                    className="me-2"
                  />

                  A guardar...
                </>
              ) : (
                <>
                  <BiPlus
                    size={18}
                    className="me-1"
                  />

                  Criar lembrete
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ===================================================
          MODAL EDITAR
      =================================================== */}

      <Modal
        show={Boolean(
          lembreteEditar
        )}
        onHide={() =>
          !isSaving &&
          setLembreteEditar(null)
        }
        centered
      >
        <Form
          onSubmit={
            editarLembrete
          }
        >
          <Modal.Header
            closeButton
          >
            <Modal.Title>
              Editar lembrete
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>
                Título
              </Form.Label>

              <Form.Control
                type="text"
                value={
                  dadosEdicao.titulo
                }
                onChange={(
                  event
                ) =>
                  setDadosEdicao(
                    (anterior) => ({
                      ...anterior,

                      titulo:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                Descrição
              </Form.Label>

              <Form.Control
                as="textarea"
                rows={4}
                value={
                  dadosEdicao
                    .descricao
                }
                onChange={(
                  event
                ) =>
                  setDadosEdicao(
                    (anterior) => ({
                      ...anterior,

                      descricao:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>
                Data limite
              </Form.Label>

              <Form.Control
                type="date"
                value={
                  dadosEdicao
                    .data_limite
                }
                onChange={(
                  event
                ) =>
                  setDadosEdicao(
                    (anterior) => ({
                      ...anterior,

                      data_limite:
                        event.target
                          .value,
                    })
                  )
                }
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              type="button"
              disabled={isSaving}
              onClick={() =>
                setLembreteEditar(
                  null
                )
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving
                ? "A guardar..."
                : "Guardar alterações"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ===================================================
          MODAL ELIMINAR
      =================================================== */}

      <Modal
        show={Boolean(
          lembreteEliminar
        )}
        onHide={() =>
          !isSaving &&
          setLembreteEliminar(
            null
          )
        }
        centered
      >
        <Modal.Header
          closeButton
        >
          <Modal.Title>
            Eliminar lembrete
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p style={{ marginBottom: 8 }}>
            Tens a certeza de que
            pretendes eliminar este
            lembrete?
          </p>

          <strong>
            {
              lembreteEliminar
                ?.titulo
            }
          </strong>

          <div style={modalAviso}>
            O lembrete será cancelado e
            deixará de aparecer na tua
            lista ativa.
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            disabled={isSaving}
            onClick={() =>
              setLembreteEliminar(
                null
              )
            }
          >
            Cancelar
          </Button>

          <Button
            variant="danger"
            disabled={isSaving}
            onClick={
              eliminarLembrete
            }
          >
            {isSaving
              ? "A eliminar..."
              : "Eliminar"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ===================================================
          MODAL RECUSAR DESAFIO
      =================================================== */}

      <Modal
        show={Boolean(
          desafioRecusar
        )}
        onHide={() =>
          !acaoEmCurso &&
          setDesafioRecusar(
            null
          )
        }
        centered
      >
        <Modal.Header
          closeButton
        >
          <Modal.Title>
            Recusar desafio
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p>
            Pretendes recusar o desafio:
          </p>

          <strong>
            {
              desafioRecusar
                ?.titulo
            }
          </strong>

          <Form.Group className="mt-3">
            <Form.Label>
              Motivo
              <span style={opcional}>
                {" "}
                — opcional
              </span>
            </Form.Label>

            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Explica ao Talent Manager o motivo da recusa."
              value={motivoRecusa}
              onChange={(
                event
              ) =>
                setMotivoRecusa(
                  event.target.value
                )
              }
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            disabled={Boolean(
              acaoEmCurso
            )}
            onClick={() =>
              setDesafioRecusar(
                null
              )
            }
          >
            Voltar
          </Button>

          <Button
            variant="danger"
            disabled={Boolean(
              acaoEmCurso
            )}
            onClick={
              recusarDesafio
            }
          >
            {acaoEmCurso
              ? "A recusar..."
              : "Recusar desafio"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

/* =========================================================
   CARTÃO DE LEMBRETE
========================================================= */

function LembreteCard({
  lembrete,
  isProposta = false,
  acaoEmCurso,
  onEditar,
  onConcluir,
  onEliminar,
  onAceitar,
  onRecusar,
}) {
  const estado =
    normalizarEstado(
      lembrete.estado_lembrete
    );

  const estadoVisual =
    obterEstadoVisual(estado);

  const tipoVisual =
    obterTipoVisual(
      lembrete.tipo_lembrete
    );

  const criadoPeloConsultor =
    String(
      lembrete.origem
    ).toUpperCase() ===
    "CONSULTOR";

  const podeEditar =
    criadoPeloConsultor &&
    estado === "PENDENTE" &&
    !lembrete.id_candidatura_pedido;

  const podeEliminar =
    criadoPeloConsultor &&
    [
      "PENDENTE",
      "ATRASADO",
    ].includes(estado);

  const podeConcluir =
    [
      "PENDENTE",
      "ATRASADO",
    ].includes(estado);

  const isDesafio =
    String(
      lembrete.tipo_lembrete
    ).toUpperCase() ===
    "DESAFIO_TM";

  const pontosBadge =
    Number(
      lembrete.pontos_badge ||
        0
    );

  const totalDesafio =
    isDesafio
      ? pontosBadge * 2
      : pontosBadge;

  const algumaAcao =
    Boolean(acaoEmCurso);

  return (
    <article style={lembreteCard}>
      <div style={lembreteTopo}>
        <div style={tipoLembrete}>
          {tipoVisual.icone}

          <span>
            {tipoVisual.texto}
          </span>
        </div>

        <span
          style={{
            ...estadoChip,
            background:
              estadoVisual.fundo,
            color:
              estadoVisual.cor,
          }}
        >
          {estadoVisual.texto}
        </span>
      </div>

      <div style={lembreteCorpo}>
        <div style={iconeLembrete}>
          {lembrete.imagem_badge ? (
            <img
              src={
                lembrete.imagem_badge
              }
              alt={
                lembrete.nome_badge ||
                lembrete.titulo
              }
              style={imagemLembrete}
            />
          ) : isDesafio ? (
            <BiTargetLock
              size={30}
            />
          ) : lembrete.id_badge_modelo ? (
            <BiBadgeCheck
              size={30}
            />
          ) : (
            <BiCalendar
              size={30}
            />
          )}
        </div>

        <div style={conteudoLembrete}>
          <h3 style={tituloLembrete}>
            {lembrete.titulo}
          </h3>

          {lembrete.descricao && (
            <p style={descricaoLembrete}>
              {lembrete.descricao}
            </p>
          )}

          <div style={metadadosGrid}>
            <div style={metaItem}>
              <BiCalendar
                size={16}
              />

              <span>
                Prazo:{" "}
                <strong>
                  {formatarData(
                    lembrete.data_limite
                  )}
                </strong>
              </span>
            </div>

            <div style={metaItem}>
              <BiTimeFive
                size={16}
              />

              <span>
                {obterTextoPrazo(
                  lembrete
                )}
              </span>
            </div>

            <div style={metaItem}>
              <BiUser size={16} />

              <span>
                {criadoPeloConsultor
                  ? "Criado por ti"
                  : `Criado por ${
                      lembrete.nome_criador ||
                      "Talent Manager"
                    }`}
              </span>
            </div>

            {lembrete.nome_badge && (
              <div style={metaItem}>
                <BiBadgeCheck
                  size={16}
                />

                <span>
                  {
                    lembrete.nome_badge
                  }
                </span>
              </div>
            )}
          </div>

          {lembrete.nome_badge && (
            <div style={pontosBox}>
              {isDesafio ? (
                <>
                  <strong>
                    Recompensa do desafio:
                  </strong>{" "}
                  {pontosBadge} pontos do
                  badge + {pontosBadge} de
                  bónus ={" "}
                  <strong>
                    {totalDesafio} pontos
                  </strong>
                </>
              ) : (
                <>
                  <strong>
                    Valor do badge:
                  </strong>{" "}
                  {pontosBadge} pontos após
                  aprovação do TM e SLL.
                </>
              )}
            </div>
          )}

          {Number(
            lembrete.pontos_bonus ||
              0
          ) > 0 && (
            <div style={premioBox}>
              <BiCheckCircle
                size={17}
              />

              Recebeste{" "}
              <strong>
                {
                  lembrete.pontos_bonus
                }{" "}
                pontos extra
              </strong>
              .
            </div>
          )}

          {estado ===
            "EM_VALIDACAO" && (
            <div style={validacaoBox}>
              A candidatura já foi
              submetida e está a ser
              avaliada pelo TM e pelo SLL.
            </div>
          )}

          {lembrete.motivo_recusa && (
            <div style={motivoBox}>
              <strong>
                Motivo:
              </strong>{" "}
              {
                lembrete.motivo_recusa
              }
            </div>
          )}
        </div>
      </div>

      <div style={acoesLembrete}>
        {isProposta ? (
          <>
            <Button
              variant="outline-danger"
              disabled={algumaAcao}
              onClick={onRecusar}
            >
              <BiX
                size={18}
                className="me-1"
              />
              Recusar
            </Button>

            <Button
              variant="primary"
              disabled={algumaAcao}
              onClick={onAceitar}
            >
              {acaoEmCurso ===
              `aceitar-${lembrete.id_lembrete}` ? (
                <Spinner
                  size="sm"
                  className="me-2"
                />
              ) : (
                <BiCheckCircle
                  size={18}
                  className="me-1"
                />
              )}

              Aceitar desafio
            </Button>
          </>
        ) : (
          <>
            {podeEditar && (
              <Button
                variant="outline-primary"
                disabled={algumaAcao}
                onClick={onEditar}
              >
                <BiEditAlt
                  size={17}
                  className="me-1"
                />
                Editar
              </Button>
            )}

            {podeConcluir && (
              <Button
                variant="success"
                disabled={algumaAcao}
                onClick={
                  onConcluir
                }
              >
                {acaoEmCurso ===
                `concluir-${lembrete.id_lembrete}` ? (
                  <Spinner
                    size="sm"
                    className="me-2"
                  />
                ) : (
                  <BiCheckCircle
                    size={17}
                    className="me-1"
                  />
                )}

                {lembrete.id_badge_modelo
                  ? "Concluir e submeter"
                  : "Concluir"}
              </Button>
            )}

            {podeEliminar && (
              <Button
                variant="outline-danger"
                disabled={algumaAcao}
                onClick={
                  onEliminar
                }
              >
                <BiTrash
                  size={17}
                  className="me-1"
                />
                Eliminar
              </Button>
            )}
          </>
        )}
      </div>
    </article>
  );
}

/* =========================================================
   COMPONENTES AUXILIARES
========================================================= */

function ResumoCard({
  valor,
  label,
  icon,
}) {
  return (
    <div style={resumoCard}>
      <div style={resumoIcon}>
        {icon}
      </div>

      <div>
        <div style={resumoValor}>
          {valor}
        </div>

        <div style={resumoLabel}>
          {label}
        </div>
      </div>
    </div>
  );
}

function FiltroButton({
  ativo,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...filtroButton,

        ...(ativo
          ? filtroButtonAtivo
          : {}),
      }}
    >
      {children}
    </button>
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
  gap: 6,
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
  width: "100%",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 22,
};

const tituloPagina = {
  margin: 0,
  color: "#111827",
  fontSize: 23,
  fontWeight: 800,
};

const subtituloPagina = {
  marginTop: 5,
  color: "#64748b",
  fontSize: 12,
  maxWidth: 650,
};

const adicionarButton = {
  minHeight: 42,
  border: "none",
  borderRadius: 9,
  background: "#2563eb",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 17px",
  fontSize: 13,
  fontWeight: 700,
};

const loadingBox = {
  minHeight: 220,
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  color: "#64748b",
};

const resumoGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(0, 1fr))",
  gap: 14,
  marginBottom: 24,
};

const resumoCard = {
  minHeight: 90,
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 11,
  padding: "15px 17px",
  display: "flex",
  alignItems: "center",
  gap: 13,
};

const resumoIcon = {
  width: 45,
  height: 45,
  borderRadius: 10,
  background: "#eff6ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const resumoValor = {
  color: "#111827",
  fontSize: 21,
  fontWeight: 800,
};

const resumoLabel = {
  marginTop: 2,
  color: "#64748b",
  fontSize: 11,
};

const propostasSection = {
  width: "100%",
  background: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: 12,
  padding: "18px",
  marginBottom: 24,
};

const listaSection = {
  width: "100%",
};

const tituloSectionRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 15,
  marginBottom: 14,
};

const tituloSection = {
  margin: 0,
  color: "#111827",
  fontSize: 17,
  fontWeight: 800,
};

const subtituloSection = {
  marginTop: 3,
  color: "#64748b",
  fontSize: 11,
};

const filtros = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 17,
};

const filtroButton = {
  border: "1px solid #cbd5e1",
  borderRadius: 999,
  background: "white",
  color: "#475569",
  padding: "7px 14px",
  fontSize: 11,
  cursor: "pointer",
};

const filtroButtonAtivo = {
  borderColor: "#2563eb",
  background: "#2563eb",
  color: "white",
  fontWeight: 700,
};

const listaLembretes = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const lembreteCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "17px 19px",
  boxShadow:
    "0 2px 5px rgba(15,23,42,0.04)",
};

const lembreteTopo = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  paddingBottom: 11,
  borderBottom: "1px solid #f1f5f9",
};

const tipoLembrete = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  color: "#475569",
  fontSize: 11,
  fontWeight: 700,
};

const estadoChip = {
  borderRadius: 999,
  padding: "5px 11px",
  fontSize: 10,
  fontWeight: 700,
};

const lembreteCorpo = {
  display: "flex",
  alignItems: "flex-start",
  gap: 15,
  paddingTop: 16,
};

const iconeLembrete = {
  width: 58,
  height: 58,
  flexShrink: 0,
  borderRadius: 12,
  background: "#eff6ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const imagemLembrete = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const conteudoLembrete = {
  minWidth: 0,
  flex: 1,
};

const tituloLembrete = {
  margin: 0,
  color: "#111827",
  fontSize: 15,
  fontWeight: 800,
};

const descricaoLembrete = {
  margin: "5px 0 0",
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};

const metadadosGrid = {
  marginTop: 13,
  display: "flex",
  alignItems: "center",
  gap: "8px 17px",
  flexWrap: "wrap",
};

const metaItem = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  color: "#64748b",
  fontSize: 10,
};

const pontosBox = {
  marginTop: 13,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 8,
  padding: "9px 11px",
  color: "#1e40af",
  fontSize: 11,
};

const premioBox = {
  marginTop: 10,
  background: "#dcfce7",
  border: "1px solid #bbf7d0",
  borderRadius: 8,
  padding: "9px 11px",
  color: "#166534",
  fontSize: 11,
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const validacaoBox = {
  marginTop: 10,
  background: "#f5f3ff",
  border: "1px solid #ddd6fe",
  borderRadius: 8,
  padding: "9px 11px",
  color: "#6d28d9",
  fontSize: 11,
};

const motivoBox = {
  marginTop: 10,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "9px 11px",
  color: "#475569",
  fontSize: 11,
};

const acoesLembrete = {
  marginTop: 16,
  paddingTop: 13,
  borderTop: "1px solid #f1f5f9",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 9,
  flexWrap: "wrap",
};

const vazioBox = {
  minHeight: 220,
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 30,
  textAlign: "center",
};

const vazioTitulo = {
  marginTop: 10,
  color: "#334155",
  fontSize: 14,
  fontWeight: 700,
};

const vazioTexto = {
  marginTop: 4,
  color: "#94a3b8",
  fontSize: 11,
};

const tipoCriacaoGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginBottom: 22,
};

const tipoCriacaoCard = {
  minHeight: 125,
  border: "1px solid #dbe3ef",
  borderRadius: 11,
  background: "#f8fafc",
  color: "#475569",
  padding: "15px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 6,
  textAlign: "left",
  cursor: "pointer",
};

const tipoCriacaoCardAtivo = {
  borderColor: "#2563eb",
  background: "#eff6ff",
  color: "#1d4ed8",
  boxShadow:
    "0 0 0 1px #2563eb",
};

const opcional = {
  color: "#94a3b8",
  fontWeight: 400,
  fontSize: 11,
};

const badgeInfoModal = {
  marginTop: 17,
  border: "1px solid #bfdbfe",
  borderRadius: 9,
  background: "#eff6ff",
  color: "#1e40af",
  padding: "12px 14px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 11,
};

const modalAviso = {
  marginTop: 13,
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 8,
  padding: 10,
  color: "#991b1b",
  fontSize: 11,
};

export default LembretePage;