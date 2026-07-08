export const EVENTO_NOTIFICACOES_ATUALIZADAS =
  "notificacoes-atualizadas";

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

export function emitirAtualizacaoNotificacoes() {
  window.dispatchEvent(
    new Event(
      EVENTO_NOTIFICACOES_ATUALIZADAS
    )
  );
}