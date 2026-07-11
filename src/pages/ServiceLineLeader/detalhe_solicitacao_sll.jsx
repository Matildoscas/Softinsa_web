import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBadge,
  BiBriefcase,
  BiCalendar,
  BiCheckCircle,
  BiChevronDown,
  BiChevronUp,
  BiDownload,
  BiEnvelope,
  BiFile,
  BiGift,
  BiLinkExternal,
  BiMedal,
  BiTargetLock,
  BiTimeFive,
  BiUserCircle,
  BiXCircle,
} from "react-icons/bi";

import {
  Alert,
  Button,
} from "react-bootstrap";

import {
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";

import api, {
  buildUploadUrl,
} from "../../services/api.js";
import DebugBadgePanel from "../../components/DebugBadgePanel.jsx";
import {
  getDebugModeEnabled,
  getDebugSwitchVisible,
} from "../../services/debugMode.js";

import Header from "../../components/Header.jsx";
import SllLeftSidebar from "../../components/sll_left_sidebar.jsx";
import SllRightSidebar from "../../components/sll_right_sidebar.jsx";

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
      "Erro ao ler utilizador guardado:",
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
    return "Data não disponível";
  }

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return "Data não disponível";
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

function normalizarLinks(links) {
  if (!Array.isArray(links)) {
    return [];
  }

  return links
    .map((link) => {
      if (typeof link === "string") {
        return {
          id_link: null,
          url: link,
        };
      }

      return {
        id_link:
          link?.id_link ||
          link?.id ||
          null,

        url:
          link?.url ||
          link?.link ||
          "",
      };
    })
    .filter((link) => link.url);
}

function normalizarDocumentos(documentos) {
  if (!Array.isArray(documentos)) {
    return [];
  }

  return documentos
    .map((documento, index) => ({
      id:
        documento.id_documento ||
        documento.id_evidencia ||
        documento.id ||
        index,

      nome:
        documento.nome_ficheiro ||
        documento.nome ||
        documento.filename ||
        documento.nome_original ||
        "Documento",

      url:
        documento.url ||
        documento.caminho ||
        documento.path ||
        documento.ficheiro_url ||
        "",

      tamanho:
        documento.tamanho ||
        documento.size ||
        null,

      formato:
        documento.formato ||
        documento.tipo ||
        documento.mimetype ||
        "",

      estado_evidencia:
        documento.estado_evidencia ||
        "",
    }));
}

function normalizarEstadoValor(estado) {
  return String(
    estado || ""
  )
    .trim()
    .toUpperCase();
}

function estadoEhAprovado(estado) {
  const valor =
    normalizarEstadoValor(estado);

  return (
    valor.startsWith("APROV") ||
    valor.startsWith("VALID")
  );
}

function estadoEhRejeitado(estado) {
  const valor =
    normalizarEstadoValor(estado);

  return (
    valor.startsWith("REJEIT") ||
    valor.startsWith("RECUS")
  );
}

function resolverEstadoEvidenciaUi(evidencia) {
  const estadoSll =
    evidencia?.estado_evidencia_sll;

  if (
    estadoEhAprovado(estadoSll) ||
    estadoEhRejeitado(estadoSll)
  ) {
    return estadoSll;
  }

  if (normalizarEstadoValor(estadoSll)) {
    return estadoSll;
  }

  return "PENDENTE";
}

function calcularEstadoRequisitoUi(
  evidencias
) {
  if (
    !Array.isArray(evidencias) ||
    evidencias.length === 0
  ) {
    return "SEM_EVIDENCIA";
  }

  const estadosResolvidos =
    evidencias.map(
      resolverEstadoEvidenciaUi
    );

  if (
    estadosResolvidos.some((estado) =>
      estadoEhRejeitado(estado)
    )
  ) {
    return "REJEITADA";
  }

  if (
    estadosResolvidos.every((estado) =>
      estadoEhAprovado(estado)
    )
  ) {
    return "APROVADA";
  }

  return "PENDENTE";
}

function resolverEstadoRequisitoUi(
  requisito,
  evidencias
) {
  return calcularEstadoRequisitoUi(
    evidencias
  );
}

function normalizarRequisito(
  requisito,
  index
) {
  const evidenciasOriginais =
    Array.isArray(
      requisito.evidencias
    )
      ? requisito.evidencias
      : [];

  const evidencias =
    evidenciasOriginais.map(
      (item) => ({
        ...item,
        url:
          item?.url ||
          buildUploadUrl(
            item?.caminho_ficheiro ||
              item?.path ||
              item?.ficheiro_url ||
              ""
          ),
        estado_evidencia:
          resolverEstadoEvidenciaUi(
            item
          ),
      })
    );

  const evidencia =
    requisito.evidencia ||
    requisito.evidencia_apresentada ||
    null;

  const descricoesEvidencia =
    [
      ...new Set(
        evidencias
          .map((item) =>
            String(
              item.descricao || ""
            ).trim()
          )
          .filter(Boolean)
      ),
    ];

  const documentosNormalizados =
    normalizarDocumentos(
      evidencia?.documentos ||
        requisito.documentos ||
        requisito.ficheiros ||
        []
    ).map((doc) => ({
      ...doc,
      url:
        doc?.url ||
        buildUploadUrl(
          doc?.caminho_ficheiro ||
            doc?.path ||
            doc?.ficheiro_url ||
            ""
        ),
    }));

  const evidenciasDerivadas =
    evidencias.length > 0
      ? evidencias
      : documentosNormalizados.map(
          (doc) => ({
            id_evidencia:
              doc.id || null,
            nome_ficheiro:
              doc.nome || "Documento",
            url: doc.url,
            caminho_ficheiro:
              doc.caminho_ficheiro ||
              doc.path ||
              null,
            formato_ficheiro:
              doc.formato || "",
            estado_evidencia:
              resolverEstadoEvidenciaUi(
                doc
              ),
            estado_evidencia_tm:
              doc.estado_evidencia_tm ||
              null,
            estado_evidencia_sll:
              doc.estado_evidencia_sll ||
              null,
            descricao:
              requisito.descricao_evidencia ||
              evidencia?.descricao ||
              "",
          })
        );

  return {
    id:
      requisito.id_requisitos ||
      requisito.id_requisito ||
      requisito.id ||
      index + 1,

    codigo:
      requisito.nome_requisito ||
      requisito.codigo ||
      `R${index + 1}`,

    titulo:
      requisito.titulo ||
      requisito.nome_requisito ||
      "Requisito",

    descricao:
      requisito.descricao_requisito ||
      requisito.descricao ||
      "Sem descrição.",

    estado:
      resolverEstadoRequisitoUi(
        requisito,
        evidencias
      ) || "AGUARDAR_TM",

    descricao_evidencia:
      descricoesEvidencia.join(
        " | "
      ) ||
      evidencia?.descricao ||
      requisito.descricao_evidencia ||
      requisito.evidencia_descricao ||
      "",

    links: normalizarLinks(
      requisito.links
    ),

    documentos:
      documentosNormalizados,

    evidencias:
      evidenciasDerivadas,
  };
}

