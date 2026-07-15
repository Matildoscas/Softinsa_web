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
  BiMenu,
  BiSearch,
  BiUser,
  BiUserCircle,
  BiX,
} from "react-icons/bi";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

import useNotificacoesRealtime from
  "../hooks/useNotificacoesRealtime.js";

import NotificationPopover from "./NotificacoesPop.jsx";

import logoImg from "../assets/logo.png";

import {
  limparUtilizadorAnalytics,
} from "../services/firebaseAnalytics";

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
      notificacoes: "/admin/notificacoes",
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

  const location =
    useLocation();

  const [
    showLogoutModal,
    setShowLogoutModal,
  ] = useState(false);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const user =
    obterUtilizadorGuardado();

  const userId =
    user?.id_utilizador ||
    user?.ID_UTILIZADOR ||
    user?.id ||
    null;

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

  useEffect(() => {
    document.body.classList.toggle(
      "mobile-sidebar-open",
      mobileMenuOpen
    );

    return () => {
      document.body.classList.remove(
        "mobile-sidebar-open"
      );
    };
  }, [mobileMenuOpen]);

  const alternarMenuMobile = () => {
    setMobileMenuOpen((aberto) => !aberto);
  };

  const fecharMenuMobile = () => {
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
    <div
      className="app-mobile-overlay"
      onClick={fecharMenuMobile}
      aria-hidden="true"
    />

    <Navbar
      bg="white"
      className="app-topbar border-bottom px-4 py-0"
      style={{
        height: "52px",
        flexShrink: 0,
      }}
    >
      <button
        type="button"
        className="app-menu-toggle"
        aria-label={
          mobileMenuOpen
            ? "Fechar menu"
            : "Abrir menu"
        }
        onClick={alternarMenuMobile}
      >
        {mobileMenuOpen ? (
          <BiX size={18} />
        ) : (
          <BiMenu size={18} />
        )}
      </button>

      <Navbar.Brand
        as={Link}
        to={rotas.inicio}
        onClick={fecharMenuMobile}
      >
        <img
          src={logoImg}
          alt="Softinsa"
          style={{
            height: "40px",
          }}
        />
      </Navbar.Brand>

      <div className="app-topbar-search" style={searchContainer}>
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

      <Nav className="app-topbar-actions ms-auto align-items-center gap-2">
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
    </Navbar>
    </>
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

export default Header;