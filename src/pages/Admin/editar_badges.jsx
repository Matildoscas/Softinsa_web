import { useEffect, useRef, useState } from "react";
import { Spinner } from "react-bootstrap";
import {
  BiArrowBack,
  BiChevronDown,
  BiChevronUp,
  BiEdit,
  BiImageAdd,
  BiMedal,
  BiPlus,
  BiSave,
  BiTrash,
  BiUpload,
  BiX,
} from "react-icons/bi";
import { useNavigate, useParams } from "react-router-dom";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    id_requisitos: null,
    titulo: "Completar formação associada",
    nome_requisito: "Completar formação associada",
    descricao_requisito: "O consultor deve ter concluído o curso:",
    link: "",
    links: [],
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
  try {
    const res = await api.get("/badges/niveis");

    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.niveis)) return res.data.niveis;
    if (Array.isArray(res.data?.data)) return res.data.data;

    return [];
  } catch {
    return [];
  }
}

function normalizarImagemSrc(imagem) {
  if (!imagem) return null;

  if (typeof imagem === "string") {
    const valor = imagem.trim();

    if (!valor) return null;

    if (
      valor.startsWith("http://") ||
      valor.startsWith("https://") ||
      valor.startsWith("data:image/")
    ) {
      return valor;
    }

    return valor;
  }

  if (imagem.type === "Buffer" && Array.isArray(imagem.data)) {
    const bytes = imagem.data;

    try {
      const texto = new TextDecoder("utf-8")
        .decode(new Uint8Array(bytes))
        .trim();

      if (
        texto.startsWith("http://") ||
        texto.startsWith("https://") ||
        texto.startsWith("data:image/")
      ) {
        return texto;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function formatarData(data) {
  if (!data) return "-";

  const d = new Date(data);

  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("pt-PT");
}

function calcularTempoExpiracao(dataExpiracao) {
  if (!dataExpiracao) {
    return {
      quantidade: "",
      unidade: "MESES",
    };
  }

  const hoje = new Date();
  const fim = new Date(dataExpiracao);

  if (Number.isNaN(fim.getTime())) {
    return {
      quantidade: "",
      unidade: "MESES",
    };
  }

  const diffMs = fim.getTime() - hoje.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias <= 0) {
    return {
      quantidade: "",
      unidade: "MESES",
    };
  }

  if (diffDias >= 365) {
    return {
      quantidade: Math.round(diffDias / 365),
      unidade: "ANOS",
    };
  }

  if (diffDias >= 30) {
    return {
      quantidade: Math.round(diffDias / 30),
      unidade: "MESES",
    };
  }

  return {
    quantidade: diffDias,
    unidade: "DIAS",
  };
}

function normalizarRequisito(req, index) {
  const links = Array.isArray(req.links)
    ? req.links
    : req.url
      ? [req.url]
      : req.link
        ? [req.link]
        : [];

  return {
    tempId: req.id_requisitos || req.id || Date.now() + Math.random(),
    id_requisitos: req.id_requisitos || req.id || null,
    codigo: req.codigo || `C${index + 1}`,
    titulo:
      req.titulo ||
      req.nome_requisito ||
      req.nome ||
      "Completar formação associada",
    nome_requisito:
      req.nome_requisito ||
      req.titulo ||
      req.nome ||
      "Completar formação associada",
    descricao_requisito:
      req.descricao_requisito ||
      req.descricao ||
      "O consultor deve ter concluído o curso:",
    link: links[0] || "",
    links,
    aberto: index === 0,
  };
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
          height: 42,
          border: `1px solid ${
            erro ? "#fca5a5" : aberto ? "#2563eb" : "#d1d5db"
          }`,
          borderRadius: 8,
          padding: "0 36px 0 12px",
          cursor: disabled ? "not-allowed" : "pointer",
          background: disabled ? "#f9fafb" : "white",
          display: "flex",
          alignItems: "center",
          fontSize: 14,
          color: selected ? "#111827" : "#9ca3af",
          position: "relative",
          userSelect: "none",
          opacity: disabled ? 0.7 : 1,
        }}
      >
        {selected ? selected.label : placeholder}

        <span style={dropdownIcon}>
          <BiChevronDown
            size={17}
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
            {options.map((opt) => (
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
                  fontWeight: String(value) === String(opt.value) ? 600 : 400,
                }}
              >
                {opt.label}
              </div>
            ))}

            {options.length === 0 && (
              <div style={{ padding: "9px 14px", fontSize: 13, color: "#9ca3af" }}>
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
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
          {req.aberto ? (
            <>
              Requisito{" "}
              <span style={{ color: "#2563eb" }}>
                {req.codigo || `C${index + 1}`}
              </span>{" "}
              - <span style={{ color: "#2563eb" }}>{req.titulo}</span>
            </>
          ) : (
            <>
              {req.codigo || `C${index + 1}`} – {req.titulo}
            </>
          )}
        </div>

        <span style={{ color: "#6b7280" }}>
          {req.aberto ? <BiChevronUp size={20} /> : <BiChevronDown size={20} />}
        </span>
      </div>

      {req.aberto ? (
        <div style={requisitoBodyAberto}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: "#2563eb" }}>
                {req.codigo || `C${index + 1}`}
              </span>
              - {req.descricao_requisito}
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
                  wordBreak: "break-all",
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
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            <span style={{ fontWeight: 500, color: "#6b7280" }}>
              {req.codigo || `C${index + 1}`}-
            </span>{" "}
            {req.descricao_requisito}
          </span>

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

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Título</label>

          <input
            value={draft.titulo}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                titulo: e.target.value,
                nome_requisito: e.target.value,
              }))
            }
            style={inputStyleBase}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Descrição</label>

          <textarea
            value={draft.descricao_requisito}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                descricao_requisito: e.target.value,
              }))
            }
            rows={4}
            style={textareaStyleBase}
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={labelStyle}>Link</label>

          <input
            value={draft.link}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                link: e.target.value,
                links: e.target.value ? [e.target.value] : [],
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