function normalizarResposta(dados) {
  const candidatura =
    dados.candidatura ||
    dados.pedido ||
    {};

  const candidaturaSll =
    dados.candidatura_sll ||
    dados.candidaturaSll ||
    {};

  const consultor =
    dados.consultor ||
    dados.utilizador ||
    {};

  const badge =
    dados.badge ||
    {};

  const requisitosRaw =
    dados.requisitos ||
    badge.requisitos ||
    [];

  const desafioRaw =
    dados.desafio ||
    dados.lembrete ||
    null;

  return {
    candidatura: {
      id:
        candidatura.id_candidatura_pedido ||
        candidatura.id ||
        "",

      id_candidatura_sll:
      candidatura.id_candidatura_sll ??
      candidaturaSll.id_candidatura_sll ??
      dados.solicitacao?.id_candidatura_sll ??
      dados.detalhe?.id_candidatura_sll ??
      dados.id_candidatura_sll ??
      null,

      data_submissao:
        candidatura.data_submissao ||
        candidatura.data_submisao ||
        null,

      estado_candidaturatm:
        candidatura.estado_candidaturatm ||
        dados.estado_candidaturatm ||
        null,

      estado_candidaturasll:
        candidatura.estado_candidaturasll ||
        candidaturaSll.estado_candidaturasll ||
        dados.estado_candidaturasll ||
        null,

      estado:
        candidatura.estado_candidatura_pedido ||
        candidatura.estado ||
        "PENDENTE",
    },

    consultor: {
      id_utilizador:
        consultor.id_utilizador ||
        candidatura.id_utilizador ||
        "",

      nome_completo:
        consultor.nome_completo ||
        consultor.nome ||
        "Consultor",

      email:
        consultor.email_softinsa ||
        consultor.email ||
        "Sem email",

      nome_area:
        consultor.nome_area ||
        consultor.area ||
        "Sem área associada",

      data_entrada_empresa:
        consultor.data_entrada_empresa ||
        consultor.data_contratacao ||
        null,

      total_badges: Number(
        consultor.total_badges || 0
      ),
    },

    badge: {
      id_badge_modelo:
        badge.id_badge_modelo ||
        candidatura.id_badge_modelo ||
        "",

      nome_badge:
        badge.nome_badge ||
        badge.nome ||
        "Badge sem nome",

      descricao_badge_modelo:
        badge.descricao_badge_modelo ||
        badge.descricao ||
        "Sem descrição.",

      nome_nivel:
        badge.nome_nivel ||
        "Sem nível",

      codigo_nivel:
        badge.codigo_nivel ||
        "",

      pontos: Number(
        badge.pontos || 0
      ),

      imagem:
        badge.imagem ||
        badge.imagem_url ||
        null,
    },

    requisitos: Array.isArray(
      requisitosRaw
    )
      ? requisitosRaw.map(
          normalizarRequisito
        )
      : [],

    desafio:
    desafioRaw?.id_lembrete
      ? {
          id_lembrete:
            desafioRaw.id_lembrete,

          titulo:
            desafioRaw.titulo ||
            desafioRaw.desafio_titulo ||
            "Desafio de badge",

          descricao:
            desafioRaw.descricao ||
            desafioRaw.desafio_descricao ||
            "",

          estado:
            desafioRaw.estado ||
            desafioRaw.estado_lembrete ||
            "",

          nome_tm:
            desafioRaw.nome_tm ||
            desafioRaw.nome_tm_desafio ||
            "Talent Manager",

          data_criacao:
            desafioRaw.data_criacao ||
            desafioRaw.desafio_data_criacao ||
            null,

          data_aceitacao:
            desafioRaw.data_aceitacao ||
            desafioRaw.desafio_data_aceitacao ||
            null,

          data_limite:
            desafioRaw.data_limite ||
            desafioRaw.desafio_data_limite ||
            null,

          data_submissao_objetivo:
            desafioRaw.data_submissao_objetivo ||
            candidatura.data_submissao ||
            candidatura.data_submisao ||
            null,

          multiplicador_pontos:
            Number(
              desafioRaw.multiplicador_pontos ||
              2
            ),

          pontos_bonus:
            Number(
              desafioRaw.pontos_bonus ||
              0
            ),

          premio_atribuido:
            Boolean(
              desafioRaw.premio_atribuido
            ),
        }
      : null,
  };
}

function obterEstadoVisual(estado) {
  const valor = String(
    estado || ""
  ).toUpperCase();

  if (
    valor.includes("APROV") ||
    valor.includes("VALID")
  ) {
    return {
      label: "Aprovada",
      background: "#dcfce7",
      color: "#166534",
      border: "#bbf7d0",
    };
  }

  if (
    valor.includes("REJEIT") ||
    valor.includes("RECUS")
  ) {
    return {
      label: "Rejeitada",
      background: "#fee2e2",
      color: "#991b1b",
      border: "#fecaca",
    };
  }

  return {
    label: "Pendente",
    background: "#fef3c7",
    color: "#92400e",
    border: "#fde68a",
  };
}

function obterEstadoCandidaturaVisual(estado) {
  const valor = String(
    estado || ""
  ).toUpperCase();

  if (
    valor.includes("REJEIT") ||
    valor.includes("RECUS")
  ) {
    return {
      label: "Rejeitada",
      background: "#fee2e2",
      color: "#991b1b",
      border: "#fecaca",
    };
  }

  if (
    valor.includes("APROV") ||
    valor.includes("VALID")
  ) {
    return {
      label: "Aprovada",
      background: "#dcfce7",
      color: "#166534",
      border: "#bbf7d0",
    };
  }

  if (
    valor.includes("SLL")
  ) {
    return {
      label: "Aguardar validação do SLL",
      background: "#fef3c7",
      color: "#92400e",
      border: "#fde68a",
    };
  }

  return {
    label: "Aguardar validação do Talent Manager",
    background: "#dbeafe",
    color: "#1e3a8a",
    border: "#bfdbfe",
  };
}

