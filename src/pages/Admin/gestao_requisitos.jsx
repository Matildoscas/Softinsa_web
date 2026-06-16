import { useEffect, useState } from "react";
import {
  BiArrowBack,
  BiEdit,
  BiSave,
  BiX,
  BiLinkExternal,
} from "react-icons/bi";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../services/api.js";
import Header from "../../components/Header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

function normalizarRequisito(r) {
  return {
    id:
      r.id_requisitos ||
      r.ID_REQUISITOS ||
      r.id ||
      "",

    nome_requisito:
      r.nome_requisito ||
      r.NOME_REQUISITO ||
      "",

    titulo:
      r.titulo ||
      r.TITULO ||
      "",

    descricao_requisito:
      r.descricao_requisito ||
      r.DESCRICAO_REQUISITO ||
      "",

    tipo_requisito:
      r.tipo_requisito ||
      r.TIPO_REQUISITO ||
      "",

    links: Array.isArray(r.links)
      ? r.links.map((l) => ({
          id_link: l.id_link || l.ID_LINK || "",
          url: l.url || l.URL || l,
        }))
      : [],
  };
}

function RequisitoCard({ requisito, aberto, onToggle }) {
  return (
    <div style={reqCard}>
      <div style={reqHeader} onClick={onToggle}>
        <div>
          <div style={reqTitle}>
            {requisito.nome_requisito} - {requisito.titulo}
          </div>

          {!aberto && (
            <div style={reqShortDescription}>
              {requisito.descricao_requisito}
            </div>
          )}
        </div>

        <span style={{ color: "#64748b", fontSize: 18 }}>
          {aberto ? "⌃" : "⌄"}
        </span>
      </div>

      {aberto && (
        <div style={reqBody}>
          <div style={reqDescription}>
            <strong>{requisito.nome_requisito}</strong> -{" "}
            {requisito.descricao_requisito}
          </div>

          {requisito.links.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {requisito.links.map((link, index) => (
                <div key={link.id_link || index}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={reqLink}
                  >
                    <BiLinkExternal size={13} />
                    {link.url}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function normalizarBadge(b) {
  return {
    id:
      b.id_badge_modelo ||
      b.ID_BADGE_MODELO ||
      b.id ||
      "",

    nome:
      b.nome_badge ||
      b.NOME_BADGE ||
      b.nome ||
      "Badge sem nome",

    descricao:
      b.descricao_badge_modelo ||
      b.DESCRICAO_BADGE_MODELO ||
      b.descricao ||
      "Sem descrição.",

    pontos: Number(b.pontos || b.PONTOS || 0),

    numero_requisitos: Number(
      b.numero_requisitos ||
        b.NUMERO_REQUISITOS ||
        0
    ),

    id_nivel:
      b.id_nivel ||
      b.ID_NIVEL ||
      null,

    codigo_nivel:
      b.codigo_nivel ||
      b.CODIGO_NIVEL ||
      "",

    requisitos: Array.isArray(b.requisitos)
      ? b.requisitos
      : [],
  };
}

function GestaoRequisitos() {
  const navigate = useNavigate();
  const { idNivel } = useParams();

  const [area, setArea] = useState(null);
  const [nivel, setNivel] = useState(null);
  const [badge, setBadge] = useState(null);
  const [requisitos, setRequisitos] = useState([]);
  const [abertos, setAbertos] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [badgesDisponiveis, setBadgesDisponiveis] = useState([]);
  const [modalBadgeAberta, setModalBadgeAberta] = useState(false);
  const [badgeSelecionadoId, setBadgeSelecionadoId] = useState("");
  const [aGuardarBadge, setAGuardarBadge] = useState(false);

  function codigoNivelAtual() {
    const nome = String(nivel?.nome_nivel || "").trim().toUpperCase();

    if (nome === "A") return "A";
    if (nome === "B") return "B";
    if (nome === "C") return "C";
    if (nome === "D") return "D";
    if (nome === "E") return "E";

    return "";
    }

    const badgesDoNivel = badgesDisponiveis.filter((b) => {
    return String(b.codigo_nivel || "").toUpperCase() === codigoNivelAtual();
    });

  useEffect(() => {
    carregarDados();
  }, [idNivel]);

    async function carregarDados() {
    try {
        setIsLoading(true);
        setErro("");

        const [reqRes, badgesRes] = await Promise.all([
        api.get(`/niveis/${idNivel}/requisitos`),
        api.get("/badges/modelos-disponiveis"),
        ]);

        const dados = reqRes.data;

        setArea(dados.area || null);
        setNivel(dados.nivel || null);
        setBadge(dados.badge || null);

        const lista = Array.isArray(dados.requisitos)
        ? dados.requisitos.map(normalizarRequisito)
        : [];

        setRequisitos(lista);

        if (lista.length > 0) {
        setAbertos({ [lista[0].id]: true });
        }

        const badgesData = badgesRes.data;

        const listaBadges =
        Array.isArray(badgesData)
            ? badgesData
            : Array.isArray(badgesData.badges)
            ? badgesData.badges
            : Array.isArray(badgesData.data)
                ? badgesData.data
                : [];

        setBadgesDisponiveis(listaBadges.map(normalizarBadge));
    } catch (err) {
        console.error("Erro ao carregar requisitos:", err);
        console.error("STATUS:", err.response?.status);
        console.error("BODY:", err.response?.data);

        setErro(
        err.response?.data?.error ||
            "Não foi possível carregar os requisitos."
        );
    } finally {
        setIsLoading(false);
    }
    }

    async function guardarAlteracaoBadge() {
    if (!badgeSelecionadoId) {
        setErro("Seleciona um badge modelo.");
        return;
    }

    try {
        setAGuardarBadge(true);
        setErro("");
        setSucesso("");

        await api.put(`/niveis/${idNivel}/badge`, {
        id_badge_modelo: Number(badgeSelecionadoId),
        });

        setSucesso("Badge do nível atualizado com sucesso.");
        setModalBadgeAberta(false);
        setBadgeSelecionadoId("");

        await carregarDados();
    } catch (err) {
        console.error("Erro ao alterar badge do nível:", err);
        console.error("STATUS:", err.response?.status);
        console.error("BODY:", err.response?.data);

        setErro(
        err.response?.data?.error ||
            "Não foi possível alterar o badge deste nível."
        );
    } finally {
        setAGuardarBadge(false);
    }
    }

  function toggleRequisito(id) {
    setAbertos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  return (
    <div
      style={{
        backgroundColor: "#f0f2f5",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <AdminLeftSidebar />

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 24,
            minWidth: 0,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={backButton}
          >
            <BiArrowBack size={16} />
            Voltar
          </button>

          {erro && <div style={errorBox}>{erro}</div>}
          {sucesso && <div style={successBox}>{sucesso}</div>}

          {isLoading ? (
            <div style={loadingBox}>A carregar requisitos...</div>
          ) : (
            <>
              <div style={pageHeader}>
                <div>
                  <div style={breadcrumb}>
                    Gestão da Área:{" "}
                    <span style={{ color: "#2563eb", fontWeight: 700 }}>
                      {area?.nome_area || "Área"}
                    </span>
                  </div>

                  <h5 style={pageTitle}>
                    Gestão do Nível:{" "}
                    {badge?.nome_badge || `Nível ${nivel?.nome_nivel || ""}`}
                  </h5>

                  <div style={{ fontSize: 13, color: "#374151" }}>
                    Abaixo pode visualizar todos os requisitos associados ao badge deste nível.
                  </div>
                </div>
              </div>

                <div style={nivelInfoCard}>
                <div>
                    <h5 style={nivelInfoTitle}>
                    Nível {nivel?.nome_nivel} - {badge?.nome_badge || "Sem badge associado"}
                    </h5>

                    <div style={nivelInfoDescription}>
                    {badge?.descricao_badge_modelo || "Sem descrição."}
                    </div>

                    <div style={pointsLine}>
                    Pontos Atribuídos:{" "}
                    <span>{badge?.pontos || 0} pts</span>
                    </div>

                    <button
                    type="button"
                    onClick={() => {
                        setBadgeSelecionadoId("");
                        setModalBadgeAberta(true);
                    }}
                    style={editInfoButton}
                    >
                    <BiEdit size={15} />
                    Alterar badge aplicado
                    </button>
                </div>
                </div>

              <div style={sectionReqHeader}>
                <h5 style={sectionReqTitle}>Requisitos do Nível</h5>
              </div>

                {requisitos.length > 0 ? (
                requisitos.map((req) => (
                    <RequisitoCard
                    key={req.id}
                    requisito={req}
                    aberto={!!abertos[req.id]}
                    onToggle={() => toggleRequisito(req.id)}
                    />
                ))
                ) : (
                <div style={loadingBox}>
                    Este badge ainda não tem requisitos associados.
                </div>
                )}
            </>
          )}
        </div>

        <AdminRightSidebar />
      </div>
      {modalBadgeAberta && (
        <AlterarBadgeModal
            badges={badgesDoNivel}
            value={badgeSelecionadoId}
            loading={aGuardarBadge}
            onChange={setBadgeSelecionadoId}
            onClose={() => {
            if (aGuardarBadge) return;
            setModalBadgeAberta(false);
            setBadgeSelecionadoId("");
            }}
            onSave={guardarAlteracaoBadge}
        />
        )}
    </div>
  );
}

function AlterarBadgeModal({
  badges,
  value,
  loading,
  onChange,
  onClose,
  onSave,
}) {
  const badgeSelecionado = badges.find(
    (b) => String(b.id) === String(value)
  );

  return (
    <div style={modalOverlay}>
      <div style={modalCard}>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          style={modalCloseButton}
        >
          <BiX size={22} />
        </button>

        <h3 style={modalTitle}>Alterar badge aplicado</h3>

        <p style={modalSubText}>
          Escolhe outro badge modelo para este nível. Os requisitos e links
          serão atualizados automaticamente.
        </p>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Badge modelo</label>

          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyle}
          >
            <option value="">Selecionar badge</option>

            {badges.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome} — {b.pontos} pts
              </option>
            ))}
          </select>
        </div>

        {badges.length === 0 && (
          <div style={errorBox}>
            Não existem badges disponíveis para este nível.
          </div>
        )}

        {badgeSelecionado && (
          <div style={badgePreviewBox}>
            <div style={badgePreviewTitle}>
              {badgeSelecionado.nome}
            </div>

            <div style={badgePreviewDescription}>
              {badgeSelecionado.descricao}
            </div>

            <div style={badgePreviewMeta}>
              Pontos: <strong>{badgeSelecionado.pontos}</strong> ·
              Requisitos:{" "}
              <strong>{badgeSelecionado.requisitos.length}</strong>
            </div>
          </div>
        )}

        <div style={modalActions}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={cancelButton}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            style={{
              ...saveButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <BiSave size={15} />
            {loading ? "A guardar..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const backButton = {
  background: "none",
  border: "none",
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#2563eb",
  fontSize: 13,
  cursor: "pointer",
  marginBottom: 16,
  padding: 0,
};

const breadcrumb = {
  fontSize: 12,
  color: "#9ca3af",
  marginBottom: 4,
};

const pageHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 20,
};

const pageTitle = {
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const nivelInfoCard = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "22px 24px",
  marginBottom: 32,
};

const nivelInfoTitle = {
  margin: "0 0 4px",
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
};

const nivelInfoDescription = {
  fontSize: 13,
  color: "#64748b",
  lineHeight: 1.5,
  marginBottom: 14,
};

const pointsLine = {
  fontSize: 16,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 14,
};

const editInfoButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  background: "#eff6ff",
  color: "#2563eb",
  border: "none",
  borderRadius: 8,
  padding: "9px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const sectionReqHeader = {
  marginBottom: 12,
};

const sectionReqTitle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
};

const reqCard = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  marginBottom: 14,
  overflow: "hidden",
};

const reqHeader = {
  padding: "16px 18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  cursor: "pointer",
};

const reqTitle = {
  fontSize: 15,
  fontWeight: 800,
  color: "#374151",
};

const reqShortDescription = {
  fontSize: 13,
  color: "#64748b",
  marginTop: 6,
};

const reqBody = {
  padding: "0 18px 16px",
};

const reqDescription = {
  fontSize: 13,
  color: "#374151",
  lineHeight: 1.6,
};

const reqLink = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  color: "#2563eb",
  fontSize: 13,
  textDecoration: "underline",
  wordBreak: "break-all",
};

const reqActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 12,
};

const editButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "#eff6ff",
  color: "#2563eb",
  border: "none",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 13,
  cursor: "pointer",
};

const deleteButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "#fef2f2",
  color: "#dc2626",
  border: "none",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 13,
  cursor: "pointer",
};

const addReqMainButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "11px 24px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 10,
};

const loadingBox = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  color: "#6b7280",
  textAlign: "center",
};

const errorBox = {
  background: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: "10px 12px",
  color: "#991b1b",
  fontSize: 13,
  marginBottom: 16,
};

const successBox = {
  background: "#dcfce7",
  border: "1px solid #bbf7d0",
  borderRadius: 10,
  padding: "10px 12px",
  color: "#166534",
  fontSize: 13,
  marginBottom: 16,
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: 20,
};

const modalCard = {
  position: "relative",
  width: "100%",
  maxWidth: 620,
  background: "white",
  borderRadius: 18,
  padding: "28px 28px 24px",
  boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
  border: "1px solid #e5e7eb",
};

const modalCloseButton = {
  position: "absolute",
  top: 14,
  right: 14,
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "1px solid #e5e7eb",
  background: "white",
  color: "#6b7280",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const modalTitle = {
  fontSize: 20,
  fontWeight: 800,
  color: "#111827",
  margin: "0 0 6px",
  textAlign: "center",
};

const modalSubText = {
  fontSize: 13,
  color: "#6b7280",
  margin: "0 0 18px",
  lineHeight: 1.5,
  textAlign: "center",
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: "#111827",
  display: "block",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  height: 40,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "0 12px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyle = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: 10,
  fontSize: 14,
  resize: "vertical",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const twoColumns = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const linkRow = {
  display: "flex",
  gap: 8,
  marginBottom: 8,
};

const smallDangerButton = {
  width: 38,
  height: 40,
  border: "none",
  borderRadius: 8,
  background: "#fee2e2",
  color: "#dc2626",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

const addLinkButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "white",
  color: "#2563eb",
  border: "1px dashed #93c5fd",
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const cancelButton = {
  border: "1px solid #d1d5db",
  background: "white",
  color: "#374151",
  borderRadius: 10,
  padding: "9px 15px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const saveButton = {
  border: "none",
  background: "#2563eb",
  color: "white",
  borderRadius: 10,
  padding: "9px 15px",
  fontSize: 13,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
};

const dangerIconBox = {
  width: 68,
  height: 68,
  margin: "0 auto 16px",
  borderRadius: "50%",
  background: "#fee2e2",
  color: "#dc2626",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const deleteConfirmButton = {
  border: "none",
  background: "#dc2626",
  color: "white",
  borderRadius: 10,
  padding: "9px 15px",
  fontSize: 13,
  fontWeight: 700,
};

const badgePreviewBox = {
  marginTop: 14,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 12,
};

const badgePreviewTitle = {
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 4,
};

const badgePreviewDescription = {
  fontSize: 12,
  color: "#6b7280",
  lineHeight: 1.5,
  marginBottom: 8,
};

const badgePreviewMeta = {
  fontSize: 12,
  color: "#374151",
};

export default GestaoRequisitos;