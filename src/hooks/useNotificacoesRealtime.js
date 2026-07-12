import {
  useCallback,
  useEffect,
  useRef,
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

function existeTokenSessao() {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("jwt") ||
    "";

  return Boolean(
    String(token).trim()
  );
}

export default function
  useNotificacoesRealtime(
    idUtilizador
  ) {
  const [
    totalNaoLidas,
    setTotalNaoLidas,
  ] = useState(0);

  const bloqueadoPor401Ref =
    useRef(false);

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

        if (!existeTokenSessao()) {
          setTotalNaoLidas(0);
          return;
        }

        if (bloqueadoPor401Ref.current) {
          setTotalNaoLidas(0);
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
          const status = Number(
            err?.response?.status || 0
          );

          if (status === 401) {
            bloqueadoPor401Ref.current = true;
            setTotalNaoLidas(0);

            console.warn(
              "[NOTIFICAÇÕES] Sessão inválida para carregar contador. Pedidos seguintes serão ignorados até novo login."
            );

            return;
          }

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

    const onConnectError =
      () => {
        /*
         * Fallback silencioso: se o socket
         * falhar, o polling periódico mantém
         * o contador sincronizado.
         */
      };

    socket.on(
      "connect_error",
      onConnectError
    );

    window.addEventListener(
      EVENTO_NOTIFICACOES_ATUALIZADAS,
      carregarContador
    );

    const intervaloPolling =
      window.setInterval(
        () => {
          carregarContador();
        },
        30000
      );

    const onFocus = () => {
      carregarContador();
    };

    window.addEventListener(
      "focus",
      onFocus
    );

    document.addEventListener(
      "visibilitychange",
      onFocus
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

      socket.off(
        "connect_error"
        ,
        onConnectError
      );

      window.clearInterval(
        intervaloPolling
      );

      window.removeEventListener(
        "focus",
        onFocus
      );

      document.removeEventListener(
        "visibilitychange",
        onFocus
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