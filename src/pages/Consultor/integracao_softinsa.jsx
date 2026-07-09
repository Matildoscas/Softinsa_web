import {
  useState,
} from "react";

import {
  Button,
  Card,
} from "react-bootstrap";

import {
  BiArrowBack,
  BiBriefcase,
  BiBuildingHouse,
  BiCheckCircle,
  BiEnvelope,
  BiGlobe,
  BiLinkExternal,
  BiMap,
  BiPhone,
  BiShield,
} from "react-icons/bi";

import {
  useNavigate,
} from "react-router-dom";

import Header from "../../components/Header.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";

const SOFTINSA_LINKS = {
  site: "https://softinsa.pt/",
  quemSomos: "https://softinsa.pt/quem-somos/",
  servicos: "https://softinsa.pt/servicos/",
  carreiras: "https://softinsa.pt/carreiras/",
  contactos: "https://softinsa.pt/contactos/",
  centros: "https://softinsa.pt/centros-de-inovacao/",
  privacidade: "https://softinsa.pt/politica-de-privacidade/",
};

const CONTACTO_SOFTINSA = {
  email: "geral@pt.softinsa.com",
  telefone: "+351213219600",
  telefoneFormatado: "+351 213 219 600",
  morada:
    "EdifÃ­cio Office Oriente, Rua do Mar da China nÂº 3, B6, Parque das NaÃ§Ãµes, 1990-138 Lisboa",
};

function abrirLink(url) {
  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}

