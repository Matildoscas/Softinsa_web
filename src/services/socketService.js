import {
  io,
} from "socket.io-client";

function resolverSocketUrl() {
  const configurado = String(
    import.meta.env
      .VITE_SOCKET_URL ||
      ""
  ).trim();

  if (configurado) {
    return configurado;
  }

  const hostname =
    typeof window !== "undefined"
      ? String(window.location.hostname || "").toLowerCase()
      : "";

  const ambienteLocal =
    hostname === "localhost" ||
    hostname === "127.0.0.1";

  if (ambienteLocal) {
    return "http://localhost:3000";
  }

  return "https://softinsa-api.onrender.com";
}

const socketUrl =
  resolverSocketUrl();

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
    ) ||
    sessionStorage.getItem(
      "token"
    ) ||
    sessionStorage.getItem(
      "authToken"
    ) ||
    sessionStorage.getItem(
      "jwt"
    );

  socket.auth = {
    token:
      token || null,
  };
}