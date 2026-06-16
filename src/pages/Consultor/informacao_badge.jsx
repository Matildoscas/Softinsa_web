import { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useNavigate, useParams } from "react-router-dom";
import { FaLinkedinIn } from "react-icons/fa";
import { HiOutlineDownload, HiOutlineMail } from "react-icons/hi";
import { BiChevronUp, BiChevronDown, BiMedal } from "react-icons/bi";

import Header from "../../components/Header.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";
import api from "../../services/api.js";

const niveis = ["A", "B", "C", "D", "E"];

function BadgeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [badge, setBadge] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conquistado, setConquistado] = useState(false);
  const [conquistadoBadge, setConquistadoBadge] = useState(null);

  const removerDuplicadosComRequisitos = (lista) => {
    const mapa = new Map();

    lista.forEach((linha) => {
      const badgeId = Number(linha.id || linha.id_badge_modelo);

      if (!mapa.has(badgeId)) {
        mapa.set(badgeId, {
          id: badgeId,
          nome: linha.nome || linha.nome_badge,
          descricao: linha.descricao || linha.descricao_badge_modelo,
          pontos: linha.pontos,
          id_nivel: linha.id_nivel,
          id_areas: linha.id_areas,
          nome_area: linha.nome_area || linha.nome_areas || linha.area || "",
          requisitos: [],
        });
      }

      if (linha.titulo || linha.nome_requisito || linha.descricao_requisito) {
        mapa.get(badgeId).requisitos.push({
          id: linha.titulo || linha.nome_requisito || "Requisito",
          titulo: linha.nome_requisito || linha.titulo || "Requisito",
          descricao: linha.descricao_requisito || "",
          link: linha.link_requisito || linha.link || "",
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

    setLoading(true);

    Promise.all([
        api.get("/badges/todos"),
        api.get(`/badges/conquistados/${userId}`),
    ])
        .then(([todosRes, conquistadosRes]) => {
        const dados = Array.isArray(todosRes.data) ? todosRes.data : [];
        const badgesAgrupados = removerDuplicadosComRequisitos(dados);

        const badgeSelecionado = badgesAgrupados.find(
            (b) => Number(b.id) === Number(id)
        );

        const conquistadosRaw = Array.isArray(conquistadosRes.data)
            ? conquistadosRes.data
            : [];

        const conquistadosAgrupados =
            removerDuplicadosComRequisitos(conquistadosRaw);

        const badgeConquistado = conquistadosAgrupados.find(
            (b) => Number(b.id) === Number(id)
        );

        setConquistado(!!badgeConquistado);
        setConquistadoBadge(badgeConquistado || null);

        if (!badgeSelecionado) {
            setBadge(null);
            setRelacionados([]);
            return;
        }

        const relacionadosCalc = badgesAgrupados
            .filter((b) => {
            const mesmaArea =
                Number(b.id_areas) === Number(badgeSelecionado.id_areas) ||
                b.nome_area === badgeSelecionado.nome_area;

            return mesmaArea && Number(b.id) !== Number(badgeSelecionado.id);
            })
            .slice(0, 3);

        setBadge(badgeSelecionado);
        setRelacionados(relacionadosCalc);
        })
        .catch((err) => {
        console.error("Erro ao carregar detalhe do badge:", err);
        console.error("STATUS:", err.response?.status);
        console.error("BODY:", err.response?.data);
        })
        .finally(() => {
        setLoading(false);
        });
    }, [id, navigate]);

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
          <main style={{ flex: 1, padding: "28px 32px" }}>
            <Button
              variant="link"
              className="d-flex align-items-center text-decoration-none p-0 mb-2"
              style={{ color: "#4A5568", fontSize: "1.05rem" }}
              onClick={() => navigate(-1)}
            >
              <HiOutlineArrowLeft className="me-1" />
              <span>Voltar</span>
            </Button>

            <div className="text-muted mt-4">
              Badge não encontrado.
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

        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <Button
            variant="link"
            className="d-flex align-items-center text-decoration-none p-0 mb-2"
            style={{ color: "#4A5568", fontSize: "1.05rem" }}
            onClick={() => navigate(-1)}
          >
            <HiOutlineArrowLeft className="me-1" />
            <span>Voltar</span>
          </Button>

          <hr className="my-2" />

          <div style={heroCard}>
            <div style={heroIconWrap}>🏅</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginTop: 10 }}>
              {badge.nome}
            </div>
            {badge.nome_area && (
              <div style={{ fontSize: 13, color: "#4470AF", marginTop: 4 }}>
                {badge.nome_area}
              </div>
            )}
          </div>

          <div style={sectionCard}>
            <div style={sectionTitle}>Descrição</div>
            <p style={{ fontSize: 13, color: "#374151", marginTop: 8, marginBottom: 0, lineHeight: 1.65 }}>
              {badge.descricao || "Sem descrição disponível."}
            </p>
          </div>

          <NivelSelector nivelAtual={nivelParaLetra(badge.id_nivel)} />

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 10 }}>
              Requisitos do Nível
            </div>

            {badge.requisitos.length > 0 ? (
              badge.requisitos.map((req, i) => (
                <RequisitoRow key={`${req.id}-${i}`} req={req} defaultOpen={i === 0} />
              ))
            ) : (
              <div style={sectionCard}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  Sem requisitos registados para este badge.
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 32, flexWrap: "wrap" }}>
            {conquistado ? (
                <>
                <button style={actionBtn}>
                    <FaLinkedinIn size={16} color="#0077b5" style={{ marginRight: 8 }} />
                    Partilhar badge no LinkedIn
                </button>

                <button
                  style={actionBtn}
                  onClick={() => navigate(`/certificado/${badge.id}`)}
                >
                  <HiOutlineDownload size={17} style={{ marginRight: 8 }} />
                  Obter certificado
                </button>

                <button style={actionBtn}>
                    <HiOutlineMail size={17} style={{ marginRight: 8 }} />
                    Adicionar Badge à Assinatura
                </button>
                </>
            ) : (
                <button
                style={actionBtn}
                onClick={() => navigate(`/submeter-evidencias/${badge.id}`)}
                >
                <BiMedal size={18} style={{ marginRight: 8 }} />
                Submeter Evidências
                </button>
            )}
            </div>

          <hr />

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 14 }}>
              Badges Relacionados
            </div>

            {relacionados.length > 0 ? (
              relacionados.map((b) => (
                <RelatedBadgeRow
                  key={b.id}
                  badge={b}
                  onClick={() => navigate(`/badge-detalhe/${b.id}`)}
                />
              ))
            ) : (
              <div style={sectionCard}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  Sem badges relacionados.
                </span>
              </div>
            )}
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

