import React, { useEffect, useMemo, useState } from "react";
// Assumindo que usas react-bootstrap devido aos componentes <Card> e <Button> do teu código original
import { Card, Button } from "react-bootstrap"; 
import { BiCopy, BiSave, BiRefresh } from "react-icons/bi";
import { useNavigate } from "react-router-dom";

import Header from "../../components/Header.jsx";
import TmLeftSidebar from "../../components/TM_LeftBar.jsx";
import TmRightSidebar from "../../components/TM_RightBar.jsx";
import api from "../../services/api.js";

function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function tornarUrlAbsoluta(url) {
  if (!url) return "";
  const valor = String(url).trim();
  if (valor.startsWith("http://") || valor.startsWith("https://") || valor.startsWith("data:image/")) {
    return valor;
  }
  return valor;
}

function obterIdBadge(badge) {
  return badge?.id || badge?.id_badge_modelo || badge?.badge_id || null;
}

function removerDuplicados(lista) {
  const mapa = new Map();
  (lista || []).forEach((badge) => {
    const idBadge = obterIdBadge(badge);
    if (!idBadge) return;
    const existente = mapa.get(String(idBadge));
    if (!existente) {
      mapa.set(String(idBadge), {
        ...badge,
        id: idBadge,
        nome: badge.nome || badge.nome_badge || "Badge",
        descricao: badge.descricao || badge.descricao_badge_modelo || "",
        imagem: badge.imagem|| badge.imagem || badge.imagem || null,
      });
      return;
    }
    mapa.set(String(idBadge), {
      ...existente,
      ...badge,
      nome: existente.nome || badge.nome || badge.nome_badge || "Badge",
      imagem: existente.imagem || badge.imagem || badge.imagem || badge.imagem || null,
    });
  });
  return Array.from(mapa.values());
}

function obterUserId(user) {
  return user?.id_utilizador || user?.ID_UTILIZADOR || user?.id || null;
}

const CONFIG_PADRAO = {
  template: "completo",
  mostrarNome: true,
  mostrarCargo: true,
  mostrarEmail: true,
  mostrarLogoSoftinsa: true,
  mostrarImagemBadge: true,
  mostrarLinkBadge: true,
  mostrarVariosBadges: false,
  limiteBadges: 3,
  badgePrincipalId: "",
  badgesSelecionadosIds: [],
};

export default function ConfiguracaoAssinaturaPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState([]);
  const [config, setConfig] = useState(CONFIG_PADRAO);
  const [copiado, setCopiado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const storageKey = useMemo(() => {
    const id = obterUserId(user);
    return id ? `softinsa_email_signature_template_${id}` : "softinsa_email_signature_template";
  }, [user]);

  // ATUALIZADO: Agora carrega os teus dados assincronamente a partir do teu novo controller do Backend
  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          navigate("/login");
          return;
        }

        const userData = JSON.parse(storedUser);
        const userId = obterUserId(userData);
        if (!userId) {
          navigate("/login");
          return;
        }

        setUser(userData);

        // Chamada real à API utilizando o endpoint do teu router: /api/badges/conquistados/:id
        try {
          const resposta = await api.get(`/badges/conquistados/${userId}`);
          console.log("Resposta API:", resposta.data);
          const badgesTratados = removerDuplicados(resposta.data);
          console.log("Badges tratados:", badgesTratados);
          setBadges(badgesTratados);
        } catch (apiErr) {
          console.error("Erro ao ir buscar os badges à API:", apiErr);
          setBadges([]);
        }

        const guardada = localStorage.getItem(`softinsa_email_signature_template_${userId}`);
        let configInicial = CONFIG_PADRAO;

        if (guardada) {
          configInicial = { ...CONFIG_PADRAO, ...JSON.parse(guardada) };
        }

        setConfig(configInicial);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, [navigate]);

  const dadosAssinatura = useMemo(() => {
    return {
      nome: user?.nome_completo || user?.nome || "Consultor/a Softinsa",
      email: user?.email_softinsa || user?.email || "",
      cargo: user?.departamento || user?.tipo_utilizador || "Consultor/a",
    };
  }, [user]);

  // ATUALIZADO: Filtra o badge correspondente que está guardado no teu estado de configurações
  const badgesSelecionados = useMemo(() => {
    if (!config.badgePrincipalId) return [];
    return badges.filter((b) => String(obterIdBadge(b)) === String(config.badgePrincipalId));
  }, [badges, config.badgePrincipalId]);

  const atualizarConfig = (campo, valor) => {
    setConfig((anterior) => ({ ...anterior, [campo]: valor }));
    setGuardado(false);
  };

  const obterUrlBadge = (badge) => {
    const userId = obterUserId(user);
    const idBadge = obterIdBadge(badge);
    return userId && idBadge ? `https://teudominio.com/badges/${userId}/${idBadge}` : "";
  };

  const gerarAssinaturaTexto = () => {
    const lines = [];
    if (config.mostrarNome) lines.push(dadosAssinatura.nome);
    if (config.mostrarCargo) lines.push(dadosAssinatura.cargo);
    if (config.mostrarEmail && dadosAssinatura.email) lines.push(dadosAssinatura.email);
    
    // Opcional: Adiciona o nome do Badge e link de validação ao texto simples caso configurado
    if (config.mostrarLinkBadge && badgesSelecionados.length > 0) {
      badgesSelecionados.forEach(badge => {
        lines.push(`Badge: ${badge.nome} - ${obterUrlBadge(badge)}`);
      });
    }

    return lines.filter(Boolean).join("\n");
  };

  const copiarAssinatura = async () => {
    try {
      const texto = gerarAssinaturaTexto();
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch (err) {
      console.error("Erro ao copiar: ", err);
    }
  };

  const guardarTemplate = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(config));
      setGuardado(true);
      setTimeout(() => setGuardado(false), 1800);
    } catch (err) {
      console.error("Erro ao guardar no localStorage", err);
    }
  };

  const reporTemplate = () => {
    setConfig(CONFIG_PADRAO);
  };

  if (loading) {
    return <div style={{ padding: 20 }}>A carregar...</div>;
  }

  return (
    <div style={page}>
      <Header />

      <div style={layout}>
        <TmLeftSidebar />

        <main style={main}>
          <button type="button" style={backButton} onClick={() => navigate(-1)}>
            Voltar
          </button>

          <header style={pageHeader}>
            <div>
              <span style={eyebrow}>Configurações</span>
              <h1 style={title}>Assinatura de E-mail</h1>
              <p style={subtitle}>Gere e personalize a sua assinatura para clientes de e-mail.</p>
            </div>
          </header>

          <div style={grid}>
            <div style={leftColumn}>
              {/* Opções de Template */}
              <Card className="border-0" style={{ ...card, marginBottom: 20 }}>
                <Card.Body>
                  <h5 style={sectionTitle}>Selecione o Template</h5>
                  <div style={templateGrid}>
                    <TemplateOption
                      title="Simples"
                      description="Nome, cargo e um badge principal."
                      active={config.template === "simples"}
                      onClick={() => atualizarConfig("template", "simples")}
                    />
                    <TemplateOption
                      title="Completo"
                      description="Dados pessoais, badge e links públicos."
                      active={config.template === "completo"}
                      onClick={() => atualizarConfig("template", "completo")}
                    />
                  </div>
                </Card.Body>
              </Card>

              {/* Opções de Checkbox */}
              <Card className="border-0" style={card}>
                <Card.Body>
                  <h5 style={sectionTitle}>Opções de visualização</h5>
                  <div style={checksGrid}>
                    <CheckOption
                      label="Mostrar Nome"
                      checked={config.mostrarNome}
                      onChange={(val) => atualizarConfig("mostrarNome", val)}
                    />
                    <CheckOption
                      label="Mostrar Cargo"
                      checked={config.mostrarCargo}
                      onChange={(val) => atualizarConfig("mostrarCargo", val)}
                    />
                    <CheckOption
                      label="Mostrar Email"
                      checked={config.mostrarEmail}
                      onChange={(val) => atualizarConfig("mostrarEmail", val)}
                    />
                  </div>
                </Card.Body>
              </Card>

              {/* INCLUÍDO: Seleção Dinâmica do Badge Conquistado */}
              {badges.length > 0 && (
                <Card className="border-0" style={{ ...card, marginTop: 20 }}>
                  <Card.Body>
                    <h5 style={sectionTitle}>Escolha o seu Badge Conquistado</h5>
                    <select
                      value={config.badgePrincipalId}
                      onChange={(e) => atualizarConfig("badgePrincipalId", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        backgroundColor: "#f8fafc",
                        fontSize: "13px",
                        color: "#374151",
                        outline: "none",
                        cursor: "pointer"
                      }}
                    >
                      <option value="">-- Selecione um Badge para a Assinatura --</option>
                      {badges.map((badge) => (
                        <option key={obterIdBadge(badge)} value={obterIdBadge(badge)}>
                          {badge.nome} ({badge.nome_nivel || "Sem Nível"})
                        </option>
                      ))}
                    </select>
                  </Card.Body>
                </Card>
              )}
            </div>

            {/* Coluna Direita (Ações e Textarea) */}
            <aside style={rightColumn}>
              <Card className="border-0" style={{ ...card, marginBottom: 20 }}>
                <Card.Body>
                  <div style={actions}>
                    <Button style={primaryButton} onClick={copiarAssinatura}>
                      <BiCopy size={17} />
                      {copiado ? "Copiado!" : "Copiar assinatura"}
                    </Button>

                    <Button variant="light" style={secondaryButton} onClick={guardarTemplate}>
                      <BiSave size={17} />
                      {guardado ? "Guardado!" : "Guardar template"}
                    </Button>

                    <Button variant="light" style={secondaryButton} onClick={reporTemplate}>
                      <BiRefresh size={17} />
                      Repor
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              <Card className="border-0" style={card}>
                <Card.Body>
                  <h5 style={sectionTitle}>Texto simples</h5>

                  <textarea
                    readOnly
                    value={gerarAssinaturaTexto()}
                    style={textarea}
                  />

                  <p style={smallInfo}>
                    Usa esta versão se o cliente de e-mail não aceitar HTML.
                  </p>
                </Card.Body>
              </Card>
            </aside>
          </div>
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

function TemplateOption({ active, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...templateOption,
        borderColor: active ? "#2563eb" : "#e5e7eb",
        background: active ? "#eff6ff" : "white",
      }}
    >
      <div style={templateTitle}>{title}</div>
      <div style={templateDescription}>{description}</div>
    </button>
  );
}

