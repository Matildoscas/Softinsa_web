import {
  Dropdown,
  Modal,
  Nav,
  Navbar,
  OverlayTrigger,
  Button,
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
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import useNotificacoesRealtime from
  "../hooks/useNotificacoesRealtime.js";

import NotificationPopover from "./NotificacoesPop.jsx";

import logoImg from "../assets/logo.png";

import {
  limparUtilizadorAnalytics,
} from "../services/firebaseAnalytics";

import MobileMenuButton
  from "./MobileMenuButton.jsx";

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
    tipo.includes("talent manager") ||
    tipo.includes("talentmanager") ||
    tipo.includes("talent_manager") ||
    tipo === "tm";

  const isSll =
    tipo.includes("service line leader") ||
    tipo.includes("servicelineleader") ||
    tipo.includes("service_line_leader") ||
    tipo === "sll";

  const isAdmin =
    tipo.includes("admin") ||
    tipo.includes(
      "administrador"
    );

    if (isTm) {
      return {
        inicio: "/tm",
        perfil: "/tm/perfil",
        definicoes:
          "/tm/definicoes",
        notificacoes:
          "/tm/notificacoes",
      };
    }

  if (isSll) {
    return {
      inicio: "/sll",
      perfil: "/sll/perfil",
      definicoes:
        "/sll/definicoes",
      notificacoes:
        "/sll/notificacoes",
    };
  }

  if (isAdmin) {
    return {
      inicio: "/admin",
      perfil: "/admin/perfil",
      definicoes: "/admin/definicoes",
      notificacoes: "/admin/notificacoespage",
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

  const [
    showLogoutModal,
    setShowLogoutModal,
  ] = useState(false);

  const user =
    obterUtilizadorGuardado();

  const userId =
    user?.id_utilizador ||
    user?.ID_UTILIZADOR ||
    user?.id ||
    null;

  const tipoUtilizador =
    String(
      user?.tipo_utilizador ||
        user?.TIPO_UTILIZADOR ||
        user?.cargo ||
        user?.CARGO ||
        ""
    )
      .trim()
      .toLowerCase();

  const isAdmin =
    tipoUtilizador.includes("admin") ||
    tipoUtilizador.includes(
      "administrador"
    );

  const isConsultor =
    tipoUtilizador.includes(
      "consultor"
    );

  const mostrarMenuLateral =
    isAdmin || isConsultor;

  const {
    totalNaoLidas,
  } = useNotificacoesRealtime(
    userId
  );

  const rotas =
    obterRotasUtilizador(user);

  const handleLogout = async () => {
    await limparUtilizadorAnalytics();

    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("jwt");
    localStorage.removeItem("user");

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  };

  const abrirModalLogout = () => {
    setShowLogoutModal(true);
  };

  const fecharModalLogout = () => {
    setShowLogoutModal(false);
  };

  const confirmarLogout = async () => {
    setShowLogoutModal(false);
    await handleLogout();
  };

  return (
    /*<Navbar
      bg="white"
      className="border-bottom px-4 py-0"
      style={{
        height: "52px",
        flexShrink: 0,
      }}
    >*/
    <header
      className="app-header"
      style={headerStyle}
    >

      {mostrarMenuLateral && (
        <MobileMenuButton />
      )}

      <Navbar.Brand
        as={Link}
        to={rotas.inicio}
        className="app-header-logo"
      >
        <img
          src={logoImg}
          alt="Softinsa"
          style={{
            height: "40px",
          }}
        />
      </Navbar.Brand>

      <div
        className="app-header-search"
        style={searchContainer}
      >
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

      <Nav className="app-header-actions ms-auto align-items-center gap-2">
        <OverlayTrigger
          trigger="click"
          placement="bottom-end"
          rootClose
          overlay={
          <NotificationPopover
            rotaNotificacoes={
              rotas.notificacoes
            }
          />
        }
        >
          <button
            type="button"
            style={
              notificationButton
            }
            aria-label={
              `Notificações: ${totalNaoLidas} não lidas`
            }
          >
            <BiBell
              size={18}
              color="white"
            />

            {totalNaoLidas > 0 && (
              <span
                style={
                  notificationBadge
                }
              >
                {totalNaoLidas > 99
                  ? "99+"
                  : totalNaoLidas}
              </span>
            )}
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
              onClick={abrirModalLogout}
              className="py-2 d-flex align-items-center gap-2 text-danger"
            >
              <BiLogOut size={18} />
              Terminar Sessão
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Nav>

      <Modal
        show={showLogoutModal}
        onHide={fecharModalLogout}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Confirmar logout
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Tens a certeza que queres terminar a sessão?
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={fecharModalLogout}
          >
            Cancelar
          </Button>

          <Button
            variant="danger"
            onClick={confirmarLogout}
          >
            Terminar Sessão
          </Button>
        </Modal.Footer>
      </Modal>
    </header>
  );
}

const notificationBadge = {
  position:
    "absolute",

  top:
    -5,

  right:
    -6,

  minWidth:
    18,

  height:
    18,

  padding:
    "0 5px",

  borderRadius:
    999,

  background:
    "#dc2626",

  color:
    "white",

  border:
    "2px solid white",

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  fontSize:
    9,

  fontWeight:
    700,

  lineHeight:
    1,
};

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

const headerStyle = {
  width: "100%",
  height: 52,
  flexShrink: 0,
  background: "white",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  padding: "0 24px",
  position: "relative",
};

export default Header;