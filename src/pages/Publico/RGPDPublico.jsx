import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import api from "../../services/api.js";

function RGPDPublico() {
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarPolitica() {
      try {
        setIsLoading(true);
        setErro("");

        const resposta = await api.get("/rgpd/politica-publica");
        const politica = resposta?.data?.politica || resposta?.data || {};

        if (!ativo) {
          return;
        }

        setTexto(String(politica?.conteudo || ""));
      } catch (err) {
        console.error("[RGPD PÚBLICO] Erro ao carregar política:", err);

        if (!ativo) {
          return;
        }

        setErro(
          err?.response?.data?.error ||
            "Não foi possível carregar a política de RGPD."
        );
      } finally {
        if (ativo) {
          setIsLoading(false);
        }
      }
    }

    carregarPolitica();

    return () => {
      ativo = false;
    };
  }, []);

  const blocos = useMemo(
    () =>
      String(texto || "")
        .split("\n")
        .map((linha) => linha.trim())
        .filter(Boolean),
    [texto]
  );

  return (
    <main style={paginaStyle}>
      <section style={cardStyle}>
        <div style={topoStyle}>
          <h1 style={tituloStyle}>Política de RGPD</h1>

          <button type="button" style={botaoVoltarStyle} onClick={() => navigate(-1)}>
            <BiArrowBack size={16} />
            Voltar
          </button>
        </div>

        {isLoading && <p style={estadoStyle}>A carregar política de RGPD...</p>}

        {!isLoading && erro && <p style={erroStyle}>{erro}</p>}

        {!isLoading && !erro && (
          <article style={conteudoStyle}>
            {blocos.map((bloco, index) => (
              <p key={`${index}-${bloco.slice(0, 16)}`} style={paragrafoStyle}>
                {bloco}
              </p>
            ))}
          </article>
        )}
      </section>
    </main>
  );
}

const paginaStyle = {
  minHeight: "100vh",
  background: "linear-gradient(160deg, #f8fbff 0%, #eef4ff 100%)",
  padding: "32px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardStyle = {
  width: "100%",
  maxWidth: 880,
  borderRadius: 18,
  border: "1px solid #dbe3ef",
  background: "#ffffff",
  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.10)",
  padding: "24px",
};

const topoStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 18,
  flexWrap: "wrap",
};

const tituloStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "1.75rem",
  lineHeight: 1.2,
};

const botaoVoltarStyle = {
  border: "1px solid #dbe3ef",
  background: "#f8fafc",
  color: "#1f2937",
  borderRadius: 10,
  padding: "8px 12px",
  display: "inline-flex",
  gap: 6,
  alignItems: "center",
  cursor: "pointer",
  fontWeight: 600,
};

const conteudoStyle = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "16px",
};

const paragrafoStyle = {
  margin: "0 0 12px 0",
  color: "#334155",
  lineHeight: 1.6,
  fontSize: 14,
};

const estadoStyle = {
  margin: 0,
  color: "#475569",
  fontSize: 14,
};

const erroStyle = {
  margin: 0,
  color: "#b91c1c",
  fontSize: 14,
};

export default RGPDPublico;
