import { useEffect, useState } from "react";
import {
  BiUserCircle,
  BiArrowBack,
  BiUser,
  BiSave,
  BiBuildings,
  BiStats,
} from "react-icons/bi";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../services/api.js";
import Header from "../../components/Header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

function normalizarUtilizador(u) {
  const estado = u.estado_conta || u.ESTADO_CONTA || "ATIVO";

  return {
    id:
      u.id_utilizador ||
      u.ID_UTILIZADOR ||
      u.id ||
      "",

    nome_completo:
      u.nome_completo ||
      u.NOME_COMPLETO ||
      "",

    nome_display:
      u.nome_completo ||
      u.NOME_COMPLETO ||
      "Utilizador",

    email:
      u.email ||
      u.EMAIL ||
      u.email_softinsa ||
      u.EMAIL_SOFTINSA ||
      "",

    telefone:
      u.contacto ||
      u.CONTACTO ||
      "",

    funcao:
      formatarFuncao(
        u.tipo_utilizador ||
          u.TIPO_UTILIZADOR ||
          u.cargo ||
          u.CARGO ||
          "Consultor"
      ),

    departamento:
      u.departamento ||
      u.DEPARTAMENTO ||
      u.nome_area ||
      u.NOME_AREA ||
      u.nome_serviceline ||
      u.NOME_SERVICELINE ||
      "-",

    status:
      estado.toString().toUpperCase() === "ATIVO" ? "Ativo" : "Inativo",

    data_registo: formatarData(
      u.data_criacao_conta ||
        u.DATA_CRIACAO_CONTA ||
        u.data_registo ||
        u.DATA_REGISTO
    ),

    total_badges: Number(
      u.total_badges ||
        u.TOTAL_BADGES ||
        u.badges ||
        u.BADGES ||
        0
    ),

    total_pontos: Number(
      u.total_pontos ||
        u.TOTAL_PONTOS ||
        0
    ),
  };
}

function formatarFuncao(tipo) {
  const t = String(tipo || "").toLowerCase();

  if (t.includes("admin")) return "Administrador";
  if (t.includes("talent") || t === "tm" || t === "t.m.") {
    return "Talent Manager";
  }
  if (
    t.includes("service") ||
    t.includes("leader") ||
    t === "sll" ||
    t === "s.l.l."
  ) {
    return "Service Line Leader";
  }

  return "Consultor";
}

function formatarData(raw) {
  if (!raw) return "-";

  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-PT");
  } catch {
    return "-";
  }
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
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SectionTitle({ icon, label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
        marginTop: 8,
      }}
    >
      <span style={{ color: "#2563eb" }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
        {label}
      </span>
    </div>
  );
}

