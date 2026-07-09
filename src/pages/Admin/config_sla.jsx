import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import {
  BiArrowBack,
  BiSave,
  BiTimeFive,
  BiMailSend,
  BiBell,
  BiRefresh,
} from "react-icons/bi";
import { useNavigate } from "react-router-dom";

import api from "../../services/api.js";

import Header from "../../components/header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

function ConfiguracaoSLA() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [aProcessar, setAProcessar] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [resultado, setResultado] = useState(null);

  const [form, setForm] = useState({
    sla_tm_dias: 3,
    sla_sll_dias: 2,
    alerta_email: true,
    alerta_push: false,
    estado_configuracao: "ATIVO",
  });

  useEffect(() => {
    carregarConfig();
  }, []);

  async function carregarConfig() {
    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const response = await api.get("/admin/sla/config");

      const config = response.data?.config || response.data || {};

      setForm({
        sla_tm_dias: Number(config.sla_tm_dias || 3),
        sla_sll_dias: Number(config.sla_sll_dias || 2),
        alerta_email: Boolean(config.alerta_email),
        alerta_push: Boolean(config.alerta_push),
        estado_configuracao:
          config.estado_configuracao || "ATIVO",
      });
    } catch (err) {
      console.error("Erro ao carregar configuração SLA:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar a configuração de SLA."
      );
    } finally {
      setLoading(false);
    }
  }

  async function guardarConfig() {
    try {
      setAGuardar(true);
      setErro("");
      setSucesso("");
      setResultado(null);

      if (Number(form.sla_tm_dias) <= 0) {
        setErro("O SLA do Talent Manager deve ser superior a 0.");
        return;
      }

      if (Number(form.sla_sll_dias) <= 0) {
        setErro("O SLA do Service Line Leader deve ser superior a 0.");
        return;
      }

      await api.put("/admin/sla/config", {
        sla_tm_dias: Number(form.sla_tm_dias),
        sla_sll_dias: Number(form.sla_sll_dias),
        alerta_email: form.alerta_email,
        alerta_push: form.alerta_push,
        estado_configuracao: form.estado_configuracao,
      });

      setSucesso("Configuração de SLA guardada com sucesso.");
    } catch (err) {
      console.error("Erro ao guardar configuração SLA:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível guardar a configuração de SLA."
      );
    } finally {
      setAGuardar(false);
    }
  }

  async function processarAlertas() {
    try {
      setAProcessar(true);
      setErro("");
      setSucesso("");
      setResultado(null);

      const response =
        await api.post("/admin/sla/processar-alertas", {});

      setResultado(response.data?.resultado || null);
      setSucesso("Verificação de SLA executada com sucesso.");
    } catch (err) {
      console.error("Erro ao processar alertas SLA:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível processar os alertas de SLA."
      );
    } finally {
      setAProcessar(false);
    }
  }

  function atualizarCampo(campo, valor) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    setErro("");
    setSucesso("");
    setResultado(null);
  }

  return (
    <div style={pageWrapper}>
      <Header />

      <div style={layoutBody}>
        <AdminLeftSidebar />

        <main style={mainContent}>
          <button onClick={() => navigate("/admin")} style={backButton}>
            <BiArrowBack size={16} />
            Voltar
          </button>

          <div style={pageHeader}>
            <div>
              <h5 style={pageTitle}>Configuração de SLA</h5>

              <div style={pageSubtitle}>
                Define os prazos máximos de avaliação para Talent Managers e Service Line Leaders.
              </div>
            </div>
          </div>

          {erro && <div style={errorBox}>{erro}</div>}
          {sucesso && <div style={successBox}>{sucesso}</div>}

          {loading ? (
            <div style={loadingBox}>
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <>
              <div style={cardsGrid}>
                <div style={configCard}>
                  <div style={cardHeader}>
                    <div style={iconBoxBlue}>
                      <BiTimeFive size={22} />
                    </div>

                    <div>
                      <div style={cardTitle}>
                        SLA Talent Manager
                      </div>

                      <div style={cardSubtitle}>
                        Prazo máximo para análise inicial da candidatura.
                      </div>
                    </div>
                  </div>

                  <label style={labelStyle}>
                    Dias para avaliação TM
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={form.sla_tm_dias}
                    onChange={(e) =>
                      atualizarCampo(
                        "sla_tm_dias",
                        e.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </div>

                <div style={configCard}>
                  <div style={cardHeader}>
                    <div style={iconBoxPurple}>
                      <BiTimeFive size={22} />
                    </div>

                    <div>
                      <div style={cardTitle}>
                        SLA Service Line Leader
                      </div>

                      <div style={cardSubtitle}>
                        Prazo máximo para validação final do pedido.
                      </div>
                    </div>
                  </div>

                  <label style={labelStyle}>
                    Dias para avaliação SLL
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={form.sla_sll_dias}
                    onChange={(e) =>
                      atualizarCampo(
                        "sla_sll_dias",
                        e.target.value
                      )
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={sectionCard}>
                <div style={sectionHeader}>
                  <div>
                    <div style={sectionTitle}>
                      Alertas automáticos
                    </div>

                    <div style={sectionSubtitle}>
                      Define como os responsáveis são avisados quando o SLA é ultrapassado.
                    </div>
                  </div>
                </div>

                <div style={toggleGrid}>
                  <label style={toggleRow}>
                    <div style={toggleTextBox}>
                      <div style={toggleTitle}>
                        <BiMailSend size={17} />
                        Enviar alerta por email
                      </div>

                      <div style={toggleSubtitle}>
                        Envia email para o TM ou SLL responsável pela candidatura.
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={form.alerta_email}
                      onChange={(e) =>
                        atualizarCampo(
                          "alerta_email",
                          e.target.checked
                        )
                      }
                    />
                  </label>

                  <label style={toggleRow}>
                    <div style={toggleTextBox}>
                      <div style={toggleTitle}>
                        <BiBell size={17} />
                        Enviar alerta push
                      </div>

                      <div style={toggleSubtitle}>
                        Preparado para o requisito seguinte de notificações push.
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={form.alerta_push}
                      onChange={(e) =>
                        atualizarCampo(
                          "alerta_push",
                          e.target.checked
                        )
                      }
                    />
                  </label>
                </div>

                <div style={{ marginTop: 18 }}>
                  <label style={labelStyle}>
                    Estado da configuração
                  </label>

                  <div style={statusActions}>
                    <button
                      type="button"
                      onClick={() =>
                        atualizarCampo(
                          "estado_configuracao",
                          "INATIVO"
                        )
                      }
                      style={{
                        ...statusButton,
                        background:
                          form.estado_configuracao === "INATIVO"
                            ? "#fee2e2"
                            : "white",
                        color:
                          form.estado_configuracao === "INATIVO"
                            ? "#b91c1c"
                            : "#6b7280",
                        border:
                          form.estado_configuracao === "INATIVO"
                            ? "1.5px solid #fca5a5"
                            : "1.5px solid #d1d5db",
                      }}
                    >
                      Inativo
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        atualizarCampo(
                          "estado_configuracao",
                          "ATIVO"
                        )
                      }
                      style={{
                        ...statusButton,
                        background:
                          form.estado_configuracao === "ATIVO"
                            ? "#16a34a"
                            : "white",
                        color:
                          form.estado_configuracao === "ATIVO"
                            ? "white"
                            : "#6b7280",
                        border:
                          form.estado_configuracao === "ATIVO"
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
                  type="button"
                  onClick={guardarConfig}
                  disabled={aGuardar}
                  style={{
                    ...saveButton,
                    opacity: aGuardar ? 0.7 : 1,
                    cursor: aGuardar ? "not-allowed" : "pointer",
                  }}
                >
                  <BiSave size={16} />
                  {aGuardar ? "A guardar..." : "Guardar configuração"}
                </button>

                <button
                  type="button"
                  onClick={processarAlertas}
                  disabled={aProcessar}
                  style={{
                    ...testButton,
                    opacity: aProcessar ? 0.7 : 1,
                    cursor: aProcessar ? "not-allowed" : "pointer",
                  }}
                >
                  <BiRefresh size={16} />
                  {aProcessar ? "A processar..." : "Testar verificação SLA"}
                </button>
              </div>

              {resultado && (
                <div style={resultCard}>
                  <div style={sectionTitle}>
                    Resultado da última verificação
                  </div>

                  <div style={resultGrid}>
                    <ResultItem
                      label="Ativo"
                      value={resultado.ativo ? "Sim" : "Não"}
                    />

                    <ResultItem
                      label="Email ativo"
                      value={resultado.alerta_email ? "Sim" : "Não"}
                    />

                    <ResultItem
                      label="Candidaturas TM atrasadas"
                      value={resultado.candidaturas_tm_atrasadas}
                    />

                    <ResultItem
                      label="Candidaturas SLL atrasadas"
                      value={resultado.candidaturas_sll_atrasadas}
                    />

                    <ResultItem
                      label="Notificações criadas"
                      value={resultado.notificacoes_criadas}
                    />

                    <ResultItem
                      label="Duplicadas ignoradas"
                      value={resultado.notificacoes_duplicadas}
                    />

                    <ResultItem
                      label="Emails enviados"
                      value={resultado.emails_enviados}
                    />

                    <ResultItem
                      label="Emails com erro"
                      value={resultado.emails_com_erro}
                    />

                    <ResultItem
                        label="Pushes enviados"
                        value={resultado.pushes_enviados}
                    />

                        <ResultItem
                        label="Pushes com erro"
                        value={resultado.pushes_com_erro}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        <AdminRightSidebar />
      </div>
    </div>
  );
}

function ResultItem({ label, value }) {
  return (
    <div style={resultItem}>
      <div style={resultLabel}>{label}</div>
      <div style={resultValue}>{value}</div>
    </div>
  );
}

export default ConfiguracaoSLA;

const pageWrapper = {
  backgroundColor: "#f0f2f5",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};

const layoutBody = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const mainContent = {
  flex: 1,
  overflowY: "auto",
  padding: 24,
  minWidth: 0,
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
  gap: 16,
};

const pageTitle = {
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const pageSubtitle = {
  fontSize: 12,
  color: "#6b7280",
  marginTop: 4,
};

const cardsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 16,
  marginBottom: 16,
};

const configCard = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "20px 24px",
};

const cardHeader = {
  display: "flex",
  gap: 14,
  alignItems: "center",
  marginBottom: 18,
};

const iconBoxBlue = {
  width: 44,
  height: 44,
  borderRadius: 12,
  background: "#dbeafe",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const iconBoxPurple = {
  width: 44,
  height: 44,
  borderRadius: 12,
  background: "#ede9fe",
  color: "#7c3aed",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const cardTitle = {
  fontSize: 15,
  fontWeight: 800,
  color: "#111827",
};

const cardSubtitle = {
  fontSize: 12,
  color: "#6b7280",
  lineHeight: 1.5,
};

const sectionCard = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "20px 24px",
  marginBottom: 16,
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 16,
};

const sectionTitle = {
  fontSize: 15,
  fontWeight: 800,
  color: "#111827",
};

const sectionSubtitle = {
  fontSize: 12,
  color: "#6b7280",
  marginTop: 4,
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
  height: 42,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "0 12px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const toggleGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 12,
};

const toggleRow = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "14px 16px",
  background: "#f8fafc",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  cursor: "pointer",
};

const toggleTextBox = {
  flex: 1,
};

const toggleTitle = {
  fontSize: 13,
  fontWeight: 800,
  color: "#111827",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const toggleSubtitle = {
  fontSize: 12,
  color: "#6b7280",
  marginTop: 4,
  lineHeight: 1.5,
};

const statusActions = {
  display: "flex",
  gap: 10,
};

const statusButton = {
  padding: "8px 20px",
  borderRadius: 20,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const actionsRow = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "flex-end",
  marginBottom: 16,
};

const saveButton = {
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  color: "white",
  padding: "9px 16px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const testButton = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  color: "#374151",
  padding: "9px 16px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const resultCard = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "20px 24px",
  marginBottom: 24,
};

const resultGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginTop: 14,
};

const resultItem = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 14,
};

const resultLabel = {
  fontSize: 12,
  color: "#6b7280",
  marginBottom: 4,
};

const resultValue = {
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
};

const loadingBox = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 50,
};

const errorBox = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#991b1b",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 13,
  marginBottom: 12,
};

const successBox = {
  background: "#ecfdf5",
  border: "1px solid #bbf7d0",
  color: "#166534",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 13,
  marginBottom: 12,
};