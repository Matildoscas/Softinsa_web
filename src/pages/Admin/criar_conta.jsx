import { useEffect, useState } from "react";
import {
  BiArrowBack,
  BiUser,
  BiSave,
  BiEnvelope,
  BiBuildings,
  BiX,
} from "react-icons/bi";
import { useNavigate } from "react-router-dom";

import api from "../../services/api.js";
import Header from "../../components/Header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

function CriarConta() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    contacto: "",
    password: "",
    confirmar_password: "",
    funcao: "Consultor",
    id_areas: "",
    id_serviceline: "",
    estado_conta: "ATIVO",
    notas: "",
  });

  const [areas, setAreas] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);

  const [isLoadingDados, setIsLoadingDados] = useState(true);
  const [aCriar, setACriar] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    carregarDadosAuxiliares();
  }, []);

  async function carregarDadosAuxiliares() {
    try {
        setIsLoadingDados(true);

        /*const [areasRes, serviceLinesRes] = await Promise.allSettled([
        api.get("/areas"),
        api.get("/servicelines"),
        ]);*/

        const [areasRes, serviceLinesRes] = await Promise.allSettled([
            api.get("/areas"),
            Promise.resolve({ data: [] }),
        ]);

        if (areasRes.status === "fulfilled") {
        console.log("ÁREAS RECEBIDAS:", areasRes.value.data);

        const data = areasRes.value.data;

        const listaAreas =
            Array.isArray(data)
            ? data
            : Array.isArray(data.areas)
                ? data.areas
                : Array.isArray(data.data)
                ? data.data
                : [];

        setAreas(listaAreas);
        } else {
        console.error("Erro ao carregar áreas:", areasRes.reason);
        setAreas([]);
        }

        if (serviceLinesRes.status === "fulfilled") {
        console.log("SERVICE LINES RECEBIDAS:", serviceLinesRes.value.data);

        const data = serviceLinesRes.value.data;

        const listaServiceLines =
            Array.isArray(data)
            ? data
            : Array.isArray(data.serviceLines)
                ? data.serviceLines
                : Array.isArray(data.servicelines)
                ? data.servicelines
                : Array.isArray(data.data)
                    ? data.data
                    : [];

        setServiceLines(listaServiceLines);
        } else {
        console.error("Erro ao carregar service lines:", serviceLinesRes.reason);
        setServiceLines([]);
        }
    } finally {
        setIsLoadingDados(false);
    }
    }

  const set = (field) => (value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,

      // limpa campos dependentes quando muda a função
      ...(field === "funcao"
        ? {
            id_areas: "",
            id_serviceline: "",
          }
        : {}),
    }));
  };

  function validarFormulario() {
    if (!form.nome_completo.trim()) {
      return "O nome completo é obrigatório.";
    }

    if (!form.email.trim()) {
      return "O email é obrigatório.";
    }

    if (!form.email.includes("@")) {
      return "Introduz um email válido.";
    }

    if (!form.password.trim()) {
      return "A password temporária é obrigatória.";
    }

    if (form.password.length < 6) {
      return "A password deve ter pelo menos 6 caracteres.";
    }

    if (form.password !== form.confirmar_password) {
      return "As passwords não coincidem.";
    }

    if (form.funcao === "Consultor" && !form.id_areas) {
      return "Escolhe a área do consultor.";
    }

    if (form.funcao === "Service Line Leader" && !form.id_serviceline) {
      return "Escolhe a service line do SLL.";
    }

    return "";
  }

  async function handleCriarConta() {
    const erroValidacao = validarFormulario();

    if (erroValidacao) {
      setErro(erroValidacao);
      setSucesso("");
      return;
    }

    try {
      setACriar(true);
      setErro("");
      setSucesso("");

      await api.post("/admin/contas", {
        nome_completo: form.nome_completo.trim(),
        email: form.email.trim(),
        contacto: form.contacto.trim() || null,
        password: form.password,
        tipo_utilizador: form.funcao,
        estado_conta: form.estado_conta,
        id_areas: form.id_areas ? Number(form.id_areas) : null,
        id_serviceline: form.id_serviceline
          ? Number(form.id_serviceline)
          : null,
        notas: form.notas.trim() || null,
      });

      setSucesso("Conta criada com sucesso.");

      setTimeout(() => {
        navigate("/admin/contas");
      }, 900);
    } catch (err) {
      console.error("Erro ao criar conta:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Não foi possível criar a conta."
      );
    } finally {
      setACriar(false);
    }
  }

  function handleCancelar() {
    navigate("/admin/contas");
  }

    console.log("AREAS NO STATE:", areas);
    console.log("SERVICE LINES NO STATE:", serviceLines);

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
            Voltar para gestão de contas
          </button>

          <div style={pageHeader}>
            <div>
              <h5 style={{ fontWeight: 700, color: "#111827", margin: 0 }}>
                Criar Conta
              </h5>

              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Criar uma nova conta de utilizador no sistema
              </div>
            </div>

            <button
              type="button"
              disabled
              style={{
                ...inviteButton,
                opacity: 0.55,
                cursor: "not-allowed",
              }}
              title="Será ativado quando a funcionalidade de email estiver pronta"
            >
              <BiEnvelope size={18} />
              Envio de email pendente
            </button>
          </div>

          {erro && <div style={errorBoxSmall}>{erro}</div>}
          {sucesso && <div style={successBoxSmall}>{sucesso}</div>}

          <div style={card}>
            <SectionTitle
              icon={<BiUser size={18} />}
              label="Informações Pessoais"
            />

            <div style={formGrid}>
              <FormField
                label="Nome Completo"
                value={form.nome_completo}
                onChange={set("nome_completo")}
                placeholder="Nome completo"
              />

              <FormField
                label="Email"
                value={form.email}
                onChange={set("email")}
                placeholder="email@softinsa.pt"
                type="email"
              />

              <FormField
                label="Contacto"
                value={form.contacto}
                onChange={set("contacto")}
                placeholder="+351 9XX XXX XXX"
              />

              <SelectField
                label="Estado da Conta"
                value={form.estado_conta}
                onChange={set("estado_conta")}
                options={[
                  { value: "ATIVO", label: "Ativo" },
                  { value: "INATIVA", label: "Inativo" },
                ]}
              />

              <FormField
                label="Password Temporária"
                value={form.password}
                onChange={set("password")}
                placeholder="Password temporária"
                type="password"
              />

              <FormField
                label="Confirmar Password"
                value={form.confirmar_password}
                onChange={set("confirmar_password")}
                placeholder="Confirmar password"
                type="password"
              />
            </div>

            <Divider />

            <SectionTitle
              icon={<BiBuildings size={18} />}
              label="Informações Profissionais"
            />

            <div style={formGrid}>
              <SelectField
                label="Função"
                value={form.funcao}
                onChange={set("funcao")}
                options={[
                  { value: "Consultor", label: "Consultor" },
                  { value: "Talent Manager", label: "Talent Manager" },
                  {
                    value: "Service Line Leader",
                    label: "Service Line Leader",
                  },
                ]}
              />

              {form.funcao === "Consultor" && (
                <SelectField
                    label="Área"
                    value={form.id_areas}
                    onChange={set("id_areas")}
                    options={[
                    { value: "", label: "Selecionar área" },
                    ...areas.map((a) => ({
                        value: String(
                        a.id_areas ||
                        a.ID_AREAS ||
                        a.id_area ||
                        a.id ||
                        ""
                        ),
                        label:
                        a.nome_area ||
                        a.NOME_AREA ||
                        a.nome ||
                        a.designacao ||
                        "Área sem nome",
                    })),
                    ]}
                />
                )}

              {form.funcao === "Service Line Leader" && (
                <SelectField
                  label="Service Line"
                  value={form.id_serviceline}
                  onChange={set("id_serviceline")}
                  options={[
                    { value: "", label: "Selecionar service line" },
                    ...serviceLines.map((s) => ({
                      value: String(s.id_serviceline),
                      label: s.nome_serviceline,
                    })),
                  ]}
                />
              )}

              {form.funcao === "Talent Manager" && (
                <FormField
                  label="Departamento"
                  value="Talent Management"
                  readOnly
                />
              )}

              {isLoadingDados && (
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  A carregar áreas e service lines...
                </div>
              )}
            </div>

            <Divider />

            <div style={{ marginBottom: 28 }}>
              <label style={fieldLabel}>Observações / Notas Internas</label>

              <textarea
                value={form.notas}
                onChange={(e) => set("notas")(e.target.value)}
                placeholder="Adicione notas sobre o utilizador..."
                rows={5}
                style={textareaStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "#2563eb";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                }}
              />
            </div>
          </div>

          <div style={actionsGrid}>
            <button
              onClick={handleCriarConta}
              disabled={aCriar}
              style={{
                ...saveButton,
                opacity: aCriar ? 0.7 : 1,
                cursor: aCriar ? "not-allowed" : "pointer",
              }}
            >
              <BiSave size={18} />
              {aCriar ? "A criar conta..." : "Criar Conta"}
            </button>

            <button
              onClick={handleCancelar}
              disabled={aCriar}
              style={cancelButton}
            >
              <BiX size={18} />
              Cancelar
            </button>
          </div>
        </div>

        <AdminRightSidebar />
      </div>
    </div>
  );
}