function IntegracaoSoftinsaPage() {
  const navigate =
    useNavigate();

  const [
    copiado,
    setCopiado,
  ] = useState(false);

  const copiarContacto =
    async () => {
      const texto =
        [
          "Softinsa",
          CONTACTO_SOFTINSA.email,
          CONTACTO_SOFTINSA.telefoneFormatado,
          CONTACTO_SOFTINSA.morada,
          SOFTINSA_LINKS.site,
        ].join("\n");

      try {
        await navigator.clipboard.writeText(
          texto
        );

        setCopiado(true);

        setTimeout(() => {
          setCopiado(false);
        }, 1800);
      } catch {
        alert(
          "NÃ£o foi possÃ­vel copiar os contactos."
        );
      }
    };

  return (
    <div style={page}>
      <Header />

      <div style={layout}>
        <LeftSidebar />

        <main style={main}>
          <button
            type="button"
            style={backButton}
            onClick={() =>
              navigate(-1)
            }
          >
            <BiArrowBack size={18} />
            Voltar
          </button>

          <section style={hero}>
            <div>
              <div style={eyebrow}>
                IntegraÃ§Ã£o institucional
              </div>

              <h1 style={title}>
                Softinsa institucional
              </h1>

              <p style={subtitle}>
                Acede rapidamente ao site oficial da Softinsa, contactos, carreiras, serviÃ§os, centros de inovaÃ§Ã£o e polÃ­tica de privacidade.
              </p>

              <div style={heroActions}>
                <Button
                  style={primaryButton}
                  onClick={() =>
                    abrirLink(
                      SOFTINSA_LINKS.site
                    )
                  }
                >
                  <BiGlobe size={18} />
                  Abrir www.softinsa.pt
                </Button>

                <Button
                  style={outlineHeroButton}
                  onClick={() =>
                    abrirLink(
                      SOFTINSA_LINKS.contactos
                    )
                  }
                >
                  <BiLinkExternal size={18} />
                  Contactos oficiais
                </Button>
              </div>
            </div>

            <div style={heroIcon}>
              <BiBuildingHouse size={42} />
            </div>
          </section>

          <section style={grid}>
            <InstitutionalCard
              icon={<BiGlobe />}
              title="Site oficial"
              description="PÃ¡gina institucional da Softinsa."
              buttonText="Abrir site"
              onClick={() =>
                abrirLink(
                  SOFTINSA_LINKS.site
                )
              }
            />

            <InstitutionalCard
              icon={<BiBuildingHouse />}
              title="Quem somos"
              description="InformaÃ§Ã£o institucional sobre a Softinsa."
              buttonText="Ver informaÃ§Ã£o"
              onClick={() =>
                abrirLink(
                  SOFTINSA_LINKS.quemSomos
                )
              }
            />

            <InstitutionalCard
              icon={<BiBriefcase />}
              title="Carreiras"
              description="Acesso Ã  Ã¡rea de carreiras e candidaturas."
              buttonText="Ver carreiras"
              onClick={() =>
                abrirLink(
                  SOFTINSA_LINKS.carreiras
                )
              }
            />

            <InstitutionalCard
              icon={<BiMap />}
              title="Centros de inovaÃ§Ã£o"
              description="Consulta os centros de inovaÃ§Ã£o da Softinsa."
              buttonText="Ver centros"
              onClick={() =>
                abrirLink(
                  SOFTINSA_LINKS.centros
                )
              }
            />

            <InstitutionalCard
              icon={<BiShield />}
              title="PolÃ­tica de privacidade"
              description="Consulta a polÃ­tica oficial de privacidade."
              buttonText="Ver polÃ­tica"
              onClick={() =>
                abrirLink(
                  SOFTINSA_LINKS.privacidade
                )
              }
            />

            <InstitutionalCard
              icon={<BiCheckCircle />}
              title="ServiÃ§os"
              description="Consulta os serviÃ§os apresentados no site institucional."
              buttonText="Ver serviÃ§os"
              onClick={() =>
                abrirLink(
                  SOFTINSA_LINKS.servicos
                )
              }
            />
          </section>

          <section style={twoColumns}>
            <Card
              className="border-0"
              style={card}
            >
              <Card.Body>
                <h5 style={sectionTitle}>
                  Contactos oficiais
                </h5>

                <div style={contactList}>
                  <ContactLine
                    icon={<BiEnvelope />}
                    label="Email"
                    value={
                      CONTACTO_SOFTINSA.email
                    }
                    actionText="Enviar email"
                    onClick={() => {
                      window.location.href =
                        `mailto:${CONTACTO_SOFTINSA.email}`;
                    }}
                  />

                  <ContactLine
                    icon={<BiPhone />}
                    label="Telefone"
                    value={
                      CONTACTO_SOFTINSA.telefoneFormatado
                    }
                    actionText="Ligar"
                    onClick={() => {
                      window.location.href =
                        `tel:${CONTACTO_SOFTINSA.telefone}`;
                    }}
                  />

                  <ContactLine
                    icon={<BiMap />}
                    label="Morada"
                    value={
                      CONTACTO_SOFTINSA.morada
                    }
                    actionText="Ver contactos"
                    onClick={() =>
                      abrirLink(
                        SOFTINSA_LINKS.contactos
                      )
                    }
                  />
                </div>

                <div style={contactActions}>
                  <Button
                    style={secondaryButton}
                    onClick={
                      copiarContacto
                    }
                  >
                    {copiado
                      ? "Contactos copiados!"
                      : "Copiar contactos"}
                  </Button>

                  <Button
                    style={primarySmallButton}
                    onClick={() =>
                      abrirLink(
                        SOFTINSA_LINKS.contactos
                      )
                    }
                  >
                    Abrir pÃ¡gina de contactos
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card
              className="border-0"
              style={card}
            >
              <Card.Body>
                <h5 style={sectionTitle}>
                  IntegraÃ§Ã£o funcional
                </h5>

                <div style={statusBox}>
                  <BiCheckCircle
                    size={26}
                    color="#16a34a"
                  />

                  <div>
                    <div style={statusTitle}>
                      LigaÃ§Ã£o ativa ao site institucional
                    </div>

                    <div style={statusText}>
                      Esta pÃ¡gina nÃ£o contÃ©m apenas texto estÃ¡tico: permite abrir pÃ¡ginas oficiais, enviar email, ligar para o contacto institucional e consultar informaÃ§Ãµes externas da Softinsa.
                    </div>
                  </div>
                </div>

                <div style={integrationList}>
                  <div style={integrationItem}>
                    Website oficial ligado
                  </div>

                  <div style={integrationItem}>
                    Contactos institucionais funcionais
                  </div>

                  <div style={integrationItem}>
                    LigaÃ§Ã£o Ã  pÃ¡gina de carreiras
                  </div>

                  <div style={integrationItem}>
                    LigaÃ§Ã£o Ã  polÃ­tica de privacidade
                  </div>

                  <div style={integrationItem}>
                    Abertura externa segura
                  </div>
                </div>
              </Card.Body>
            </Card>
          </section>
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

function InstitutionalCard({
  icon,
  title,
  description,
  buttonText,
  onClick,
}) {
  return (
    <Card
      className="border-0"
      style={card}
    >
      <Card.Body style={cardBody}>
        <div style={cardIcon}>
          {icon}
        </div>

        <h5 style={cardTitle}>
          {title}
        </h5>

        <p style={cardText}>
          {description}
        </p>

        <Button
          style={cardButton}
          onClick={onClick}
        >
          {buttonText}
          <BiLinkExternal size={16} />
        </Button>
      </Card.Body>
    </Card>
  );
}

function ContactLine({
  icon,
  label,
  value,
  actionText,
  onClick,
}) {
  return (
    <div style={contactLine}>
      <div style={contactIcon}>
        {icon}
      </div>

      <div style={{ flex: 1 }}>
        <div style={contactLabel}>
          {label}
        </div>

        <div style={contactValue}>
          {value}
        </div>
      </div>

      <button
        type="button"
        style={contactButton}
        onClick={onClick}
      >
        {actionText}
      </button>
    </div>
  );
}

const page = {
  backgroundColor: "#f0f2f5",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};

const layout = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const main = {
  flex: 1,
  overflowY: "auto",
  padding: "24px 28px 42px",
};

const backButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  gap: 7,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  marginBottom: 14,
};

const hero = {
  background:
    "linear-gradient(135deg, #4470AF, #2563eb)",
  color: "white",
  borderRadius: 18,
  padding: 28,
  marginBottom: 24,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 24,
};

const eyebrow = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.8,
  opacity: 0.85,
  fontWeight: 700,
  marginBottom: 6,
};

