import { useEffect, useRef, useState } from "react";
import { Spinner } from "react-bootstrap";
import {
  BiArrowBack,
  BiChevronDown,
  BiEdit,
  BiPlus,
  BiSave,
  BiTrash,
  BiUpload,
  BiUserCircle,
  BiX,
} from "react-icons/bi";
import { useNavigate } from "react-router-dom";

import api from "../../services/api.js";
import Header from "../../components/Header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

const UNIDADES_TEMPO = [
  { value: "DIAS", label: "Dias" },
  { value: "MESES", label: "Meses" },
  { value: "ANOS", label: "Anos" },
];

const NIVEIS_FALLBACK = [
  { value: 1, label: "Iniciante" },
  { value: 2, label: "Intermédio" },
  { value: 3, label: "Avançado" },
  { value: 4, label: "Expert" },
  { value: 5, label: "Master" },
];

function criarRequisito(aberto = true) {
  return {
    tempId: Date.now() + Math.random(),
    titulo: "Completar formação associada",
    descricao: "O consultor deve ter concluído o curso:",
    link: "",
    aberto,
  };
}

function normalizarNivel(nivel) {
  return {
    value: Number(nivel.id_nivel || nivel.id || nivel.ID_NIVEL),
    label: nivel.nome_nivel || nivel.nome || nivel.NOME_NIVEL || "Nível",
  };
}

async function getNiveis() {
  const endpoints = ["/badges/niveis"];

  for (const endpoint of endpoints) {
    try {
      const res = await api.get(endpoint);

      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.niveis)) return res.data.niveis;
      if (Array.isArray(res.data?.data)) return res.data.data;
    } catch {
      // tenta o próximo endpoint
    }
  }

  return [];
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

  const selected = options.find((opt) => String(opt.value) === String(value));

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => {
          if (!disabled) setAberto((prev) => !prev);
        }}
        style={{
          height: 40,
          border: `1px solid ${
            erro ? "#fca5a5" : aberto ? "#2563eb" : "#d1d5db"
          }`,
          borderRadius: 8,
          padding: "0 36px 0 12px",
          cursor: disabled ? "not-allowed" : "pointer",
          background: disabled ? "#f9fafb" : "white",
          display: "flex",
          alignItems: "center",
          fontSize: 13,
          color: selected ? "#111827" : "#9ca3af",
          position: "relative",
          userSelect: "none",
          opacity: disabled ? 0.7 : 1,
        }}
      >
        {selected ? selected.label : placeholder}

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
            size={16}
            style={{
              transform: aberto ? "rotate(180deg)" : "none",
              transition: "0.2s",
            }}
          />
        </span>
      </div>

      {aberto && !disabled && (
        <div style={dropdownBox}>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {options.length > 0 ? (
              options.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value, opt);
                    setAberto(false);
                  }}
                  style={{
                    padding: "9px 14px",
                    fontSize: 13,
                    color: "#374151",
                    cursor: "pointer",
                    background:
                      String(value) === String(opt.value)
                        ? "#eff6ff"
                        : "transparent",
                    fontWeight:
                      String(value) === String(opt.value) ? 600 : 400,
                  }}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: "9px 14px",
                  fontSize: 13,
                  color: "#9ca3af",
                }}
              >
                Sem opções disponíveis
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RequisitoItem({ req, index, onToggle, onEditar, onEliminar }) {
  return (
    <div style={requisitoCard}>
      <div onClick={() => onToggle(req.tempId)} style={requisitoHeader}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
          <span style={{ color: "#374151" }}>Requisito {index + 1}</span>
          {" – "}
          <span>{req.titulo || "Sem título"}</span>
        </span>

        <span style={{ color: "#6b7280", fontSize: 16 }}>
          {req.aberto ? "∧" : "∨"}
        </span>
      </div>

      {req.aberto ? (
        <div style={requisitoBodyAberto}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
              {req.descricao || "Sem descrição."}
            </div>

            {req.link && (
              <a
                href={req.link}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 13,
                  color: "#2563eb",
                  textDecoration: "none",
                }}
              >
                {req.link}
              </a>
            )}
          </div>

          <RequisitoActions
            onEditar={() => onEditar(req)}
            onEliminar={() => onEliminar(req.tempId)}
          />
        </div>
      ) : (
        <div style={requisitoBodyFechado}>
          <div style={{ fontSize: 13, color: "#374151" }}>
            {req.descricao || "Sem descrição."}
          </div>

          <RequisitoActions
            onEditar={() => onEditar(req)}
            onEliminar={() => onEliminar(req.tempId)}
          />
        </div>
      )}
    </div>
  );
}

