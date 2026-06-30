import {
  Dropdown,
  Nav,
  Navbar,
  OverlayTrigger,
} from "react-bootstrap";

import {
  BiBell,
  BiCog,
  BiLogOut,
  BiSearch,
  BiUser,
  BiUserCircle,
} from "react-icons/bi";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import NotificationPopover from "./notificacoes_pop";

import logoImg from "../assets/logo.png";

function obterUtilizadorGuardado() {
  const storedUser =
    localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (err) {
    console.error(
      "Erro ao ler utilizador:",
      err
    );

    return null;
  }
}

function obterRotasUtilizador(user) {
  const tipo = String(
    user?.tipo_utilizador ||
      user?.TIPO_UTILIZADOR ||
      user?.cargo ||
      user?.CARGO ||
      ""
  )
    .trim()
    .toLowerCase();

  const isTm =
  tipo.includes(
    "talent manager"
  ) ||
  tipo === "tm";

  const isSll =
    tipo.includes(
      "service line leader"
    ) || tipo === "sll";

  const isAdmin =
    tipo.includes("admin") ||
    tipo.includes(
      "administrador"
    );

    if (isTm) {
    return {
      inicio: "/tm",
      perfil: "/tm/definicoes",
      definicoes:
        "/tm/definicoes",
      notificacoes:
        "/tm/notificacoes",
    };
  }

  if (isSll) {
    return {
      inicio: "/sll",
      perfil: "/sll/definicoes",
      definicoes:
        "/sll/definicoes",
      notificacoes:
        "/sll/notificacoes",
    };
  }

  if (isAdmin) {
    return {
      inicio: "/admin",
      perfil: "/admin",
      definicoes: "/admin",
      notificacoes:
        "/admin/notificacoes",
    };
  }

  return {
    inicio: "/pag_consultor",
    perfil: "/perfil_consultor",
    definicoes: "/definicoes",
    notificacoes:
      "/notificacoes",
  };
}

function Header() {
  const navigate =
    useNavigate();

  const user =
    obterUtilizadorGuardado();

  const rotas =
    obterRotasUtilizador(user);

  function handleLogout() {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <Navbar
      bg="white"
      className="border-bottom px-4 py-0"
      style={{
        height: "52px",
        flexShrink: 0,
      }}
    >
      <Navbar.Brand
        as={Link}
        to={rotas.inicio}
      >
        <img
          src={logoImg}
          alt="Softinsa"
          style={{
            height: "40px",
          }}
        />
      </Navbar.Brand>

      <div style={searchContainer}>
        <BiSearch
          size={20}
          style={searchIcon}
        />

        <input
          type="text"
          placeholder="Pesquisar..."
          style={searchInput}
          onFocus={(event) => {
            event.target.style.borderColor =
              "#2563eb";
          }}
          onBlur={(event) => {
            event.target.style.borderColor =
              "#e5e7eb";
          }}
        />
      </div>

      <Nav className="ms-auto align-items-center gap-2">
        <OverlayTrigger
          trigger="click"
          placement="bottom-end"
          rootClose
          overlay={
            <NotificationPopover />
          }
        >
          <button
            type="button"
            style={notificationButton}
            aria-label="Notificações"
          >
            <BiBell
              size={18}
              color="white"
            />
          </button>
        </OverlayTrigger>

        <Dropdown align="end">
          <Dropdown.Toggle
            as="div"
            bsPrefix="p-0"
            style={{
              cursor: "pointer",
            }}
          >
            <div style={profileCircle}>
              <BiUserCircle
                size={20}
                color="white"
              />
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu
            className="shadow border-0 mt-2"
            style={{
              borderRadius: "12px",
              fontSize: "14px",
            }}
          >
            <Dropdown.Item
              onClick={() =>
                navigate(
                  rotas.perfil
                )
              }
              className="py-2 d-flex align-items-center gap-2"
            >
              <BiUser size={18} />
              O meu Perfil
            </Dropdown.Item>

            <Dropdown.Divider />

            <Dropdown.Item
              onClick={() =>
                navigate(
                  rotas.definicoes
                )
              }
              className="py-2 d-flex align-items-center gap-2"
            >
              <BiCog size={18} />
              Definições de Conta
            </Dropdown.Item>

            <Dropdown.Divider />

            <Dropdown.Item
              onClick={handleLogout}
              className="py-2 d-flex align-items-center gap-2 text-danger"
            >
              <BiLogOut size={18} />
              Terminar Sessão
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Nav>
    </Navbar>
  );
}

const searchContainer = {
  position: "relative",
  marginLeft: "3.7%",
};

const searchIcon = {
  position: "absolute",
  left: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#9ca3af",
  pointerEvents: "none",
};

const searchInput = {
  paddingLeft: "32px",
  paddingRight: "12px",
  height: "34px",
  border:
    "1px solid #e5e7eb",
  borderRadius: "10px",
  fontSize: "14px",
  width: "600px",
  outline: "none",
  color: "#374151",
  background: "#f9fafb",
};

const notificationButton = {
  width: 36,
  height: 36,
  border: "none",
  borderRadius: "50%",
  background: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  position: "relative",
  padding: 0,
};

const profileCircle = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default Header;