function SectionTitle({ icon, label }) {
  return (
    <div style={sectionTitle}>
      <span style={{ color: "#2563eb" }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
        {label}
      </span>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={fieldLabel}>{label}</label>

      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{
          ...inputStyle,
          background: readOnly ? "#f9fafb" : "white",
          cursor: readOnly ? "not-allowed" : "text",
        }}
        onFocus={(e) => {
          if (!readOnly) e.target.style.borderColor = "#2563eb";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#d1d5db";
        }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={fieldLabel}>{label}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      >
        {options.map((op) => (
          <option key={`${op.value}-${op.label}`} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Divider() {
  return <div style={dividerStyle} />;
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
  alignItems: "center",
  marginBottom: 24,
  gap: 14,
  flexWrap: "wrap",
};

const inviteButton = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "#1e3a6e",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "10px 22px",
  fontSize: 14,
  fontWeight: 600,
};

const card = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "28px 28px 32px",
};

const sectionTitle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 18,
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 18,
  marginBottom: 28,
};

const fieldLabel = {
  fontSize: 12,
  color: "#6b7280",
  fontWeight: 500,
};

const inputStyle = {
  height: 42,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "0 14px",
  fontSize: 14,
  color: "#111827",
  background: "white",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const dividerStyle = {
  height: 1,
  background: "#f3f4f6",
  marginBottom: 24,
};

const textareaStyle = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: 14,
  fontSize: 14,
  color: "#111827",
  resize: "vertical",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  lineHeight: 1.6,
  marginTop: 8,
};

const actionsGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
  marginTop: 20,
};

const saveButton = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "14px 0",
  fontSize: 15,
  fontWeight: 600,
};

const cancelButton = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "#6b7280",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "14px 0",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const errorBoxSmall = {
  background: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: "10px 12px",
  color: "#991b1b",
  fontSize: 13,
  marginBottom: 16,
};

const successBoxSmall = {
  background: "#dcfce7",
  border: "1px solid #bbf7d0",
  borderRadius: 10,
  padding: "10px 12px",
  color: "#166534",
  fontSize: 13,
  marginBottom: 16,
};

export default CriarConta;