function ConfirmDeleteModal({ badgeNome, loading, onClose, onConfirm }) {
  return (
    <div style={modalOverlay}>
      <div style={modalCard}>
        <div style={modalHeader}>
          <h6 style={modalTitle}>Excluir badge</h6>

          <button onClick={onClose} style={modalCloseButton} disabled={loading}>
            <BiX size={22} />
          </button>
        </div>

        <p style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.6 }}>
          Tens a certeza que queres excluir/desativar o badge{" "}
          <strong>{badgeNome}</strong>?
        </p>

        <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
          Esta ação não precisa apagar definitivamente os dados da BD. O backend
          pode apenas marcar o badge como inativo.
        </p>

        <div style={modalActions}>
          <button onClick={onClose} style={cancelButton} disabled={loading}>
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              ...deleteModalButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "A excluir..." : "Excluir"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditarBadge() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [badgeOriginal, setBadgeOriginal] = useState(null);

  const [form, setForm] = useState({
    nome: "",
    pontos: "",
    tempoExpiracao: "",
    unidadeExpiracao: "MESES",
    id_nivel: "",
    descricao: "",
    imagem: null,
    imagemPreview: null,
  });

  const [niveis, setNiveis] = useState(NIVEIS_FALLBACK);
  const [requisitos, setRequisitos] = useState([]);
  const [modalReq, setModalReq] = useState(null);
  const [modalExcluir, setModalExcluir] = useState(false);

  const [loading, setLoading] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [aExcluir, setAExcluir] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [erros, setErros] = useState({});

  useEffect(() => {
    carregarPagina();
  }, [id]);

  async function carregarPagina() {
    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const [badgeRes, niveisRaw] = await Promise.all([
        api.get(`/badges/admin/${id}`),
        getNiveis(),
      ]);

      const badge = badgeRes.data?.badge || badgeRes.data;

      const niveisNormalizados = niveisRaw
        .map(normalizarNivel)
        .filter((nivel) => nivel.value && nivel.label);

      setNiveis(
        niveisNormalizados.length > 0 ? niveisNormalizados : NIVEIS_FALLBACK
      );

      const tempo = calcularTempoExpiracao(
        badge.tempo_expiracao || badge.tempoExpiracao
      );

      const imagemSrc = normalizarImagemSrc(
        badge.imagem_url || badge.imagem || badge.url_imagem
      );

      setBadgeOriginal({
        ...badge,
        imagem_url: imagemSrc,
      });

      setForm({
        nome: badge.nome || badge.nome_badge || "",
        pontos: String(badge.pontos || 0),
        tempoExpiracao: String(
          badge.tempo_expiracao_quantidade || tempo.quantidade || ""
        ),
        unidadeExpiracao:
          badge.tempo_expiracao_unidade || tempo.unidade || "MESES",
        id_nivel: badge.id_nivel || "",
        descricao:
          badge.descricao ||
          badge.descricao_badge_modelo ||
          "",
        imagem: null,
        imagemPreview: imagemSrc,
      });

      const reqs = badge.requisitos || badge.requisitosData || [];

      setRequisitos(reqs.map(normalizarRequisito));
    } catch (err) {
      console.error("Erro ao carregar badge:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar os dados do badge."
      );
    } finally {
      setLoading(false);
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

    setErro("");
    setSucesso("");
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

  function guardarRequisito(reqAtualizado) {
    setRequisitos((prev) =>
      prev.map((req) =>
        req.tempId === reqAtualizado.tempId ? reqAtualizado : req
      )
    );

    setModalReq(null);
  }

  function eliminarRequisito(tempId) {
    setRequisitos((prev) => prev.filter((req) => req.tempId !== tempId));
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

    if (requisitos.length === 0) {
      novosErros.requisitos = "Adiciona pelo menos um requisito.";
    }

    setErros(novosErros);

    return Object.keys(novosErros).length === 0;
  }

  async function handleGuardar() {
    if (!validar()) return;

    try {
      setAGuardar(true);
      setErro("");
      setSucesso("");

      const requisitosLimpos = requisitos.map((req) => ({
        id_requisitos: req.id_requisitos || null,
        titulo: req.titulo.trim(),
        nome_requisito: req.nome_requisito?.trim() || req.titulo.trim(),
        descricao_requisito: req.descricao_requisito.trim(),
        links: req.link?.trim() ? [req.link.trim()] : [],
      }));

      const formData = new FormData();

      formData.append("nome_badge", form.nome.trim());
      formData.append("descricao_badge_modelo", form.descricao.trim());
      formData.append("pontos", Number(form.pontos));
      formData.append("id_nivel", form.id_nivel);
      formData.append("numero_requisitos", requisitosLimpos.length);
      formData.append("tempo_expiracao_quantidade", form.tempoExpiracao || 0);
      formData.append("tempo_expiracao_unidade", form.unidadeExpiracao);
      formData.append("requisitos", JSON.stringify(requisitosLimpos));

      if (form.imagem) {
        formData.append("imagem", form.imagem);
      }

      await api.put(`/badges/admin/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSucesso("Badge atualizado com sucesso.");
      await carregarPagina();
    } catch (err) {
      console.error("Erro ao guardar badge:", err);
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

  async function handleExcluir() {
    try {
      setAExcluir(true);

      await api.delete(`/badges/admin/${id}`);

      navigate("/admin/badges");
    } catch (err) {
      console.error("Erro ao excluir badge:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível excluir/desativar o badge."
      );
    } finally {
      setAExcluir(false);
      setModalExcluir(false);
    }
  }

  function prepararDadosExportacao() {
    return [
      {
        ID: id,
        Nome: form.nome,
        Pontos: form.pontos,
        Nível:
          niveis.find((n) => String(n.value) === String(form.id_nivel))?.label ||
          form.id_nivel,
        Expiração: `${form.tempoExpiracao || 0} ${
          UNIDADES_TEMPO.find((u) => u.value === form.unidadeExpiracao)?.label ||
          form.unidadeExpiracao
        }`,
        Descrição: form.descricao,
        Requisitos: requisitos.length,
      },
    ];
  }

  function handleExcel() {
    const dados = prepararDadosExportacao();

    const ws = XLSX.utils.json_to_sheet(dados);

    ws["!cols"] = [
      { wch: 10 },
      { wch: 35 },
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
      { wch: 70 },
      { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Badge");

    XLSX.writeFile(wb, `badge_${id}.xlsx`);
  }

  function handlePDF() {
    const dados = prepararDadosExportacao();

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SOFTINSA - Editar Badge", 14, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Badge #${id}`, 14, 24);

    autoTable(doc, {
      startY: 34,
      head: [[
        "ID",
        "Nome",
        "Pontos",
        "Nível",
        "Expiração",
        "Descrição",
        "Requisitos",
      ]],
      body: dados.map((b) => [
        b.ID,
        b.Nome,
        b.Pontos,
        b.Nível,
        b.Expiração,
        b.Descrição,
        b.Requisitos,
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 40 },
        2: { cellWidth: 18 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 120 },
        6: { cellWidth: 22 },
      },
    });

    doc.save(`badge_${id}.pdf`);
  }

  if (loading) {
    return (
      <div style={pageWrapper}>
        <Header />

        <div style={layoutBody}>
          <AdminLeftSidebar />

          <main style={mainContent}>
            <div style={loadingBox}>
              <Spinner animation="border" variant="primary" />
            </div>
          </main>

          <AdminRightSidebar />
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      <Header />

      <div style={layoutBody}>
        <AdminLeftSidebar />

        <main style={mainContent}>
          <button onClick={() => navigate("/admin/badges")} style={backButton}>
            <BiArrowBack size={16} />
            Voltar
          </button>

          <div style={pageHeader}>
            <div>
              <h5 style={pageTitle}>Editar Badge</h5>
              <div style={pageSubtitle}>Badge #{id}</div>
            </div>

            <div style={exportActions}>
              <button onClick={handleExcel} style={excelButton}>
                📊 Excel
              </button>

              <button onClick={handlePDF} style={pdfButton}>
                📄 PDF
              </button>
            </div>
          </div>

          {erro && <div style={errorBox}>{erro}</div>}
          {sucesso && <div style={successBox}>{sucesso}</div>}

          <div style={card}>
            <div style={topBadgeBox}>
              <div onClick={handleImagemClick} style={imageCircle}>
                {form.imagemPreview ? (
                  <img
                    src={form.imagemPreview}
                    alt="Badge"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  <BiMedal size={44} color="#f59e0b" />
                )}

                <div style={imageEditBadge}>
                  <BiImageAdd size={15} />
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                style={{ display: "none" }}
                onChange={handleImagemChange}
              />

              <div style={{ flex: 1 }}>
                <div style={badgeNamePreview}>
                  {form.nome || "Badge sem nome"}
                </div>

                <div style={metaGrid}>
                  <MetaItem label="ID da badge" value={`#${id}`} />
                  <MetaItem
                    label="Data de criação"
                    value={formatarData(
                      badgeOriginal?.data_criacao_badge_modelo ||
                      badgeOriginal?.data_criacao
                    )}
                  />
                  <MetaItem
                    label="Última aquisição"
                    value={formatarData(
                      badgeOriginal?.ultima_aquisicao ||
                      badgeOriginal?.ultimaAquisicao
                    )}
                  />
                  <MetaItem
                    label="Total de consultores"
                    value={`${
                      badgeOriginal?.total_consultores ||
                      badgeOriginal?.totalConsultores ||
                      0
                    } consultores`}
                  />
                </div>

                {erros.imagem && <FieldError>{erros.imagem}</FieldError>}
              </div>
            </div>

            <div style={sectionHeader}>
              <BiUpload size={17} color="#2563eb" />
              <span style={sectionHeaderText}>Informações do Badge</span>
            </div>

            <div style={grid2}>
              <div>
                <label style={labelStyle}>Nome do Badge</label>

                <input
                  value={form.nome}
                  onChange={(e) => setCampo("nome", e.target.value)}
                  placeholder="Nome do badge"
                  style={{
                    ...inputStyleBase,
                    borderColor: erros.nome ? "#fca5a5" : "#d1d5db",
                  }}
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
                  placeholder="Ex: 120"
                  style={{
                    ...inputStyleBase,
                    borderColor: erros.pontos ? "#fca5a5" : "#d1d5db",
                  }}
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
                    style={{
                      ...inputStyleBase,
                      width: 85,
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <SelectDropdown
                      options={UNIDADES_TEMPO}
                      value={form.unidadeExpiracao}
                      onChange={(value) =>
                        setCampo("unidadeExpiracao", value)
                      }
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
                  placeholder="Selecione um nível"
                  erro={erros.id_nivel}
                />

                {erros.id_nivel && <FieldError>{erros.id_nivel}</FieldError>}
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Descrição</label>

              <textarea
                value={form.descricao}
                onChange={(e) => setCampo("descricao", e.target.value)}
                rows={4}
                style={{
                  ...textareaStyleBase,
                  borderColor: erros.descricao ? "#fca5a5" : "#d1d5db",
                }}
              />

              {erros.descricao && <FieldError>{erros.descricao}</FieldError>}
            </div>

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
                onEditar={setModalReq}
                onEliminar={eliminarRequisito}
              />
            ))}

            {requisitos.length === 0 && (
              <div style={emptyBox}>Sem requisitos definidos.</div>
            )}

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
                {aGuardar ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <BiSave size={18} />
                )}

                {aGuardar ? "A guardar..." : "Aplicar Alterações"}
              </button>

              <button
                onClick={() => setModalExcluir(true)}
                style={deleteButtonLarge}
              >
                <BiTrash size={18} />
                Excluir a Badge
              </button>
            </div>
          </div>
        </main>

        <AdminRightSidebar />
      </div>

      {modalReq && (
        <RequisitoModal
          requisito={modalReq}
          onClose={() => setModalReq(null)}
          onSave={guardarRequisito}
        />
      )}

      {modalExcluir && (
        <ConfirmDeleteModal
          badgeNome={form.nome}
          loading={aExcluir}
          onClose={() => setModalExcluir(false)}
          onConfirm={handleExcluir}
        />
      )}
    </div>
  );
}

