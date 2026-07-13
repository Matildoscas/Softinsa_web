import { useEffect, useState } from "react";
import {
  BiArrowBack,
  BiEdit,
  BiSave,
  BiBook,
  BiBuildings,
  BiChevronDown,
  BiPlus,
  BiTrash,
  BiX,
} from "react-icons/bi";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../services/api.js";
import Header from "../../components/Header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

function normalizarEstadoArea(estado) {
  const e = String(estado || "").trim().toUpperCase();

  if (e === "ATIVO" || e === "ATIVA" || e === "ACTIVE") return "ATIVO";
  if (e === "INATIVO" || e === "INATIVA" || e === "INACTIVE") return "INATIVO";

  return "ATIVO";
}

function normalizarEstadoNivel(estado) {
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

function obterCodigoNivel(nomeNivel, index) {
  const nome = String(nomeNivel || "")
    .trim()
    .toUpperCase();

  const mapa = {
    A: "A",
    JÚNIOR: "A",
    JUNIOR: "A",

    B: "B",
    INTERMÉDIO: "B",
    INTERMEDIO: "B",

    C: "C",
    SÉNIOR: "C",
    SENIOR: "C",

    D: "D",
    ESPECIALISTA: "D",

    E: "E",
    "LÍDER DE CONHECIMENTO": "E",
    "LIDER DE CONHECIMENTO": "E",
  };

  return mapa[nome] || ["A", "B", "C", "D", "E"][index] || "";
}

/*function abrirTrocarBadge(nivel) {
  setNivelParaTrocarBadge(nivel);
  setBadgeSelecionadoId("");
  setModalBadgeAberta(true);
}

function fecharTrocarBadge() {
  if (aTrocarBadge) return;

  setModalBadgeAberta(false);
  setNivelParaTrocarBadge(null);
  setBadgeSelecionadoId("");
}

async function guardarTrocaBadge() {
  if (!nivelParaTrocarBadge || !badgeSelecionadoId) {
    setErroGeral("Seleciona um badge rascunho.");
    return;
  }

  try {
    setATrocarBadge(true);
    setErroGeral("");
    setSucesso("");

    await api.put(
      `/niveis/${nivelParaTrocarBadge.id_nivel}/badge`,
      {
        id_badge_modelo: Number(badgeSelecionadoId),
      }
    );

    setSucesso("Badge do nível atualizado com sucesso.");

    fecharTrocarBadge();
    await carregarDados();
  } catch (err) {
    console.error("Erro ao trocar badge do nível:", err);
    console.error("STATUS:", err.response?.status);
    console.error("BODY:", err.response?.data);

    setErroGeral(
      err.response?.data?.error ||
        "Não foi possível trocar o badge deste nível."
    );
  } finally {
    setATrocarBadge(false);
  }
}*/

function garantirArray(valor) {
  if (!valor) return [];

  if (Array.isArray(valor)) {
    return valor;
  }

  if (typeof valor === "string") {
    try {
      const parsed = JSON.parse(valor);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizarBadge(badge) {
  const requisitos = garantirArray(
    badge.requisitos ||
      badge.REQUISITOS ||
      badge.requisitosData ||
      []
  );

  return {
    id:
      badge.id ||
      badge.id_badge_modelo ||
      badge.ID_BADGE_MODELO ||
      "",

    nome:
      badge.nome ||
      badge.nome_badge ||
      badge.NOME_BADGE ||
      "Badge sem nome",

    descricao:
      badge.descricao ||
      badge.descricao_badge_modelo ||
      badge.DESCRICAO_BADGE_MODELO ||
      "",

    pontos: Number(
      badge.pontos ||
        badge.PONTOS ||
        0
    ),

    id_nivel:
      badge.id_nivel ||
      badge.ID_NIVEL ||
      "",

    nome_nivel:
      badge.nome_nivel ||
      badge.NOME_NIVEL ||
      "",

    codigo_nivel:
      badge.codigo_nivel ||
      obterCodigoNivel(
        badge.nome_nivel ||
          badge.NOME_NIVEL ||
          "",
        0
      ),

    requisitos: requisitos.map((req, index) => ({
      id:
        req.id ||
        req.id_requisitos ||
        req.ID_REQUISITOS ||
        index,

      titulo:
        req.titulo ||
        req.nome_requisito ||
        req.NOME_REQUISITO ||
        `Requisito ${index + 1}`,

      nome:
        req.nome_requisito ||
        req.titulo ||
        req.NOME_REQUISITO ||
        `Requisito ${index + 1}`,

      descricao:
        req.descricao ||
        req.descricao_requisito ||
        req.DESCRICAO_REQUISITO ||
        "",
    })),
  };
}

function normalizarNivel(n, index = 0) {
  const nomeNivel =
    n.nome_nivel ||
    n.NOME_NIVEL ||
    "";

  return {
    id_nivel:
      n.id_nivel ||
      n.ID_NIVEL ||
      "",

    nome_nivel: nomeNivel,

    codigo_nivel: obterCodigoNivel(nomeNivel, index),

    estado_nivel:
      n.estado_nivel ||
      n.ESTADO_NIVEL ||
      "ATIVO",

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
      "Ainda não existe um badge associado a este nível.",

    pontos: Number(
      n.pontos ||
      n.PONTOS ||
      0
    ),

    total_requisitos: Number(
      n.total_requisitos ||
      n.numero_requisitos ||
      n.NUMERO_REQUISITOS ||
      (Array.isArray(n.requisitos) ? n.requisitos.length : 0)
    ),

    requisitos: Array.isArray(n.requisitos)
      ? n.requisitos
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

function NivelCard({
  nivel,
  areaId,
  onEditarRequisitos,
  onEditarNivel,
  onDesativarNivel,
  onTrocarBadge,
}) {
  const estadoNormalizado = normalizarEstadoNivel(nivel.estado_nivel);
  const estaInativo = estadoNormalizado === "INATIVO";
  return (
    <div style={nivelCard}>
      <div style={nivelCodeBox}>{nivel.codigo_nivel}</div>

      <div style={nivelTitle}>
        Nível {nivel.codigo_nivel} — {nivel.nome_nivel}
      </div>

      <span
        style={{
          ...nivelEstadoBadge,
          background: estaInativo ? "#fee2e2" : "#dcfce7",
          color: estaInativo ? "#b91c1c" : "#15803d",
        }}
      >
        {estaInativo ? "Inativo" : "Ativo"}
      </span>

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: nivel.id_badge_modelo ? "#2563eb" : "#9ca3af",
        }}
      >
        {nivel.nome_badge}
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
        onClick={() => onTrocarBadge(nivel)}
        style={editNivelButton}
      >
        <BiEdit size={15} />
        Trocar badge
      </button>

      <button
        type="button"
        onClick={() => onEditarRequisitos(nivel)}
        style={nivelSmallButton}
      >
        <BiEdit size={14} />
        Editar requisitos
      </button>

      <div style={nivelActionsRow}>
        <button
          type="button"
          onClick={() => onEditarNivel(nivel)}
          style={nivelSmallButton}
        >
          <BiEdit size={14} />
          Editar nível
        </button>

        <button
          type="button"
          onClick={() => onDesativarNivel(nivel)}
          disabled={estaInativo}
          style={{
            ...nivelDangerButton,
            opacity: estaInativo ? 0.45 : 1,
            cursor: estaInativo ? "not-allowed" : "pointer",
          }}
        >
          <BiTrash size={14} />
          Desativar
        </button>
      </div>
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
  const [modalNivelAberto, setModalNivelAberto] = useState(false);
  const [modoNivel, setModoNivel] = useState("criar");
  const [nivelSelecionado, setNivelSelecionado] = useState(null);
  const [badgesDisponiveis, setBadgesDisponiveis] = useState([]);
  const [modalBadgeAberta, setModalBadgeAberta] = useState(false);
  const [nivelParaTrocarBadge, setNivelParaTrocarBadge] = useState(null);
  const [badgeSelecionadoId, setBadgeSelecionadoId] = useState("");
  const [aTrocarBadge, setATrocarBadge] = useState(false);

  const [formNivel, setFormNivel] = useState({
    nome_nivel: "",
    estado_nivel: "ATIVO",
  });

  const [erroNivel, setErroNivel] = useState("");
  const [aGuardarNivel, setAGuardarNivel] = useState(false);

  const [modalDesativarNivelAberta, setModalDesativarNivelAberta] =
    useState(false);

  const [aDesativarNivel, setADesativarNivel] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [id]);

  async function carregarDados() {
    try {
      setIsLoading(true);
      setErroGeral("");

      const [areaRes, serviceLinesRes, niveisRes, badgesRes] = await Promise.all([
        api.get(`/areas/${id}`),
        api.get("/servicelines/select"),
        api.get(`/areas/${id}/niveis`),
        api.get("/badges/modelos-disponiveis"),
      ]);

      const badgesData = badgesRes.data;

      const listaBadges =
        Array.isArray(badgesData)
          ? badgesData
          : Array.isArray(badgesData.badges)
            ? badgesData.badges
            : Array.isArray(badgesData.data)
              ? badgesData.data
              : [];

      setBadgesDisponiveis(listaBadges.map(normalizarBadge));

      const areaData = areaRes.data?.area || areaRes.data;

      setForm({
        nome: areaData.nome_area || "",
        descricao: areaData.descricao_area || "",
        estado: normalizarEstadoArea(areaData.estado_area),
        id_serviceline: areaData.id_serviceline || "",
      });

      const niveisData = niveisRes.data;

      const listaNiveis = Array.isArray(niveisData)
        ? niveisData
        : Array.isArray(niveisData?.niveis)
          ? niveisData.niveis
          : [];

      console.log("ID DA ÁREA:", id);
      console.log("RESPOSTA DOS NÍVEIS:", niveisRes.data);
      console.log("LISTA DE NÍVEIS:", listaNiveis);

      setNiveis(
        listaNiveis.map((nivel, index) =>
          normalizarNivel(nivel, index)
        )
      );

      const slData = serviceLinesRes.data;

      const listaServiceLines = Array.isArray(slData)
        ? slData
        : Array.isArray(slData?.servicelines)
          ? slData.servicelines
          : Array.isArray(slData?.data)
            ? slData.data
            : [];

      setServiceLines(listaServiceLines.map(normalizarServiceLine));
    } catch (err) {
      console.error("Erro ao carregar área:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErroGeral(
        err.response?.data?.error ||
          "Não foi possível carregar a área, os níveis ou as Service Lines."
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

  function abrirTrocarBadge(nivel) {
    setNivelParaTrocarBadge(nivel);
    setBadgeSelecionadoId("");
    setErroGeral("");
    setSucesso("");
    setModalBadgeAberta(true);
  }

  function fecharTrocarBadge() {
    if (aTrocarBadge) return;

    setModalBadgeAberta(false);
    setNivelParaTrocarBadge(null);
    setBadgeSelecionadoId("");
  }

  async function guardarTrocaBadge() {
    if (!nivelParaTrocarBadge || !badgeSelecionadoId) {
      setErroGeral("Seleciona um badge rascunho.");
      return;
    }

    try {
      setATrocarBadge(true);
      setErroGeral("");
      setSucesso("");

      await api.put(
        `/niveis/${nivelParaTrocarBadge.id_nivel}/badge`,
        {
          id_badge_modelo: Number(badgeSelecionadoId),
        }
      );

      setSucesso("Badge do nível atualizado com sucesso.");

      setModalBadgeAberta(false);
      setNivelParaTrocarBadge(null);
      setBadgeSelecionadoId("");

      await carregarDados();
    } catch (err) {
      console.error("Erro ao trocar badge do nível:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErroGeral(
        err.response?.data?.error ||
          "Não foi possível trocar o badge deste nível."
      );
    } finally {
      setATrocarBadge(false);
    }
  }

  function abrirCriarNivel() {
    setModoNivel("criar");
    setNivelSelecionado(null);
    setFormNivel({
      nome_nivel: "",
      estado_nivel: "ATIVO",
    });
    setErroNivel("");
    setModalNivelAberto(true);
  }

  function abrirEditarNivel(nivel) {
    setModoNivel("editar");
    setNivelSelecionado(nivel);
    setFormNivel({
      nome_nivel: nivel.nome_nivel || "",
      estado_nivel: normalizarEstadoNivel(nivel.estado_nivel),
    });
    setErroNivel("");
    setModalNivelAberto(true);
  }

  function fecharModalNivel() {
    if (aGuardarNivel) return;

    setModalNivelAberto(false);
    setNivelSelecionado(null);
    setErroNivel("");
  }

  async function guardarNivel() {
    if (!formNivel.nome_nivel.trim()) {
      setErroNivel("O nome do nível é obrigatório.");
      return;
    }

    try {
      setAGuardarNivel(true);
      setErroNivel("");
      setErroGeral("");
      setSucesso("");

      if (modoNivel === "criar") {
        const res = await api.post(`/areas/${id}/niveis`, {
          nome_nivel: formNivel.nome_nivel.trim(),
          estado_nivel: normalizarEstadoNivel(formNivel.estado_nivel),
        });

        const novoNivel = res.data?.nivel || res.data;

        setNiveis((prev) => [
          ...prev,
          normalizarNivel(novoNivel, prev.length),
        ]);

        setSucesso("Nível criado com sucesso.");
      } else {
        const res = await api.put(`/niveis/${nivelSelecionado.id_nivel}`, {
          nome_nivel: formNivel.nome_nivel.trim(),
          estado_nivel: normalizarEstadoNivel(formNivel.estado_nivel),
        });

        const nivelAtualizado = res.data?.nivel || res.data;

        setNiveis((prev) =>
          prev.map((nivel, index) =>
            String(nivel.id_nivel) === String(nivelSelecionado.id_nivel)
              ? normalizarNivel(
                  {
                    ...nivel,
                    ...nivelAtualizado,
                    nome_nivel:
                      nivelAtualizado.nome_nivel ||
                      formNivel.nome_nivel.trim(),
                    estado_nivel:
                      nivelAtualizado.estado_nivel ||
                      normalizarEstadoNivel(formNivel.estado_nivel),
                  },
                  index
                )
              : nivel
          )
        );

        setSucesso("Nível updated com sucesso.");
      }

      fecharModalNivel();
    } catch (err) {
      console.error("Erro ao guardar nível:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErroNivel(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Não foi possível guardar o nível."
      );
    } finally {
      setAGuardarNivel(false);
    }
  }

  function abrirModalDesativarNivel(nivel) {
    if (normalizarEstadoNivel(nivel.estado_nivel) === "INATIVO") {
      return;
    }

    setNivelSelecionado(nivel);
    setModalDesativarNivelAberta(true);
  }

  function fecharModalDesativarNivel() {
    if (aDesativarNivel) return;

    setNivelSelecionado(null);
    setModalDesativarNivelAberta(false);
  }

  async function confirmarDesativarNivel() {
    if (!nivelSelecionado) return;

    try {
      setADesativarNivel(true);
      setErroGeral("");
      setSucesso("");

      await api.put(`/niveis/${nivelSelecionado.id_nivel}/desativar`);

      setNiveis((prev) =>
        prev.map((nivel, index) =>
          String(nivel.id_nivel) === String(nivelSelecionado.id_nivel)
            ? normalizarNivel(
                {
                  ...nivel,
                  estado_nivel: "INATIVO",
                },
                index
              )
            : nivel
        )
      );

      setSucesso("Nível desativado com sucesso.");
      fecharModalDesativarNivel();
    } catch (err) {
      console.error("Erro ao desativar nível:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErroGeral(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Não foi possível desativar o nível."
      );
    } finally {
      setADesativarNivel(false);
    }
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
                <button
                  type="button"
                  onClick={abrirCriarNivel}
                  style={addNivelButton}
                >
                  <BiPlus size={17} />
                  Adicionar nível
                </button>
              </div>

              {niveis.length > 0 ? (
                <div style={gridNiveis}>
                  {niveis.map((nivel) => (
                    <NivelCard
                      key={nivel.id_nivel}
                      nivel={nivel}
                      areaId={id}
                      onEditarRequisitos={handleEditarRequisitos}
                      onEditarNivel={abrirEditarNivel}
                      onDesativarNivel={abrirModalDesativarNivel}
                      onTrocarBadge={abrirTrocarBadge}
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

      {modalNivelAberto && (
        <NivelModal
          modo={modoNivel}
          formNivel={formNivel}
          setFormNivel={setFormNivel}
          erro={erroNivel}
          loading={aGuardarNivel}
          onClose={fecharModalNivel}
          onGuardar={guardarNivel}
        />
      )}

      {modalDesativarNivelAberta && (
        <DesativarNivelModal
          nivel={nivelSelecionado}
          loading={aDesativarNivel}
          onClose={fecharModalDesativarNivel}
          onConfirm={confirmarDesativarNivel}
        />
      )}

      {modalBadgeAberta && (
        <TrocarBadgeModal
          nivel={nivelParaTrocarBadge}
          badgesDisponiveis={badgesDisponiveis}
          badgeSelecionadoId={badgeSelecionadoId}
          setBadgeSelecionadoId={setBadgeSelecionadoId}
          loading={aTrocarBadge}
          onClose={fecharTrocarBadge}
          onGuardar={guardarTrocaBadge}
        />
      )}

    </div>
  );
}

function TrocarBadgeModal({
  nivel,
  badgesDisponiveis,
  badgeSelecionadoId,
  setBadgeSelecionadoId,
  loading,
  onClose,
  onGuardar,
}) {
  if (!nivel) return null;

  const codigoNivel = obterCodigoNivel(
    nivel.nome_nivel,
    0
  );

  const badgesDoNivel = badgesDisponiveis.filter((badge) => {
    return String(badge.codigo_nivel || "")
      .trim()
      .toUpperCase() === String(codigoNivel || "")
      .trim()
      .toUpperCase();
  });

  const badgeSelecionado = badgesDoNivel.find(
    (badge) =>
      String(badge.id) === String(badgeSelecionadoId)
  );

  return (
    <div style={modalOverlay}>
      <div style={modalCardLarge}>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          style={modalCloseButton}
        >
          <BiX size={22} />
        </button>

        <h3 style={modalTitle}>
          Trocar badge do nível {codigoNivel}
        </h3>

        <p style={modalSubText}>
          Escolhe um badge rascunho do mesmo nível. O sistema cria uma cópia ativa para esta área.
        </p>

        <label style={labelStyle}>
          Badge rascunho
        </label>

        <select
          value={badgeSelecionadoId}
          onChange={(e) =>
            setBadgeSelecionadoId(e.target.value)
          }
          style={inputStyleNormal}
        >
          <option value="">
            Selecionar badge
          </option>

          {badgesDoNivel.map((badge) => (
            <option
              key={badge.id}
              value={badge.id}
            >
              {badge.nome} — {badge.pontos} pts
            </option>
          ))}
        </select>

        {badgesDoNivel.length === 0 && (
          <div style={emptySmallBox}>
            Não existem badges rascunho disponíveis para este nível.
          </div>
        )}

        {badgeSelecionado && (
          <div style={badgePreviewBox}>
            <div style={badgePreviewTitle}>
              {badgeSelecionado.nome}
            </div>

            <div style={badgePreviewDescription}>
              {badgeSelecionado.descricao}
            </div>

            <div style={badgePreviewMeta}>
              Pontos: <strong>{badgeSelecionado.pontos}</strong> ·
              Requisitos:{" "}
              <strong>
                {badgeSelecionado.requisitos?.length || 0}
              </strong>
            </div>

            {badgeSelecionado.requisitos?.length > 0 ? (
              badgeSelecionado.requisitos.map((req, index) => (
                <div
                  key={req.id || index}
                  style={reqPreviewBox}
                >
                  <div style={reqPreviewTitle}>
                    {req.titulo || req.nome}
                  </div>

                  <div style={reqPreviewDescription}>
                    {req.descricao}
                  </div>
                </div>
              ))
            ) : (
              <div style={emptySmallBox}>
                Este badge ainda não tem requisitos.
              </div>
            )}
          </div>
        )}

        <div style={modalActions}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={modalCancelButton}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onGuardar}
            disabled={loading || !badgeSelecionadoId}
            style={{
              ...modalConfirmButtonBlue,
              opacity:
                loading || !badgeSelecionadoId
                  ? 0.6
                  : 1,
              cursor:
                loading || !badgeSelecionadoId
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading
              ? "A guardar..."
              : "Trocar badge"}
          </button>
        </div>
      </div>
    </div>
  );
}

function NivelModal({
  modo,
  formNivel,
  setFormNivel,
  erro,
  loading,
  onClose,
  onGuardar,
}) {
  const titulo =
    modo === "criar" ? "Adicionar nível" : "Editar nível";

  return (
    <div style={modalOverlay}>
      <div style={modalCard}>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          style={modalCloseButton}
        >
          <BiX size={22} />
        </button>

        <h3 style={modalTitle}>{titulo}</h3>

        <p style={modalText}>
          Define o nome e o estado do nível desta área.
        </p>

        {erro && <div style={errorBox}>{erro}</div>}

        <div style={{ marginBottom: 18, textAlign: "left" }}>
          <label style={labelStyle}>
            Nome do nível <span style={{ color: "#dc2626" }}>*</span>
          </label>

          <input
            value={formNivel.nome_nivel}
            onChange={(e) =>
              setFormNivel((prev) => ({
                ...prev,
                nome_nivel: e.target.value,
              }))
            }
            placeholder="Ex: A, B, C, Iniciante, Intermédio..."
            style={{
              width: "100%",
              height: 42,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "0 14px",
              fontSize: 14,
              color: "#111827",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 22, textAlign: "left" }}>
          <label style={labelStyle}>Estado</label>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() =>
                setFormNivel((prev) => ({
                  ...prev,
                  estado_nivel: "INATIVO",
                }))
              }
              style={{
                ...statusButton,
                background:
                  formNivel.estado_nivel === "INATIVO"
                    ? "#fee2e2"
                    : "white",
                color:
                  formNivel.estado_nivel === "INATIVO"
                    ? "#b91c1c"
                    : "#6b7280",
                border:
                  formNivel.estado_nivel === "INATIVO"
                    ? "1.5px solid #fca5a5"
                    : "1.5px solid #d1d5db",
              }}
            >
              Inativo
            </button>

            <button
              type="button"
              onClick={() =>
                setFormNivel((prev) => ({
                  ...prev,
                  estado_nivel: "ATIVO",
                }))
              }
              style={{
                ...statusButton,
                background:
                  formNivel.estado_nivel === "ATIVO"
                    ? "#16a34a"
                    : "white",
                color:
                  formNivel.estado_nivel === "ATIVO"
                    ? "white"
                    : "#6b7280",
                border:
                  formNivel.estado_nivel === "ATIVO"
                    ? "1.5px solid #16a34a"
                    : "1.5px solid #d1d5db",
              }}
            >
              Ativo
            </button>
          </div>
        </div>

        <div style={modalActions}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={modalCancelButton}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onGuardar}
            disabled={loading}
            style={{
              ...modalConfirmButtonBlue,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "A guardar..." : "Guardar nível"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DesativarNivelModal({
  nivel,
  loading,
  onClose,
  onConfirm,
}) {
  if (!nivel) return null;

  return (
    <div style={modalOverlay}>
      <div style={modalCard}>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          style={modalCloseButton}
        >
          <BiX size={22} />
        </button>

        <h3 style={modalTitle}>Desativar nível?</h3>

        <p style={modalText}>
          O nível <strong>{nivel.nome_nivel}</strong> será marcado como{" "}
          <strong>Inativo</strong>.
        </p>

        <p style={modalSubText}>
          Esta ação não elimina o nível da base de dados. Os registos e
          associações ficam guardados para consulta administrativa.
        </p>

        <div style={modalActions}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={modalCancelButton}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              ...modalConfirmButtonRed,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "A desativar..." : "Sim, desativar nível"}
          </button>
        </div>
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

const addNivelButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "9px 16px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const nivelEstadoBadge = {
  alignSelf: "flex-start",
  borderRadius: 999,
  padding: "3px 10px",
  fontSize: 11,
  fontWeight: 800,
};

const nivelActionsRow = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const nivelSmallButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  background: "white",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const nivelDangerButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  background: "white",
  color: "#dc2626",
  border: "1px solid #fecaca",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 700,
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

const modalCard = {
  position: "relative",
  width: "100%",
  maxWidth: 460,
  background: "white",
  borderRadius: 18,
  padding: "28px 28px 24px",
  boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
  border: "1px solid #e5e7eb",
  textAlign: "center",
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
  margin: "0 0 8px",
};

const modalText = {
  fontSize: 14,
  color: "#374151",
  margin: "0 0 8px",
  lineHeight: 1.5,
};

const modalSubText = {
  fontSize: 12,
  color: "#6b7280",
  margin: "0 0 18px",
  lineHeight: 1.5,
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const modalCancelButton = {
  border: "1px solid #d1d5db",
  background: "white",
  color: "#374151",
  borderRadius: 10,
  padding: "9px 15px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const modalConfirmButtonBlue = {
  border: "none",
  background: "#2563eb",
  color: "white",
  borderRadius: 10,
  padding: "9px 15px",
  fontSize: 13,
  fontWeight: 700,
};

const modalConfirmButtonRed = {
  border: "none",
  background: "#dc2626",
  color: "white",
  borderRadius: 10,
  padding: "9px 15px",
  fontSize: 13,
  fontWeight: 700,
};

const modalCardLarge = {
  position: "relative",
  width: "100%",
  maxWidth: 620,
  background: "white",
  borderRadius: 18,
  padding: "28px 28px 24px",
  boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
  border: "1px solid #e5e7eb",
  textAlign: "left",
};

const inputStyleNormal = {
  width: "100%",
  height: 42,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "0 12px",
  fontSize: 14,
  color: "#111827",
  background: "white",
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 12,
};

const emptySmallBox = {
  background: "#f8fafc",
  border: "1px dashed #cbd5e1",
  borderRadius: 10,
  padding: 12,
  color: "#64748b",
  fontSize: 12,
  marginTop: 10,
};

const badgePreviewBox = {
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 14,
  marginTop: 14,
};

const badgePreviewTitle = {
  fontSize: 15,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 4,
};

const badgePreviewDescription = {
  fontSize: 12,
  color: "#64748b",
  lineHeight: 1.45,
  marginBottom: 8,
};

const badgePreviewMeta = {
  fontSize: 12,
  color: "#2563eb",
  marginBottom: 12,
};

const reqPreviewBox = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 10,
  marginTop: 8,
};

const reqPreviewTitle = {
  fontSize: 12,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 3,
};

const reqPreviewDescription = {
  fontSize: 11,
  color: "#64748b",
  lineHeight: 1.4,
};

export default EditarArea;