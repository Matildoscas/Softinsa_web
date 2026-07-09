const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api";

const API_ORIGIN =
  API_BASE_URL.replace(/\/api\/?$/, "");

export function resolverUrlFicheiro(caminho) {
  if (!caminho) return "";

  const valor = String(caminho).trim();

  if (!valor) return "";

  // Se vier com localhost guardado na BD, troca para a API atual
  if (
    valor.startsWith("http://localhost:3000") ||
    valor.startsWith("https://localhost:3000")
  ) {
    return valor.replace(
      /^https?:\/\/localhost:3000/,
      API_ORIGIN
    );
  }

  // Se já vier Cloudinary/Render/outro URL completo, usa direto
  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://")
  ) {
    return valor;
  }

  const caminhoNormalizado =
    valor.startsWith("/")
      ? valor
      : `/${valor}`;

  return `${API_ORIGIN}${caminhoNormalizado}`;
}