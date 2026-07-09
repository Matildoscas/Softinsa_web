import { useEffect, useState } from "react";
import {
  BiArrowBack,
  BiChevronDown,
  BiX,
  BiBuildings,
  BiSave,
} from "react-icons/bi";
import { useNavigate } from "react-router-dom";

import api from "../../services/api.js";
import Header from "../../components/Header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

function normalizarLearningPath(lp) {
  return {
    id:
      lp.id_learningpaths ||
      lp.ID_LEARNINGPATHS ||
      lp.id ||
      "",

    nome:
      lp.nome_learningpaths ||
      lp.NOME_LEARNINGPATHS ||
      lp.nome ||
      "Learning Path sem nome",

    estado:
      lp.estado_learningpath ||
      lp.ESTADO_LEARNINGPATH ||
      "ATIVO",
  };
}

function CriarServiceLine() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    tipo: "",
    estado: "ATIVO",
    id_learningpaths: "",
  });

  const [learningPaths, setLearningPaths] = useState([]);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [isLoadingLearningPaths, setIsLoadingLearningPaths] = useState(true);
  const [aCriar, setACriar] = useState(false);

  useEffect(() => {
    carregarLearningPaths();
  }, []);

  async function carregarLearningPaths() {
    try {
      setIsLoadingLearningPaths(true);

      const res = await api.get("/learningpaths/select");

      const data = res.data;

      const lista =
        Array.isArray(data)
          ? data
          : Array.isArray(data.learningpaths)
            ? data.learningpaths
            : Array.isArray(data.data)
              ? data.data
              : [];

      setLearningPaths(lista.map(normalizarLearningPath));
    } catch (err) {
      console.error("Erro ao carregar Learning Paths:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setLearningPaths([]);
      setErroGeral("Não foi possível carregar as Learning Paths.");
    } finally {
      setIsLoadingLearningPaths(false);
    }
  }

  const set = (field) => (val) => {
    setForm((prev) => ({
      ...prev,
      [field]: val,
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

    if (!form.tipo.trim()) {
      novosErros.tipo = "O tipo é obrigatório.";
    }

    if (!form.id_learningpaths) {
      novosErros.id_learningpaths = "Seleciona uma Learning Path.";
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

      await api.post("/servicelines", {
        nome_serviceline: form.nome.trim(),
        descricao_serviceline: form.descricao.trim(),
        tipo_serviceline: form.tipo.trim(),
        estado_serviceline: form.estado,
        id_learningpaths: Number(form.id_learningpaths),
      });

      setSucesso("Service Line criada com sucesso.");

      setTimeout(() => {
        navigate("/admin/service-lines");
      }, 900);
    } catch (err) {
      console.error("Erro ao criar service line:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErroGeral(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Não foi possível criar a Service Line."
      );
    } finally {
      setACriar(false);
    }
  }

  function handleCancelar() {
    navigate("/admin/service-lines");
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
              <h5 style={pageTitle}>Criar Service Line</h5>

              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                Preencha os dados da nova Service Line
              </div>
            </div>
          </div>

          {erroGeral && <div style={errorBox}>{erroGeral}</div>}
          {sucesso && <div style={successBox}>{sucesso}</div>}

          <div style={formCard}>
            <div style={sectionTitle}>
              <BiBuildings size={18} color="#2563eb" />
              <span>Informações da Service Line</span>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                Nome da Service Line <span style={{ color: "#dc2626" }}>*</span>
              </label>

              <input
                value={form.nome}
                onChange={(e) => set("nome")(e.target.value)}
                placeholder="Ex: Application Operations"
                style={inputStyle("nome")}
                onFocus={(e) => {
                  if (!erros.nome) e.target.style.borderColor = "#2563eb";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = erros.nome ? "#fca5a5" : "#d1d5db";
                }}
              />

              {erros.nome && <div style={fieldError}>{erros.nome}</div>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>
                Descrição <span style={{ color: "#dc2626" }}>*</span>
              </label>

              <textarea
                value={form.descricao}
                onChange={(e) => set("descricao")(e.target.value)}
                placeholder="Descreva a Service Line..."
                rows={5}
                style={{
                  width: "100%",
                  border: `1px solid ${erros.descricao ? "#fca5a5" : "#d1d5db"}`,
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
                  if (!erros.descricao) e.target.style.borderColor = "#2563eb";
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

            <div style={twoColumns}>
              <div>
                <label style={labelStyle}>
                  Tipo de Service Line <span style={{ color: "#dc2626" }}>*</span>
                </label>

                <input
                  value={form.tipo}
                  onChange={(e) => set("tipo")(e.target.value)}
                  placeholder="Ex: Tecnologia, Técnica, Gestão"
                  style={inputStyle("tipo")}
                  onFocus={(e) => {
                    if (!erros.tipo) e.target.style.borderColor = "#2563eb";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = erros.tipo ? "#fca5a5" : "#d1d5db";
                  }}
                />

                {erros.tipo && <div style={fieldError}>{erros.tipo}</div>}
              </div>

              <div>
                <label style={labelStyle}>Estado</label>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => set("estado")("INATIVO")}
                    style={{
                      ...statusButton,
                      background: form.estado === "INATIVO" ? "#fee2e2" : "white",
                      color: form.estado === "INATIVO" ? "#b91c1c" : "#6b7280",
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
                      background: form.estado === "ATIVO" ? "#16a34a" : "white",
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

            <div style={{ marginTop: 22 }}>
              <label style={labelStyle}>
                Learning Path <span style={{ color: "#dc2626" }}>*</span>
              </label>

              <select
                value={form.id_learningpaths}
                onChange={(e) => set("id_learningpaths")(e.target.value)}
                disabled={isLoadingLearningPaths}
                style={inputStyle("id_learningpaths")}
                onFocus={(e) => {
                  if (!erros.id_learningpaths) {
                    e.target.style.borderColor = "#2563eb";
                  }
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = erros.id_learningpaths
                    ? "#fca5a5"
                    : "#d1d5db";
                }}
              >
                <option value="">
                  {isLoadingLearningPaths
                    ? "A carregar Learning Paths..."
                    : "Selecione a Learning Path"}
                </option>

                {learningPaths.map((lp) => (
                  <option key={lp.id} value={lp.id}>
                    {lp.nome}
                  </option>
                ))}
              </select>

              {erros.id_learningpaths && (
                <div style={fieldError}>{erros.id_learningpaths}</div>
              )}

              <div style={helperText}>
                A Service Line será associada a esta Learning Path. As áreas serão criadas depois e associadas à Service Line.
              </div>
            </div>
          </div>

          <div style={actionsRow}>
            <button onClick={handleCancelar} disabled={aCriar} style={cancelButton}>
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
              {aCriar ? "A criar..." : "Criar Service Line"}
            </button>
          </div>
        </div>

        <AdminRightSidebar />
      </div>
    </div>
  );
}

const helperText = {
  fontSize: 12,
  color: "#6b7280",
  marginTop: 6,
  lineHeight: 1.45,
};

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

const sectionTitle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 20,
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#111827",
  display: "block",
  marginBottom: 8,
};

const fieldError = {
  fontSize: 11,
  color: "#dc2626",
  marginTop: 4,
};

const twoColumns = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 18,
  marginBottom: 20,
};

const statusButton = {
  padding: "9px 20px",
  borderRadius: 20,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
};

const selectedTag = {
  background: "#dbeafe",
  color: "#1d4ed8",
  borderRadius: 6,
  padding: "2px 8px",
  fontSize: 12,
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  gap: 4,
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

const dropdownSearch = {
  width: "100%",
  height: 34,
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  padding: "0 10px",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const dropdownItem = {
  padding: "10px 14px",
  fontSize: 13,
  color: "#374151",
  cursor: "pointer",
  transition: "background 0.15s",
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
  display: "flex",
  alignItems: "center",
  gap: 7,
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

export default CriarServiceLine;