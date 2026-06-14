import { useEffect, useState } from "react";
import {
  BiArrowBack,
  BiEdit,
  BiSave,
  BiX,
  BiBook,
} from "react-icons/bi";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../services/api.js";
import Header from "../../components/header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

function normalizarNivel(n) {
  const requisitosLista =
    Array.isArray(n.requisitos)
      ? n.requisitos
      : Array.isArray(n.requisitosLista)
        ? n.requisitosLista
        : [];

  return {
    id:
      n.id_nivel ||
      n.ID_NIVEL ||
      n.id ||
      "",

    codigo:
      n.codigo_nivel ||
      n.CODIGO_NIVEL ||
      n.codigo ||
      "A",

    titulo:
      n.titulo_nivel ||
      n.TITULO_NIVEL ||
      n.titulo ||
      "",

    descricao:
      n.descricao_nivel ||
      n.DESCRICAO_NIVEL ||
      n.descricao ||
      "",

    requisitosLista,

    requisitos: requisitosLista.length,
  };
}

function EditarNivelModal({ nivel, loading, onClose, onSave }) {
  const [titulo, setTitulo] = useState(nivel.titulo);
  const [descricao, setDescricao] = useState(nivel.descricao);
  const [requisitos, setRequisitos] = useState([...nivel.requisitosLista]);
  const [novoRequisito, setNovoRequisito] = useState("");
  const [erro, setErro] = useState("");

  function adicionarRequisito() {
    const texto = novoRequisito.trim();

    if (!texto) return;

    setRequisitos((prev) => [...prev, texto]);
    setNovoRequisito("");
    setErro("");
  }

  function removerRequisito(index) {
    setRequisitos((prev) => prev.filter((_, i) => i !== index));
  }

  function atualizarRequisito(index, valor) {
    setRequisitos((prev) =>
      prev.map((req, i) => (i === index ? valor : req))
    );
  }

  function handleSave() {
    if (!titulo.trim()) {
      setErro("O título do nível é obrigatório.");
      return;
    }

    if (!descricao.trim()) {
      setErro("A descrição do nível é obrigatória.");
      return;
    }

    const requisitosLimpos = requisitos
      .map((r) => String(r).trim())
      .filter(Boolean);

    onSave(nivel.id, {
      titulo_nivel: titulo.trim(),
      descricao_nivel: descricao.trim(),
      requisitos: requisitosLimpos,
    });
  }

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

        <div style={modalIconBox}>
          <BiBook size={30} />
        </div>

        <h3 style={modalTitle}>
          Editar Nível {nivel.codigo}
        </h3>

        <p style={modalSubText}>
          Define o título, descrição e requisitos necessários para este nível.
        </p>

        {erro && <div style={errorBox}>{erro}</div>}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Título do nível</label>

          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Júnior"
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#2563eb";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#d1d5db";
            }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Descrição</label>

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreve o nível..."
            rows={3}
            style={textareaStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#2563eb";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#d1d5db";
            }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>
            Requisitos ({requisitos.length})
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {requisitos.map((req, i) => (
              <div key={i} style={requisitoRow}>
                <span style={requisitoNumber}>{i + 1}.</span>

                <input
                  value={req}
                  onChange={(e) => atualizarRequisito(i, e.target.value)}
                  style={requisitoInput}
                />

                <button
                  type="button"
                  onClick={() => removerRequisito(i)}
                  style={removeReqButton}
                >
                  <BiX size={16} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              value={novoRequisito}
              onChange={(e) => setNovoRequisito(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  adicionarRequisito();
                }
              }}
              placeholder="Adicionar novo requisito..."
              style={{ ...inputStyle, height: 38 }}
            />

            <button
              type="button"
              onClick={adicionarRequisito}
              style={addReqButton}
            >
              + Adicionar
            </button>
          </div>
        </div>

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
            onClick={handleSave}
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

function NivelCard({ nivel, onEditar }) {
  return (
    <div style={nivelCard}>
      <div style={nivelCodeBox}>
        {nivel.codigo}
      </div>

      <div style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>
        Nível {nivel.codigo} — {nivel.titulo || "Sem título"}
      </div>

      <div style={nivelDescription}>
        {nivel.descricao || "Sem descrição definida."}
      </div>

      <div style={nivelFooter}>
        <span style={{ fontSize: 13, color: "#374151" }}>
          Requisitos:{" "}
          <span style={{ color: "#2563eb", fontWeight: 700 }}>
            {nivel.requisitos} definidos
          </span>
        </span>

        <button onClick={() => onEditar(nivel)} style={editButton}>
          <BiEdit size={15} color="#2563eb" />
          Editar
        </button>
      </div>
    </div>
  );
}

function GestaoNiveis() {
  const navigate = useNavigate();
  const { areaId } = useParams();

  const [area, setArea] = useState(null);
  const [niveis, setNiveis] = useState([]);
  const [nivelEditando, setNivelEditando] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    carregarNiveis();
  }, [areaId]);

  async function carregarNiveis() {
    try {
      setIsLoading(true);
      setErro("");

      const res = await api.get(`/areas/${areaId}/niveis`);

      const dados = res.data;

      setArea(dados.area || null);

      const lista =
        Array.isArray(dados.niveis)
          ? dados.niveis
          : Array.isArray(dados)
            ? dados
            : [];

      setNiveis(lista.map(normalizarNivel));
    } catch (err) {
      console.error("Erro ao carregar níveis:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar os níveis desta área."
      );

      setNiveis([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveNivel(idNivel, dados) {
    try {
      setAGuardar(true);
      setErro("");
      setSucesso("");

      await api.put(`/niveis/${idNivel}`, dados);

      setNiveis((prev) =>
        prev.map((n) =>
          String(n.id) === String(idNivel)
            ? {
                ...n,
                titulo: dados.titulo_nivel,
                descricao: dados.descricao_nivel,
                requisitosLista: dados.requisitos,
                requisitos: dados.requisitos.length,
              }
            : n
        )
      );

      setNivelEditando(null);
      setSucesso("Nível atualizado com sucesso.");
    } catch (err) {
      console.error("Erro ao guardar nível:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível guardar o nível."
      );
    } finally {
      setAGuardar(false);
    }
  }

  function handleExcel() {
    alert("Exportar níveis para Excel será implementado depois.");
  }

  function handlePDF() {
    alert("Exportar níveis para PDF será implementado depois.");
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
          <button onClick={() => navigate("/admin/areas")} style={backButton}>
            <BiArrowBack size={16} />
            Voltar
          </button>

          <div style={pageHeader}>
            <div>
              <h5 style={pageTitle}>
                Gestão de Níveis
                {area?.nome_area && (
                  <>
                    {" "}
                    da Área:{" "}
                    <span style={{ color: "#2563eb" }}>
                      {area.nome_area}
                    </span>
                  </>
                )}
              </h5>

              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                Os níveis A, B, C, D e E são fixos. Edita apenas os requisitos e descrições.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleExcel} style={excelButton}>
                📊 Excel
              </button>

              <button onClick={handlePDF} style={pdfButton}>
                📄 PDF
              </button>
            </div>
          </div>

          {erro && <div style={errorBox}>{erro}</div>}
          {sucesso && <div style={successBox}>{sucesso}</div>}

          {isLoading ? (
            <div style={loadingBox}>A carregar níveis...</div>
          ) : niveis.length > 0 ? (
            <div style={gridNiveis}>
              {niveis.map((nivel) => (
                <NivelCard
                  key={nivel.id}
                  nivel={nivel}
                  onEditar={setNivelEditando}
                />
              ))}
            </div>
          ) : (
            <div style={loadingBox}>
              Esta área ainda não tem níveis criados.
            </div>
          )}
        </div>

        <AdminRightSidebar />
      </div>

      {nivelEditando && (
        <EditarNivelModal
          nivel={nivelEditando}
          loading={aGuardar}
          onClose={() => setNivelEditando(null)}
          onSave={handleSaveNivel}
        />
      )}
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

const pageHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 24,
  gap: 12,
  flexWrap: "wrap",
};

const pageTitle = {
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const gridNiveis = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
};

const nivelCard = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "22px 22px 18px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  minHeight: 175,
};

const nivelCodeBox = {
  width: 42,
  height: 42,
  borderRadius: 10,
  background: "#eff6ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  fontWeight: 900,
};

const nivelDescription = {
  fontSize: 13,
  color: "#6b7280",
  flex: 1,
  lineHeight: 1.5,
};

const nivelFooter = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 4,
  gap: 10,
};

const editButton = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  padding: "6px 14px",
  fontSize: 13,
  color: "#374151",
  cursor: "pointer",
  fontWeight: 500,
};

const excelButton = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "7px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const pdfButton = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "7px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
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
  maxWidth: 560,
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

const modalIconBox = {
  width: 64,
  height: 64,
  margin: "0 auto 14px",
  borderRadius: "50%",
  background: "#eff6ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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
  fontSize: 12,
  color: "#374151",
  fontWeight: 700,
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

const requisitoRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "7px 10px",
};

const requisitoNumber = {
  fontSize: 11,
  fontWeight: 700,
  color: "#2563eb",
  minWidth: 20,
};

const requisitoInput = {
  flex: 1,
  border: "none",
  background: "transparent",
  outline: "none",
  fontSize: 13,
  color: "#374151",
};

const removeReqButton = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#dc2626",
  padding: 2,
};

const addReqButton = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "0 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const modalActions = {
  display: "flex",
  gap: 10,
  justifyContent: "flex-end",
};

const cancelButton = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  padding: "8px 20px",
  fontSize: 13,
  color: "#374151",
  cursor: "pointer",
};

const saveButton = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  padding: "8px 20px",
  fontSize: 13,
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};

export default GestaoNiveis;