function formatarTamanho(bytes) {
  const valor = Number(bytes);

  if (!valor || Number.isNaN(valor)) {
    return "";
  }

  if (valor < 1024) {
    return `${valor} B`;
  }

  if (valor < 1024 * 1024) {
    return `${(
      valor / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    valor /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function calcularDiasUtilizados(
  desafio
) {
  if (
    !desafio?.data_submissao_objetivo
  ) {
    return null;
  }

  const inicio =
    new Date(
      desafio.data_aceitacao ||
      desafio.data_criacao
    );

  const fim =
    new Date(
      desafio.data_submissao_objetivo
    );

  if (
    Number.isNaN(inicio.getTime()) ||
    Number.isNaN(fim.getTime())
  ) {
    return null;
  }

  const diferenca =
    fim.getTime() -
    inicio.getTime();

  return Math.max(
    1,
    Math.ceil(
      diferenca / 86400000
    )
  );
}

function cumpriuPrazoDesafio(
  desafio
) {
  if (
    !desafio?.data_limite ||
    !desafio?.data_submissao_objetivo
  ) {
    return false;
  }

  const limite =
    new Date(
      desafio.data_limite
    );

  const submissao =
    new Date(
      desafio.data_submissao_objetivo
    );

  if (
    Number.isNaN(limite.getTime()) ||
    Number.isNaN(submissao.getTime())
  ) {
    return false;
  }

  return submissao <= limite;
}

/* =========================================================
   PÁGINA
========================================================= */

function DetalheSolicitacaoSll() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    idCandidatura,
  } = useParams();

  const idCandidaturaSllQuery =
    useMemo(() => {
      const params =
        new URLSearchParams(
          location.search || ""
        );

      const sid = String(
        params.get("sid") || ""
      ).trim();

      return sid || null;
    }, [location.search]);

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const [
    mensagem,
    setMensagem,
  ] = useState("");

  const [
    mostrarRejeitar,
    setMostrarRejeitar,
  ] = useState(false);

  const [
    motivoRejeicao,
    setMotivoRejeicao,
  ] = useState("");

  const [dados, setDados] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [
    decisoesPendentes,
    setDecisoesPendentes,
  ] = useState({});

  const [
    aGuardarDecisoes,
    setAGuardarDecisoes,
  ] = useState(false);

  const [
    erroGuardarDecisoes,
    setErroGuardarDecisoes,
  ] = useState("");

  const [debugAtivo, setDebugAtivo] =
    useState(
      getDebugSwitchVisible() &&
        getDebugModeEnabled()
    );

  useEffect(() => {
    const onDebugChanged = () => {
      setDebugAtivo(
        getDebugSwitchVisible() &&
          getDebugModeEnabled()
      );
    };

    window.addEventListener(
      "debug-mode-changed",
      onDebugChanged
    );

    return () => {
      window.removeEventListener(
        "debug-mode-changed",
        onDebugChanged
      );
    };
  }, []);

  useEffect(() => {
    carregarDetalhe();
  }, [idCandidatura]);

  async function carregarDetalhe() {
  const utilizador =
    obterUtilizadorGuardado();

  const idUtilizadorSll =
    utilizador?.id_utilizador ||
    utilizador?.ID_UTILIZADOR ||
    utilizador?.id;

  if (!idUtilizadorSll) {
    setErro(
      "Não foi possível identificar o Service Line Leader."
    );

    setIsLoading(false);
    return;
  }

  try {
    setIsLoading(true);
    setErro("");

    /*
     * Carrega os dados visuais atuais:
     * consultor, badge, requisitos e
     * evidências.
     */
    const responseDetalhe =
      await api.get(
        `/sll/${idUtilizadorSll}/solicitacoes/${
          idCandidaturaSllQuery ||
          idCandidatura
        }`
      );

    const dadosNormalizados =
      normalizarResposta(
        responseDetalhe.data
      );

    /*
     * Se o endpoint anterior não devolveu
     * id_candidatura_sll, procuramo-lo
     * diretamente pela relação:
     *
     * candidatura_pedido
     * → candidatura_tm
     * → candidatura_sll
     */
    if (
      !dadosNormalizados
        .candidatura
        .id_candidatura_sll
    ) {
      try {
        const responseSll =
          await api.get(
            `/candidaturas/sll/${idUtilizadorSll}/pedido/${idCandidatura}`
          );

        dadosNormalizados
          .candidatura
          .id_candidatura_sll =
            responseSll.data
              .id_candidatura_sll;

        dadosNormalizados
          .candidatura
          .estado_sll =
            responseSll.data
              .estado_candidaturasll;
      } catch (fallbackErr) {
        if (fallbackErr?.response?.status === 404) {
          console.warn(
            "[SLL] Candidatura ainda sem registo em candidatura_sll; a página continuará em modo leitura.",
            {
              idCandidatura,
              idUtilizadorSll,
            }
          );
        } else {
          throw fallbackErr;
        }
      }
    }

    console.log(
      "DETALHE NORMALIZADO:",
      dadosNormalizados
    );

    console.log(
      "ID CANDIDATURA SLL:",
      dadosNormalizados
        .candidatura
        .id_candidatura_sll
    );

    setDecisoesPendentes({});
    setErroGuardarDecisoes("");

    setDados(
      dadosNormalizados
    );
  } catch (err) {
    console.error(
      "Erro ao carregar detalhe da solicitação:",
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
      "Não foi possível carregar os detalhes da solicitação."
    );
  } finally {
    setIsLoading(false);
  }
}

  async function aprovarCandidatura() {
  const idSll =
    dados?.candidatura
      ?.id_candidatura_sll ??
    idCandidatura ??
    null;

  if (!idSll) {
    setErro(
      "Não foi possível identificar a candidatura do SLL."
    );

    return;
  }

  try {
    setIsProcessing(true);
    setErro("");
    setMensagem("");

    const response =
      await api.put(
        `/certificados/sll/aprovar/${idSll}`
      );

    setMensagem(
      response.data?.message ||
      "Candidatura aprovada com sucesso."
    );

    setTimeout(() => {
      navigate(
        "/sll/solicitacoes",
        {
          replace: true,
        }
      );
    }, 1300);
  } catch (err) {
    console.error(
      "Erro ao aprovar candidatura:",
      err
    );

    setErro(
      err.response?.data?.error ||
      "Não foi possível aprovar a candidatura."
    );
  } finally {
    setIsProcessing(false);
  }
}

async function rejeitarCandidatura() {
  const idSll =
    dados?.candidatura
      ?.id_candidatura_sll ??
    idCandidatura ??
    null;

  if (!idSll) {
    setErro(
      "Não foi possível identificar a candidatura do SLL."
    );

    return;
  }

  if (!motivoRejeicao.trim()) {
    setErro(
      "Indica o motivo da rejeição."
    );

    return;
  }

  try {
    setIsProcessing(true);
    setErro("");
    setMensagem("");

    const response =
      await api.put(
        `/certificados/sll/rejeitar/${idSll}`,
        {
          motivo:
            motivoRejeicao.trim(),
        }
      );

    setMostrarRejeitar(false);

    setMensagem(
      response.data?.message ||
      "Candidatura rejeitada."
    );

    setTimeout(() => {
      navigate(
        "/sll/solicitacoes",
        {
          replace: true,
        }
      );
    }, 1300);
  } catch (err) {
    console.error(
      "Erro ao rejeitar candidatura:",
      err
    );

    setErro(
      err.response?.data?.error ||
      "Não foi possível rejeitar a candidatura."
    );
  } finally {
    setIsProcessing(false);
  }
}

  const totalEvidencias =
    useMemo(() => {
      if (!dados) {
        return 0;
      }

      return dados.requisitos.filter(
        (requisito) =>
          requisito.descricao_evidencia ||
          requisito.documentos.length > 0
      ).length;
    }, [dados]);

  const alertaAprovacaoTm =
    useMemo(() => {
      if (!dados) {
        return {
          mostrar: false,
          total: 0,
          aprovadosTm: 0,
        };
      }

      const requisitos =
        Array.isArray(
          dados.requisitos
        )
          ? dados.requisitos
          : [];

      const total =
        requisitos.length;

      const aprovadosTm =
        requisitos.filter(
          (requisito) => {
            const evidencias =
              Array.isArray(
                requisito.evidencias
              )
                ? requisito.evidencias
                : [];

            if (
              evidencias.length === 0
            ) {
              return false;
            }

            return evidencias.every(
              (evidencia) =>
                estadoEhAprovado(
                  evidencia
                    .estado_evidencia_tm
                )
            );
          }
        ).length;

      const estadoSll =
        normalizarEstadoValor(
          dados?.candidatura
            ?.estado_candidaturasll ||
            dados?.candidatura
              ?.estado_sll
        );

      const estadoCandidatura =
        normalizarEstadoValor(
          dados?.candidatura
            ?.estado
        );

      const sllJaDecidiu =
        estadoSll.includes(
          "APROV"
        ) ||
        estadoSll.includes(
          "REJEIT"
        ) ||
        estadoSll.includes(
          "RECUS"
        ) ||
        estadoCandidatura.includes(
          "APROV"
        ) ||
        estadoCandidatura.includes(
          "REJEIT"
        ) ||
        estadoCandidatura.includes(
          "RECUS"
        );

      return {
        mostrar:
          total > 0 &&
          aprovadosTm === total &&
          !sllJaDecidiu,
        total,
        aprovadosTm,
      };
    }, [dados]);


  const idCandidaturaSll =
    dados?.candidatura
      ?.id_candidatura_sll ||
    null;

  const emAvaliacaoSll =
    useMemo(() => {
      const estadoPedido =
        normalizarEstadoValor(
          dados?.candidatura
            ?.estado
        );

      return (
        estadoPedido ===
          "AGUARDA_SLL" ||
        estadoPedido.includes("SLL")
      );
    }, [dados]);

  const sllJaFinalizou =
    useMemo(() => {
      const estadoSll =
        normalizarEstadoValor(
          dados?.candidatura
            ?.estado_candidaturasll ||
            dados?.candidatura
              ?.estado_sll
        );

      const estadoPedido =
        normalizarEstadoValor(
          dados?.candidatura
            ?.estado
        );

      return (
        estadoSll.includes("APROV") ||
        estadoSll.includes("REJEIT") ||
        estadoSll.includes("RECUS") ||
        estadoPedido.includes("APROV") ||
        estadoPedido.includes("REJEIT") ||
        estadoPedido.includes("RECUS")
      );
    }, [dados]);

  const podeAvaliarEvidencias =
    emAvaliacaoSll &&
    !sllJaFinalizou &&
    !isProcessing;

  const podeDecidir =
    Boolean(
      idCandidaturaSll
    ) &&
    !sllJaFinalizou &&
    !isProcessing;

  const temDecisoesPendentes =
    Object.keys(decisoesPendentes)
      .length > 0;

  const temRejeicoesPendentes =
    Object.values(
      decisoesPendentes
    ).some(
      (estado) => estado === "REJEITADO"
    );

  function definirDecisaoEvidencia(
    evidencia,
    estado
  ) {
    const chave = String(
      evidencia?.id_evidencia ||
        ""
    );

    if (!chave) {
      return;
    }

    const estadoPersistido =
      normalizarEstadoValor(
        evidencia?.estado_evidencia_sll
      );

    setDecisoesPendentes((prev) => {
      // Se a decisão escolhida é igual à já guardada, removemos qualquer alteração pendente.
      if (estadoPersistido === estado) {
        if (!prev[chave]) {
          return prev;
        }

        const copia = { ...prev };
        delete copia[chave];
        return copia;
      }

      if (prev[chave] === estado) {
        const copia = { ...prev };
        delete copia[chave];
        return copia;
      }

      return {
        ...prev,
        [chave]: estado,
      };
    });
  }

  async function confirmarAvaliacoes() {
    if (!temDecisoesPendentes) {
      return;
    }

    if (
      temRejeicoesPendentes &&
      !motivoRejeicao.trim()
    ) {
      setErroGuardarDecisoes(
        "Indica o motivo da rejeição antes de confirmar."
      );
      return;
    }

    try {
      setAGuardarDecisoes(true);
      setErroGuardarDecisoes("");

      for (const [
        idEvidencia,
        estado,
      ] of Object.entries(
        decisoesPendentes
      )) {
        // Guardamos de forma sequencial para evitar concorrência em inserções auxiliares do backend.
        await api.put(
          `/sll/evidencias/${idEvidencia}/avaliar`,
          {
            estado,
            motivo:
              estado === "REJEITADO"
                ? motivoRejeicao.trim()
                : undefined,
          }
        );
      }

      setDecisoesPendentes({});
      setMotivoRejeicao("");
      await carregarDetalhe();
    } catch (err) {
      setErroGuardarDecisoes(
        err.response?.data?.error ||
          "Erro ao guardar as avaliações."
      );
    } finally {
      setAGuardarDecisoes(false);
    }
  }


  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <SllLeftSidebar />

        <main style={conteudo}>
          <button
            type="button"
            onClick={() =>
              navigate(
                "/sll/solicitacoes"
              )
            }
            style={voltarButton}
          >
            <BiArrowBack size={18} />
            Voltar para as solicitações
          </button>

          {erro && (
            <div style={erroBox}>
              {erro}
            </div>
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
            <div style={mensagemBox}>
              A carregar detalhes da
              solicitação...
            </div>
          ) : dados ? (
            <>
              <PerfilConsultor
                consultor={
                  dados.consultor
                }
              />

              <BadgeSolicitado
                badge={dados.badge}
                candidatura={
                  dados.candidatura
                }
                debugEvidencias={
                  dados.requisitos.flatMap(
                    (
                      requisito
                    ) =>
                      (
                        requisito.evidencias ||
                        []
                      ).map(
                        (evidencia) => ({
                          ...evidencia,
                          id_requisitos:
                            requisito.id,
                          nome_requisito:
                            requisito.titulo,
                        })
                      )
                  )
                }
              />

              {dados.desafio && (
                <DesafioCandidatura
                  desafio={dados.desafio}
                  badge={dados.badge}
                />
              )}

              <div style={cabecalhoRequisitos}>
                <div>
                  <h2 style={tituloRequisitos}>
                    Requisitos e evidências
                  </h2>

                  <div style={subtituloRequisitos}>
                    {totalEvidencias} de{" "}
                    {
                      dados.requisitos
                        .length
                    } requisitos com
                    evidência submetida
                  </div>
                </div>

                <div style={estadoLateralBox}>
                  <EstadoCandidatura
                    estado={
                      dados
                        .candidatura
                        .estado
                    }
                  />

                  {alertaAprovacaoTm.mostrar && (
                    <span
                      style={
                        avisoTmAprovado
                      }
                    >
                      TM validou {
                        alertaAprovacaoTm.aprovadosTm
                      }
                      /
                      {
                        alertaAprovacaoTm.total
                      } requisitos. Falta aprovação final do SLL.
                    </span>
                  )}
                </div>
              </div>

              {debugAtivo && (
                <div style={debugEvidenciasCard}>
                  <div style={debugEvidenciasTitulo}>
                    Debug Evidências
                  </div>

                  <div style={debugEvidenciasSubtitulo}>
                    Estados diretos da API para validar TM/SLL por evidência.
                  </div>

                  <pre style={debugEvidenciasJson}>
                    {JSON.stringify(
                      dados.requisitos.flatMap(
                        (
                          requisito
                        ) =>
                          (
                            requisito.evidencias ||
                            []
                          ).map(
                            (evidencia) => ({
                              id_evidencia:
                                evidencia.id_evidencia,
                              id_requisito:
                                requisito.id,
                              requisito:
                                requisito.titulo,
                              estado_requisito:
                                requisito.estado,
                              estado_evidencia:
                                evidencia.estado_evidencia,
                              estado_evidencia_tm:
                                evidencia.estado_evidencia_tm,
                              estado_evidencia_sll:
                                evidencia.estado_evidencia_sll,
                              data_submissao:
                                evidencia.data_submissao,
                            })
                          )
                      ),
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}

              {dados.requisitos.length >
              0 ? (
                dados.requisitos.map(
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
                        podeAvaliarEvidencias ||
                        index === 0
                      }
                      podeAvaliar={
                        podeAvaliarEvidencias
                      }
                      decisoesPendentes={
                        decisoesPendentes
                      }
                      onDefinirDecisao={
                        definirDecisaoEvidencia
                      }
                      desativado={
                        aGuardarDecisoes
                      }
                    />
                  )
                )
              ) : (
                <div style={mensagemBox}>
                  Este badge não possui
                  requisitos registados.
                </div>
              )}

              {podeAvaliarEvidencias && (
                <div style={requisitoAvaliacaoBox}>
                  {erroGuardarDecisoes && (
                    <p
                      style={{
                        color: "#dc2626",
                        fontSize: 13,
                        margin: "0 0 8px",
                      }}
                    >
                      {erroGuardarDecisoes}
                    </p>
                  )}

                  {temRejeicoesPendentes && (
                    <div
                      style={{
                        width: "100%",
                        marginBottom: 10,
                      }}
                    >
                      <label
                        htmlFor="motivo-rejeicao-evidencias"
                        style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#334155",
                          marginBottom: 6,
                        }}
                      >
                        Motivo da rejeição
                      </label>

                      <textarea
                        id="motivo-rejeicao-evidencias"
                        value={motivoRejeicao}
                        onChange={(event) =>
                          setMotivoRejeicao(
                            event.target.value
                          )
                        }
                        placeholder="Explica ao consultor o motivo das evidências rejeitadas."
                        rows={3}
                        style={{
                          width: "100%",
                          border: "1px solid #cbd5e1",
                          borderRadius: 10,
                          padding: "10px 12px",
                          fontSize: 13,
                          color: "#0f172a",
                          background: "#fff",
                          resize: "vertical",
                        }}
                      />
                    </div>
                  )}

                  <Button
                    variant="primary"
                    disabled={
                      !temDecisoesPendentes ||
                      aGuardarDecisoes
                    }
                    onClick={
                      confirmarAvaliacoes
                    }
                  >
                    <BiCheckCircle
                      size={17}
                      className="me-2"
                    />
                    {aGuardarDecisoes
                      ? "A guardar avaliações..."
                      : `Confirmar avaliação de ${Object.keys(decisoesPendentes).length} evidência${Object.keys(decisoesPendentes).length !== 1 ? "s" : ""}`}
                  </Button>
                </div>
              )}

            </>
          ) : (
            !erro && (
              <div style={mensagemBox}>
                Solicitação não encontrada.
              </div>
            )
          )}
        </main>

        <SllRightSidebar />
      </div>
    </div>
  );
}

function DesafioCandidatura({
  desafio,
  badge,
}) {
  const diasUtilizados =
    calcularDiasUtilizados(
      desafio
    );

  const cumpriuPrazo =
    cumpriuPrazoDesafio(
      desafio
    );

  const pontosBase =
    Number(
      badge.pontos || 0
    );

  const pontosExtra =
    cumpriuPrazo
      ? pontosBase
      : 0;

  const totalPossivel =
    pontosBase +
    pontosExtra;

  return (
    <section style={desafioCard}>
      <div style={desafioCabecalho}>
        <div style={desafioIcone}>
          <BiTargetLock
            size={27}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div style={desafioEtiqueta}>
            Candidatura resultante de
            desafio
          </div>

          <h2 style={desafioTitulo}>
            {desafio.titulo}
          </h2>

          <div style={desafioCriador}>
            Proposto por{" "}
            <strong>
              {desafio.nome_tm}
            </strong>
          </div>
        </div>

        <span
          style={{
            ...prazoChip,

            background:
              cumpriuPrazo
                ? "#dcfce7"
                : "#fee2e2",

            color:
              cumpriuPrazo
                ? "#166534"
                : "#991b1b",
          }}
        >
          {cumpriuPrazo
            ? "Prazo cumprido"
            : "Fora do prazo"}
        </span>
      </div>

      {desafio.descricao && (
        <p style={desafioDescricao}>
          {desafio.descricao}
        </p>
      )}

      <div style={desafioInformacaoGrid}>
        <div style={desafioInfoItem}>
          <BiCalendar size={18} />

          <div>
            <div style={desafioInfoLabel}>
              Data limite
            </div>

            <div style={desafioInfoValor}>
              {formatarData(
                desafio.data_limite
              )}
            </div>
          </div>
        </div>

        <div style={desafioInfoItem}>
          <BiTimeFive size={18} />

          <div>
            <div style={desafioInfoLabel}>
              Tempo utilizado
            </div>

            <div style={desafioInfoValor}>
              {diasUtilizados
                ? `${diasUtilizados} ${
                    diasUtilizados === 1
                      ? "dia"
                      : "dias"
                  }`
                : "Não disponível"}
            </div>
          </div>
        </div>

        <div style={desafioInfoItem}>
          <BiCheckCircle size={18} />

          <div>
            <div style={desafioInfoLabel}>
              Submetido em
            </div>

            <div style={desafioInfoValor}>
              {formatarData(
                desafio
                  .data_submissao_objetivo
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={recompensaDesafio}>
        <div style={recompensaTitulo}>
          <BiGift size={19} />
          Recompensa em caso de aprovação
        </div>

        <div style={recompensaValores}>
          <span>
            {pontosBase} pontos do badge
          </span>

          <strong>+</strong>

          <span>
            {pontosExtra} pontos extra
          </span>

          <strong>=</strong>

          <span style={recompensaTotal}>
            {totalPossivel} pontos
          </span>
        </div>

        {!cumpriuPrazo && (
          <div style={semBonusTexto}>
            A candidatura pode ser
            aprovada normalmente, mas não
            atribuirá o bónus porque foi
            submetida depois do prazo.
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   PERFIL DO CONSULTOR
========================================================= */

function PerfilConsultor({
  consultor,
}) {
  return (
    <section style={perfilCard}>
      <div style={cardTitulo}>
        Perfil do Consultor
      </div>

      <div style={perfilConteudo}>
        <div style={perfilPrincipal}>
          <div style={avatar}>
            <BiUserCircle
              size={66}
              color="#6092bf"
            />
          </div>

          <div>
            <div style={nomeConsultor}>
              {consultor.nome_completo}
            </div>

            <div style={cargoBadge}>
              Consultor
            </div>
          </div>
        </div>

        <div style={perfilDetalhes}>
          <InfoPerfil
            icon={
              <BiEnvelope size={18} />
            }
            label="Email"
            value={consultor.email}
          />

          <InfoPerfil
            icon={
              <BiBriefcase size={18} />
            }
            label="Área"
            value={
              consultor.nome_area
            }
          />

          <InfoPerfil
            icon={
              <BiCalendar size={18} />
            }
            label="Data de entrada"
            value={formatarData(
              consultor
                .data_entrada_empresa
            )}
          />

          <InfoPerfil
            icon={
              <BiMedal size={18} />
            }
            label="Badges conquistados"
            value={`${consultor.total_badges} badges`}
          />
        </div>
      </div>
    </section>
  );
}

function InfoPerfil({
  icon,
  label,
  value,
}) {
  return (
    <div style={infoPerfil}>
      <div style={infoPerfilIcon}>
        {icon}
      </div>

      <div>
        <div style={infoPerfilLabel}>
          {label}
        </div>

        <div style={infoPerfilValor}>
          {value}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   BADGE SOLICITADO
========================================================= */

function BadgeSolicitado({
  badge,
  candidatura,
  debugEvidencias = [],
}) {
  return (
    <section style={badgeCard}>
      <div style={badgeImagemBox}>
        {badge.imagem ? (
          <img
            src={badge.imagem}
            alt={badge.nome_badge}
            style={badgeImagem}
          />
        ) : (
          <BiBadge
            size={38}
            color="#2563eb"
          />
        )}
      </div>

      <div style={badgeInfo}>
        <h2 style={badgeNome}>
          {badge.nome_badge}
        </h2>

        <p style={badgeDescricao}>
          {
            badge
              .descricao_badge_modelo
          }
        </p>

        <div style={badgeMeta}>
          <span style={metaBadge}>
            Nível:{" "}
            <strong>
              {badge.codigo_nivel ||
                badge.nome_nivel}
            </strong>
          </span>

          <span style={metaBadge}>
            {badge.pontos} pontos
          </span>

          <span style={metaBadge}>
            Solicitado em{" "}
            {formatarData(
              candidatura
                .data_submissao
            )}
          </span>
        </div>

        <DebugBadgePanel
          badge={{
            ...badge,
            id_candidatura_pedido:
              candidatura?.id,
            estado_candidatura_pedido:
              candidatura?.estado,
          }}
          variant="solicitacao"
          evidencias={debugEvidencias}
        />
      </div>
    </section>
  );
}

/* =========================================================
   ESTADO
========================================================= */

function EstadoCandidatura({
  estado,
}) {
  const visual =
    obterEstadoCandidaturaVisual(
      estado
    );

  return (
    <span
      style={{
        ...estadoCandidatura,

        background:
          visual.background,

        color: visual.color,

        border: `1px solid ${visual.border}`,
      }}
    >
      {visual.label}
    </span>
  );
}

/* =========================================================
   REQUISITOS
========================================================= */

function RequisitoCard({
  requisito,
  abertoInicial,
  podeAvaliar,
  decisoesPendentes,
  onDefinirDecisao,
  desativado,
}) {
  const [aberto, setAberto] =
    useState(abertoInicial);

  const estadoVisual =
    obterEstadoVisual(requisito.estado);

  const evidencias = Array.isArray(
    requisito.evidencias
  )
    ? requisito.evidencias
    : [];

  return (
    <article style={requisitoCard}>
      <button
        type="button"
        onClick={() =>
          setAberto((v) => !v)
        }
        style={requisitoHeader}
      >
        <div style={requisitoHeaderInfo}>
          <div>
            <span style={codigoRequisito}>
              {requisito.codigo}
            </span>

            <span style={separadorTitulo}>
              {" — "}
            </span>

            <span style={tituloRequisito}>
              {requisito.titulo}
            </span>
          </div>
        </div>

        <div style={headerDireita}>
          <span
            style={{
              ...estadoRequisito,
              background: estadoVisual.background,
              color: estadoVisual.color,
            }}
          >
            {estadoVisual.label}
          </span>

          {aberto ? (
            <BiChevronUp size={21} color="#64748b" />
          ) : (
            <BiChevronDown size={21} color="#64748b" />
          )}
        </div>
      </button>

      {aberto && (
        <div style={requisitoBody}>
          <BlocoInformacao titulo="Descrição do requisito">
            <p style={textoNormal}>
              {requisito.descricao}
            </p>

            {requisito.links.length > 0 && (
              <div style={linksWrapper}>
                {requisito.links.map((link, index) => (
                  <a
                    key={link.id_link || `${link.url}-${index}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    style={linkExterno}
                  >
                    <BiLinkExternal size={15} />
                    {link.url}
                  </a>
                ))}
              </div>
            )}
          </BlocoInformacao>

          <BlocoInformacao titulo="Evidências">
            {evidencias.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {evidencias.map((ev) => {
                  const chave = String(ev.id_evidencia);
                  const estadoEv = obterEstadoVisual(
                    ev.estado_evidencia
                  );
                  const decisaoLocal =
                    decisoesPendentes[chave];
                  const estadoSllPersistido =
                    normalizarEstadoValor(
                      ev.estado_evidencia_sll
                    );

                  return (
                    <div key={ev.id_evidencia} style={evidenciaRow}>
                      <div style={evidenciaEsquerda}>
                        <BiFile size={16} color="#64748b" />

                        <span style={evidenciaNome}>
                          {ev.nome_ficheiro || "Documento"}
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 9px",
                            borderRadius: 20,
                            background: estadoEv.background,
                            color: estadoEv.color,
                            border: `1px solid ${estadoEv.border}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {estadoEv.label}
                        </span>

                        {decisaoLocal && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "2px 9px",
                              borderRadius: 20,
                              background:
                                decisaoLocal === "APROVADO"
                                  ? "#dcfce7"
                                  : "#fee2e2",
                              color:
                                decisaoLocal === "APROVADO"
                                  ? "#15803d"
                                  : "#dc2626",
                              border:
                                decisaoLocal === "APROVADO"
                                  ? "1px solid #bbf7d0"
                                  : "1px solid #fecaca",
                              whiteSpace: "nowrap",
                            }}
                          >
                            →{" "}
                            {decisaoLocal === "APROVADO"
                              ? "Aprovar"
                              : "Rejeitar"}
                          </span>
                        )}
                      </div>

                      <div style={evidenciaDireita}>
                        {ev.url && (
                          <button
                            type="button"
                            title="Abrir ficheiro"
                            onClick={() =>
                              window.open(
                                ev.url,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                            style={evidenciaMiniBtn}
                          >
                            <BiDownload size={14} />
                          </button>
                        )}

                        {podeAvaliar && (
                          <>
                            <button
                              type="button"
                              title="Rejeitar"
                              disabled={
                                desativado
                              }
                              onClick={() =>
                                onDefinirDecisao(
                                  ev,
                                  "REJEITADO"
                                )
                              }
                              style={{
                                ...evidenciaMiniBtn,
                                background:
                                  decisaoLocal === "REJEITADO"
                                    ? "#dc2626"
                                    : "#fff",
                                color:
                                  decisaoLocal === "REJEITADO"
                                    ? "#fff"
                                    : "#dc2626",
                                border: "1px solid #dc2626",
                                opacity:
                                  estadoSllPersistido ===
                                    "REJEITADO" &&
                                  !decisaoLocal
                                    ? 0.5
                                    : 1,
                              }}
                            >
                              <BiXCircle size={14} />
                            </button>

                            <button
                              type="button"
                              title="Aprovar"
                              disabled={
                                desativado
                              }
                              onClick={() =>
                                onDefinirDecisao(
                                  ev,
                                  "APROVADO"
                                )
                              }
                              style={{
                                ...evidenciaMiniBtn,
                                background:
                                  decisaoLocal === "APROVADO"
                                    ? "#15803d"
                                    : "#fff",
                                color:
                                  decisaoLocal === "APROVADO"
                                    ? "#fff"
                                    : "#15803d",
                                border: "1px solid #15803d",
                                opacity:
                                  estadoSllPersistido ===
                                    "APROVADO" &&
                                  !decisaoLocal
                                    ? 0.5
                                    : 1,
                              }}
                            >
                              <BiCheckCircle size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={textoVazio}>
                Não existem evidências associadas a este requisito.
              </p>
            )}
          </BlocoInformacao>
        </div>
      )}
    </article>
  );
}

function BlocoInformacao({
  titulo,
  children,
}) {
  return (
    <div style={blocoInformacao}>
      <h3 style={blocoTitulo}>
        {titulo}
      </h3>

      {children}
    </div>
  );
}

/* =========================================================
   DOCUMENTOS
========================================================= */

function DocumentoCard({
  documento,
}) {
  function abrirDocumento() {
    if (!documento.url) {
      return;
    }

    window.open(
      documento.url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div style={documentoCard}>
      <div style={documentoInfo}>
        <div style={documentoIcon}>
          <BiFile size={20} />
        </div>

        <div>
          <div style={documentoNome}>
            {documento.nome}
          </div>

          {(documento.tamanho ||
            documento.formato) && (
            <div style={documentoMeta}>
              {formatarTamanho(
                documento.tamanho
              )}

              {documento.tamanho &&
                documento.formato &&
                " · "}

              {documento.formato}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {documento.estado_evidencia && (() => {
          const ev = obterEstadoVisual(documento.estado_evidencia);
          return (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "3px 10px",
                borderRadius: 20,
                background: ev.background,
                color: ev.color,
                border: `1px solid ${ev.border}`,
                whiteSpace: "nowrap",
              }}
            >
              {ev.label}
            </span>
          );
        })()}

        {documento.url && (
          <button
            type="button"
            onClick={abrirDocumento}
            style={visualizarButton}
          >
            <BiDownload size={16} />
            Visualizar
          </button>
        )}
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
  marginBottom: 22,
  fontSize: 14,
  cursor: "pointer",
};

/* Perfil */

const perfilCard = {
  background: "white",
  border: "1px solid #bfdbfe",
  borderRadius: 13,
  padding: "18px 22px",
  marginBottom: 18,
};

const cardTitulo = {
  fontSize: 14,
  fontWeight: 700,
  color: "#334155",
  marginBottom: 16,
};

const perfilConteudo = {
  display: "grid",
  gridTemplateColumns:
    "minmax(230px, 0.7fr) minmax(350px, 1.3fr)",
  gap: 34,
  alignItems: "center",
};

const perfilPrincipal = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
};

const avatar = {
  width: 80,
  height: 80,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const nomeConsultor = {
  fontSize: 17,
  fontWeight: 700,
  color: "#111827",
};

const cargoBadge = {
  display: "inline-flex",
  marginTop: 7,
  background: "#eff6ff",
  color: "#2563eb",
  borderRadius: 999,
  padding: "5px 14px",
  fontSize: 11,
};

const perfilDetalhes = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: 18,
};

const infoPerfil = {
  display: "flex",
  alignItems: "flex-start",
  gap: 9,
};

const infoPerfilIcon = {
  color: "#64748b",
  marginTop: 2,
};

const infoPerfilLabel = {
  fontSize: 10,
  color: "#94a3b8",
};

const infoPerfilValor = {
  marginTop: 2,
  fontSize: 12,
  fontWeight: 600,
  color: "#334155",
};

/* Badge */

const badgeCard = {
  background: "white",
  border: "1px solid #bfdbfe",
  borderRadius: 13,
  padding: "18px 22px",
  marginBottom: 20,
  display: "grid",
  gridTemplateColumns:
    "76px minmax(0, 1fr)",
  gap: 18,
  alignItems: "center",
};

const badgeImagemBox = {
  width: 72,
  height: 72,
  borderRadius: "50%",
  background: "#eff6ff",
  border: "2px solid #dbeafe",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const badgeImagem = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: "50%",
};

const badgeInfo = {
  minWidth: 0,
};

const badgeNome = {
  margin: 0,
  color: "#111827",
  fontSize: 17,
  fontWeight: 800,
};

const badgeDescricao = {
  margin: "7px 0 0",
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.55,
};

const badgeMeta = {
  marginTop: 12,
  display: "flex",
  alignItems: "center",
  gap: 9,
  flexWrap: "wrap",
};

const metaBadge = {
  background: "#f1f5f9",
  color: "#475569",
  borderRadius: 999,
  padding: "5px 11px",
  fontSize: 10,
};

/* Requisitos */

const cabecalhoRequisitos = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  marginBottom: 13,
};

const tituloRequisitos = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
  color: "#111827",
};

const subtituloRequisitos = {
  marginTop: 3,
  fontSize: 11,
  color: "#64748b",
};

const estadoCandidatura = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "7px 13px",
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const estadoLateralBox = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 8,
};

const avisoTmAprovado = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 10,
  padding: "6px 10px",
  background: "#fef3c7",
  border: "1px solid #fcd34d",
  color: "#92400e",
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1.35,
  textAlign: "right",
  maxWidth: 380,
};

const debugEvidenciasCard = {
  marginBottom: 12,
  background: "#f8fafc",
  border: "1px dashed #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
};

const debugEvidenciasTitulo = {
  fontSize: 12,
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: 4,
};

const debugEvidenciasSubtitulo = {
  fontSize: 11,
  color: "#475569",
  marginBottom: 8,
};

const debugEvidenciasJson = {
  margin: 0,
  maxHeight: 280,
  overflow: "auto",
  background: "#0f172a",
  color: "#e2e8f0",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 10,
  lineHeight: 1.35,
};

const requisitoCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  overflow: "hidden",
  marginBottom: 13,
};

const requisitoHeader = {
  width: "100%",
  border: "none",
  background: "white",
  padding: "15px 18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  textAlign: "left",
  cursor: "pointer",
};

const requisitoHeaderInfo = {
  minWidth: 0,
};

const codigoRequisito = {
  fontSize: 13,
  fontWeight: 800,
  color: "#111827",
};

const separadorTitulo = {
  color: "#94a3b8",
};

const tituloRequisito = {
  fontSize: 13,
  fontWeight: 600,
  color: "#475569",
};

const headerDireita = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexShrink: 0,
};

const estadoRequisito = {
  borderRadius: 999,
  padding: "5px 11px",
  fontSize: 10,
  fontWeight: 600,
};

const requisitoBody = {
  borderTop: "1px solid #e5e7eb",
  background: "#fafbfc",
  padding: "16px 18px",
};

const requisitoAvaliacaoBox = {
  marginTop: 14,
  paddingTop: 14,
  borderTop: "1px solid #e5e7eb",
};

const requisitoAvaliacaoBotoes = {
  display: "flex",
  gap: 10,
};

const evidenciaRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "7px 10px",
  borderRadius: 8,
  background: "#fff",
  border: "1px solid #e5e7eb",
};

const evidenciaEsquerda = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  flex: 1,
  minWidth: 0,
};

const evidenciaNome = {
  fontSize: 12,
  color: "#374151",
  fontWeight: 500,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: 220,
};

const evidenciaDireita = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  flexShrink: 0,
};

const evidenciaMiniBtn = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#64748b",
  cursor: "pointer",
  padding: 0,
};

const blocoInformacao = {
  marginBottom: 17,
};

const blocoTitulo = {
  margin: "0 0 7px",
  color: "#111827",
  fontSize: 12,
  fontWeight: 800,
};

const textoNormal = {
  margin: 0,
  color: "#475569",
  fontSize: 12,
  lineHeight: 1.6,
};

const textoVazio = {
  margin: 0,
  color: "#94a3b8",
  fontSize: 12,
};

const linksWrapper = {
  marginTop: 8,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 6,
};

const linkExterno = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  color: "#2563eb",
  fontSize: 11,
  textDecoration: "underline",
  wordBreak: "break-all",
};

/* Documentos */

const documentosLista = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const documentoCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 9,
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
};

const documentoInfo = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 0,
};

const documentoIcon = {
  color: "#64748b",
  display: "flex",
};

const documentoNome = {
  color: "#334155",
  fontSize: 12,
  fontWeight: 600,
  wordBreak: "break-word",
};

const documentoMeta = {
  marginTop: 2,
  color: "#94a3b8",
  fontSize: 10,
};

const visualizarButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 11,
  cursor: "pointer",
  flexShrink: 0,
};

/* Mensagens */

const mensagemBox = {
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

const desafioCard = {
  background: "#eff6ff",
  border: "1px solid #93c5fd",
  borderRadius: 13,
  padding: "19px 22px",
  marginBottom: 20,
};

const desafioCabecalho = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const desafioIcone = {
  width: 52,
  height: 52,
  flexShrink: 0,
  borderRadius: 12,
  background: "white",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const desafioEtiqueta = {
  color: "#2563eb",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
};

const desafioTitulo = {
  margin: "3px 0 0",
  color: "#1e3a8a",
  fontSize: 17,
  fontWeight: 800,
};

const desafioCriador = {
  marginTop: 3,
  color: "#475569",
  fontSize: 11,
};

const prazoChip = {
  borderRadius: 999,
  padding: "6px 12px",
  fontSize: 10,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const desafioDescricao = {
  margin: "15px 0 0",
  color: "#475569",
  fontSize: 12,
  lineHeight: 1.6,
};

const desafioInformacaoGrid = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: 12,
};

const desafioInfoItem = {
  background: "white",
  border: "1px solid #bfdbfe",
  borderRadius: 9,
  padding: "11px 13px",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  gap: 9,
};

const desafioInfoLabel = {
  color: "#94a3b8",
  fontSize: 9,
  textTransform: "uppercase",
};

const desafioInfoValor = {
  marginTop: 2,
  color: "#334155",
  fontSize: 11,
  fontWeight: 700,
};

const recompensaDesafio = {
  marginTop: 15,
  background: "white",
  border: "1px solid #bfdbfe",
  borderRadius: 10,
  padding: "12px 14px",
};

const recompensaTitulo = {
  color: "#1e40af",
  display: "flex",
  alignItems: "center",
  gap: 7,
  fontSize: 11,
  fontWeight: 800,
};

const recompensaValores = {
  marginTop: 9,
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "#475569",
  fontSize: 12,
  flexWrap: "wrap",
};

const recompensaTotal = {
  color: "#166534",
  fontWeight: 800,
};

const semBonusTexto = {
  marginTop: 8,
  color: "#991b1b",
  fontSize: 10,
};

const decisaoCard = {
  marginTop: 24,
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "18px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
};

const decisaoTitulo = {
  margin: 0,
  color: "#111827",
  fontSize: 15,
  fontWeight: 800,
};

const decisaoTexto = {
  marginTop: 4,
  color: "#64748b",
  fontSize: 11,
};

const decisaoAcoes = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

export default DetalheSolicitacaoSll;