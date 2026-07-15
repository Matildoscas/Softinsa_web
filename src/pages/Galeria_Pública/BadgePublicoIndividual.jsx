
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Button,
  Spinner,
} from "react-bootstrap";

import {
  BiArrowBack,
  BiBadgeCheck,
  BiCalendar,
  BiCopy,
  BiLinkExternal,
  BiMedal,
  BiShieldAlt2,
  BiStar,
  BiUser,
} from "react-icons/bi";

import {
  FaLinkedinIn,
} from "react-icons/fa";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api.js";
import logoImg from "../../assets/logo.png";

function formatarData(data) {
  if (!data) {
    return "Sem data";
  }

  const date =
    new Date(data);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Sem data";
  }

  return date.toLocaleDateString(
    "pt-PT",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function obterEstadoVisual(
  estadoPublico,
  diasFaltam
) {
  const estado =
    String(
      estadoPublico || ""
    )
      .trim()
      .toUpperCase();

  if (
    estado === "EXPIRADO"
  ) {
    return {
      texto: "Expirado",
      background: "#fee2e2",
      color: "#b91c1c",
      border: "#fecaca",
    };
  }

  if (
    estado === "A_EXPIRAR"
  ) {
    return {
      texto:
        Number(diasFaltam) > 0
          ? `A expirar em ${diasFaltam} dia(s)`
          : "A expirar",
      background: "#fef3c7",
      color: "#92400e",
      border: "#fde68a",
    };
  }

  if (
    estado === "SEM_EXPIRACAO"
  ) {
    return {
      texto: "Sem expiração",
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "#bfdbfe",
    };
  }

  return {
    texto: "Ativo",
    background: "#dcfce7",
    color: "#166534",
    border: "#bbf7d0",
  };
}

function copiarTexto(texto) {
  if (
    navigator.clipboard
  ) {
    return navigator
      .clipboard
      .writeText(texto);
  }

  const input =
    document.createElement(
      "textarea"
    );

  input.value = texto;
  document.body.appendChild(input);
  input.select();

  document.execCommand(
    "copy"
  );

  document.body.removeChild(
    input
  );

  return Promise.resolve();
}

function BadgePublicoIndividualPage() {
  const navigate =
    useNavigate();
  const location =
    useLocation();

  const {
    userId,
    badgeId,
  } = useParams();

  const [
    badge,
    setBadge,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    copiado,
    setCopiado,
  ] = useState(false);

  const [
    urlCertificado,
    setUrlCertificado,
  ] = useState("");

  const FRONTEND_PUBLIC_URL =
    (
      import.meta.env.VITE_PUBLIC_APP_URL ||
      window.location.origin
    ).replace(/\/$/, "");

  const urlPublica =
    useMemo(
      () =>
        `${FRONTEND_PUBLIC_URL}/badges/${userId}/${badgeId}`,
      [
        FRONTEND_PUBLIC_URL,
        userId,
        badgeId,
      ]
    );

  const destinoVoltar =
    location.state?.backTo ||
    "/galeria-badges";

  const textoVoltar =
    location.state?.backLabel ||
    "Voltar à galeria";

  useEffect(() => {
    if (
      !userId ||
      !badgeId
    ) {
      setErro(
        "Link público inválido."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro("");

    Promise
  .all([
    api.get(
      `/badges/publico/${userId}/${badgeId}`
    ),

    api
    .get(
      `/certificados/publico/badge/${userId}/${badgeId}`
    )
    .catch(() => ({
      data: null,
    })),
    ])
    .then(
      ([
        badgeResponse,
        certificadosResponse,
      ]) => {
        const badgeAtual =
          badgeResponse.data?.badge ||
          null;

        setBadge(
          badgeAtual
        );

        const certificado =
          certificadosResponse
            .data
            ?.certificado ||
          null;

        if (certificado?.codigo_certificado) {
          setUrlCertificado(
            `${FRONTEND_PUBLIC_URL}/verificar/${certificado.codigo_certificado}`
          );
        } else {
          setUrlCertificado("");
        }

        const idHistorico =
          certificado
            ?.id_candidatura_historico ||
          certificado
            ?.id_historico ||
          certificado
            ?.idHistorico;

        if (idHistorico) {
          setUrlCertificado(
            `${window.location.origin}/verificar/CERT-${idHistorico}-${userId}`
          );
        } else {
          setUrlCertificado("");
        }
      }
    )
    .catch((err) => {
      console.error(
        "Erro ao carregar badge público:",
        err
      );

      setErro(
        "Este badge público não existe ou não está autorizado para publicação."
      );
    })
    .finally(() => {
      setLoading(false);
    });
  }, [
    userId,
    badgeId,
  ]);

  const estadoVisual =
    obterEstadoVisual(
      badge?.estado_publico,
      badge?.dias_faltam
    );

  const copiarLink =
    async () => {
      try {
        await copiarTexto(
          urlPublica
        );

        setCopiado(true);

        setTimeout(() => {
          setCopiado(false);
        }, 1800);
      } catch {
        alert(
          "Não foi possível copiar o link."
        );
      }
    };

  const partilharLinkedin = async () => {
    if (!badge) {
      alert("Não foi possível carregar os dados do badge.");
      return;
    }

    const nomeBadge =
      badge.nome_badge ||
      badge.nome ||
      "badge";

    const textoParaPublicacao = [
      `Conquistei o badge "${nomeBadge}" na Softinsa Academy!`,
      "",
      urlPublica,
      urlCertificado
        ? `Certificado público: ${urlCertificado}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await copiarTexto(textoParaPublicacao);
    } catch {
      console.warn(
        "Não foi possível copiar o texto para a área de transferência."
      );
    }

    const linkedinUrl =
      `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(textoParaPublicacao)}`;

    const janela = window.open(
      linkedinUrl,
      "_blank",
      "noopener,noreferrer"
    );

    if (!janela) {
      window.location.href = linkedinUrl;
    }
  };

  if (loading) {
    return (
      <div style={center}>
        <Spinner
          animation="border"
          variant="primary"
        />
      </div>
    );
  }

  if (erro || !badge) {
    return (
      <div style={page}>
        <PublicHeader />

        <main style={errorMain}>
          <div style={errorCard}>
            <div style={errorIcon}>
              !
            </div>

            <h2 style={errorTitle}>
              Badge público indisponível
            </h2>

            <p style={errorText}>
              {erro ||
                "Não foi possível carregar este badge público."}
            </p>

            <Button
              onClick={() =>
                navigate(destinoVoltar)
              }
              style={primaryButton}
            >
              {textoVoltar}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={page}>
      <PublicHeader />

      <main style={main}>
        <button
          type="button"
          style={backButton}
          onClick={() =>
            navigate(destinoVoltar)
          }
        >
          <BiArrowBack size={18} />
          {textoVoltar}
        </button>

        <section style={heroCard}>
          <div style={heroLeft}>
            <div style={badgeImageWrap}>
              {badge.imagem_url ||
              badge.imagem ? (
                <img
                  src={
                    badge.imagem_url ||
                    badge.imagem
                  }
                  alt={
                    badge.nome_badge
                  }
                  style={badgeImage}
                />
              ) : (
                <BiMedal
                  size={58}
                  color="#2563eb"
                />
              )}
            </div>

            <div style={heroText}>
              <div style={verifiedLine}>
                <BiShieldAlt2 size={17} />
                Badge verificado pela Softinsa Academy
              </div>

              <h1 style={badgeTitle}>
                {badge.nome_badge ||
                  badge.nome}
              </h1>

              <p style={consultorLine}>
                Conquistado por{" "}
                <strong>
                  {badge.nome_consultor}
                </strong>
              </p>

              <div style={metaLine}>
                <span>
                  {badge.nome_area ||
                    "Área não definida"}
                </span>

                {badge.nome_serviceline && (
                  <>
                    <span style={dot}>
                      •
                    </span>

                    <span>
                      {
                        badge.nome_serviceline
                      }
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={heroRight}>
            <span
              style={{
                ...statusPill,
                background:
                  estadoVisual.background,
                color:
                  estadoVisual.color,
                borderColor:
                  estadoVisual.border,
              }}
            >
              {estadoVisual.texto}
            </span>

            <div style={pointsBox}>
              <BiStar size={20} />
              <div>
                <div style={pointsValue}>
                  {badge.pontos}
                </div>
                <div style={pointsLabel}>
                  pontos
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={grid}>
          <div style={leftColumn}>
            <InfoCard
              title="Descrição"
              icon={<BiBadgeCheck />}
            >
              <p style={paragraph}>
                {badge.descricao ||
                  badge.descricao_badge_modelo ||
                  "Sem descrição disponível."}
              </p>
            </InfoCard>

            <InfoCard
              title="Requisitos do badge"
              icon={<BiMedal />}
            >
              {Array.isArray(
                badge.requisitos
              ) &&
              badge.requisitos.length >
                0 ? (
                <div style={requirementsList}>
                  {badge.requisitos.map(
                    (req, index) => (
                      <RequisitoItem
                        key={
                          req.id_requisitos ||
                          req.id_requisito ||
                          index
                        }
                        requisito={req}
                        index={index}
                      />
                    )
                  )}
                </div>
              ) : (
                <p style={mutedText}>
                  Sem requisitos disponíveis.
                </p>
              )}
            </InfoCard>
          </div>

          <aside style={rightColumn}>
            <InfoCard
              title="Dados da conquista"
              icon={<BiCalendar />}
            >
              <InfoLine
                label="Consultor"
                value={
                  badge.nome_consultor
                }
              />

              <InfoLine
                label="Nível"
                value={
                  badge.codigo_nivel ||
                  badge.nome_nivel ||
                  "Sem nível"
                }
              />

              <InfoLine
                label="Atribuído em"
                value={formatarData(
                  badge.data_atribuicao
                )}
              />

              <InfoLine
                label="Validade"
                value={
                  badge.data_validade
                    ? formatarData(
                        badge.data_validade
                      )
                    : "Sem expiração"
                }
              />

              <InfoLine
                label="Estado"
                value={
                  estadoVisual.texto
                }
              />
            </InfoCard>

            <InfoCard
              title="Partilhar"
              icon={<BiLinkExternal />}
            >
              <div style={actionsColumn}>
                <Button
                  type="button"
                  onClick={
                    copiarLink
                  }
                  style={secondaryButton}
                >
                  <BiCopy size={17} />
                  {copiado
                    ? "Link copiado!"
                    : "Copiar link público"}
                </Button>

                <Button
                  type="button"
                  onClick={
                    partilharLinkedin
                  }
                  style={linkedinButton}
                >
                  <FaLinkedinIn size={16} />
                  Partilhar no LinkedIn
                </Button>

                {urlCertificado && (
                  <Button
                    type="button"
                    onClick={() =>
                      window.open(
                        urlCertificado,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    style={primaryButton}
                  >
                    <BiShieldAlt2 size={17} />
                    Ver certificado público
                  </Button>
                )}

                {badge.linkedin_url && (
                  <Button
                    type="button"
                    onClick={() =>
                      window.open(
                        badge.linkedin_url,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    style={secondaryButton}
                  >
                    <BiUser size={17} />
                    Perfil LinkedIn
                  </Button>
                )}
              </div>
            </InfoCard>
          </aside>
        </section>
      </main>
    </div>
  );
}

function PublicHeader() {
  return (
    <header style={header}>
      <div style={headerInner}>
        <img
          src={logoImg}
          alt="Softinsa"
          style={logo}
        />

        <div style={headerActions}>
          <a
            href="/"
            style={headerLink}
          >
            Galeria pública
          </a>

          <a
            href="/login"
            style={loginButton}
          >
            Login
          </a>
        </div>
      </div>
    </header>
  );
}

function InfoCard({
  title,
  icon,
  children,
}) {
  return (
    <div style={infoCard}>
      <div style={infoCardTitle}>
        <span style={infoCardIcon}>
          {icon}
        </span>
        {title}
      </div>

      {children}
    </div>
  );
}

function InfoLine({
  label,
  value,
}) {
  return (
    <div style={infoLine}>
      <span style={infoLabel}>
        {label}
      </span>

      <span style={infoValue}>
        {value || "—"}
      </span>
    </div>
  );
}

function RequisitoItem({
  requisito,
  index,
}) {
  const links =
    Array.isArray(
      requisito.links
    )
      ? requisito.links
      : [];

  return (
    <div style={requisitoItem}>
      <div style={requisitoTitle}>
        Requisito{" "}
        {index + 1} —{" "}
        {requisito.titulo ||
          requisito.nome_requisito ||
          "Requisito"}
      </div>

      <div style={requisitoText}>
        {requisito.descricao ||
          requisito.descricao_requisito ||
          "Sem descrição."}
      </div>

      {links.length > 0 && (
        <div style={linksBox}>
          {links.map(
            (link, i) => (
              <a
                key={`${link}-${i}`}
                href={link}
                target="_blank"
                rel="noreferrer"
                style={cursoLink}
              >
                {link}
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}

const page = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
};

const header = {
  background: "white",
  borderBottom: "1px solid #e5e7eb",
};

const headerInner = {
  maxWidth: 1180,
  margin: "0 auto",
  height: 72,
  padding: "0 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const logo = {
  width: 145,
  maxHeight: 46,
  objectFit: "contain",
};

const headerActions = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const headerLink = {
  fontSize: 14,
  color: "#475569",
  textDecoration: "none",
  fontWeight: 600,
};

const loginButton = {
  border: "1px solid #4470AF",
  color: "#4470AF",
  borderRadius: 999,
  padding: "7px 18px",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
};

const main = {
  maxWidth: 1180,
  margin: "0 auto",
  padding:
    "clamp(18px, 3vw, 34px) 24px 60px",
};

const backButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  gap: 7,
  fontSize: 14,
  fontWeight: 400,
  cursor: "pointer",
  marginBottom: 18,
};

const heroCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 24,
  padding:
    "clamp(22px, 4vw, 34px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 26,
  flexWrap: "wrap",
  boxShadow:
    "0 18px 45px rgba(15, 23, 42, 0.08)",
  marginBottom: 24,
};

const heroLeft = {
  display: "flex",
  alignItems: "center",
  gap: 24,
  flexWrap: "wrap",
};

const badgeImageWrap = {
  width: 116,
  height: 116,
  borderRadius: "50%",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  flexShrink: 0,
};

const badgeImage = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  padding: 10,
};

const heroText = {
  minWidth: 260,
};

const verifiedLine = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  color: "#2563eb",
  background: "#eff6ff",
  borderRadius: 999,
  padding: "5px 10px",
  fontSize: 12,
  fontWeight: 400,
  marginBottom: 10,
};

const badgeTitle = {
  fontSize:
    "clamp(24px, 3vw, 30px)",
  fontWeight: 550,
  color: "#0f172a",
  margin: "0 0 8px",
  lineHeight: 1.1,
};

const consultorLine = {
  fontSize: 15,
  color: "#334155",
  margin: 0,
};

const metaLine = {
  marginTop: 8,
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  color: "#64748b",
  fontSize: 14,
};

const dot = {
  color: "#cbd5e1",
};

const heroRight = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 12,
};

const statusPill = {
  border: "1px solid",
  borderRadius: 999,
  padding: "7px 13px",
  fontSize: 13,
  fontWeight: 400,
};

const pointsBox = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: "1px solid #dbe3ef",
  borderRadius: 16,
  padding: "10px 14px",
  color: "#2563eb",
  background: "#f8fafc",
};

const pointsValue = {
  fontSize: 17,
  fontWeight: 500,
  lineHeight: 1,
};

const pointsLabel = {
  fontSize: 11,
  fontWeight: 700,
  color: "#64748b",
};

const grid = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 340px",
  gap: 24,
  alignItems: "start",
};

const leftColumn = {
  minWidth: 0,
};

const rightColumn = {
  minWidth: 0,
};

const infoCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 18,
  padding: 20,
  marginBottom: 18,
  boxShadow:
    "0 10px 28px rgba(15, 23, 42, 0.05)",
};

const infoCardTitle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 15,
  fontWeight: 500,
  color: "#111827",
  marginBottom: 14,
};

const infoCardIcon = {
  display: "inline-flex",
  color: "#2563eb",
  fontSize: 15,
};

const paragraph = {
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.7,
  margin: 0,
};

const mutedText = {
  color: "#64748b",
  fontSize: 13,
  margin: 0,
};

const requirementsList = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const requisitoItem = {
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 14,
  background: "#fbfdff",
};

const requisitoTitle = {
  fontSize: 13,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 6,
};

const requisitoText = {
  fontSize: 13,
  color: "#475569",
  lineHeight: 1.55,
};

const linksBox = {
  marginTop: 10,
  display: "flex",
  flexDirection: "column",
  gap: 5,
};

const cursoLink = {
  color: "#2563eb",
  fontSize: 13,
  fontWeight: 500,
  overflowWrap: "anywhere",
};

const infoLine = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  borderBottom: "1px solid #f1f5f9",
  padding: "9px 0",
};

const infoLabel = {
  color: "#64748b",
  fontSize: 13,
};

const infoValue = {
  color: "#111827",
  fontSize: 13,
  fontWeight: 400,
  textAlign: "right",
};

const actionsColumn = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const primaryButton = {
  background: "#2563eb",
  border: "none",
  borderRadius: 999,
  padding: "10px 22px",
  fontWeight: 400,
};

const secondaryButton = {
  ...primaryButton,
  background: "white",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const linkedinButton = {
  ...primaryButton,
  background: "#0a66c2",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const center = {
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const errorMain = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "80px 24px",
};

const errorCard = {
  background: "white",
  borderRadius: 24,
  border: "1px solid #e5e7eb",
  padding: 34,
  textAlign: "center",
  boxShadow:
    "0 18px 45px rgba(15, 23, 42, 0.08)",
};

const errorIcon = {
  width: 74,
  height: 74,
  borderRadius: "50%",
  background: "#fee2e2",
  color: "#b91c1c",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 34,
  fontWeight: 900,
  margin: "0 auto 16px",
};

const errorTitle = {
  fontSize: 24,
  fontWeight: 900,
  color: "#111827",
};

const errorText = {
  color: "#64748b",
  fontSize: 14,
  lineHeight: 1.6,
  marginBottom: 22,
};

const responsiveStyle = document.createElement("style");
responsiveStyle.textContent = `
  @media (max-width: 850px) {
    [data-public-badge-grid="true"] {
      grid-template-columns: 1fr !important;
    }
  }
`;

export default BadgePublicoIndividualPage;