function RequisitoActions({ onEditar, onEliminar }) {
  return (
    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
      <button onClick={onEditar} style={editReqButton}>
        <BiEdit size={14} />
        Editar
      </button>

      <button onClick={onEliminar} style={deleteReqButton}>
        <BiTrash size={14} />
        Eliminar
      </button>
    </div>
  );
}

function RequisitoModal({ requisito, onClose, onSave }) {
  const [draft, setDraft] = useState(requisito);

  if (!requisito) return null;

  return (
    <div style={modalOverlay}>
      <div style={modalCard}>
        <div style={modalHeader}>
          <h6 style={modalTitle}>Editar requisito</h6>

          <button onClick={onClose} style={modalCloseButton}>
            <BiX size={22} />
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Título</label>

          <input
            value={draft.titulo}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                titulo: e.target.value,
              }))
            }
            style={inputStyleBase}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Descrição</label>

          <textarea
            value={draft.descricao}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                descricao: e.target.value,
              }))
            }
            rows={4}
            style={textareaStyleBase}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Link</label>

          <input
            value={draft.link}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                link: e.target.value,
              }))
            }
            placeholder="https://..."
            style={inputStyleBase}
          />
        </div>

        <div style={modalActions}>
          <button onClick={onClose} style={cancelButton}>
            Cancelar
          </button>

          <button onClick={() => onSave(draft)} style={saveModalButton}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function CriarBadge() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    nome: "",
    pontos: "",
    tempoExpiracao: "",
    unidadeTempo: "MESES",
    id_nivel: "",
    imagem: null,
    imagemPreview: null,
    descricao: "",
  });

  const [niveis, setNiveis] = useState(NIVEIS_FALLBACK);
  const [requisitos, setRequisitos] = useState([criarRequisito(true)]);
  const [requisitoEmEdicao, setRequisitoEmEdicao] = useState(null);

  const [loadingNiveis, setLoadingNiveis] = useState(true);
  const [aCriar, setACriar] = useState(false);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");

  useEffect(() => {
    carregarNiveis();
  }, []);

  async function carregarNiveis() {
    try {
      setLoadingNiveis(true);

      const niveisRaw = await getNiveis();

      const niveisNormalizados = niveisRaw
        .map(normalizarNivel)
        .filter((nivel) => nivel.value && nivel.label);

      setNiveis(
        niveisNormalizados.length > 0
          ? niveisNormalizados
          : NIVEIS_FALLBACK
      );
    } catch (err) {
      console.error("Erro ao carregar níveis:", err);
      setNiveis(NIVEIS_FALLBACK);
    } finally {
      setLoadingNiveis(false);
    }
  }

  function setCampo(campo, valor) {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));

    setErros((prev) => ({
      ...prev,
      [campo]: "",
    }));

    setErroGeral("");
  }

  function handleImagemClick() {
    fileInputRef.current?.click();
  }

  function handleImagemChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const tiposPermitidos = [
      "image/png",
      "image/jpeg",
      "image/svg+xml",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(file.type)) {
      setErros((prev) => ({
        ...prev,
        imagem: "A imagem deve ser PNG, JPG, SVG ou WEBP.",
      }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErros((prev) => ({
        ...prev,
        imagem: "A imagem não pode ter mais de 2MB.",
      }));
      return;
    }

    const reader = new FileReader();

    reader.onload = (ev) => {
      setForm((prev) => ({
        ...prev,
        imagem: file,
        imagemPreview: ev.target.result,
      }));

      setErros((prev) => ({
        ...prev,
        imagem: "",
      }));
    };

    reader.readAsDataURL(file);
  }

  function toggleRequisito(tempId) {
    setRequisitos((prev) =>
      prev.map((req) =>
        req.tempId === tempId
          ? {
              ...req,
              aberto: !req.aberto,
            }
          : req
      )
    );
  }

  function adicionarRequisito() {
    setRequisitos((prev) => [
      ...prev.map((req) => ({
        ...req,
        aberto: false,
      })),
      criarRequisito(true),
    ]);
  }

  function eliminarRequisito(tempId) {
    setRequisitos((prev) => prev.filter((req) => req.tempId !== tempId));
  }

  function guardarRequisito(reqAtualizado) {
    setRequisitos((prev) =>
      prev.map((req) =>
        req.tempId === reqAtualizado.tempId ? reqAtualizado : req
      )
    );

    setRequisitoEmEdicao(null);
  }

  function validar() {
    const novosErros = {};

    if (!form.nome.trim()) {
      novosErros.nome = "O nome é obrigatório.";
    }

    if (!form.pontos) {
      novosErros.pontos = "Os pontos são obrigatórios.";
    }

    if (Number(form.pontos) < 0) {
      novosErros.pontos = "Os pontos não podem ser negativos.";
    }

    if (!form.id_nivel) {
      novosErros.id_nivel = "Seleciona um nível.";
    }

    if (!form.descricao.trim()) {
      novosErros.descricao = "A descrição é obrigatória.";
    }

    const requisitosValidos = requisitos.filter(
      (req) =>
        req.titulo.trim() ||
        req.descricao.trim() ||
        req.link.trim()
    );

    if (requisitosValidos.length === 0) {
      novosErros.requisitos = "Adiciona pelo menos um requisito.";
    }

    setErros(novosErros);

    return Object.keys(novosErros).length === 0;
  }

  async function handleCriar() {
    if (!validar()) return;

    try {
      setACriar(true);
      setErroGeral("");

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const idUtilizador =
        user.id_utilizador ||
        user.ID_UTILIZADOR ||
        user.id ||
        user.ID ||
        "";

      const requisitosLimpos = requisitos
        .filter(
          (req) =>
            req.titulo.trim() ||
            req.descricao.trim() ||
            req.link.trim()
        )
        .map((req) => ({
          titulo: req.titulo.trim(),
          nome_requisito: req.titulo.trim(),
          descricao_requisito: req.descricao.trim(),
          links: req.link.trim() ? [req.link.trim()] : [],
        }));

      const formData = new FormData();

      formData.append("nome_badge", form.nome.trim());
      formData.append("descricao_badge_modelo", form.descricao.trim());
      formData.append("pontos", Number(form.pontos));
      formData.append("id_nivel", form.id_nivel);
      formData.append("estado_badge_modelo", "ATIVO");
      formData.append("numero_requisitos", requisitosLimpos.length);
      formData.append("tempo_expiracao_quantidade", form.tempoExpiracao || 0);
      formData.append("tempo_expiracao_unidade", form.unidadeTempo);
      formData.append("requisitos", JSON.stringify(requisitosLimpos));

      if (idUtilizador) {
        formData.append("id_utilizador", idUtilizador);
      }

      if (form.imagem) {
        formData.append("imagem", form.imagem);
      }

      await api.post("/badges/admin", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/admin/badges");
    } catch (err) {
      console.error("Erro ao criar badge:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", JSON.stringify(err.response?.data, null, 2));

      setErroGeral(
        err.response?.data?.error ||
          "Não foi possível criar o badge."
      );
    } finally {
      setACriar(false);
    }
  }

  function inputStyle(campo) {
    return {
      width: "100%",
      height: 40,
      border: `1px solid ${erros[campo] ? "#fca5a5" : "#d1d5db"}`,
      borderRadius: 8,
      padding: "0 12px",
      fontSize: 13,
      color: "#111827",
      background: "white",
      outline: "none",
      boxSizing: "border-box",
    };
  }

  return (
    <div style={pageWrapper}>
      <Header />

      <div style={layoutBody}>
        <AdminLeftSidebar />

        <main style={mainContent}>
          <button onClick={() => navigate("/admin/badges")} style={backButton}>
            <BiArrowBack size={15} />
            Voltar
          </button>

          <div style={{ marginBottom: 20 }}>
            <h5 style={pageTitle}>Criar Badge</h5>
            <div style={pageSubtitle}>Nova Badge</div>
          </div>

          {erroGeral && <div style={errorBox}>{erroGeral}</div>}

          <div style={card}>
            <div style={sectionHeader}>
              <BiUserCircle size={18} color="#2563eb" />
              <span style={sectionHeaderText}>Informações da Badge</span>
            </div>

            <div style={grid2}>
              <div>
                <label style={labelStyle}>Nome do Badge</label>

                <input
                  value={form.nome}
                  onChange={(e) => setCampo("nome", e.target.value)}
                  placeholder="Digite o nome da badge"
                  style={inputStyle("nome")}
                />

                {erros.nome && <FieldError>{erros.nome}</FieldError>}
              </div>

              <div>
                <label style={labelStyle}>Pontos</label>

                <input
                  type="number"
                  min="0"
                  value={form.pontos}
                  onChange={(e) => setCampo("pontos", e.target.value)}
                  placeholder="0"
                  style={inputStyle("pontos")}
                />

                {erros.pontos && <FieldError>{erros.pontos}</FieldError>}
              </div>
            </div>

            <div style={grid2}>
              <div>
                <label style={labelStyle}>Tempo de expiração</label>

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    min="0"
                    value={form.tempoExpiracao}
                    onChange={(e) =>
                      setCampo("tempoExpiracao", e.target.value)
                    }
                    placeholder="0"
                    style={{
                      ...inputStyle("tempoExpiracao"),
                      width: 72,
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <SelectDropdown
                      options={UNIDADES_TEMPO}
                      value={form.unidadeTempo}
                      onChange={(value) => setCampo("unidadeTempo", value)}
                      placeholder="Meses"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Nível</label>

                <SelectDropdown
                  options={niveis}
                  value={form.id_nivel}
                  onChange={(value) => setCampo("id_nivel", value)}
                  placeholder={
                    loadingNiveis
                      ? "A carregar níveis..."
                      : "Selecione um nível"
                  }
                  erro={erros.id_nivel}
                  disabled={loadingNiveis}
                />

                {erros.id_nivel && <FieldError>{erros.id_nivel}</FieldError>}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Imagem da Badge</label>

              <div
                onClick={handleImagemClick}
                style={{
                  ...uploadBox,
                  borderColor: erros.imagem ? "#fca5a5" : "#d1d5db",
                }}
              >
                {form.imagemPreview ? (
                  <img
                    src={form.imagemPreview}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <>
                    <BiUpload size={24} color="#9ca3af" />

                    <span
                      style={{
                        fontSize: 13,
                        color: "#374151",
                        fontWeight: 500,
                      }}
                    >
                      Clique para adicionar imagem
                    </span>

                    <span style={{ fontSize: 11, color: "#2563eb" }}>
                      PNG, JPG, SVG ou WEBP (máx. 2MB)
                    </span>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                style={{ display: "none" }}
                onChange={handleImagemChange}
              />

              {erros.imagem && <FieldError>{erros.imagem}</FieldError>}
            </div>

            <div>
              <label style={labelStyle}>Descrição</label>

              <textarea
                value={form.descricao}
                onChange={(e) => setCampo("descricao", e.target.value)}
                placeholder="Digite uma descrição para a badge..."
                rows={5}
                style={{
                  ...textareaStyleBase,
                  borderColor: erros.descricao ? "#fca5a5" : "#d1d5db",
                }}
              />

              {erros.descricao && (
                <FieldError>{erros.descricao}</FieldError>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 90 }}>
            <div style={reqTitleRow}>
              <div>
                <h6 style={reqTitle}>Requisitos do Badge</h6>

                <div style={pageSubtitle}>
                  Total de {requisitos.length} requisito(s)
                </div>
              </div>

              <button onClick={adicionarRequisito} style={addReqButton}>
                <BiPlus size={18} />
                Adicionar requisito
              </button>
            </div>

            {erros.requisitos && <div style={errorBox}>{erros.requisitos}</div>}

            {requisitos.map((req, index) => (
              <RequisitoItem
                key={req.tempId}
                req={req}
                index={index}
                onToggle={toggleRequisito}
                onEditar={setRequisitoEmEdicao}
                onEliminar={eliminarRequisito}
              />
            ))}
          </div>
        </main>

        <AdminRightSidebar />
      </div>

      <div style={bottomBar}>
        <button
          onClick={handleCriar}
          disabled={aCriar}
          style={{
            ...createButton,
            opacity: aCriar ? 0.7 : 1,
            cursor: aCriar ? "not-allowed" : "pointer",
          }}
        >
          {aCriar ? <Spinner animation="border" size="sm" /> : <BiSave size={17} />}

          {aCriar ? "A criar..." : "Criar Badge"}
        </button>
      </div>

      {requisitoEmEdicao && (
        <RequisitoModal
          requisito={requisitoEmEdicao}
          onClose={() => setRequisitoEmEdicao(null)}
          onSave={guardarRequisito}
        />
      )}
    </div>
  );
}

function FieldError({ children }) {
  return (
    <div style={{ fontSize: 11, color: "#dc2626", marginTop: 3 }}>
      {children}
    </div>
  );
}

export default CriarBadge;

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
  padding: "20px 24px 60px",
  minWidth: 0,
};

const backButton = {
  background: "none",
  border: "none",
  display: "flex",
  alignItems: "center",
  gap: 6,
  color: "#374151",
  fontSize: 13,
  cursor: "pointer",
  marginBottom: 10,
  padding: 0,
};

const pageTitle = {
  fontWeight: 700,
  color: "#111827",
  margin: "0 0 2px",
};

const pageSubtitle = {
  fontSize: 12,
  color: "#6b7280",
};

const card = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "24px 28px 28px",
  marginBottom: 20,
};

const sectionHeader = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 20,
};

const sectionHeaderText = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
  marginBottom: 18,
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 500,
  color: "#374151",
  display: "block",
  marginBottom: 6,
};

const inputStyleBase = {
  width: "100%",
  height: 40,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "0 12px",
  fontSize: 13,
  color: "#111827",
  background: "white",
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyleBase = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: 12,
  fontSize: 13,
  color: "#111827",
  resize: "vertical",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
  lineHeight: 1.6,
};

const dropdownBox = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  zIndex: 200,
  background: "white",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
  overflow: "hidden",
};

