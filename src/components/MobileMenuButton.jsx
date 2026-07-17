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

function MobileMenuButton() {
  const [aberto, setAberto] =
    useState(false);

  const location =
    useLocation();

  /*
   * Fecha a sidebar automaticamente
   * quando o utilizador muda de página.
   */
  useEffect(() => {
    setAberto(false);
  }, [location.pathname]);

  /*
   * Controla a classe global utilizada
   * pelo CSS para mostrar a sidebar.
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

  return (
    <>
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() =>
          setAberto(
            (anterior) => !anterior
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
          <BiX size={25} />
        ) : (
          <BiMenu size={25} />
        )}
      </button>

      {aberto && (
        <button
          type="button"
          className="mobile-menu-overlay"
          onClick={() =>
            setAberto(false)
          }
          aria-label="Fechar menu lateral"
        />
      )}
    </>
  );
}

export default MobileMenuButton;