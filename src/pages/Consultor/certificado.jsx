import { useEffect, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";

import Header from "../../components/header.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";
import api from "../../services/api.js";
import logoImg from "../../assets/logo.png";

function SignatureIcon() {
  return (
    <svg
      width="80"
      height="70"
      viewBox="0 0 80 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="6" y1="6" x2="18" y2="18" stroke="#111" strokeWidth="3" strokeLinecap="round" />
      <line x1="18" y1="6" x2="6" y2="18" stroke="#111" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M22 42 C24 20, 34 14, 38 16 C42 18, 40 28, 36 34 C32 40, 28 44, 30 50 C32 56, 42 56, 50 50"
        stroke="#111"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="22" y="58" width="5" height="5" rx="1" fill="#111" />
      <rect x="30" y="58" width="5" height="5" rx="1" fill="#111" />
      <rect x="38" y="58" width="5" height="5" rx="1" fill="#111" />
      <rect x="46" y="58" width="5" height="5" rx="1" fill="#111" />
      <rect x="54" y="58" width="5" height="5" rx="1" fill="#111" />
    </svg>
  );
}

function CertificadoPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [badge, setBadge] = useState(null);
  const [loading, setLoading] = useState(true);

  const removerDuplicados = (lista) => {
    const mapa = new Map();

    lista.forEach((b) => {
      const badgeId = String(b.id || b.id_badge_modelo);

      if (!mapa.has(badgeId)) {
        mapa.set(badgeId, { ...b, requisitos: [] });
      }

      if (b.titulo || b.nome_requisito || b.descricao_requisito) {
        mapa.get(badgeId).requisitos.push({
          titulo: b.titulo,
          nome: b.nome_requisito,
          descricao: b.descricao_requisito,
        });
      }
    });

    return Array.from(mapa.values());
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    const userData = JSON.parse(storedUser);
    const userId = userData.id_utilizador || userData.ID_UTILIZADOR;

    setUser(userData);
    setLoading(true);

    Promise.all([
        api.get("/badges/todos"),
        api.get(`/badges/conquistados/${userId}`),
        ])
        .then(([todosRes, conquistadosRes]) => {
            const todosRaw = Array.isArray(todosRes.data) ? todosRes.data : [];
            const conquistadosRaw = Array.isArray(conquistadosRes.data)
            ? conquistadosRes.data
            : [];

            const todos = removerDuplicados(todosRaw);
            const conquistados = removerDuplicados(conquistadosRaw);

            const badgeConquistado = conquistados.find(
            (b) => Number(b.id || b.id_badge_modelo) === Number(id)
            );

            if (!badgeConquistado) {
            setBadge(null);
            return;
            }

            const badgeCatalogo = todos.find(
            (b) =>
                Number(b.id || b.id_badge_modelo) ===
                Number(badgeConquistado.id || badgeConquistado.id_badge_modelo)
            );

            const badgeFinal = {
            ...badgeCatalogo,
            ...badgeConquistado,
            nome_area:
                badgeConquistado.nome_area ||
                badgeCatalogo?.nome_area ||
                badgeCatalogo?.nome_areas ||
                badgeCatalogo?.area ||
                "Área não definida",
            };

            setBadge(badgeFinal);
        })
        .catch((err) => {
            console.error("Erro ao carregar certificado:", err);
            console.error("STATUS:", err.response?.status);
            console.error("BODY:", err.response?.data);
        })
        .finally(() => setLoading(false));
  }, [id, navigate]);

  const getNomeUtilizador = () => {
    return (
      user?.nome_completo ||
      user?.nome ||
      user?.NOME_COMPLETO ||
      "Utilizador"
    );
  };

  const getCargo = () => {
    return user?.cargo || "Consultor/a";
  };

  const getArea = () => {
    return badge?.nome_area || badge?.area || "Área não definida";
  };

  const getNomeBadge = () => {
    return badge?.nome || badge?.nome_badge || "Badge";
  };

  const getNivel = () => {
    const nivel = Number(badge?.id_nivel || 0);

    if (nivel === 1) return "Nível A";
    if (nivel === 2) return "Nível B";
    if (nivel === 3) return "Nível C";
    if (nivel === 4) return "Nível D";
    if (nivel === 5) return "Nível E";

    return "Nível não definido";
  };

  const getRequisitosTexto = () => {
    if (!badge?.requisitos || badge.requisitos.length === 0) {
      return "";
    }

    return badge.requisitos
      .map((r) => r.titulo)
      .filter(Boolean)
      .join(", ");
  };

  const getDataEmissao = () => {
    const data = badge?.data_atribuicao || badge?.data_emissao;

    if (!data) {
      return new Date().toLocaleDateString("pt-PT");
    }

    return new Date(data).toLocaleDateString("pt-PT");
  };

  const getCodigoVerificacao = () => {
    const userId = user?.id_utilizador || user?.ID_UTILIZADOR || "U";
    const badgeId = badge?.id || badge?.id_badge_modelo || "B";

    return `CERT-${userId}-${badgeId}`;
  };

  const getUrlVerificacao = () => {
    return `softinsa.pt/badges/${user?.id_utilizador || user?.ID_UTILIZADOR || "user"}/${badge?.id || id}`;
  };

  const handleGerarPDF = () => {
    window.print();
  };

  const handleGerarExcel = () => {
    const dados = [
      ["Campo", "Valor"],
      ["Nome do utilizador", getNomeUtilizador()],
      ["Cargo", getCargo()],
      ["Área", getArea()],
      ["Badge", getNomeBadge()],
      ["Nível", getNivel()],
      ["Requisitos", getRequisitosTexto()],
      ["Pontos", badge?.pontos || 0],
      ["Data de emissão", getDataEmissao()],
      ["Código de verificação", getCodigoVerificacao()],
      ["URL de verificação", getUrlVerificacao()],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(dados);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Certificado");

    XLSX.writeFile(
      workbook,
      `certificado_${getNomeBadge().replaceAll(" ", "_")}.xlsx`
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!badge) {
    return (
      <div style={{ backgroundColor: "#f7f7f7", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header />

        <div style={{ display: "flex", flex: 1 }}>
          <LeftSidebar />

          <main style={mainStyle}>
            <button style={backBtn} onClick={() => navigate(-1)}>
              <HiOutlineArrowLeft style={{ marginRight: 6 }} />
              Voltar
            </button>

            <hr style={{ borderColor: "#e5e7eb", margin: "8px 0 20px" }} />

            <div className="text-muted">
              Certificado não encontrado ou badge ainda não conquistado.
            </div>
          </main>

          <RightSidebar />
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f7f7f7", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <LeftSidebar />

        <main style={mainStyle}>
          <button style={backBtn} onClick={() => navigate(-1)}>
            <HiOutlineArrowLeft style={{ marginRight: 6 }} />
            Voltar
          </button>

          <hr style={{ borderColor: "#e5e7eb", margin: "8px 0 20px" }} />

          <div style={certCard} id="certificado-print">
            <div style={certificateTopLine} />
            <div style={certificateHeader}>
            <img
              src={logoImg}
              alt="Softinsa"
              style={certLogo}
            />

            <div style={certTitle}>
              Certificado de Competências
            </div>

            <div style={titleDivider} />

            <div style={certSubtitle}>
              Softinsa Academy
            </div>
          </div>

          <div style={{ height: 42 }} />

            <div style={certLine}>Certificamos que:</div>

            <div style={{ height: 20 }} />

            <div style={certHighlight}>
              {getNomeUtilizador()} , {getCargo()} – {getArea()}
            </div>

            <div style={{ height: 24 }} />

            <div style={certLine}>Concluiu com sucesso o badge:</div>

            <div style={{ height: 16 }} />

            <div style={certHighlight}>
              {getNomeBadge()} – {getNivel()}
              {getRequisitosTexto() && ` (${getRequisitosTexto()})`}
            </div>

            <div style={{ height: 56 }} />

            <div style={certMeta}>
              Data de emissão: {getDataEmissao()}
            </div>

            <div style={{ height: 10 }} />

            <div style={certMeta}>
              Código único de Verificação: {getCodigoVerificacao()}
            </div>

            <div style={{ height: 10 }} />

            <div style={certMeta}>
              URL de Verificação:{" "}
              <a
                href={`https://${getUrlVerificacao()}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#4470AF" }}
              >
                {getUrlVerificacao()}
              </a>
            </div>

            <div style={{ height: 64 }} />

            <div style={signaturesRow}>
              <div style={signatureCol}>
                <SignatureIcon />
                <div style={signatureLabel}>Service Line Leader</div>
              </div>

              <div style={signatureCol}>
                <SignatureIcon />
                <div style={signatureLabel}>Talent Manager</div>
              </div>
            </div>

            <div style={{ height: 40 }} />

            <div style={actionsRow} className="no-print">
              <button style={actionBtn} onClick={handleGerarPDF}>
                Gerar PDF
              </button>

              <button style={actionBtn} onClick={handleGerarExcel}>
                Gerar Excel
              </button>
            </div>
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

const mainStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "28px 32px",
  backgroundColor: "#f7f7f7",
  minHeight: "100vh",
};

const backBtn = {
  display: "flex",
  alignItems: "center",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#4A5568",
  fontSize: "1.05rem",
  padding: 0,
  marginBottom: 8,
};

const certCard = {
  position: "relative",
  background: "white",

  border: "2px solid #dbe3ef",
  borderRadius: 12,

  padding: "64px 80px",
  maxWidth: 900,
  minHeight: 1000,
  margin: "0 auto",

  boxShadow:
    "0 8px 30px rgba(15, 23, 42, 0.07)",

  overflow: "hidden",
};

const certLine = {
  fontSize: 16,
  color: "#111827",
  lineHeight: 1.6,
};

const certHighlight = {
  fontSize: 16,
  color: "#111827",
  textAlign: "center",
  lineHeight: 1.7,
};

const certMeta = {
  fontSize: 15,
  color: "#111827",
  lineHeight: 1.7,
};

const signaturesRow = {
  display: "flex",
  justifyContent: "center",
  gap: 80,
};

const signatureCol = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
};

const signatureLabel = {
  fontSize: 14,
  color: "#374151",
  textAlign: "center",
};

const actionsRow = {
  display: "flex",
  justifyContent: "center",
  gap: 16,
};

const actionBtn = {
  display: "flex",
  alignItems: "center",
  border: "1.5px solid #d1d5db",
  borderRadius: 8,
  padding: "8px 20px",
  fontSize: 14,
  fontWeight: 500,
  background: "white",
  color: "#374151",
  cursor: "pointer",
  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
};

const certificateHeader = {
  textAlign: "center",
};

const certLogo = {
  display: "block",
  width: 170,
  maxHeight: 65,
  objectFit: "contain",
  margin: "0 auto 22px",
};

const certTitle = {
  fontSize: 28,
  fontWeight: 700,
  color: "#111827",
  textAlign: "center",
  letterSpacing: "-0.4px",
};

const titleDivider = {
  width: 72,
  height: 3,
  borderRadius: 999,
  background: "#4470AF",
  margin: "14px auto 10px",
};

const certSubtitle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "1.5px",
};

const certificateTopLine = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: 8,
  background: "#4470AF",
};

export default CertificadoPage;