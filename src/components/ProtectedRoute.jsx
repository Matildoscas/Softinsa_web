import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

/*
 * Converte as diferentes formas do nome
 * do perfil para um valor único.
 */
function normalizarPerfil(valor) {
  const perfil = String(valor || "")
    .trim()
    .toLowerCase();

  if (
    perfil.includes("administrador") ||
    perfil === "admin"
  ) {
    return "Administrador";
  }

  if (
    perfil.includes(
      "service line leader"
    ) ||
    perfil === "sll" ||
    perfil === "service line"
  ) {
    return "Service Line Leader";
  }

  if (
    perfil.includes(
      "talent manager"
    ) ||
    perfil === "tm"
  ) {
    return "Talent Manager";
  }

  if (
    perfil.includes("consultor")
  ) {
    return "Consultor";
  }

  return "";
}

/*
 * Define para onde o utilizador deve ser
 * enviado quando tenta entrar numa página
 * pertencente a outro perfil.
 */
function obterDashboardDoPerfil(perfil) {
  switch (perfil) {
    case "Administrador":
      return "/admin";

    case "Service Line Leader":
      return "/sll";

    case "Talent Manager":
      return "/tm";

    case "Consultor":
      return "/pag_consultor";

    default:
      return "/login";
  }
}

function ProtectedRoute({
  allowedRoles = [],
}) {
  const location = useLocation();

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt");

  const utilizadorGuardado =
    localStorage.getItem("user");

  /*
   * Sem token ou sem utilizador guardado,
   * não existe uma sessão válida.
   */
  if (
    !token ||
    !utilizadorGuardado
  ) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  let utilizador;

  try {
    utilizador =
      JSON.parse(
        utilizadorGuardado
      );
  } catch {
    localStorage.clear();

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const perfilAtual =
    normalizarPerfil(
      utilizador.tipo_utilizador ||
        utilizador.TIPO_UTILIZADOR ||
        utilizador.cargo ||
        utilizador.CARGO
    );

  const perfisPermitidos =
    allowedRoles.map(
      normalizarPerfil
    );

  /*
   * Existe sessão, mas o perfil não tem
   * permissão para entrar nesta rota.
   */
  if (
    !perfilAtual ||
    !perfisPermitidos.includes(
      perfilAtual
    )
  ) {
    return (
      <Navigate
        to={obterDashboardDoPerfil(
          perfilAtual
        )}
        replace
      />
    );
  }

  /*
   * A sessão existe e o perfil tem
   * permissão. Renderiza a rota filha.
   */
  return <Outlet />;
}

export default ProtectedRoute;