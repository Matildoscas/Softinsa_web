import { useState, useEffect } from "react";
import { Button, Spinner, Form } from "react-bootstrap";
import {
  HiOutlineArrowLeft,
  HiOutlineUpload,
  HiOutlineTrash,
} from "react-icons/hi";
import { BiChevronUp, BiChevronDown, BiMedal } from "react-icons/bi";
import { useNavigate, useLocation, useParams } from "react-router-dom";

import Header from "../../components/header.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import api from "../../services/api.js";
import BadgeImage from "../../components/badge_image.jsx";

const niveis = ["A", "B", "C", "D", "E"];

function SubmeterEvidenciasPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const idLembrete = location.state?.idLembrete ?? null;

  const voltarPara = location.state?.voltarPara || "/catalogo-badges";

  const textoVoltar = location.state?.textoVoltar || "Voltar";
  const { id } = useParams();

  const [badge, setBadge] = useState(null);
  const [ficheirosPorRequisito, setFicheirosPorRequisito] = useState({});
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(true);
  const [submeterLoading, setSubmeterLoading] = useState(false);

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
        const idRequisito =
          linha.id_requisito || linha.id_requisitos || linha.id;

        const requisitosAtuais = mapa.get(badgeId).requisitos;

        const requisitoJaExiste = requisitosAtuais.some(
          (requisito) => String(requisito.id_requisito) === String(idRequisito),
        );

        if (!requisitoJaExiste) {
          requisitosAtuais.push({
            id_requisito: idRequisito,

            titulo: linha.titulo || linha.nome_requisito || "Requisito",

            nome: linha.nome_requisito || linha.titulo || "Requisito",

            descricao: linha.descricao_requisito || "",

            link: linha.link_requisito || linha.link || "",
          });
        }
      }
    });

    return Array.from(mapa.values());
  };

  useEffect(() => {
    setLoading(true);

    api
      .get("/badges/todos")
      .then((res) => {
        const dados = Array.isArray(res.data) ? res.data : [];
        const badgesAgrupados = removerDuplicadosComRequisitos(dados);

        const selecionado = badgesAgrupados.find(
          (b) => Number(b.id) === Number(id),
        );

        setBadge(selecionado || null);
      })
      .catch((err) => {
        console.error("Erro ao carregar badge:", err);
        console.error("STATUS:", err.response?.status);
        console.error("BODY:", err.response?.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const adicionarFicheiros = (requisitoKey, files) => {
    const novos = Array.from(files || []);

    setFicheirosPorRequisito((prev) => ({
      ...prev,
      [requisitoKey]: [...(prev[requisitoKey] || []), ...novos],
    }));
  };

  const removerFicheiro = (requisitoKey, index) => {
    setFicheirosPorRequisito((prev) => ({
      ...prev,
      [requisitoKey]: (prev[requisitoKey] || []).filter((_, i) => i !== index),
    }));
  };

  const totalFicheiros = Object.values(ficheirosPorRequisito).reduce(
    (total, lista) => total + lista.length,
    0,
  );

  const temRequisitos =
    Array.isArray(badge?.requisitos) && badge.requisitos.length > 0;

  const podeSubmeter =
    temRequisitos &&
    badge.requisitos.every((req, index) => {
      const requisitoKey = getRequisitoKey(req, index);

      return (ficheirosPorRequisito[requisitoKey] || []).length > 0;
    });

  const submeterEvidencias = async () => {
    if (!badge) {
      return;
    }

    if (!podeSubmeter) {
      alert("Tem de anexar pelo menos um ficheiro em cada requisito.");

      return;
    }

    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    let userData;

    try {
      userData = JSON.parse(storedUser);
    } catch (err) {
      console.error("Erro ao ler utilizador:", err);

      navigate("/login", {
        replace: true,
      });

      return;
    }

    const userId =
      userData.id_utilizador || userData.ID_UTILIZADOR || userData.id;

    if (!userId) {
      alert("Não foi possível identificar o utilizador.");

      return;
    }

    const formData = new FormData();

    formData.append("id_utilizador", userId);

    formData.append("id_badge_modelo", badge.id);

    formData.append("comentario", comentario);

    if (idLembrete) {
      formData.append("id_lembrete", String(idLembrete));
    }

    badge.requisitos.forEach((req, index) => {
      const requisitoKey = getRequisitoKey(req, index);

      const ficheiros = ficheirosPorRequisito[requisitoKey] || [];

      ficheiros.forEach((file) => {
        formData.append("ficheiros", file);

        formData.append(
          "metadados",
          JSON.stringify({
            requisito_key: requisitoKey,

            id_requisito: req.id_requisito || req.id_requisitos || null,

            titulo: req.titulo,

            nome: req.nome,

            descricao: req.descricao || "",

            ficheiro_nome: file.name,
          }),
        );
      });
    });

    try {
      setSubmeterLoading(true);

      const response = await api.post(
        "/candidaturas/submeter-evidencias",
        formData,
      );

      console.log("Candidatura submetida:", response.data);

      alert(
        idLembrete
          ? "Evidências submetidas. O objetivo está agora em validação."
          : "Evidências submetidas com sucesso.",
      );

      navigate(voltarPara, {
        replace: true,
      });
    } catch (err) {
      console.error("Erro ao submeter evidências:", err);

      console.error("STATUS:", err.response?.status);

      console.error("BODY:", err.response?.data);

      alert(err.response?.data?.error || "Erro ao submeter evidências.");
    } finally {
      setSubmeterLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!badge) {
    return (
      <div
        style={{
          backgroundColor: "#f7f7f7",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header />

        <div style={{ display: "flex", flex: 1 }}>
          <LeftSidebar />

          <main style={{ flex: 1, padding: "28px 32px" }}>
            <Button
              variant="link"
              className="d-flex align-items-center text-decoration-none p-0 mb-2"
              style={{ color: "#4A5568", fontSize: "1.05rem" }}
              onClick={() => navigate(voltarPara)}
            >
              <HiOutlineArrowLeft className="me-1" />
              <span>{textoVoltar}</span>
            </Button>

            <div className="text-muted mt-4">Badge não encontrado.</div>
          </main>

          <RightSidebar />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#f7f7f7",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <LeftSidebar />

        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <Button
            variant="link"
            className="d-flex align-items-center text-decoration-none p-0 mb-2"
            style={{ color: "#4A5568", fontSize: "1.05rem" }}
            onClick={() => navigate(voltarPara)}
          >
            <HiOutlineArrowLeft className="me-1" />
            <span>{textoVoltar}</span>
          </Button>

          <hr className="my-2" />

          <div style={heroCard}>
            <BadgeImage badge={badge} nome={badge.nome} size={72} />

            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#111827",
                marginTop: 10,
              }}
            >
              Submeter Evidências
            </div>

            <div style={{ fontSize: 14, color: "#4470AF", marginTop: 4 }}>
              {badge.nome}
            </div>

            {badge.nome_area && (
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                {badge.nome_area}
              </div>
            )}
          </div>

          <div style={sectionCard}>
            <div style={sectionTitle}>Descrição</div>
            <p
              style={{
                fontSize: 13,
                color: "#374151",
                marginTop: 8,
                marginBottom: 0,
                lineHeight: 1.65,
              }}
            >
              Anexe as evidências necessárias para cada requisito do badge. Cada
              requisito deve ter pelo menos um ficheiro associado.
            </p>
          </div>

          <NivelSelector nivelAtual={nivelParaLetra(badge.id_nivel)} />

          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#111827",
                marginBottom: 10,
              }}
            >
              Requisitos e Evidências
            </div>

            {badge.requisitos.length > 0 ? (
              badge.requisitos.map((req, index) => {
                const requisitoKey = getRequisitoKey(req, index);

                return (
                  <RequisitoUploadRow
                    key={requisitoKey}
                    req={req}
                    requisitoKey={requisitoKey}
                    ficheiros={ficheirosPorRequisito[requisitoKey] || []}
                    onAddFiles={(files) =>
                      adicionarFicheiros(requisitoKey, files)
                    }
                    onRemoveFile={(fileIndex) =>
                      removerFicheiro(requisitoKey, fileIndex)
                    }
                    defaultOpen={index === 0}
                  />
                );
              })
            ) : (
              <div style={sectionCard}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  Sem requisitos registados para este badge.
                </span>
              </div>
            )}
          </div>

          <div style={sectionCard}>
            <div style={sectionTitle}>Comentário geral</div>

            <Form.Control
              as="textarea"
              rows={3}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Escreva uma observação geral sobre a candidatura..."
              style={{
                marginTop: 10,
                borderRadius: 10,
                fontSize: 13,
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 14,
              marginBottom: 32,
              flexWrap: "wrap",
            }}
          >
            <button
              style={{
                ...actionBtn,

                opacity: submeterLoading || !podeSubmeter ? 0.55 : 1,

                cursor:
                  submeterLoading || !podeSubmeter ? "not-allowed" : "pointer",
              }}
              disabled={submeterLoading || !podeSubmeter}
              onClick={submeterEvidencias}
            >
              <HiOutlineUpload size={18} style={{ marginRight: 8 }} />
              {submeterLoading
                ? "A submeter..."
                : `Submeter Evidências (${totalFicheiros})`}
            </button>
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
              border:
                n === nivelAtual ? "2px solid #e0a800" : "1.5px solid #d1d5db",
              color: n === nivelAtual ? "#7a5800" : "#374151",
              fontWeight: n === nivelAtual ? 700 : 500,
              boxShadow:
                n === nivelAtual ? "0 2px 8px rgba(245,197,24,0.35)" : "none",
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

function RequisitoUploadRow({
  req,
  requisitoKey,
  ficheiros,
  onAddFiles,
  onRemoveFile,
  defaultOpen,
}) {
  const [open, setOpen] = useState(defaultOpen || false);

  return (
    <div style={requisitoCard}>
      <div style={requisitoHeader} onClick={() => setOpen((v) => !v)}>
        <div>
          <span style={{ fontWeight: 600, color: "#111827" }}>
            Requisito {req.titulo}
          </span>
          {" - "}
          <span style={{ color: "#4470AF", fontWeight: 500 }}>{req.nome}</span>
        </div>

        {open ? (
          <BiChevronUp size={22} color="#6b7280" />
        ) : (
          <BiChevronDown size={22} color="#6b7280" />
        )}
      </div>

      {open && (
        <div style={requisitoBody}>
          <div style={{ fontSize: 13, color: "#374151", marginBottom: 10 }}>
            {req.descricao || "Sem descrição."}
          </div>

          {req.link && (
            <div style={{ marginBottom: 10 }}>
              <a
                href={req.link}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#4470AF", fontSize: 13 }}
              >
                {req.link}
              </a>
            </div>
          )}

          <label style={uploadBox}>
            <HiOutlineUpload size={20} />
            <span>Adicionar ficheiros a este requisito</span>

            <input
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                onAddFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          {ficheiros.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {ficheiros.map((file, index) => (
                <div key={`${file.name}-${index}`} style={fileRow}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#111827",
                      }}
                    >
                      {file.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveFile(index)}
                    style={removeFileBtn}
                  >
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {ficheiros.length === 0 && (
            <div style={{ fontSize: 12, color: "#D32F2F", marginTop: 8 }}>
              Este requisito ainda não tem ficheiros anexados.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getRequisitoKey(req, index) {
  return String(
    req.id_requisito || req.id_requisitos || req.titulo || req.nome || index,
  );
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

const uploadBox = {
  border: "1.5px dashed #9ca3af",
  borderRadius: 12,
  padding: "14px 16px",
  background: "white",
  color: "#374151",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontSize: 13,
  fontWeight: 500,
};

const fileRow = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "10px 12px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 8,
};

const removeFileBtn = {
  border: "none",
  background: "#FFEBEE",
  color: "#D32F2F",
  borderRadius: 8,
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
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

function nivelParaLetra(idNivel) {
  const nivel = Number(idNivel);

  if (nivel === 1) return "A";
  if (nivel === 2) return "B";
  if (nivel === 3) return "C";
  if (nivel === 4) return "D";
  if (nivel === 5) return "E";

  return "";
}

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

export default SubmeterEvidenciasPage;
