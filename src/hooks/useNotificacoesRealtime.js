import {
  useCallback,
  useEffect,
  useState,
} from "react";

import api from
  "../services/api.js";

import {
  prepararAutenticacaoSocket,
  socket,
} from "../services/socketService.js";

import {
  emitirAtualizacaoNotificacoes,
  EVENTO_NOTIFICACOES_ATUALIZADAS,
  notificacaoNaoLida,
} from "../utils/notificacoesUtils.js";

export default function
  useNotificacoesRealtime(
    idUtilizador
  ) {
  const [
    totalNaoLidas,
    setTotalNaoLidas,
  ] = useState(0);

  const carregarContador =
    useCallback(
      async () => {
        const id =
          Number(
            idUtilizador
          );

        if (
          !Number.isInteger(
            id
          ) ||
          id <= 0
        ) {
          setTotalNaoLidas(
            0
          );

          return;
        }

        try {
          const response =
            await api.get(
              `/notificacoes/${id}`
            );

          const lista =
            Array.isArray(
              response.data
            )
              ? response.data
              : [];

          setTotalNaoLidas(
            lista.filter(
              notificacaoNaoLida
            ).length
          );
        } catch (err) {
          console.error(
            "[NOTIFICAÇÕES] Erro ao atualizar contador:",
            err
          );
        }
      },
      [
        idUtilizador,
      ]
    );

  useEffect(() => {
    const id =
      Number(
        idUtilizador
      );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return undefined;
    }

    const entrarNaSala =
      () => {
        socket.emit(
          "utilizador:entrar",
          id
        );
      };

    const receberEvento =
      (evento) => {
        if (
          evento?.id_utilizador &&
          Number(
            evento.id_utilizador
          ) !== id
        ) {
          return;
        }

        console.log(
          "[NOTIFICAÇÕES] Atualização realtime:",
          evento
        );

        emitirAtualizacaoNotificacoes(
          evento
        );
      };

    prepararAutenticacaoSocket();

    socket.on(
      "connect",
      entrarNaSala
    );

    socket.on(
      "notificacao:nova",
      receberEvento
    );

    socket.on(
      "notificacao:atualizada",
      receberEvento
    );

    socket.on(
      "notificacoes:todas-lidas",
      receberEvento
    );

    window.addEventListener(
      EVENTO_NOTIFICACOES_ATUALIZADAS,
      carregarContador
    );

    if (
      socket.connected
    ) {
      entrarNaSala();
    } else {
      socket.connect();
    }

    carregarContador();

    return () => {
      socket.off(
        "connect",
        entrarNaSala
      );

      socket.off(
        "notificacao:nova",
        receberEvento
      );

      socket.off(
        "notificacao:atualizada",
        receberEvento
      );

      socket.off(
        "notificacoes:todas-lidas",
        receberEvento
      );

      window.removeEventListener(
        EVENTO_NOTIFICACOES_ATUALIZADAS,
        carregarContador
      );

      /*
       * Não emitir utilizador:sair aqui.
       *
       * O mesmo socket pode estar a ser
       * utilizado por outros hooks.
       */
    };
  }, [
    idUtilizador,
    carregarContador,
  ]);

  return {
    totalNaoLidas,
    carregarContador,
  };
}