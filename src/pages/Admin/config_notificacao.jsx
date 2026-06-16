import { useEffect, useState } from "react";
import {
  BiArrowBack,
  BiEnvelope,
  BiSave,
  BiUserCircle,
} from "react-icons/bi";
import { useNavigate } from "react-router-dom";

import api from "../../services/api.js";
import Header from "../../components/header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

const configPadrao = {
  workflow: {
    aprovacao: {
      status: "Ativado",
      template: "Parabéns! Seu badge [Nome do Badge] foi aprovado e publicado.",
    },
    rejeicao: {
      status: "Ativado",
      template:
        "Seu pedido para o badge [Nome do Badge] foi rejeitado. Verifique o feedback aqui.",
    },
    retificacao: {
      status: "Ativado",
      template:
        "Atenção! Seu pedido [Nome do Badge] precisa de informações adicionais. Verifique a área de evidências.",
    },
  },
  expiracao: {
    alertaStatus: "Ativado",
    diasAntesExpiracao: "30",
    receptores: {
      consultor: true,
      talentManager: false,
      serviceLineLeader: false,
    },
  },
  lembrete: {
    status: "Ativado",
    frequencia: "Semanalmente",
    diasAntesPrazo: "7",
  },
};

function normalizarConfig(config = {}) {
  return {
    workflow: {
      aprovacao: {
        ...configPadrao.workflow.aprovacao,
        ...(config.workflow?.aprovacao || {}),
      },
      rejeicao: {
        ...configPadrao.workflow.rejeicao,
        ...(config.workflow?.rejeicao || {}),
      },
      retificacao: {
        ...configPadrao.workflow.retificacao,
        ...(config.workflow?.retificacao || {}),
      },
    },
    expiracao: {
      ...configPadrao.expiracao,
      ...(config.expiracao || {}),
      receptores: {
        ...configPadrao.expiracao.receptores,
        ...(config.expiracao?.receptores || {}),
      },
    },
    lembrete: {
      ...configPadrao.lembrete,
      ...(config.lembrete || {}),
    },
  };
}

function SectionTitle({ icon, label }) {
  return (
    <div style={sectionTitle}>
      <span style={{ color: "#2563eb", fontSize: 18 }}>{icon}</span>
      <span style={sectionTitleText}>{label}</span>
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={fieldLabel}>{children}</div>;
}

function SelectField({ value, onChange, options, disabled }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...selectStyle,
          opacity: disabled ? 0.7 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <span style={selectArrow}>▼</span>
    </div>
  );
}

function TemplateField({ value, onChange, disabled }) {
  return (
    <textarea
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      rows={5}
      style={{
        ...textareaStyle,
        opacity: disabled ? 0.7 : 1,
        cursor: disabled ? "not-allowed" : "text",
      }}
    />
  );
}

