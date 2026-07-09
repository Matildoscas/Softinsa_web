import { useEffect, useState } from "react";
import {
  BiArrowBack,
  BiChevronDown,
  BiSave,
} from "react-icons/bi";
import { useNavigate } from "react-router-dom";

import api from "../../services/api.js";
import Header from "../../components/header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

function normalizarEstado(valor) {
  const v = String(valor || "").trim().toUpperCase();

  if (v === "ATIVO" || v === "ATIVA" || v === "ONLINE") return "ATIVO";
  if (v === "INATIVO" || v === "INATIVA" || v === "OFFLINE") return "INATIVO";

  return "ATIVO";
}

function MultiSelectDropdown({
  options,
  values,
  onChange,
  placeholder,
  erro,
}) {
  const [aberto, setAberto] = useState(false);

  const selecionadas = options.filter((opt) =>
    values.map(String).includes(String(opt.id))
  );

  function toggleOption(id) {
    const idString = String(id);
    const jaExiste = values.map(String).includes(idString);

    if (jaExiste) {
      onChange(values.filter((v) => String(v) !== idString));
    } else {
      onChange([...values, id]);
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setAberto((v) => !v)}
        style={{
          minHeight: 42,
          border: `1px solid ${
            erro ? "#fca5a5" : aberto ? "#2563eb" : "#d1d5db"
          }`,
          borderRadius: 8,
          padding: "7px 36px 7px 12px",
          cursor: "pointer",
          background: "white",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 6,
          fontSize: 14,
          color: selecionadas.length > 0 ? "#111827" : "#9ca3af",
          position: "relative",
          userSelect: "none",
        }}
      >
        {selecionadas.length > 0 ? (
          selecionadas.map((sl) => (
            <span key={sl.id} style={selectedTag}>
              {sl.nome}
            </span>
          ))
        ) : (
          <span>{placeholder}</span>
        )}

        <span
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "#6b7280",
          }}
        >
          <BiChevronDown
            size={18}
            style={{
              transform: aberto ? "rotate(180deg)" : "none",
              transition: "0.2s",
            }}
          />
        </span>
      </div>

      {aberto && (
        <div style={dropdownBox}>
          <div style={{ maxHeight: 240, overflowY: "auto" }}>
            {options.length > 0 ? (
              options.map((opt) => {
                const ativo = values.map(String).includes(String(opt.id));

                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    style={{
                      padding: "10px 14px",
                      fontSize: 13,
                      color: "#374151",
                      cursor: "pointer",
                      background: ativo ? "#eff6ff" : "transparent",
                      fontWeight: ativo ? 700 : 400,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <span>{opt.nome}</span>
                    {ativo && <span style={{ color: "#2563eb" }}>✓</span>}
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#9ca3af",
                }}
              >
                Sem Service Lines disponíveis.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CriarLearningPath() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    estado: "ATIVO",
  });

  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [isLoadingDados, setIsLoadingDados] = useState(true);
  const [aCriar, setACriar] = useState(false);

  const set = (field) => (value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErros((prev) => ({
      ...prev,
      [field]: "",
    }));

    setErroGeral("");
    setSucesso("");
  };

  function validar() {
    const novosErros = {};

    if (!form.nome.trim()) {
      novosErros.nome = "O nome é obrigatório.";
    }

    if (!form.descricao.trim()) {
      novosErros.descricao = "A descrição é obrigatória.";
    }

    setErros(novosErros);

    return Object.keys(novosErros).length === 0;
  }

  async function handleCriar() {
    if (!validar()) return;

    try {
      setACriar(true);
      setErroGeral("");
      setSucesso("");

      await api.post("/learningpaths", {
        nome_learningpaths: form.nome.trim(),
        descricao_learningpaths: form.descricao.trim(),
        estado_learningpath: normalizarEstado(form.estado),
      });

      setSucesso("Learning Path criado com sucesso.");

      setTimeout(() => {
        navigate("/admin/learning-paths");
      }, 900);
    } catch (err) {
      console.error("Erro ao criar Learning Path:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErroGeral(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Não foi possível criar o Learning Path."
      );
    } finally {
      setACriar(false);
    }
  }

  function handleCancelar() {
    navigate("/admin/learning-paths");
  }

  const inputStyle = (campo) => ({
    width: "100%",
    border: `1px solid ${erros[campo] ? "#fca5a5" : "#d1d5db"}`,
    borderRadius: 8,
    padding: "0 14px",
    fontSize: 14,
    color: "#111827",
    background: "white",
    outline: "none",
    height: 42,
    boxSizing: "border-box",
  });

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
          <button onClick={handleCancelar} style={backButton}>
            <BiArrowBack size={16} />
            Voltar
          </button>

          <div style={pageHeader}>
            <div>
              <h5 style={pageTitle}>Criar Learning Path</h5>

              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                Preenche os dados base do Learning Path. As Service Lines serão associadas na criação de Service Lines.
              </div>
            </div>
          </div>

          {erroGeral && <div style={errorBox}>{erroGeral}</div>}
          {sucesso && <div style={successBox}>{sucesso}</div>}


              <div style={formCard}>
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>
                    Nome do Learning Path <span style={required}>*</span>
                  </label>

                  <input
                    value={form.nome}
                    onChange={(e) => set("nome")(e.target.value)}
                    placeholder="Ex: Frontend Developer"
                    style={inputStyle("nome")}
                    onFocus={(e) => {
                      if (!erros.nome) e.target.style.borderColor = "#2563eb";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = erros.nome
                        ? "#fca5a5"
                        : "#d1d5db";
                    }}
                  />

                  {erros.nome && <div style={fieldError}>{erros.nome}</div>}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>
                    Descrição <span style={required}>*</span>
                  </label>

                  <textarea
                    value={form.descricao}
                    onChange={(e) => set("descricao")(e.target.value)}
                    placeholder="Descreve o Learning Path..."
                    rows={5}
                    style={{
                      width: "100%",
                      border: `1px solid ${
                        erros.descricao ? "#fca5a5" : "#d1d5db"
                      }`,
                      borderRadius: 8,
                      padding: 14,
                      fontSize: 14,
                      color: "#111827",
                      resize: "vertical",
                      outline: "none",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      lineHeight: 1.6,
                    }}
                    onFocus={(e) => {
                      if (!erros.descricao) {
                        e.target.style.borderColor = "#2563eb";
                      }
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = erros.descricao
                        ? "#fca5a5"
                        : "#d1d5db";
                    }}
                  />

                  {erros.descricao && (
                    <div style={fieldError}>{erros.descricao}</div>
                  )}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Estado</label>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => set("estado")("INATIVO")}
                      style={{
                        ...statusButton,
                        background:
                          form.estado === "INATIVO" ? "#fee2e2" : "white",
                        color:
                          form.estado === "INATIVO" ? "#b91c1c" : "#6b7280",
                        border:
                          form.estado === "INATIVO"
                            ? "1.5px solid #fca5a5"
                            : "1.5px solid #d1d5db",
                      }}
                    >
                      Inativo
                    </button>

                    <button
                      type="button"
                      onClick={() => set("estado")("ATIVO")}
                      style={{
                        ...statusButton,
                        background:
                          form.estado === "ATIVO" ? "#16a34a" : "white",
                        color: form.estado === "ATIVO" ? "white" : "#6b7280",
                        border:
                          form.estado === "ATIVO"
                            ? "1.5px solid #16a34a"
                            : "1.5px solid #d1d5db",
                      }}
                    >
                      Ativo
                    </button>
                  </div>
                </div>
              </div>

              <div style={actionsRow}>
                <button
                  onClick={handleCancelar}
                  disabled={aCriar}
                  style={cancelButton}
                >
                  Cancelar
                </button>

                <button
                  onClick={handleCriar}
                  disabled={aCriar}
                  style={{
                    ...saveButton,
                    opacity: aCriar ? 0.7 : 1,
                    cursor: aCriar ? "not-allowed" : "pointer",
                  }}
                >
                  <BiSave size={17} />
                  {aCriar ? "A criar..." : "Criar Learning Path"}
                </button>
              </div>
        </div>

        <AdminRightSidebar />
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

const formCard = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "28px 28px 32px",
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#111827",
  display: "block",
  marginBottom: 8,
};

const required = {
  color: "#dc2626",
};

const fieldError = {
  fontSize: 11,
  color: "#dc2626",
  marginTop: 4,
};

const statusButton = {
  padding: "8px 20px",
  borderRadius: 20,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
};

const dropdownBox = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  background: "white",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
  zIndex: 100,
  overflow: "hidden",
};

const actionsRow = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 20,
};

const cancelButton = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  padding: "10px 24px",
  fontSize: 14,
  color: "#374151",
  cursor: "pointer",
  fontWeight: 500,
};

const saveButton = {
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  padding: "10px 24px",
  fontSize: 14,
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
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

const selectedTag = {
  background: "#eff6ff",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
  borderRadius: 999,
  padding: "3px 9px",
  fontSize: 12,
  fontWeight: 700,
};

export default CriarLearningPath;