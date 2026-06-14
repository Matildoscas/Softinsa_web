import { useEffect, useState } from "react";
import {
  BiArrowBack,
  BiChevronDown,
  BiPlus,
  BiBuildings,
  BiSave,
  BiX,
} from "react-icons/bi";
import { useNavigate } from "react-router-dom";

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
  };
}

function normalizarBadge(b) {
  return {
    id:
      b.id_badge_modelo ||
      b.ID_BADGE_MODELO ||
      b.id ||
      "",

    nome:
      b.nome_badge ||
      b.NOME_BADGE ||
      b.nome ||
      "Badge sem nome",

    descricao:
      b.descricao_badge_modelo ||
      b.DESCRICAO_BADGE_MODELO ||
      b.descricao ||
      "Sem descrição.",

    pontos: Number(
      b.pontos ||
        b.PONTOS ||
        0
    ),

    numero_requisitos: Number(
      b.numero_requisitos ||
        b.NUMERO_REQUISITOS ||
        0
    ),

    requisitos: Array.isArray(b.requisitos)
      ? b.requisitos.map((r) => ({
          id:
            r.id_requisitos ||
            r.ID_REQUISITOS ||
            r.id ||
            "",

          nome:
            r.nome_requisito ||
            r.NOME_REQUISITO ||
            "Requisito",

          titulo:
            r.titulo ||
            r.TITULO ||
            "",

          descricao:
            r.descricao_requisito ||
            r.DESCRICAO_REQUISITO ||
            "",

          tipo:
            r.tipo_requisito ||
            r.TIPO_REQUISITO ||
            "",

          links: Array.isArray(r.links)
            ? r.links
            : [],
        }))
      : [],
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
          border: `1px solid ${erro ? "#fca5a5" : aberto ? "#2563eb" : "#d1d5db"}`,
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

function ConfigurarNiveisModal({
  niveis,
  badgesDisponiveis,
  onChange,
  onClose,
}) {
  function atualizarNivel(indexNivel, campo, valor) {
    const novos = niveis.map((nivel, i) =>
      i === indexNivel
        ? {
            ...nivel,
            [campo]: valor,
          }
        : nivel
    );

    onChange(novos);
  }

  function selecionarBadge(indexNivel, idBadge) {
    const badge = badgesDisponiveis.find(
      (b) => String(b.id) === String(idBadge)
    );

    const novos = niveis.map((nivel, i) =>
      i === indexNivel
        ? {
            ...nivel,
            id_badge_modelo: idBadge,
            badgeSelecionado: badge || null,
          }
        : nivel
    );

    onChange(novos);
  }

  function badgeJaUsado(idBadge, indexAtual) {
    return niveis.some(
      (nivel, i) =>
        i !== indexAtual && String(nivel.id_badge_modelo) === String(idBadge)
    );
  }

  return (
    <div style={modalOverlay}>
      <div style={modalCardLarge}>
        <button type="button" onClick={onClose} style={modalCloseButton}>
          <BiX size={22} />
        </button>

        <h3 style={modalTitle}>Configurar níveis e badges</h3>

        <p style={modalSubText}>
          Cada área tem sempre os níveis A, B, C, D e E. Escolhe um badge
          existente para cada nível. Os requisitos e links vêm automaticamente
          do badge selecionado.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {niveis.map((nivel, indexNivel) => (
            <div key={nivel.nome_nivel} style={nivelConfigBox}>
              <div style={nivelHeader}>
                <div style={nivelCodeBox}>{nivel.nome_nivel}</div>

                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Nome do nível</label>

                  <input
                    value={nivel.nome_nivel}
                    onChange={(e) =>
                      atualizarNivel(indexNivel, "nome_nivel", e.target.value)
                    }
                    placeholder="A, B, C, D ou E"
                    style={inputStyleNormal}
                  />
                </div>
              </div>

              <div style={badgeBox}>
                <div style={subSectionTitle}>Badge aplicado ao nível</div>

                <label style={labelStyle}>Escolher badge existente</label>

                <select
                  value={nivel.id_badge_modelo}
                  onChange={(e) =>
                    selecionarBadge(indexNivel, e.target.value)
                  }
                  style={inputStyleNormal}
                >
                  <option value="">Selecionar badge</option>

                  {badgesDisponiveis.map((badge) => (
                    <option
                      key={badge.id}
                      value={badge.id}
                      disabled={badgeJaUsado(badge.id, indexNivel)}
                    >
                      {badge.nome} — {badge.pontos} pts
                    </option>
                  ))}
                </select>

                {nivel.badgeSelecionado && (
                  <div style={badgePreviewBox}>
                    <div style={badgePreviewTitle}>
                      {nivel.badgeSelecionado.nome}
                    </div>

                    <div style={badgePreviewDescription}>
                      {nivel.badgeSelecionado.descricao}
                    </div>

                    <div style={badgePreviewMeta}>
                      Pontos:{" "}
                      <strong>{nivel.badgeSelecionado.pontos}</strong> ·
                      Requisitos:{" "}
                      <strong>
                        {nivel.badgeSelecionado.requisitos.length}
                      </strong>
                    </div>

                    <div style={subSectionTitle}>Requisitos deste badge</div>

                    {nivel.badgeSelecionado.requisitos.length > 0 ? (
                      nivel.badgeSelecionado.requisitos.map((req, i) => (
                        <div key={req.id || i} style={reqPreviewBox}>
                          <div style={reqPreviewTitle}>
                            {req.nome} — {req.titulo}
                          </div>

                          <div style={reqPreviewDescription}>
                            {req.descricao}
                          </div>

                          {req.links.length > 0 && (
                            <div style={{ marginTop: 6 }}>
                              {req.links.map((link, indexLink) => (
                                <div key={indexLink}>
                                  <a
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={reqLink}
                                  >
                                    {link}
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={emptySmallBox}>
                        Este badge ainda não tem requisitos associados.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={modalActions}>
          <button type="button" onClick={onClose} style={modalConfirmButton}>
            Confirmar configuração
          </button>
        </div>
      </div>
    </div>
  );
}

function CriarArea() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    tipo: "",
    estado: "ATIVO",
    id_serviceline: "",

    niveis: ["A", "B", "C", "D", "E"].map((codigo) => ({
        nome_nivel: codigo,
        estado_nivel: "ATIVO",
        id_badge_modelo: "",
        badgeSelecionado: null,
    })),
    });

  const [serviceLines, setServiceLines] = useState([]);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [isLoadingServiceLines, setIsLoadingServiceLines] = useState(true);
  const [aCriar, setACriar] = useState(false);
  const [modalNiveisAberta, setModalNiveisAberta] = useState(false);
  const [badgesDisponiveis, setBadgesDisponiveis] = useState([]);
 const [isLoadingBadges, setIsLoadingBadges] = useState(true);

  useEffect(() => {
    carregarDadosAuxiliares();
    }, []);

    async function carregarDadosAuxiliares() {
        try {
            setIsLoadingServiceLines(true);
            setIsLoadingBadges(true);
            setErroGeral("");

            const [serviceLinesRes, badgesRes] = await Promise.allSettled([
            api.get("/servicelines"),
            api.get("/badges/modelos-disponiveis"),
            ]);

            if (serviceLinesRes.status === "fulfilled") {
            const data = serviceLinesRes.value.data;

            const lista =
                Array.isArray(data)
                ? data
                : Array.isArray(data.servicelines)
                    ? data.servicelines
                    : Array.isArray(data.data)
                    ? data.data
                    : [];

            setServiceLines(lista.map(normalizarServiceLine));
            } else {
            console.error("Erro ao carregar Service Lines:", serviceLinesRes.reason);
            setServiceLines([]);
            setErroGeral("Não foi possível carregar as Service Lines.");
            }

            if (badgesRes.status === "fulfilled") {
            const data = badgesRes.value.data;

            const lista =
                Array.isArray(data)
                ? data
                : Array.isArray(data.badges)
                    ? data.badges
                    : Array.isArray(data.data)
                    ? data.data
                    : [];

            setBadgesDisponiveis(lista.map(normalizarBadge));
            } else {
            console.error("Erro ao carregar badges:", badgesRes.reason);
            setBadgesDisponiveis([]);
            setErroGeral("Não foi possível carregar os badges disponíveis.");
            }
        } finally {
            setIsLoadingServiceLines(false);
            setIsLoadingBadges(false);
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

    if (!form.id_serviceline) {
        novosErros.id_serviceline = "Seleciona uma Service Line.";
    }

    const niveisInvalidos = form.niveis.some((nivel) => {
        return (
            !nivel.nome_nivel ||
            !nivel.id_badge_modelo ||
            !nivel.badgeSelecionado
        );
        });

        if (niveisInvalidos) {
        novosErros.niveis =
            "Tens de escolher um badge existente para cada nível A, B, C, D e E.";
        }

        const badgesEscolhidos = form.niveis
        .map((n) => String(n.id_badge_modelo))
        .filter(Boolean);

        const existemRepetidos =
        new Set(badgesEscolhidos).size !== badgesEscolhidos.length;

        if (existemRepetidos) {
        novosErros.niveis =
            "Não podes usar o mesmo badge em mais do que um nível.";
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

        await api.post("/areas", {
        nome_area: form.nome.trim(),
        descricao_area: form.descricao.trim(),
        tipo_area: form.tipo.trim(),
        estado_area: normalizarEstadoArea(form.estado),
        id_serviceline: Number(form.id_serviceline),

        niveis: form.niveis.map((nivel) => ({
            nome_nivel: nivel.nome_nivel,
            estado_nivel: "ATIVO",
            id_badge_modelo: Number(nivel.id_badge_modelo),
        })),
        });

        setSucesso("Área, níveis e requisitos criados com sucesso.");

        setTimeout(() => {
        navigate("/admin/areas");
        }, 900);
    } catch (err) {
        console.error("Erro ao criar área:", err);
        console.error("STATUS:", err.response?.status);
        console.error("BODY:", err.response?.data);

        setErroGeral(
        err.response?.data?.error ||
            err.response?.data?.message ||
            "Não foi possível criar a área."
        );
    } finally {
        setACriar(false);
    }
    }

  function handleCancelar() {
    navigate("/admin/areas");
  }

  function handleCriarNiveis() {
    alert("Primeiro cria a área. Depois vais editar os níveis A, B, C, D e E desta área.");
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
              <h5 style={pageTitle}>Criar Área</h5>

              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                Preencha os dados da nova área
              </div>
            </div>
          </div>

          {erroGeral && <div style={errorBox}>{erroGeral}</div>}
          {sucesso && <div style={successBox}>{sucesso}</div>}

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
                placeholder="Descreva a área..."
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
                  Tipo de Área <span style={{ color: "#dc2626" }}>*</span>
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
                    e.target.style.borderColor = erros.tipo ? "#fca5a5" : "#d1d5db";
                  }}
                />

                {erros.tipo && <div style={fieldError}>{erros.tipo}</div>}
              </div>

              <div>
                <label style={labelStyle}>
                  Service Line <span style={{ color: "#dc2626" }}>*</span>
                </label>

                <SelectDropdown
                  options={serviceLines}
                  value={form.id_serviceline}
                  onChange={set("id_serviceline")}
                  placeholder={
                    isLoadingServiceLines
                      ? "A carregar Service Lines..."
                      : "Selecione a Service Line"
                  }
                  erro={erros.id_serviceline}
                />

                {erros.id_serviceline && (
                  <div style={fieldError}>{erros.id_serviceline}</div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
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

            <div>
              <label style={labelStyle}>Níveis</label>

              <div style={levelsBox}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                    Níveis da área
                  </div>

                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    Escolhe um badge existente para cada nível A, B, C, D e E.
                  </div>
                </div>

                <button
                    type="button"
                    onClick={() => setModalNiveisAberta(true)}
                    style={levelsButton}
                    >
                    <BiPlus size={16} />
                    Configurar Níveis e Requisitos
                </button>

                {erros.niveis && <div style={fieldError}>{erros.niveis}</div>}

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
              {aCriar ? "A criar..." : "Criar Área"}
            </button>
          </div>
        </div>

        <AdminRightSidebar />
      </div>

    {modalNiveisAberta && (
    <ConfigurarNiveisModal
        niveis={form.niveis}
        badgesDisponiveis={badgesDisponiveis}
        onChange={set("niveis")}
        onClose={() => setModalNiveisAberta(false)}
        />
    )}

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

const levelsBox = {
  border: "1px dashed #cbd5e1",
  background: "#f8fafc",
  borderRadius: 10,
  padding: 16,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  flexWrap: "wrap",
};

const levelsButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "9px 20px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
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

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: 20,
};

const modalCardLarge = {
  position: "relative",
  width: "100%",
  maxWidth: 900,
  maxHeight: "88vh",
  overflowY: "auto",
  background: "white",
  borderRadius: 18,
  padding: "28px 28px 24px",
  boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
  border: "1px solid #e5e7eb",
};

const modalCloseButton = {
  position: "absolute",
  top: 14,
  right: 14,
  width: 32,
  height: 32,
  borderRadius: "50%",
  border: "1px solid #e5e7eb",
  background: "white",
  color: "#6b7280",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const modalTitle = {
  fontSize: 20,
  fontWeight: 800,
  color: "#111827",
  margin: "0 0 6px",
  textAlign: "center",
};

const modalSubText = {
  fontSize: 13,
  color: "#6b7280",
  margin: "0 0 22px",
  lineHeight: 1.5,
  textAlign: "center",
};

const nivelConfigBox = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "#f8fafc",
  padding: 16,
};

const nivelHeader = {
  display: "flex",
  gap: 12,
  alignItems: "center",
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
  flexShrink: 0,
};

const subSectionTitle = {
  fontSize: 13,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 10,
};

const requisitoConfigBox = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 14,
  marginBottom: 12,
};

const requisitoHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 13,
  color: "#111827",
  marginBottom: 10,
};

const inputStyleNormal = {
  width: "100%",
  height: 40,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "0 12px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyleNormal = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: 10,
  fontSize: 14,
  resize: "vertical",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const removeReqButton = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#dc2626",
  padding: 2,
};

const addReqButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "white",
  color: "#2563eb",
  border: "1px dashed #93c5fd",
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 22,
};

const modalConfirmButton = {
  border: "none",
  background: "#2563eb",
  color: "white",
  borderRadius: 10,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const badgeBox = {
  background: "white",
  border: "1px solid #dbeafe",
  borderRadius: 10,
  padding: 14,
  marginTop: 14,
};

const badgePreviewBox = {
  marginTop: 14,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 12,
};

const badgePreviewTitle = {
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 4,
};

const badgePreviewDescription = {
  fontSize: 12,
  color: "#6b7280",
  lineHeight: 1.5,
  marginBottom: 8,
};

const badgePreviewMeta = {
  fontSize: 12,
  color: "#374151",
  marginBottom: 12,
};

const reqPreviewBox = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 10,
  marginBottom: 8,
};

const reqPreviewTitle = {
  fontSize: 12,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 4,
};

const reqPreviewDescription = {
  fontSize: 12,
  color: "#6b7280",
  lineHeight: 1.5,
};

const reqLink = {
  fontSize: 12,
  color: "#2563eb",
  textDecoration: "none",
  wordBreak: "break-all",
};

const emptySmallBox = {
  background: "white",
  border: "1px dashed #d1d5db",
  borderRadius: 8,
  padding: 12,
  fontSize: 12,
  color: "#9ca3af",
};

export default CriarArea;