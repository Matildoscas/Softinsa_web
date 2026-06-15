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

function normalizarServiceLine(sl) {
  return {
    id:
      sl.id_serviceline ||
      sl.ID_SERVICELINE ||
      sl.id ||
      "",

    nome:
      sl.nome_serviceline ||
      sl.NOME_SERVICELINE ||
      sl.nome ||
      "Service Line sem nome",

    id_learningpaths:
      sl.id_learningpaths ||
      sl.ID_LEARNINGPATHS ||
      null,
  };
}

function SelectDropdown({
  options,
  value,
  onChange,
  placeholder,
  erro,
  disabled = false,
}) {
  const [aberto, setAberto] = useState(false);

  const selecionado = options.find((opt) => String(opt.id) === String(value));

  function selecionar(opt) {
    onChange(opt.id);
    setAberto(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => {
          if (!disabled) setAberto((v) => !v);
        }}
        style={{
          height: 42,
          border: `1px solid ${
            erro ? "#fca5a5" : aberto ? "#2563eb" : "#d1d5db"
          }`,
          borderRadius: 8,
          padding: "0 36px 0 12px",
          cursor: disabled ? "not-allowed" : "pointer",
          background: disabled ? "#f9fafb" : "white",
          display: "flex",
          alignItems: "center",
          fontSize: 14,
          color: selecionado ? "#111827" : "#9ca3af",
          position: "relative",
          userSelect: "none",
          opacity: disabled ? 0.65 : 1,
        }}
      >
        {selecionado ? selecionado.nome : placeholder}

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

      {aberto && !disabled && (
        <div style={dropdownBox}>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {options.length > 0 ? (
              options.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => selecionar(opt)}
                  style={{
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#374151",
                    cursor: "pointer",
                    background:
                      String(value) === String(opt.id)
                        ? "#eff6ff"
                        : "transparent",
                    fontWeight:
                      String(value) === String(opt.id) ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (String(value) !== String(opt.id)) {
                      e.currentTarget.style.background = "#f0f9ff";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (String(value) !== String(opt.id)) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {opt.nome}
                </div>
              ))
            ) : (
              <div style={{ padding: "12px 14px", fontSize: 13, color: "#9ca3af" }}>
                Sem opções disponíveis.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
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
    tipo: "",
    estado: "ATIVO",
    id_servicelines: [],
  });

  const [serviceLines, setServiceLines] = useState([]);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [isLoadingDados, setIsLoadingDados] = useState(true);
  const [aCriar, setACriar] = useState(false);

  useEffect(() => {
    carregarDadosAuxiliares();
  }, []);

    async function carregarDadosAuxiliares() {
    try {
        setIsLoadingDados(true);
        setErroGeral("");

        const slRes = await api.get("/servicelines");

        const data = slRes.data;

        const lista =
        Array.isArray(data)
            ? data
            : Array.isArray(data.servicelines)
            ? data.servicelines
            : Array.isArray(data.serviceLines)
                ? data.serviceLines
                : Array.isArray(data.data)
                ? data.data
                : [];

        setServiceLines(lista.map(normalizarServiceLine));
    } catch (err) {
        console.error("Erro ao carregar Service Lines:", err);
        console.error("STATUS:", err.response?.status);
        console.error("BODY:", err.response?.data);

        setErroGeral("Não foi possível carregar as Service Lines.");
        setServiceLines([]);
    } finally {
        setIsLoadingDados(false);
    }
    }

  const set = (field) => (value) => {
    setForm((prev) => {
      const novo = {
        ...prev,
        [field]: value,
      };

      if (field === "id_serviceline") {
        novo.id_areas = "";
      }

      return novo;
    });

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

    if (!Array.isArray(form.id_servicelines) || form.id_servicelines.length === 0) {
        novosErros.id_servicelines = "Seleciona pelo menos uma Service Line.";
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
        tipo_learningpaths: form.tipo.trim(),
        estado_learningpaths: normalizarEstado(form.estado),
        modalidade: form.estado === "ATIVO" ? "Online" : "Offline",
        id_servicelines: form.id_servicelines.map(Number),
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
                Preenche todos os campos obrigatórios.
              </div>
            </div>
          </div>

          {erroGeral && <div style={errorBox}>{erroGeral}</div>}
          {sucesso && <div style={successBox}>{sucesso}</div>}

          {isLoadingDados ? (
            <div style={loadingBox}>A carregar dados...</div>
          ) : (
            <>
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

                <div style={{ marginBottom: 20 }}>
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
                  <label style={labelStyle}>
                    Tipo de Learning Path <span style={required}>*</span>
                  </label>

                  <input
                    value={form.tipo}
                    onChange={(e) => set("tipo")(e.target.value)}
                    placeholder="Ex: Tecnologia"
                    style={inputStyle("tipo")}
                    onFocus={(e) => {
                      if (!erros.tipo) e.target.style.borderColor = "#2563eb";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = erros.tipo
                        ? "#fca5a5"
                        : "#d1d5db";
                    }}
                  />

                  {erros.tipo && <div style={fieldError}>{erros.tipo}</div>}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Estado</label>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => {
                        set("modalidade")("Offline");
                        set("estado")("INATIVO");
                      }}
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
                      Offline (Inativo)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        set("modalidade")("Online");
                        set("estado")("ATIVO");
                      }}
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
                      Online (Ativo)
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                    <label style={labelStyle}>
                        Service Lines <span style={{ color: "#dc2626" }}>*</span>
                    </label>

                    <MultiSelectDropdown
                        options={serviceLines}
                        values={form.id_servicelines}
                        onChange={set("id_servicelines")}
                        placeholder="Selecione uma ou mais Service Lines"
                        erro={erros.id_servicelines}
                    />

                    {erros.id_servicelines && (
                        <div style={fieldError}>{erros.id_servicelines}</div>
                    )}

                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                        As áreas associadas serão determinadas automaticamente pelas Service Lines escolhidas.
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
            </>
          )}
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

const twoColumns = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
  marginBottom: 8,
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