function MetaItem({ label, value }) {
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

function FieldError({ children }) {
  return (
    <div style={{ fontSize: 11, color: "#dc2626", marginTop: 3 }}>
      {children}
    </div>
  );
}

export default EditarBadge;

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
};

const exportActions = {
  display: "flex",
  gap: 10,
};

const excelButton = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "7px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const pdfButton = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "7px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const card = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 28,
};

const topBadgeBox = {
  display: "flex",
  alignItems: "center",
  gap: 24,
  marginBottom: 28,
  paddingBottom: 24,
  borderBottom: "1px solid #f3f4f6",
};

const imageCircle = {
  width: 90,
  height: 90,
  borderRadius: "50%",
  background: "#fef9c3",
  border: "3px solid #fde68a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 44,
  flexShrink: 0,
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
};

const imageEditBadge = {
  position: "absolute",
  right: 0,
  bottom: 0,
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "#2563eb",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "2px solid white",
};

const badgeNamePreview = {
  fontSize: 18,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 14,
};

const metaGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px 40px",
};

const sectionHeader = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 18,
};

const sectionHeaderText = {
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  marginBottom: 18,
};

const labelStyle = {
  fontSize: 12,
  color: "#6b7280",
  fontWeight: 500,
  display: "block",
  marginBottom: 6,
};