const title = {
  fontSize: 28,
  fontWeight: 650,
  margin: 0,
};

const subtitle = {
  fontSize: 14,
  opacity: 0.92,
  margin: "10px 0 0",
  maxWidth: 600,
  lineHeight: 1.6,
};

const heroActions = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 20,
};

const primaryButton = {
  background: "white",
  color: "#2563eb",
  border: "none",
  borderRadius: 999,
  padding: "10px 18px",
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const outlineHeroButton = {
  background: "rgba(255,255,255,0.12)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.5)",
  borderRadius: 999,
  padding: "10px 18px",
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const heroIcon = {
  width: 86,
  height: 86,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const grid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 16,
  marginBottom: 20,
};

const card = {
  borderRadius: 14,
  boxShadow:
    "0 2px 10px rgba(15,23,42,0.05)",
};

const cardBody = {
  minHeight: 190,
  display: "flex",
  flexDirection: "column",
};

const cardIcon = {
  width: 46,
  height: 46,
  borderRadius: "50%",
  background: "#eff6ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  marginBottom: 12,
};

const cardTitle = {
  fontSize: 16,
  fontWeight: 450,
  color: "#111827",
  marginBottom: 6,
};

const cardText = {
  color: "#64748b",
  fontSize: 13,
  lineHeight: 1.5,
  flex: 1,
};

const cardButton = {
  background: "#2563eb",
  border: "none",
  borderRadius: 999,
  padding: "9px 15px",
  fontWeight: 400,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  marginTop: 10,
};

const twoColumns = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) minmax(0, 1fr)",
  gap: 18,
};

const sectionTitle = {
  fontSize: 16,
  fontWeight: 500,
  color: "#111827",
  marginBottom: 14,
};

const contactList = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const contactLine = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  background: "#f8fafc",
};

const contactIcon = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  background: "#eff6ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
  flexShrink: 0,
};

const contactLabel = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
};

const contactValue = {
  fontSize: 13,
  color: "#111827",
  fontWeight: 600,
  lineHeight: 1.4,
};

const contactButton = {
  border: "1px solid #bfdbfe",
  background: "white",
  color: "#2563eb",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 12,
  fontWeight: 400,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const contactActions = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 14,
};

const secondaryButton = {
  background: "white",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
  borderRadius: 999,
  padding: "9px 15px",
  fontWeight: 400,
};

const primarySmallButton = {
  background: "#2563eb",
  border: "none",
  borderRadius: 999,
  padding: "9px 15px",
  fontWeight: 400,
};

const statusBox = {
  display: "flex",
  gap: 12,
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: 12,
  padding: 14,
  marginBottom: 14,
};

const statusTitle = {
  fontSize: 14,
  fontWeight: 500,
  color: "#166534",
};

const statusText = {
  fontSize: 13,
  color: "#166534",
  lineHeight: 1.5,
  marginTop: 3,
};

const integrationList = {
  display: "grid",
  gap: 8,
};

const integrationItem = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "10px 12px",
  color: "#374151",
  fontSize: 13,
  fontWeight: 500,
};

export default IntegracaoSoftinsaPage;