function ConfigurarNotificacoes() {
  const navigate = useNavigate();

  const [config, setConfig] = useState(configPadrao);
  const [loading, setLoading] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [dataAtualizacao, setDataAtualizacao] = useState(null);

  useEffect(() => {
    carregarConfiguracao();
  }, []);

  async function carregarConfiguracao() {
    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const response = await api.get("/notificacoes/config");

      const configRecebida = response.data?.config || response.data;

      setConfig(normalizarConfig(configRecebida));
      setDataAtualizacao(response.data?.data_atualizacao || null);
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
      console.error("STATUS:", error.response?.status);
      console.error("BODY:", error.response?.data);

      setErro(
        error.response?.data?.error ||
          "Não foi possível carregar a configuração de notificações."
      );

      setConfig(configPadrao);
    } finally {
      setLoading(false);
    }
  }

  function setWorkflow(campo, subcampo, valor) {
    setConfig((prev) => ({
      ...prev,
      workflow: {
        ...prev.workflow,
        [campo]: {
          ...prev.workflow[campo],
          [subcampo]: valor,
        },
      },
    }));

    limparMensagens();
  }

  function setExpiracao(campo, valor) {
    setConfig((prev) => ({
      ...prev,
      expiracao: {
        ...prev.expiracao,
        [campo]: valor,
      },
    }));

    limparMensagens();
  }

  function setReceptor(key, valor) {
    setConfig((prev) => ({
      ...prev,
      expiracao: {
        ...prev.expiracao,
        receptores: {
          ...prev.expiracao.receptores,
          [key]: valor,
        },
      },
    }));

    limparMensagens();
  }

  function setLembrete(campo, valor) {
    setConfig((prev) => ({
      ...prev,
      lembrete: {
        ...prev.lembrete,
        [campo]: valor,
      },
    }));

    limparMensagens();
  }

  function limparMensagens() {
    setErro("");
    setSucesso("");
  }

  function validarConfig() {
    const workflow = config.workflow;

    if (
      workflow.aprovacao.status === "Ativado" &&
      !workflow.aprovacao.template.trim()
    ) {
      return "O template de aprovação não pode estar vazio.";
    }

    if (
      workflow.rejeicao.status === "Ativado" &&
      !workflow.rejeicao.template.trim()
    ) {
      return "O template de rejeição não pode estar vazio.";
    }

    if (
      workflow.retificacao.status === "Ativado" &&
      !workflow.retificacao.template.trim()
    ) {
      return "O template de retificação não pode estar vazio.";
    }

    return "";
  }

  async function handleGuardar() {
    const erroValidacao = validarConfig();

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    try {
      setAGuardar(true);
      setErro("");
      setSucesso("");

      const response = await api.put("/notificacoes/config", config);

      setConfig(normalizarConfig(response.data?.config || config));
      setDataAtualizacao(response.data?.data_atualizacao || null);
      setSucesso("Configuração de notificações guardada com sucesso.");
    } catch (error) {
      console.error("Erro ao guardar configuração:", error);
      console.error("STATUS:", error.response?.status);
      console.error("BODY:", error.response?.data);

      setErro(
        error.response?.data?.error ||
          "Não foi possível guardar a configuração de notificações."
      );
    } finally {
      setAGuardar(false);
    }
  }

  const statusOpts = ["Ativado", "Desativado"];
  const diasExpiracaoOpts = ["7", "14", "30", "60", "90"];
  const frequenciaOpts = ["Diariamente", "Semanalmente", "Mensalmente"];
  const diasPrazoOpts = ["3", "5", "7", "14", "30"];

  const disabled = loading || aGuardar;

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
              <h5 style={pageTitle}>Configurar notificações</h5>

              {dataAtualizacao && (
                <div style={pageSubtitle}>
                  Última atualização:{" "}
                  {new Date(dataAtualizacao).toLocaleString("pt-PT")}
                </div>
              )}
            </div>

            <button
              onClick={handleGuardar}
              disabled={disabled}
              style={{
                ...saveButton,
                opacity: disabled ? 0.7 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <BiSave size={16} />
              {aGuardar ? "A guardar..." : "Guardar alterações"}
            </button>
          </div>

          {loading && <div style={infoBox}>A carregar configuração...</div>}
          {erro && <div style={errorBox}>{erro}</div>}
          {sucesso && <div style={successBox}>{sucesso}</div>}

          <div style={card}>
            <SectionTitle
              icon={<BiUserCircle size={20} />}
              label="Workflow"
            />

            <div style={workflowGrid}>
              <div>
                <FieldLabel>Aprovação</FieldLabel>

                <SelectField
                  value={config.workflow.aprovacao.status}
                  onChange={(value) =>
                    setWorkflow("aprovacao", "status", value)
                  }
                  options={statusOpts}
                  disabled={disabled}
                />

                <div style={{ marginTop: 14 }}>
                  <FieldLabel>Template</FieldLabel>

                  <TemplateField
                    value={config.workflow.aprovacao.template}
                    onChange={(value) =>
                      setWorkflow("aprovacao", "template", value)
                    }
                    disabled={disabled}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Rejeição</FieldLabel>

                <SelectField
                  value={config.workflow.rejeicao.status}
                  onChange={(value) =>
                    setWorkflow("rejeicao", "status", value)
                  }
                  options={statusOpts}
                  disabled={disabled}
                />

                <div style={{ marginTop: 14 }}>
                  <FieldLabel>Template</FieldLabel>

                  <TemplateField
                    value={config.workflow.rejeicao.template}
                    onChange={(value) =>
                      setWorkflow("rejeicao", "template", value)
                    }
                    disabled={disabled}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Retificação</FieldLabel>

                <SelectField
                  value={config.workflow.retificacao.status}
                  onChange={(value) =>
                    setWorkflow("retificacao", "status", value)
                  }
                  options={statusOpts}
                  disabled={disabled}
                />

                <div style={{ marginTop: 14 }}>
                  <FieldLabel>Template</FieldLabel>

                  <TemplateField
                    value={config.workflow.retificacao.template}
                    onChange={(value) =>
                      setWorkflow("retificacao", "template", value)
                    }
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={card}>
            <SectionTitle icon={<BiEnvelope size={20} />} label="Tempo e expiração" />

            <div style={expirationGrid}>
              <div style={column}>
                <div>
                  <FieldLabel>Alerta de expiração de badges</FieldLabel>

                  <SelectField
                    value={config.expiracao.alertaStatus}
                    onChange={(value) =>
                      setExpiracao("alertaStatus", value)
                    }
                    options={statusOpts}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <FieldLabel>Enviar alerta [X] dias antes da expiração</FieldLabel>

                  <SelectField
                    value={config.expiracao.diasAntesExpiracao}
                    onChange={(value) =>
                      setExpiracao("diasAntesExpiracao", value)
                    }
                    options={diasExpiracaoOpts}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <FieldLabel>Recetor da notificação:</FieldLabel>

                  <div style={checkboxBox}>
                    <label style={checkboxLine}>
                      <span>Consultor (Padrão)</span>

                      <input
                        type="checkbox"
                        checked={config.expiracao.receptores.consultor}
                        disabled={disabled}
                        onChange={(e) =>
                          setReceptor("consultor", e.target.checked)
                        }
                        style={checkboxStyle}
                      />
                    </label>

                    <label style={checkboxLine}>
                      <span>Talent Manager</span>

                      <input
                        type="checkbox"
                        checked={config.expiracao.receptores.talentManager}
                        disabled={disabled}
                        onChange={(e) =>
                          setReceptor("talentManager", e.target.checked)
                        }
                        style={checkboxStyle}
                      />
                    </label>

                    <label style={checkboxLine}>
                      <span>Service Line Leader</span>

                      <input
                        type="checkbox"
                        checked={
                          config.expiracao.receptores.serviceLineLeader
                        }
                        disabled={disabled}
                        onChange={(e) =>
                          setReceptor(
                            "serviceLineLeader",
                            e.target.checked
                          )
                        }
                        style={checkboxStyle}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div style={column}>
                <div>
                  <FieldLabel>Lembrete de objetivos</FieldLabel>

                  <SelectField
                    value={config.lembrete.status}
                    onChange={(value) => setLembrete("status", value)}
                    options={statusOpts}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <FieldLabel>Frequência do lembrete</FieldLabel>

                  <SelectField
                    value={config.lembrete.frequencia}
                    onChange={(value) => setLembrete("frequencia", value)}
                    options={frequenciaOpts}
                    disabled={disabled}
                  />
                </div>

                <div>
                  <FieldLabel>Enviar lembrete [X] dias antes do prazo final</FieldLabel>

                  <SelectField
                    value={config.lembrete.diasAntesPrazo}
                    onChange={(value) =>
                      setLembrete("diasAntesPrazo", value)
                    }
                    options={diasPrazoOpts}
                    disabled={disabled}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        <AdminRightSidebar />
      </div>
    </div>
  );
}