const inputStyleBase = {
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
};

const textareaStyleBase = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: 12,
  fontSize: 14,
  color: "#111827",
  resize: "vertical",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  lineHeight: 1.6,
};

const dropdownIcon = {
  position: "absolute",
  right: 10,
  top: "50%",
  transform: "translateY(-50%)",
  color: "#6b7280",
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

const reqTitleRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
};

const reqTitle = {
  fontSize: 16,
  fontWeight: 700,
  color: "#111827",
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
  background: "white",
  marginBottom: 12,
  overflow: "hidden",
};

const requisitoHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 20px",
  cursor: "pointer",
  userSelect: "none",
};

const requisitoBodyAberto = {
  padding: "0 20px 16px",
  borderTop: "1px solid #f3f4f6",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  paddingTop: 14,
};

const requisitoBodyFechado = {
  padding: "0 20px 12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
};

const editReqButton = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  padding: "6px 14px",
  fontSize: 13,
  color: "#374151",
  cursor: "pointer",
  fontWeight: 500,
};

const deleteReqButton = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  border: "1px solid #fecaca",
  borderRadius: 8,
  background: "white",
  padding: "6px 14px",
  fontSize: 13,
  color: "#dc2626",
  cursor: "pointer",
  fontWeight: 500,
};

const actionsGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  marginTop: 24,
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

const deleteButtonLarge = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "13px 0",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const loadingBox = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 50,
};

const emptyBox = {
  textAlign: "center",
  padding: "20px 0",
  color: "#9ca3af",
  fontSize: 13,
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
  padding: 28,
  width: 500,
  boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
};

const modalTitle = {
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const modalCloseButton = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#6b7280",
};

const modalActions = {
  display: "flex",
  gap: 10,
  justifyContent: "flex-end",
};

const cancelButton = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  padding: "8px 20px",
  fontSize: 13,
  color: "#374151",
  cursor: "pointer",
};

const saveModalButton = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  padding: "8px 20px",
  fontSize: 13,
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};

const deleteModalButton = {
  border: "none",
  borderRadius: 8,
  background: "#dc2626",
  padding: "8px 20px",
  fontSize: 13,
  color: "white",
  fontWeight: 600,
};