import {
  useEffect,
  useState,
} from "react";

import {
  BiMenu,
  BiX,
} from "react-icons/bi";

function MobileMenuButton() {
  const [
    aberto,
    setAberto,
  ] = useState(false);

  useEffect(() => {
    document.body.classList.toggle(
      "mobile-sidebar-open",
      aberto
    );

    return () => {
      document.body.classList.remove(
        "mobile-sidebar-open"
      );
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
        style={{
          display: "none",
          position: "fixed",
          top: 14,
          left: 14,
          zIndex: 6001,
          width: 42,
          height: 42,
          border: "none",
          borderRadius: 10,
          background: "#1e3a6e",
          color: "white",
          alignItems: "center",
          justifyContent: "center",
          boxShadow:
            "0 4px 14px rgba(15, 23, 42, 0.25)",
          cursor: "pointer",
        }}
        aria-label={
          aberto
            ? "Fechar menu"
            : "Abrir menu"
        }
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
          onClick={() =>
            setAberto(false)
          }
          aria-label="Fechar menu"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 4999,
            border: "none",
            background:
              "rgba(15, 23, 42, 0.5)",
          }}
        />
      )}
    </>
  );
}

export default MobileMenuButton;