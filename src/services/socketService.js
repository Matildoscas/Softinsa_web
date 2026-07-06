import {
  io,
} from "socket.io-client";

const socketUrl =
  import.meta.env
    .VITE_SOCKET_URL ||
  "http://localhost:3000";

export const socket =
  io(
    socketUrl,
    {
      autoConnect: false,

      /*transports: [
        "websocket",
        "polling",
      ],*/

      withCredentials: true,
    }
  );

/*
 * Coloca o token JWT no handshake
 * do Socket.IO antes da ligação.
 *
 * Neste momento o backend ainda não
 * valida este token, mas fica preparado
 * para adicionar autenticação depois.
 */
export function
    prepararAutenticacaoSocket() {
  const token =
    localStorage.getItem(
      "token"
    ) ||
    localStorage.getItem(
      "authToken"
    ) ||
    localStorage.getItem(
      "jwt"
    );

  socket.auth = {
    token:
      token || null,
  };
}