const uploadBox = {
  width: 300,
  height: 110,
  border: "1.5px dashed #d1d5db",
  borderRadius: 10,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  background: "#fafafa",
  gap: 4,
  transition: "border-color 0.2s",
  overflow: "hidden",
};

const reqTitleRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};

const reqTitle = {
  fontWeight: 700,
  color: "#111827",
  fontSize: 15,
  margin: 0,
};

const addReqButton = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const requisitoCard = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  marginBottom: 12,
  background: "white",
  overflow: "hidden",
};

const requisitoHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 20px",
  cursor: "pointer",
  userSelect: "none",
};

const requisitoBodyAberto = {
  padding: "14px 20px 16px",
  borderTop: "1px solid #f3f4f6",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
};

const requisitoBodyFechado = {
  padding: "0 20px 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
};

const editReqButton = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  border: "1px solid #bfdbfe",
  borderRadius: 7,
  background: "#eff6ff",
  color: "#2563eb",
  fontSize: 12,
  fontWeight: 600,
  padding: "6px 14px",
  cursor: "pointer",
};

const deleteReqButton = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  border: "1px solid #fecaca",
  borderRadius: 7,
  background: "#fff1f1",
  color: "#dc2626",
  fontSize: 12,
  fontWeight: 600,
  padding: "6px 14px",
  cursor: "pointer",
};

const bottomBar = {
  position: "fixed",
  bottom: 0,
  left: 240,
  right: 260,
  background: "white",
  borderTop: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "14px 0",
  zIndex: 50,
};

const createButton = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "11px 48px",
  fontSize: 14,
  fontWeight: 600,
  minWidth: 220,
  letterSpacing: "0.2px",
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

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalCard = {
  background: "white",
  borderRadius: 14,
  padding: 24,
  width: 460,
  boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
};

const modalTitle = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: "#111827",
};

const modalCloseButton = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#6b7280",
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const cancelButton = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  padding: "8px 18px",
  fontSize: 13,
  color: "#374151",
  cursor: "pointer",
};

const saveModalButton = {
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  padding: "8px 18px",
  fontSize: 13,
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};