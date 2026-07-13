import {
  useEffect,
  useState,
} from "react";

import {
  BiChevronDown,
  BiChevronRight,
  BiGlobe,
  BiGrid,
  BiMedal,
  BiTargetLock,
  BiUser,
  BiUserCircle,
  BiTimeFive,
} from "react-icons/bi";

import {
  useLocation,
} from "react-router-dom";

import SidebarItem from "./SidebarItem.jsx";

function LeftSidebar() {
  const location = useLocation();

  const [userName, setUserName] =
    useState("Consultor");

  const [badgesAberto, setBadgesAberto] =
    useState(true);

  const rotasBadges = [
    "/catalogo-badges",
    "/progresso-badges",
    "/meus_badges",
    "/badge-detalhe",
    "/historico_badges",
    "/configurar-assinatura",
  ];

  const estaNumaRotaDeBadges =
    rotasBadges.some((rota) =>
      location.pathname.startsWith(rota)
    );

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      return;
    }

    try {
      const user =
        JSON.parse(storedUser);

      setUserName(
        user.nome_completo ||
          user.NOME_COMPLETO ||
          user.nome ||
          user.NOME ||
          "Consultor"
      );
    } catch (error) {
      console.error(
        "Erro ao ler dados do utilizador:",
        error
      );
    }
  }, []);

  useEffect(() => {
    if (estaNumaRotaDeBadges) {
      setBadgesAberto(true);
    }
  }, [estaNumaRotaDeBadges]);

  return (
    <aside
      style={{
        width: 250,
        minWidth: 250,
        background: "white",
        borderRight: "1px solid #e5e7eb",
        flexShrink: 0,
        overflowY: "auto",
        paddingTop: 14,
      }}
    >
      {/* Utilizador */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "4px 22px 20px",
        }}
      >
        <BiUserCircle
          size={25}
          color="#6b7280"
        />

        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#111827",
          }}
        >
          {userName}
        </span>
      </div>

      {/* Título */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: "#9ca3af",
          padding: "0 28px 10px",
          textAlign: "left",
        }}
      >
        Pages
      </div>

      {/* Página principal */}
      <SidebarItem
        to="/pag_consultor"
        icon={<BiGrid size={17} />}
        label="Página Principal"
        end
      />

      {/* Perfil */}
      <SidebarItem
        to="/perfil_consultor"
        icon={<BiUser size={18} />}
        label="Perfil do Consultor"
      />

      <SidebarItem
        to="/status-candidaturas"
        icon={<BiTimeFive size={18} />}
        label="Progresso das Candidaturas"
      />

      <SidebarItem
        to="/desafios"
        icon={<BiTargetLock size={18} />}
        label="Desafios"
      />

      {/* Grupo Badges */}
      <button
        type="button"
        onClick={() =>
          setBadgesAberto((valor) => !valor)
        }
        style={{
          width: "100%",
          border: "none",
          background: estaNumaRotaDeBadges
            ? "#f8fbff"
            : "transparent",
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "10px 22px",
          color: estaNumaRotaDeBadges
            ? "#111827"
            : "#374151",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          textAlign: "left",
        }}
      >
        {badgesAberto ? (
          <BiChevronDown
            size={15}
            color="#94a3b8"
          />
        ) : (
          <BiChevronRight
            size={15}
            color="#94a3b8"
          />
        )}

        <BiMedal size={17} />

        <span>Badges</span>
      </button>

      {/* Submenu */}
      {badgesAberto && (
        <div
          style={{
            paddingBottom: 6,
          }}
        >
          <SidebarItem
            to="/catalogo-badges"
            label="Catálogo de Badges"
            nested
          />

          <SidebarItem
            to="/progresso-badges"
            label="Progresso dos Badges"
            nested
          />

          <SidebarItem
            to="/meus_badges"
            label="Badges Conquistados"
            nested
          />

          <SidebarItem
            to="/configurar-assinatura"
            label="Template de Assinatura"
            nested
          />
        </div>
      )}

       <SidebarItem
        to="/softinsa"
        icon={<BiGlobe size={18} />}
        label="Site Softinsa"
      />
    </aside>
  );
}

export default LeftSidebar;