export default ConfigurarNotificacoes;

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
  alignItems: "center",
  marginBottom: 24,
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

const saveButton = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "8px 20px",
  fontSize: 13,
  fontWeight: 600,
};

const card = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "24px 28px",
  marginBottom: 20,
};

const sectionTitle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 20,
};

const sectionTitleText = {
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
};

const fieldLabel = {
  fontSize: 12,
  color: "#6b7280",
  fontWeight: 500,
  marginBottom: 6,
};

const workflowGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 20,
};

const expirationGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 32,
};

const column = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const selectStyle = {
  width: "100%",
  height: 42,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "0 36px 0 12px",
  fontSize: 14,
  color: "#111827",
  background: "white",
  outline: "none",
  appearance: "none",
};

const selectArrow = {
  position: "absolute",
  right: 12,
  top: "50%",
  transform: "translateY(-50%)",
  pointerEvents: "none",
  color: "#6b7280",
  fontSize: 12,
};

const textareaStyle = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: 12,
  fontSize: 13,
  color: "#374151",
  resize: "vertical",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  lineHeight: 1.6,
};

const checkboxBox = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "10px 14px",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const checkboxLine = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: 13,
  color: "#374151",
  cursor: "pointer",
};

const checkboxStyle = {
  width: 16,
  height: 16,
  accentColor: "#2563eb",
  cursor: "pointer",
};

const infoBox = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  color: "#1d4ed8",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 13,
  marginBottom: 12,
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