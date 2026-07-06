export const EVENTO_NOTIFICACOES_ATUALIZADAS =
  "notificacoes-atualizadas";

export function obterIdNotificacao(notificacao) {
  return (
    notificacao?.id_notificacoes ||
    notificacao?.id_notificacao ||
    notificacao?.ID_NOTIFICACOES ||
    notificacao?.ID_NOTIFICACAO ||
    null
  );
}

export function obterTipoNotificacao(notificacao) {
  return String(
    notificacao?.tipo_notificacao ||
      notificacao?.TIPO_NOTIFICACAO ||
      notificacao?.tipo ||
      ""
  )
    .trim()
    .toUpperCase();
}

export function obterConteudoNotificacao(notificacao) {
  return (
    notificacao?.conteudo ||
    notificacao?.CONTEUDO ||
    notificacao?.mensagem ||
    notificacao?.MENSAGEM ||
    ""
  );
}

export function notificacaoNaoLida(notificacao) {
  if (!notificacao) {
    return false;
  }

  if (typeof notificacao.lida === "boolean") {
    return !notificacao.lida;
  }

  if (typeof notificacao.lido === "boolean") {
    return !notificacao.lido;
  }

  const valor =
    notificacao.lida ??
    notificacao.lido ??
    notificacao.estado_leitura ??
    notificacao.estado_notificacao ??
    notificacao.estado_recebido ??
    "";

  const estado = String(valor)
    .trim()
    .toUpperCase();

  return ![
    "LIDA",
    "LIDO",
    "TRUE",
    "1",
  ].includes(estado);
}

export function isNotificacaoMarco(notificacaoOuTipo) {
  const tipo =
    typeof notificacaoOuTipo === "string"
      ? notificacaoOuTipo
      : obterTipoNotificacao(notificacaoOuTipo);

  return String(tipo || "")
    .trim()
    .toUpperCase()
    .startsWith("MARCO_");
}

export function obterIconeMarco(notificacaoOuTipo) {
  const tipo =
    typeof notificacaoOuTipo === "string"
      ? notificacaoOuTipo
      : obterTipoNotificacao(notificacaoOuTipo);

  const tipoNormalizado = String(tipo || "")
    .trim()
    .toUpperCase();

  if (tipoNormalizado === "MARCO_PRIMEIRO_BADGE") {
    return "🎉";
  }

  if (tipoNormalizado === "MARCO_5_BADGES") {
    return "🔥";
  }

  if (tipoNormalizado === "MARCO_10_BADGES") {
    return "🚀";
  }

  if (tipoNormalizado === "MARCO_NIVEL_E") {
    return "🏆";
  }

  return "✨";
}

export function formatarTituloNotificacao(tipo) {
  const tipoNormalizado = String(tipo || "")
    .trim()
    .toUpperCase();

  const titulos = {
    OBJETIVO_CONCLUIDO:
      "Objetivo concluído!",

    BADGE_APROVADO:
      "Badge aprovado!",

    BADGE_REJEITADO:
      "Badge rejeitado",

    NOVO_DESAFIO_TM:
      "Novo desafio!",

    NOVO_DESAFIO:
      "Novo desafio!",

    CANDIDATURA_APROVADA:
      "Candidatura aprovada!",

    CANDIDATURA_REJEITADA:
      "Candidatura rejeitada",

    BADGE_A_EXPIRAR:
      "Badge a expirar",

    BADGE_EXPIRADO:
      "Badge expirado",

    LEMBRETE:
      "Lembrete",

    MARCO_PRIMEIRO_BADGE:
      "Primeiro badge conquistado!",

    MARCO_5_BADGES:
      "5 badges conquistados!",

    MARCO_10_BADGES:
      "10 badges conquistados!",

    MARCO_NIVEL_E:
      "Primeiro badge de nível E!",
  };

  if (titulos[tipoNormalizado]) {
    return titulos[tipoNormalizado];
  }

  if (!tipoNormalizado) {
    return "Notificação";
  }

  const titulo = tipoNormalizado
    .toLowerCase()
    .replaceAll("_", " ");

  return (
    titulo.charAt(0).toUpperCase() +
    titulo.slice(1)
  );
}

export function ordenarNotificacoesRecentes(lista) {
  return [...lista].sort((a, b) => {
    const dataA = new Date(
      a.data_envio ||
        a.DATA_ENVIO ||
        0
    ).getTime();

    const dataB = new Date(
      b.data_envio ||
        b.DATA_ENVIO ||
        0
    ).getTime();

    return dataB - dataA;
  });
}

export function filtrarNotificacoesMarco(lista) {
  return ordenarNotificacoesRecentes(
    Array.isArray(lista)
      ? lista.filter(isNotificacaoMarco)
      : []
  );
}

export function emitirAtualizacaoNotificacoes(
  detalhe = null
) {
  window.dispatchEvent(
    new CustomEvent(
      EVENTO_NOTIFICACOES_ATUALIZADAS,
      {
        detail:
          detalhe,
      }
    )
  );
}