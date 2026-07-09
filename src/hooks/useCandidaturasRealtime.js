import { useEffect } from "react";

import {
  prepararAutenticacaoSocket,
  socket,
} from "../services/socketService";

export default function useCandidaturasRealtime({
  idUtilizador,
  onAtualizar,
}) {
  useEffect(() => {
    const id = Number(idUtilizador);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return undefined;
    }

    /*
     * Coloca o consultor na sua sala
     * privada do Socket.IO.
     */
    const entrarNaSala = () => {
      console.log(
        "[SOCKET] A entrar na sala:",
        `utilizador:${id}`
      );

      socket.emit(
        "utilizador:entrar",
        id
      );
    };

    /*
     * Recebe atualizações do estado
     * das candidaturas.
     */
    const receberAtualizacao = (
      evento
    ) => {
      console.log(
        "[SOCKET] Candidatura atualizada:",
        evento
      );

      /*
       * Segurança adicional:
       * ignora eventos de outro
       * utilizador.
       */
      if (
        evento?.id_utilizador &&
        Number(
          evento.id_utilizador
        ) !== id
      ) {
        return;
      }

      if (
        typeof onAtualizar ===
        "function"
      ) {
        onAtualizar(evento);
      }
    };

    /*
     * Prepara o token JWT, caso exista.
     */
    prepararAutenticacaoSocket();

    /*
     * Quando liga ou volta a ligar,
     * entra novamente na sala.
     */
    socket.on(
      "connect",
      entrarNaSala
    );

    socket.on(
      "candidatura:estado-atualizado",
      receberAtualizacao
    );

    if (socket.connected) {
      entrarNaSala();
    } else {
      socket.connect();
    }

    return () => {
      socket.off(
        "connect",
        entrarNaSala
      );

      socket.off(
        "candidatura:estado-atualizado",
        receberAtualizacao
      );

      /*if (socket.connected) {
        socket.emit(
          "utilizador:sair",
          id
        );
      }*/
    };
  }, [
    idUtilizador,
    onAtualizar,
  ]);
}