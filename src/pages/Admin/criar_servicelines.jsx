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
import Header from "../../components/header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

function normalizarArea(a) {
  return {
    id:
      a.id_areas ||
      a.ID_AREAS ||
      a.id_area ||
      a.id ||
      "",

    nome:
      a.nome_area ||
      a.NOME_AREA ||
      a.nome ||
      a.designacao ||
      "Área sem nome",

    estado:
      a.estado_area ||
      a.ESTADO_AREA ||
      "ATIVO",
  };
}

function MultiSelectDropdown({ options, selected, onChange, erro }) {
  const [aberto, setAberto] = useState(false);
  const [pesquisa, setPesquisa] = useState("");

  const filtradas = options.filter((o) => {
    const jaSelecionada = selected.some((s) => String(s.id) === String(o.id));

    return (
      o.nome.toLowerCase().includes(pesquisa.toLowerCase()) &&
      !jaSelecionada
    );
  });

  function adicionar(area) {
    onChange([...selected, area]);
    setPesquisa("");
  }

  function remover(area) {
    onChange(selected.filter((a) => String(a.id) !== String(area.id)));
  }

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setAberto((v) => !v)}
        style={{
          minHeight: 42,
          border: `1px solid ${erro ? "#fca5a5" : aberto ? "#2563eb" : "#d1d5db"}`,
          borderRadius: 8,
          padding: "6px 36px 6px 12px",
          cursor: "pointer",
          background: "white",
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
          position: "relative",
        }}
      >
        {selected.length === 0 && (
          <span style={{ fontSize: 14, color: "#9ca3af" }}>
            Selecione as áreas
          </span>
        )}

        {selected.map((area) => (
          <span key={area.id} style={selectedTag}>
            {area.nome}

            <span
              onClick={(e) => {
                e.stopPropagation();
                remover(area);
              }}
              style={{ cursor: "pointer", lineHeight: 1 }}
            >
              <BiX size={14} />
            </span>
          </span>
        ))}

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
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #f3f4f6" }}>
            <input
              type="text"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar área..."
              onClick={(e) => e.stopPropagation()}
              style={dropdownSearch}
            />
          </div>

          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {filtradas.length > 0 ? (
              filtradas.map((area) => (
                <div
                  key={area.id}
                  onClick={() => adicionar(area)}
                  style={dropdownItem}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f0f9ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {area.nome}
                </div>
              ))
            ) : (
              <div style={{ padding: "12px 14px", fontSize: 13, color: "#9ca3af" }}>
                Nenhuma área encontrada.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CriarServiceLine() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    tipo: "",
    estado: "ATIVO",
    areas: [],
  });

  const [areasDisponiveis, setAreasDisponiveis] = useState([]);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const [aCriar, setACriar] = useState(false);

  useEffect(() => {
    carregarAreas();
  }, []);

  async function carregarAreas() {
    try {
      setIsLoadingAreas(true);

      const res = await api.get("/areas/select");

      const data = res.data;

      const lista =
        Array.isArray(data)
          ? data
          : Array.isArray(data.areas)
            ? data.areas
            : Array.isArray(data.data)
              ? data.data
              : [];

      setAreasDisponiveis(lista.map(normalizarArea));
    } catch (err) {
      console.error("Erro ao carregar áreas:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setAreasDisponiveis([]);
      setErroGeral("Não foi possível carregar as áreas.");
    } finally {
      setIsLoadingAreas(false);
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

    if (form.areas.length === 0) {
      novosErros.areas = "Seleciona pelo menos uma área.";
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
        areas_ids: form.areas.map((a) => Number(a.id)),
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
                Áreas <span style={{ color: "#dc2626" }}>*</span>
              </label>

              <MultiSelectDropdown
                options={areasDisponiveis}
                selected={form.areas}
                onChange={set("areas")}
                erro={erros.areas}
              />

              {isLoadingAreas && (
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 5 }}>
                  A carregar áreas...
                </div>
              )}

              {erros.areas && <div style={fieldError}>{erros.areas}</div>}
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