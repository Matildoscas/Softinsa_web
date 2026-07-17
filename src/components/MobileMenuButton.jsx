import {
  useEffect,
  useState,
} from "react";

import {
  BiMenu,
  BiX,
} from "react-icons/bi";

import {
  useLocation,
} from "react-router-dom";

import {
  createPortal,
} from "react-dom";

function MobileMenuButton() {
  const [aberto, setAberto] =
    useState(false);

  const location =
    useLocation();

  /*
   * Fecha automaticamente a sidebar
   * quando o utilizador muda de página.
   */
  useEffect(() => {
    setAberto(false);
  }, [location.pathname]);

  /*
   * Adiciona ao body a classe usada pelo CSS
   * para apresentar ou esconder a sidebar.
   */
  useEffect(() => {
    document.body.classList.toggle(
      "mobile-sidebar-open",
      aberto
    );

    document.body.style.overflow =
      aberto ? "hidden" : "";

    return () => {
      document.body.classList.remove(
        "mobile-sidebar-open"
      );

      document.body.style.overflow = "";
    };
  }, [aberto]);

  const overlay =
    aberto &&
    typeof document !== "undefined"
      ? createPortal(
          <button
            type="button"
            className="mobile-menu-overlay"
            onClick={() =>
              setAberto(false)
            }
            aria-label="Fechar menu lateral"
          />,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() =>
          setAberto(
            (estadoAnterior) =>
              !estadoAnterior
          )
        }
        aria-label={
          aberto
            ? "Fechar menu"
            : "Abrir menu"
        }
        aria-expanded={aberto}
      >
        {aberto ? (
          <BiX size={27} />
        ) : (
          <BiMenu size={25} />
        )}
      </button>

      {overlay}
    </>
  );
}

export default MobileMenuButton;