function CheckOption({ label, checked, onChange }) {
  return (
    <label style={checkOption}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

const page = {
  backgroundColor: "#f0f2f5",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};

const layout = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const main = {
  flex: 1,
  overflowY: "auto",
  padding: "24px 28px 40px",
};

const backButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  gap: 7,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  marginBottom: 14,
};

const pageHeader = {
  background: "linear-gradient(135deg, #4470AF, #2563eb)",
  color: "white",
  borderRadius: 16,
  padding: 24,
  marginBottom: 22,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
};

const eyebrow = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.8,
  opacity: 0.85,
  fontWeight: 700,
  marginBottom: 4,
};

const title = {
  fontSize: 25,
  fontWeight: 650,
  margin: 0,
};

const subtitle = {
  fontSize: 14,
  opacity: 0.9,
  margin: "8px 0 0",
  maxWidth: 720,
  lineHeight: 1.55,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 430px",
  gap: 22,
  alignItems: "start",
};

const leftColumn = {
  minWidth: 0,
};

const rightColumn = {
  minWidth: 0,
};

const card = {
  borderRadius: 14,
  boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
};

const sectionTitle = {
  fontSize: 16,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 12,
};

const templateGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 12,
};

const templateOption = {
  border: "1.5px solid #e5e7eb",
  borderRadius: 12,
  padding: 14,
  textAlign: "left",
  cursor: "pointer",
  width: "100%",
};

const templateTitle = {
  fontSize: 14,
  fontWeight: 600,
  color: "#111827",
  marginBottom: 5,
};

const templateDescription = {
  fontSize: 12,
  color: "#64748b",
  lineHeight: 1.45,
};

const checksGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 10,
};

const checkOption = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "#374151",
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "10px 12px",
  cursor: "pointer",
};

const actions = {
  display: "flex",
  flexDirection: "column",
  gap: 9,
};

const primaryButton = {
  background: "#2563eb",
  border: "none",
  borderRadius: 999,
  padding: "10px 18px",
  fontWeight: 400,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  color: "white",
};

const secondaryButton = {
  border: "1px solid #dbe3ef",
  borderRadius: 999,
  padding: "10px 18px",
  fontWeight: 400,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const textarea = {
  width: "100%",
  minHeight: 170,
  border: "1px solid #d1d5db",
  borderRadius: 10,
  padding: 12,
  fontSize: 12,
  color: "#475569",
  outline: "none",
  resize: "vertical",
};

const smallInfo = {
  marginTop: 10,
  color: "#64748b",
  fontSize: 12,
  lineHeight: 1.5,
};