function NivelSelector({ nivelAtual }) {
  return (
    <div style={sectionCard}>
      <div style={sectionTitle}>Nível</div>
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        {niveis.map((n) => (
          <div
            key={n}
            style={{
              ...nivelCircle,
              background: n === nivelAtual ? "#F5C518" : "#f0f0f0",
              border: n === nivelAtual ? "2px solid #e0a800" : "1.5px solid #d1d5db",
              color: n === nivelAtual ? "#7a5800" : "#374151",
              fontWeight: n === nivelAtual ? 700 : 500,
              boxShadow: n === nivelAtual ? "0 2px 8px rgba(245,197,24,0.35)" : "none",
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

function RequisitoRow({ req, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);

  return (
    <div style={requisitoCard}>
      <div style={requisitoHeader} onClick={() => setOpen((v) => !v)}>
        <div>
          <span style={{ fontWeight: 600, color: "#111827" }}>
            Requisito {req.id}
          </span>
          {" - "}
          <span style={{ color: "#4470AF", fontWeight: 500 }}>
            {req.titulo}
          </span>
        </div>

        {open ? (
          <BiChevronUp size={22} color="#6b7280" />
        ) : (
          <BiChevronDown size={22} color="#6b7280" />
        )}
      </div>

      {open && (
        <div style={requisitoBody}>
          <span style={{ fontWeight: 600 }}>{req.id}</span>
          {" - "}
          {req.descricao || "Sem descrição."}

          {req.link && (
            <div style={{ marginTop: 4 }}>
              <a href={req.link} target="_blank" rel="noreferrer" style={{ color: "#4470AF", fontSize: 13 }}>
                {req.link}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RelatedBadgeRow({ badge, onClick }) {
  return (
    <div style={{ ...relatedCard, cursor: "pointer" }} onClick={onClick}>
      <div style={relatedContent}>
        <div style={relatedIcon}>🏅</div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
            {badge.nome}
          </div>
          <div style={{ fontSize: 12, color: "#4470AF", marginTop: 2 }}>
            {badge.nome_area || "Área não definida"}
          </div>
        </div>

        <div style={pointsBox}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#374151" }}>
            Pontos
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>
            {badge.pontos || 0}
          </div>
        </div>
      </div>

      <div style={statusBar}>Ver detalhes</div>
    </div>
  );
}

function nivelParaLetra(idNivel) {
  const nivel = Number(idNivel);

  if (nivel === 1) return "A";
  if (nivel === 2) return "B";
  if (nivel === 3) return "C";
  if (nivel === 4) return "D";
  if (nivel === 5) return "E";

  return "";
}

const heroCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "28px 20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginBottom: 16,
};

const heroIconWrap = {
  width: 90,
  height: 90,
  borderRadius: "50%",
  background: "#eef3fb",
  border: "2px solid #dbe3ef",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 42,
};

const sectionCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "16px 20px",
  marginBottom: 16,
};

const sectionTitle = {
  fontSize: 15,
  fontWeight: 600,
  color: "#111827",
};

const nivelCircle = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  cursor: "default",
  transition: "all 0.15s",
};

const requisitoCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  marginBottom: 10,
  overflow: "hidden",
};

const requisitoHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 18px",
  cursor: "pointer",
  fontSize: 13,
  userSelect: "none",
};

const requisitoBody = {
  padding: "10px 18px 16px",
  fontSize: 13,
  color: "#374151",
  borderTop: "1px solid #e5e7eb",
  background: "#fafbff",
};

const actionBtn = {
  display: "flex",
  alignItems: "center",
  border: "1.5px solid #d1d5db",
  borderRadius: 999,
  padding: "9px 20px",
  fontSize: 14,
  fontWeight: 500,
  background: "white",
  color: "#374151",
  cursor: "pointer",
  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
};

const relatedCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  marginBottom: 14,
  overflow: "hidden",
};

const relatedContent = {
  padding: "14px 16px",
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const relatedIcon = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  background: "#eef6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 24,
  flexShrink: 0,
};

const pointsBox = {
  border: "1.5px solid #4470AF",
  borderRadius: 12,
  padding: "6px 10px",
  minWidth: 52,
  textAlign: "center",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
};

const statusBar = {
  borderTop: "1px solid #e5e7eb",
  textAlign: "center",
  padding: "6px 0",
  fontSize: 12,
  color: "#3b4a60",
  background: "#fbfdff",
};

export default BadgeDetailPage;