import { useEffect, useState } from "react";
import {
  BiArrowBack,
  BiEdit,
  BiSave,
  BiBook,
  BiBuildings,
  BiChevronDown,
} from "react-icons/bi";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../services/api.js";
import Header from "../../components/header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

function normalizarEstadoArea(estado) {
  const e = String(estado || "").trim().toUpperCase();

  if (e === "ATIVO" || e === "ATIVA" || e === "ACTIVE") return "ATIVO";
  if (e === "INATIVO" || e === "INATIVA" || e === "INACTIVE") return "INATIVO";

  return "ATIVO";
}

function normalizarServiceLine(sl) {
  return {
    id: sl.id_serviceline || sl.ID_SERVICELINE || sl.id || "",
    nome:
      sl.nome_serviceline ||
      sl.NOME_SERVICELINE ||
      sl.nome ||
      "Service Line sem nome",
  };
}

function normalizarNivel(n) {
  return {
    id_nivel: n.id_nivel || n.ID_NIVEL || "",
    nome_nivel: n.nome_nivel || n.NOME_NIVEL || "",
    estado_nivel: n.estado_nivel || n.ESTADO_NIVEL || "ATIVO",

    id_badge_modelo:
      n.id_badge_modelo ||
      n.ID_BADGE_MODELO ||
      "",

    nome_badge:
      n.nome_badge ||
      n.NOME_BADGE ||
      "Sem badge associado",

    descricao_badge:
      n.descricao_badge_modelo ||
      n.DESCRICAO_BADGE_MODELO ||
      "Sem descrição.",

    pontos: Number(n.pontos || n.PONTOS || 0),

    total_requisitos: Number(
      n.total_requisitos ||
        n.numero_requisitos ||
        n.NUMERO_REQUISITOS ||
        (Array.isArray(n.requisitos) ? n.requisitos.length : 0)
    ),

    requisitos: Array.isArray(n.requisitos) ? n.requisitos : [],
  };
}

