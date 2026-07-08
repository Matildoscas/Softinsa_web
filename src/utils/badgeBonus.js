export function normalizarBooleano(valor) {
  if (typeof valor === "boolean") {
    return valor;
  }

  if (typeof valor === "number") {
    return valor === 1;
  }

  return [
    "true",
    "t",
    "1",
    "sim",
    "yes",
  ].includes(
    String(valor ?? "")
      .trim()
      .toLowerCase()
  );
}

export function obterBonusBadge(badge) {
  if (!badge) {
    return {
      ganhouBonus: false,
      pontosExtra: 0,
    };
  }

  const pontosExtra = Number(
    badge.pontos_extra ??
    badge.pontos_bonus ??
    0
  );

  const ganhouBonus =
    normalizarBooleano(
      badge.ganhou_bonus
    ) ||
    normalizarBooleano(
      badge.premio_atribuido
    ) ||
    pontosExtra > 0;

  return {
    ganhouBonus,
    pontosExtra,
  };
}

export function removerBadgesDuplicados(lista) {
  const mapa = new Map();

  lista.forEach((badge, index) => {
    const id =
      badge.id ||
      badge.id_badge_modelo ||
      `badge-${index}`;

    const chave = String(id);

    const bonusNovo =
      obterBonusBadge(badge);

    const existente =
      mapa.get(chave);

    if (!existente) {
      mapa.set(chave, {
        ...badge,
        ganhou_bonus:
          bonusNovo.ganhouBonus,
        pontos_extra:
          bonusNovo.pontosExtra,
      });

      return;
    }

    const bonusExistente =
      obterBonusBadge(existente);

    mapa.set(chave, {
      ...existente,
      ...badge,

      ganhou_bonus:
        bonusExistente.ganhouBonus ||
        bonusNovo.ganhouBonus,

      pontos_extra:
        Math.max(
          bonusExistente.pontosExtra,
          bonusNovo.pontosExtra
        ),
    });
  });

  return Array.from(
    mapa.values()
  );
}