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
  BiCheckShield,
  BiCopy,
  BiErrorCircle,
  BiLinkExternal,
  BiMedal,
  BiShieldAlt2,
  BiStar,
  BiUser,
} from "react-icons/bi";

import {
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

function obterEstadoVisual(estado) {
  const normalizado =
    String(estado || "")
      .trim()
      .toUpperCase();

  if (
    normalizado === "EXPIRADO"
  ) {
    return {
      titulo: "Certificado autêntico, mas badge expirado",
      texto: "Este certificado foi emitido pela Softinsa Academy, mas o badge associado encontra-se expirado.",
      etiqueta: "Expirado",
      icon: <BiErrorCircle size={42} />,
      background: "#fff7ed",
      color: "#c2410c",
      border: "#fed7aa",
    };
  }

  if (
    normalizado === "INVALIDO" ||
    normalizado === "ERRO"
  ) {
    return {
      titulo: "Certificado inválido",
      texto: "Não foi possível validar este código de certificado.",
      etiqueta: "Inválido",
      icon: <BiErrorCircle size={42} />,
      background: "#fef2f2",
      color: "#b91c1c",
      border: "#fecaca",
    };
  }

  return {
    titulo: "Certificado verificado",
    texto: "Este certificado foi emitido pela Softinsa Academy e encontra-se válido.",
    etiqueta: "Válido",
    icon: <BiCheckShield size={42} />,
    background: "#ecfdf5",
    color: "#166534",
    border: "#bbf7d0",
  };
}

function copiarTexto(texto) {
  if (navigator.clipboard) {
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

  document.execCommand("copy");
  document.body.removeChild(input);

  return Promise.resolve();
}

function VerificarCertificadoPage() {
  const navigate =
    useNavigate();

  const {
    codigo,
  } = useParams();

  const [
    certificado,
    setCertificado,
  ] = useState(null);

  const [
    estadoResposta,
    setEstadoResposta,
  ] = useState("VALIDO");

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    copiado,
    setCopiado,
  ] = useState(false);

  const urlAtual =
    useMemo(
      () => window.location.href,
      []
    );

  useEffect(() => {
    if (!codigo) {
      setErro(
        "Código de verificação inválido."
      );
      setEstadoResposta(
        "INVALIDO"
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro("");

    api
      .get(
        `/certificados/verificar/${codigo}`
      )
      .then((response) => {
        setCertificado(
          response.data
            ?.certificado ||
          null
        );

        setEstadoResposta(
          response.data
            ?.estado_verificacao ||
          "VALIDO"
        );
      })
      .catch((err) => {
        console.error(
          "Erro ao verificar certificado:",
          err
        );

        setCertificado(null);
        setEstadoResposta("INVALIDO");

        setErro(
          err.response?.data?.error ||
          "Certificado não encontrado ou código inválido."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [codigo]);

  const estadoVisual =
    obterEstadoVisual(
      estadoResposta
    );

  const copiarLink =
    async () => {
      try {
        await copiarTexto(
          urlAtual
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

  return (
    <div style={page}>
      <PublicHeader />

      <main style={main}>
        <button
          type="button"
          style={backButton}
          onClick={() =>
            navigate("/galeria-badges")
          }
        >
          <BiArrowBack size={18} />
          Voltar à galeria pública
        </button>

        <section
          style={{
            ...statusCard,
            background:
              estadoVisual.background,
            borderColor:
              estadoVisual.border,
          }}
        >
          <div
            style={{
              ...statusIcon,
              color:
                estadoVisual.color,
            }}
          >
            {estadoVisual.icon}
          </div>

          <div style={{ flex: 1 }}>
            <div
              style={{
                ...statusBadge,
                color:
                  estadoVisual.color,
                borderColor:
                  estadoVisual.border,
              }}
            >
              {estadoVisual.etiqueta}
            </div>

            <h1 style={title}>
              {estadoVisual.titulo}
            </h1>

            <p style={subtitle}>
              {erro ||
                estadoVisual.texto}
            </p>
          </div>
        </section>

        {certificado && (
          <section style={grid}>
            <div style={leftColumn}>
              <InfoCard
                title="Dados do certificado"
                icon={<BiShieldAlt2 />}
              >
                <InfoLine
                  label="Código"
                  value={
                    certificado
                      .codigo_certificado
                  }
                />

                <InfoLine
                  label="Consultor"
                  value={
                    certificado
                      .nome_consultor
                  }
                />

                <InfoLine
                  label="Badge"
                  value={
                    certificado
                      .nome_badge
                  }
                />

                <InfoLine
                  label="Nível"
                  value={
                    certificado
                      .codigo_nivel ||
                    certificado
                      .nome_nivel ||
                    "Sem nível"
                  }
                />

                <InfoLine
                  label="Área"
                  value={
                    certificado
                      .nome_area
                  }
                />

                <InfoLine
                  label="Service Line"
                  value={
                    certificado
                      .nome_serviceline ||
                    "—"
                  }
                />
              </InfoCard>

              <InfoCard
                title="Descrição do badge"
                icon={<BiBadgeCheck />}
              >
                <p style={paragraph}>
                  {certificado
                    .descricao_badge_modelo ||
                    "Sem descrição disponível."}
                </p>
              </InfoCard>
            </div>

            <aside style={rightColumn}>
              <InfoCard
                title="Validade"
                icon={<BiCalendar />}
              >
                <InfoLine
                  label="Data de emissão"
                  value={formatarData(
                    certificado
                      .data_emissao
                  )}
                />

                <InfoLine
                  label="Data de atribuição"
                  value={formatarData(
                    certificado
                      .data_atribuicao
                  )}
                />

                <InfoLine
                  label="Data de validade"
                  value={
                    certificado
                      .data_validade
                      ? formatarData(
                          certificado
                            .data_validade
                        )
                      : "Sem expiração"
                  }
                />

                <InfoLine
                  label="Estado"
                  value={
                    estadoVisual.etiqueta
                  }
                />

                <InfoLine
                  label="Pontos"
                  value={`${certificado.pontos || 0} pontos`}
                />
              </InfoCard>

              <InfoCard
                title="Ações"
                icon={<BiLinkExternal />}
              >
                <div style={actionsColumn}>
                  <Button
                    type="button"
                    onClick={copiarLink}
                    style={secondaryButton}
                  >
                    <BiCopy size={17} />
                    {copiado
                      ? "Link copiado!"
                      : "Copiar link"}
                  </Button>

                  {certificado
                    .url_publica_badge && (
                    <Button
                      type="button"
                      onClick={() =>
                        navigate(
                          certificado
                            .url_publica_badge
                        )
                      }
                      style={primaryButton}
                    >
                      <BiMedal size={17} />
                      Ver badge público
                    </Button>
                  )}
                </div>
              </InfoCard>
            </aside>
          </section>
        )}
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
            href="/galeria-badges"
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
  fontWeight: 400,
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

const statusCard = {
  border: "1px solid",
  borderRadius: 24,
  padding:
    "clamp(22px, 4vw, 34px)",
  display: "flex",
  alignItems: "center",
  gap: 22,
  boxShadow:
    "0 18px 45px rgba(15, 23, 42, 0.08)",
  marginBottom: 24,
};

const statusIcon = {
  width: 82,
  height: 82,
  borderRadius: "50%",
  background: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  boxShadow:
    "0 12px 28px rgba(15, 23, 42, 0.08)",
};

const statusBadge = {
  display: "inline-flex",
  border: "1px solid",
  background: "white",
  borderRadius: 999,
  padding: "5px 12px",
  fontSize: 12,
  fontWeight: 500,
  marginBottom: 10,
};

const title = {
  fontSize:
    "clamp(24px, 3vw, 30px)",
  fontWeight: 550,
  color: "#0f172a",
  margin: "0 0 8px",
  lineHeight: 1.1,
};

const subtitle = {
  fontSize: 15,
  color: "#475569",
  margin: 0,
  lineHeight: 1.6,
};

const grid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
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
  fontWeight: 400,
  color: "#111827",
  marginBottom: 14,
};

const infoCardIcon = {
  display: "inline-flex",
  color: "#2563eb",
  fontSize: 17,
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
  fontWeight: 450,
  textAlign: "right",
};

const paragraph = {
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.7,
  margin: 0,
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
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const secondaryButton = {
  ...primaryButton,
  background: "white",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
};

const center = {
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default VerificarCertificadoPage;