function SelectDropdown({ options, value, onChange, placeholder, erro }) {
  const [aberto, setAberto] = useState(false);

  const selected = options.find((opt) => String(opt.id) === String(value));

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setAberto((v) => !v)}
        style={{
          height: 42,
          border: `1px solid ${
            erro ? "#fca5a5" : aberto ? "#2563eb" : "#d1d5db"
          }`,
          borderRadius: 8,
          padding: "0 36px 0 14px",
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          background: "white",
          fontSize: 14,
          color: selected ? "#111827" : "#9ca3af",
          userSelect: "none",
          position: "relative",
        }}
      >
        {selected ? selected.nome : placeholder}

        <span
          style={{
            position: "absolute",
            right: 12,
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
          {options.length > 0 ? (
            options.map((opt) => (
              <div
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setAberto(false);
                }}
                style={{
                  padding: "10px 14px",
                  fontSize: 14,
                  color: "#374151",
                  cursor: "pointer",
                  background:
                    String(value) === String(opt.id) ? "#eff6ff" : "white",
                }}
                onMouseEnter={(e) => {
                  if (String(value) !== String(opt.id)) {
                    e.currentTarget.style.background = "#f9fafb";
                  }
                }}
                onMouseLeave={(e) => {
                  if (String(value) !== String(opt.id)) {
                    e.currentTarget.style.background = "white";
                  }
                }}
              >
                {opt.nome}
              </div>
            ))
          ) : (
            <div style={{ padding: "12px 14px", fontSize: 13, color: "#9ca3af" }}>
              Nenhuma Service Line disponível.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NivelCard({ nivel, areaId, onEditarRequisitos }) {
  return (
    <div style={nivelCard}>
      <div style={nivelCodeBox}>{nivel.nome_nivel}</div>

      <div style={nivelTitle}>
        Nível {nivel.nome_nivel} — {nivel.nome_badge}
      </div>

      <div style={nivelDescription}>
        {nivel.descricao_badge}
      </div>

      <div style={nivelStats}>
        <span>
          Pontos: <strong>{nivel.pontos} pts</strong>
        </span>

        <span>
          Requisitos:{" "}
          <strong style={{ color: "#2563eb" }}>
            {nivel.total_requisitos} definidos
          </strong>
        </span>
      </div>

      <button
        type="button"
        onClick={() => onEditarRequisitos(nivel)}
        style={editNivelButton}
      >
        <BiEdit size={15} />
        Editar requisitos
      </button>
    </div>
  );
}

function EditarArea() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    estado: "ATIVO",
    id_serviceline: "",
  });

  const [serviceLines, setServiceLines] = useState([]);
  const [niveis, setNiveis] = useState([]);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [id]);

  async function carregarDados() {
    try {
      setIsLoading(true);
      setErroGeral("");

      const [areaRes, serviceLinesRes] = await Promise.all([
        api.get(`/areas/${id}`),
        api.get("/servicelines/select"),
      ]);

      const areaData = areaRes.data?.area || areaRes.data;

      setForm({
        nome: areaData.nome_area || "",
        descricao: areaData.descricao_area || "",
        estado: normalizarEstadoArea(areaData.estado_area),
        id_serviceline: areaData.id_serviceline || "",
      });

      const niveisData = Array.isArray(areaData.niveis)
        ? areaData.niveis
        : [];

      setNiveis(niveisData.map(normalizarNivel));

      const slData = serviceLinesRes.data;

      const listaServiceLines =
        Array.isArray(slData)
          ? slData
          : Array.isArray(slData.servicelines)
            ? slData.servicelines
            : Array.isArray(slData.data)
              ? slData.data
              : [];

      setServiceLines(listaServiceLines.map(normalizarServiceLine));
    } catch (err) {
      console.error("Erro ao carregar área:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErroGeral(
        err.response?.data?.error ||
          "Não foi possível carregar os dados da área."
      );
    } finally {
      setIsLoading(false);
    }
  }

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

    if (!form.id_serviceline) {
      novosErros.id_serviceline = "Seleciona uma Service Line.";
    }

    setErros(novosErros);

    return Object.keys(novosErros).length === 0;
  }

  async function handleGuardar() {
    if (!validar()) return;

    try {
      setAGuardar(true);
      setErroGeral("");
      setSucesso("");

      await api.put(`/areas/${id}`, {
        nome_area: form.nome.trim(),
        descricao_area: form.descricao.trim(),
        estado_area: normalizarEstadoArea(form.estado),
        id_serviceline: Number(form.id_serviceline),
      });

      setSucesso("Área atualizada com sucesso.");

      setTimeout(() => {
        navigate("/admin/areas");
      }, 900);
    } catch (err) {
      console.error("Erro ao guardar área:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErroGeral(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Não foi possível guardar as alterações."
      );
    } finally {
      setAGuardar(false);
    }
  }

  function handleCancelar() {
    navigate("/admin/areas");
  }

  function handleEditarRequisitos(nivel) {
    navigate(`/admin/niveis/${nivel.id_nivel}/requisitos`);
  }

  const inputStyle = (campo) => ({
    width: "100%",
    height: 42,
    border: `1px solid ${erros[campo] ? "#fca5a5" : "#d1d5db"}`,
    borderRadius: 8,
    padding: "0 14px",
    fontSize: 14,
    color: "#111827",
    background: "white",
    outline: "none",
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
              <div style={breadcrumb}>
                Gestão da Área:{" "}
                <span style={{ color: "#2563eb", fontWeight: 700 }}>
                  {form.nome || "A carregar..."}
                </span>
              </div>

              <h5 style={pageTitle}>
                Editar Área
              </h5>

              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                Edita os dados da área e acede aos níveis para gerir requisitos.
              </div>
            </div>
          </div>

          {erroGeral && <div style={errorBox}>{erroGeral}</div>}
          {sucesso && <div style={successBox}>{sucesso}</div>}

          {isLoading ? (
            <div style={loadingBox}>A carregar área...</div>
          ) : (
            <>
              <div style={formCard}>
                <div style={sectionTitle}>
                  <BiBuildings size={18} color="#2563eb" />
                  <span>Informações da Área</span>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>
                    Nome da Área <span style={{ color: "#dc2626" }}>*</span>
                  </label>

                  <input
                    value={form.nome}
                    onChange={(e) => set("nome")(e.target.value)}
                    placeholder="Ex: Web Development"
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
                    Descrição <span style={{ color: "#dc2626" }}>*</span>
                  </label>

                  <textarea
                    value={form.descricao}
                    onChange={(e) => set("descricao")(e.target.value)}
                    placeholder="Descreva a área..."
                    rows={4}
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

                <div style={twoColumns}>

                  <div>
                    <label style={labelStyle}>
                      Service Line <span style={{ color: "#dc2626" }}>*</span>
                    </label>

                    <SelectDropdown
                      options={serviceLines}
                      value={form.id_serviceline}
                      onChange={set("id_serviceline")}
                      placeholder="Selecione a Service Line"
                      erro={erros.id_serviceline}
                    />

                    {erros.id_serviceline && (
                      <div style={fieldError}>{erros.id_serviceline}</div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 22 }}>
                  <label style={labelStyle}>Estado</label>

                  <div style={{ display: "flex", gap: 10 }}>
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
                  disabled={aGuardar}
                  style={cancelButton}
                >
                  Cancelar
                </button>

                <button
                  onClick={handleGuardar}
                  disabled={aGuardar}
                  style={{
                    ...saveButton,
                    opacity: aGuardar ? 0.7 : 1,
                    cursor: aGuardar ? "not-allowed" : "pointer",
                  }}
                >
                  <BiSave size={17} />
                  {aGuardar ? "A guardar..." : "Guardar Alterações"}
                </button>
              </div>

              <div style={separator} />

              <div style={levelsHeader}>
                <div>
                  <h5 style={pageTitle}>Gestão de Níveis</h5>

                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Seleciona um nível para editar os seus requisitos.
                  </div>
                </div>
              </div>

              {niveis.length > 0 ? (
                <div style={gridNiveis}>
                  {niveis.map((nivel) => (
                    <NivelCard
                      key={nivel.id_nivel}
                      nivel={nivel}
                      areaId={id}
                      onEditarRequisitos={handleEditarRequisitos}
                    />
                  ))}
                </div>
              ) : (
                <div style={loadingBox}>
                  Esta área ainda não tem níveis associados.
                </div>
              )}
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

const breadcrumb = {
  fontSize: 12,
  color: "#6b7280",
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

const formCard = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "24px 26px 28px",
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
  gridTemplateColumns: "1fr",
  gap: 18,
};

const statusButton = {
  padding: "9px 20px",
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
  display: "flex",
  alignItems: "center",
  gap: 7,
};

const separator = {
  height: 1,
  background: "#d1d5db",
  margin: "34px 0 26px",
};

const levelsHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 20,
};

const gridNiveis = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 18,
};

const nivelCard = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "22px 22px 18px",
  minHeight: 190,
  display: "flex",
  flexDirection: "column",
  gap: 12,
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

const nivelTitle = {
  fontSize: 15,
  fontWeight: 800,
  color: "#111827",
};

const nivelDescription = {
  fontSize: 13,
  color: "#6b7280",
  lineHeight: 1.5,
  flex: 1,
};

const nivelStats = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontSize: 13,
  color: "#374151",
  flexWrap: "wrap",
};

const editNivelButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  background: "#eff6ff",
  color: "#2563eb",
  border: "none",
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  alignSelf: "flex-start",
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

export default EditarArea;