function FuncaoBadge({ funcao }) {
  const map = {
    "Talent Manager": { bg: "#dbeafe", color: "#1d4ed8", label: "T.M." },
    "Service Line Leader": { bg: "#d1fae5", color: "#065f46", label: "S.L.L." },
    Consultor: { bg: "#f3f4f6", color: "#374151", label: "Consultor" },
    Administrador: { bg: "#ede9fe", color: "#6d28d9", label: "Admin" },
  };

  const style = map[funcao] || map.Consultor;

  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        borderRadius: 6,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 700,
      }}
      title={funcao}
    >
      {style.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const ativo = status === "Ativo";

  return (
    <span
      style={{
        background: ativo ? "#dcfce7" : "#fee2e2",
        color: ativo ? "#15803d" : "#b91c1c",
        borderRadius: 6,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {status}
    </span>
  );
}

function EditarConta() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    carregarUtilizador();
  }, [id]);

  async function carregarUtilizador() {
    try {
        setIsLoading(true);
        setErro("");

        const res = await api.get(`/utilizadores/${id}/admin`);

        console.log("UTILIZADOR PARA EDITAR:", res.data);

        const dados = res.data?.utilizador || res.data;

        setForm(normalizarUtilizador(dados));
    } catch (err) {
        console.error("Erro ao carregar utilizador:", err);
        console.error("STATUS:", err.response?.status);
        console.error("BODY:", err.response?.data);

        setErro(
        err.response?.data?.error ||
            "Não foi possível carregar os dados do utilizador."
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
  };

  async function handleGuardar() {
    if (!form) return;

    if (!form.nome_completo.trim()) {
      setErro("O nome completo é obrigatório.");
      return;
    }

    if (!form.email.trim()) {
      setErro("O email é obrigatório.");
      return;
    }

    try {
      setAGuardar(true);
      setErro("");
      setSucesso("");

      await api.put(`/utilizadores/${form.id}/admin`, {
        nome_completo: form.nome_completo,
        email: form.email,
        contacto: form.telefone,
        estado_conta: form.status === "Ativo" ? "ATIVO" : "INATIVA",
        //tipo_utilizador: form.funcao,
    });

      setSucesso("Conta atualizada com sucesso.");

      setTimeout(() => {
        navigate("/admin/contas");
      }, 900);
    } catch (err) {
      console.error("Erro ao guardar alterações:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível guardar as alterações."
      );
    } finally {
      setAGuardar(false);
    }
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
          <button onClick={() => navigate("/admin/contas")} style={backButton}>
            <BiArrowBack size={16} /> Voltar
          </button>

          <div style={pageHeader}>
            <div>
              <h5 style={{ fontWeight: 700, color: "#111827", margin: 0 }}>
                Editar Conta
              </h5>

              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {form ? `Utilizador #${form.id}` : "A carregar utilizador..."}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div style={loadingBox}>A carregar dados da conta...</div>
          ) : erro && !form ? (
            <div style={errorBox}>{erro}</div>
          ) : (
            form && (
              <div style={card}>
                <div style={profileHeader}>
                  <div style={profileAvatar}>
                    <BiUserCircle size={60} color="#3b82f6" />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {form.nome_display}
                      </span>

                      <FuncaoBadge funcao={form.funcao} />
                      <StatusBadge status={form.status} />
                    </div>

                    <div style={profileStatsGrid}>
                      <InfoMini label="ID do Utilizador" value={`#${form.id}`} />
                      <InfoMini label="Data de Registo" value={form.data_registo} />
                      <InfoMini label="Departamento" value={form.departamento} />
                      <InfoMini label="Total de Badges" value={`${form.total_badges} badges`} />
                    </div>
                  </div>
                </div>

                {erro && <div style={errorBoxSmall}>{erro}</div>}
                {sucesso && <div style={successBoxSmall}>{sucesso}</div>}

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
                    value={form.telefone}
                    onChange={set("telefone")}
                    placeholder="+351 9XX XXX XXX"
                  />

                  <SelectField
                    label="Status da Conta"
                    value={form.status}
                    onChange={set("status")}
                    options={[
                      { value: "Ativo", label: "Ativo" },
                      { value: "Inativo", label: "Inativo" },
                    ]}
                  />
                </div>

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
                        { value: "Service Line Leader", label: "Service Line Leader" },
                    ]}
                    />

                    <FormField
                    label="Departamento / Área"
                    value={form.departamento}
                    readOnly
                    />
                </div>

                <SectionTitle
                  icon={<BiStats size={18} />}
                  label="Estatísticas e Desempenho"
                />

                <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                  <StatBox label="Badges" value={form.total_badges} />
                  <StatBox label="Pontos" value={form.total_pontos} />
                </div>

                <div style={actionsGrid}>
                  <button
                    onClick={handleGuardar}
                    disabled={aGuardar}
                    style={{
                      ...saveButton,
                      opacity: aGuardar ? 0.7 : 1,
                      cursor: aGuardar ? "not-allowed" : "pointer",
                    }}
                  >
                    <BiSave size={18} />
                    {aGuardar ? "A guardar..." : "Aplicar Alterações"}
                  </button>

                  <button
                    onClick={() => navigate("/admin/contas")}
                    disabled={aGuardar}
                    style={cancelButton}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        <AdminRightSidebar />
      </div>
    </div>
  );
}

function InfoMini({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
        {value}
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={statBox}>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#2563eb" }}>
        {value}
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
  borderRadius: 12,
  padding: 20,
  color: "#991b1b",
  fontSize: 13,
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

const card = {
  background: "white",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  padding: 28,
};

const profileHeader = {
  display: "flex",
  alignItems: "center",
  gap: 24,
  marginBottom: 28,
  paddingBottom: 24,
  borderBottom: "1px solid #f3f4f6",
};

const profileAvatar = {
  width: 90,
  height: 90,
  borderRadius: "50%",
  background: "#dbeafe",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  border: "3px solid #bfdbfe",
};

const profileStatsGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px 40px",
};

const fieldLabel = {
  fontSize: 12,
  color: "#6b7280",
  fontWeight: 500,
};

const inputStyle = {
  height: 40,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "0 12px",
  fontSize: 14,
  color: "#111827",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  marginBottom: 24,
};

const statBox = {
  background: "#f0f7ff",
  borderRadius: 10,
  padding: "16px 24px",
  minWidth: 140,
};

const actionsGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
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
  padding: "13px 0",
  fontSize: 15,
  fontWeight: 600,
};

const cancelButton = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "white",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: "13px 0",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

export default EditarConta;