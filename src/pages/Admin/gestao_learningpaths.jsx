import { useEffect, useState } from "react";
import {
  BiArrowBack,
  BiEdit,
  BiUserX,
  BiPlus,
  BiBook,
  BiSearch,
  BiX,
} from "react-icons/bi";
import { useNavigate } from "react-router-dom";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../../services/api.js";
import Header from "../../components/header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";
import logoImg from "../../assets/logo.png";

function normalizarEstado(estado) {
  const e = String(estado || "").trim().toUpperCase();

  if (e === "ATIVO" || e === "ATIVA" || e === "ACTIVE") return "ATIVO";
  if (e === "INATIVO" || e === "INATIVA" || e === "INACTIVE") return "INATIVO";

  return "ATIVO";
}

function normalizarLearningPath(lp) {
  return {
    id:
      lp.id_learningpaths ||
      lp.ID_LEARNINGPATHS ||
      lp.id_learningpath ||
      lp.id ||
      "",

    nome:
      lp.nome_learningpaths ||
      lp.NOME_LEARNINGPATHS ||
      lp.nome ||
      "Learning Path sem nome",

    descricao:
      lp.descricao_learningpaths ||
      lp.DESCRICAO_LEARNINGPATHS ||
      lp.descricao ||
      "Sem descrição.",

    estado: normalizarEstado(
      lp.estado_learningpaths ||
        lp.ESTADO_LEARNINGPATHS ||
        lp.estado ||
        "ATIVO"
    ),

    tipo:
      lp.tipo_learningpaths ||
      lp.TIPO_LEARNINGPATHS ||
      lp.tipo ||
      "Tecnologia",

    modalidade:
      lp.modalidade ||
      lp.MODALIDADE ||
      lp.tipo_formacao ||
      "Online",

    areas:
      lp.areas ||
      lp.nome_areas ||
      lp.nome_area ||
      "Sem área",

    serviceLines:
      lp.service_lines ||
      lp.nome_servicelines ||
      lp.nome_serviceline ||
      "Sem Service Line",

    totalServiceLines: Number(
      lp.total_servicelines ||
        lp.total_service_lines ||
        lp.numero_servicelines ||
        lp.serviceLines ||
        0
    ),

    inscritos: Number(
      lp.total_inscritos ||
        lp.inscritos ||
        lp.consultores ||
        0
    ),
  };
}

function tagStyle(tag) {
  const map = {
    Tecnologia: { bg: "#dbeafe", color: "#1d4ed8" },
    Online: { bg: "#dcfce7", color: "#15803d" },
    Negócio: { bg: "#fef9c3", color: "#854d0e" },
    Gestão: { bg: "#f3e8ff", color: "#7e22ce" },
    Presencial: { bg: "#ffe4e6", color: "#be123c" },
    Ativa: { bg: "#dcfce7", color: "#15803d" },
    Inativa: { bg: "#fee2e2", color: "#b91c1c" },
  };

  return map[tag] || { bg: "#f3f4f6", color: "#374151" };
}

function separarLista(texto) {
  if (!texto) return [];

  return String(texto)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function ListaCompacta({ label, texto, limite = 3 }) {
  const [aberto, setAberto] = useState(false);

  const itens = separarLista(texto);
  const temMais = itens.length > limite;

  const visiveis = aberto ? itens : itens.slice(0, limite);

  if (itens.length === 0) {
    return (
      <div style={compactLine}>
        <span style={compactLabel}>{label}:</span>
        <span style={compactEmpty}>Sem dados</span>
      </div>
    );
  }

  return (
    <div style={compactBlock}>
      <span style={compactLabel}>{label}:</span>

      <div style={compactTagsWrapper}>
        {visiveis.map((item) => (
          <span key={item} style={compactTag}>
            {item}
          </span>
        ))}

        {temMais && (
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            style={verMaisButton}
          >
            {aberto ? "Ver menos" : `+${itens.length - limite} ver mais`}
          </button>
        )}
      </div>
    </div>
  );
}

function LearningPathCard({ lp, onEditar, onDesativar }) {
  const estadoLabel = lp.estado === "ATIVO" ? "Ativa" : "Inativa";
  const tipoStyle = tagStyle(lp.tipo);
  const modalidadeStyle = tagStyle(lp.modalidade);
  const estadoStyle = tagStyle(estadoLabel);

  return (
    <div style={cardStyle}>
      <div style={cardHeader}>
        <ListaCompacta label="Áreas" texto={lp.areas} limite={3} />

        <ListaCompacta label="Service Lines" texto={lp.serviceLines} limite={3} />
    </div>

      <div style={cardBody}>
        <div style={iconBox}>
          <BiBook size={26} color="#64748b" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={lpTitle}>{lp.nome}</div>

              <div style={lpDescription}>{lp.descricao}</div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={tagPill(tipoStyle)}>{lp.tipo}</span>
                <span style={tagPill(modalidadeStyle)}>{lp.modalidade}</span>
                <span style={tagPill(estadoStyle)}>{estadoLabel}</span>
              </div>
            </div>

            <div style={rightBox}>
              <div style={{ display: "flex", gap: 28, textAlign: "center" }}>
                <div>
                  <div style={statLabel}>Service Lines</div>
                  <div style={statValue}>{lp.totalServiceLines}</div>
                </div>

                <div>
                  <div style={statLabel}>Inscritos</div>
                  <div style={statValue}>{lp.inscritos}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => onEditar(lp.id)}
                  style={editButton}
                >
                  <BiEdit size={15} color="#2563eb" />
                  Editar
                </button>

                <button
                  onClick={() => onDesativar(lp)}
                  disabled={lp.estado === "INATIVO"}
                  style={{
                    ...deactivateButton,
                    opacity: lp.estado === "INATIVO" ? 0.4 : 1,
                    cursor:
                      lp.estado === "INATIVO"
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  <BiUserX size={15} />
                  Desativar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesativarLearningPathModal({
  learningPath,
  loading,
  onClose,
  onConfirm,
}) {
  if (!learningPath) return null;

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

        <div style={modalLogoBox}>
          <img src={logoImg} alt="Softinsa" style={{ height: 40 }} />
        </div>

        <div style={modalIconDanger}>
          <BiUserX size={34} />
        </div>

        <h3 style={modalTitle}>Desativar Learning Path?</h3>

        <p style={modalText}>
          O Learning Path <strong>{learningPath.nome}</strong> será marcado
          como <strong>Inativo</strong>.
        </p>

        <p style={modalSubText}>
          Esta ação não apaga o Learning Path da base de dados. O histórico,
          service lines e relações existentes continuam guardados.
        </p>

        <div style={modalUserBox}>
          <div style={modalUserAvatar}>
            <BiBook size={24} color="#2563eb" />
          </div>

          <div style={{ flex: 1 }}>
            <div style={modalUserName}>{learningPath.nome}</div>
            <div style={modalUserEmail}>
              {learningPath.areas} · {learningPath.serviceLines}
            </div>
          </div>

          <span style={modalUserRole}>{learningPath.tipo}</span>
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
            onClick={onConfirm}
            disabled={loading}
            style={{
              ...modalConfirmButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "A desativar..." : "Sim, desativar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GestaoLearningPaths() {
  const navigate = useNavigate();

  const [pesquisa, setPesquisa] = useState("");
  const [lista, setLista] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [modalDesativarAberta, setModalDesativarAberta] = useState(false);
  const [learningPathSelecionado, setLearningPathSelecionado] = useState(null);
  const [aDesativar, setADesativar] = useState(false);

  useEffect(() => {
    carregarLearningPaths();
  }, []);

  async function carregarLearningPaths() {
    try {
      setIsLoading(true);
      setErro("");

      const res = await api.get("/learningpaths");

      const data = res.data;

      const dados =
        Array.isArray(data)
          ? data
          : Array.isArray(data.learningpaths)
            ? data.learningpaths
            : Array.isArray(data.learningPaths)
              ? data.learningPaths
              : Array.isArray(data.data)
                ? data.data
                : [];

      setLista(dados.map(normalizarLearningPath));
    } catch (err) {
      console.error("Erro ao carregar Learning Paths:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar os Learning Paths."
      );

      setLista([]);
    } finally {
      setIsLoading(false);
    }
  }

  const listaFiltrada = lista.filter((lp) => {
    const texto = pesquisa.toLowerCase();

    return (
      lp.nome.toLowerCase().includes(texto) ||
      lp.descricao.toLowerCase().includes(texto) ||
      lp.areas.toLowerCase().includes(texto) ||
      lp.serviceLines.toLowerCase().includes(texto) ||
      lp.tipo.toLowerCase().includes(texto) ||
      lp.modalidade.toLowerCase().includes(texto)
    );
  });

  function handleEditar(id) {
    navigate(`/admin/learning-paths/editar/${id}`);
  }

  function handleNovo() {
    navigate("/admin/learning-paths/novo");
  }

  function abrirModalDesativar(lp) {
    if (lp.estado === "INATIVO") return;

    setLearningPathSelecionado(lp);
    setModalDesativarAberta(true);
  }

  function fecharModalDesativar() {
    if (aDesativar) return;

    setModalDesativarAberta(false);
    setLearningPathSelecionado(null);
  }

  async function confirmarDesativar() {
    if (!learningPathSelecionado) return;

    try {
      setADesativar(true);

      await api.put(`/learningpaths/${learningPathSelecionado.id}/desativar`);

      setLista((prev) =>
        prev.map((lp) =>
          lp.id === learningPathSelecionado.id
            ? { ...lp, estado: "INATIVO" }
            : lp
        )
      );

      setModalDesativarAberta(false);
      setLearningPathSelecionado(null);
    } catch (err) {
      console.error("Erro ao desativar Learning Path:", err);

      alert(
        err.response?.data?.error ||
          "Não foi possível desativar este Learning Path."
      );
    } finally {
      setADesativar(false);
    }
  }

  function handleExcel() {
  if (listaFiltrada.length === 0) {
    alert("Não existem Learning Paths para exportar.");
    return;
  }

  const dadosExcel = listaFiltrada.map((lp) => ({
    ID: lp.id,
    "Learning Path": lp.nome,
    Descrição: lp.descricao,
    Áreas: lp.areas,
    "Service Lines": lp.serviceLines,
    Tipo: lp.tipo,
    Modalidade: lp.modalidade,
    Estado: lp.estado === "ATIVO" ? "Ativo" : "Inativo",
    "N.º Service Lines": lp.totalServiceLines,
    "N.º Inscritos": lp.inscritos,
  }));

  const worksheet = XLSX.utils.json_to_sheet(dadosExcel);

  worksheet["!cols"] = [
    { wch: 8 },
    { wch: 32 },
    { wch: 70 },
    { wch: 70 },
    { wch: 70 },
    { wch: 18 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
    { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Learning Paths"
  );

  const dataHoje = new Date()
    .toLocaleDateString("pt-PT")
    .replaceAll("/", "-");

  XLSX.writeFile(workbook, `learning_paths_${dataHoje}.xlsx`);
}

function handlePDF() {
  if (listaFiltrada.length === 0) {
    alert("Não existem Learning Paths para exportar.");
    return;
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const dataHoje = new Date().toLocaleDateString("pt-PT");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("SOFTINSA - Gestão de Learning Paths", 14, 16);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Exportado em: ${dataHoje}`, 14, 23);
  doc.text(`Total: ${listaFiltrada.length} Learning Paths`, 14, 29);

  const linhas = listaFiltrada.map((lp) => [
    lp.id,
    lp.nome,
    lp.tipo,
    lp.modalidade,
    lp.estado === "ATIVO" ? "Ativo" : "Inativo",
    lp.totalServiceLines,
    lp.inscritos,
    lp.areas,
    lp.serviceLines,
    lp.descricao,
  ]);

  autoTable(doc, {
    startY: 36,
    head: [[
      "ID",
      "Learning Path",
      "Tipo",
      "Modalidade",
      "Estado",
      "SL",
      "Inscritos",
      "Áreas",
      "Service Lines",
      "Descrição",
    ]],
    body: linhas,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: "linebreak",
      valign: "top",
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 30 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 18 },
      5: { cellWidth: 10 },
      6: { cellWidth: 16 },
      7: { cellWidth: 48 },
      8: { cellWidth: 48 },
      9: { cellWidth: 68 },
    },
    margin: { top: 36, left: 8, right: 8 },
  });

  const dataFicheiro = new Date()
    .toLocaleDateString("pt-PT")
    .replaceAll("/", "-");

  doc.save(`learning_paths_${dataFicheiro}.pdf`);
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
          <button onClick={() => navigate("/admin")} style={backButton}>
            <BiArrowBack size={16} />
            Voltar
          </button>

          <div style={pageHeader}>
            <div>
              <h5 style={pageTitle}>Gestão de Learning Paths</h5>

              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Total de {listaFiltrada.length} Learning Paths
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleExcel} style={excelButton}>
                📊 Excel
              </button>

              <button onClick={handlePDF} style={pdfButton}>
                📄 PDF
              </button>
            </div>
          </div>

          <div style={searchRow}>
            <div style={{ position: "relative", flex: 1 }}>
              <BiSearch
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                  pointerEvents: "none",
                }}
              />

              <input
                type="text"
                placeholder="Buscar Learning Paths..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                style={searchInput}
                onFocus={(e) => {
                  e.target.style.borderColor = "#2563eb";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                }}
              />
            </div>

            <button onClick={handleNovo} style={newButton}>
              <BiPlus size={24} />
            </button>
          </div>

          {erro && <div style={errorBox}>{erro}</div>}

          {isLoading ? (
            <div style={loadingBox}>A carregar Learning Paths...</div>
          ) : listaFiltrada.length > 0 ? (
            listaFiltrada.map((lp) => (
              <LearningPathCard
                key={lp.id}
                lp={lp}
                onEditar={handleEditar}
                onDesativar={abrirModalDesativar}
              />
            ))
          ) : (
            <div style={emptyBox}>
              Nenhum Learning Path encontrado.
            </div>
          )}
        </div>

        <AdminRightSidebar />
      </div>

      {modalDesativarAberta && (
        <DesativarLearningPathModal
          learningPath={learningPathSelecionado}
          loading={aDesativar}
          onClose={fecharModalDesativar}
          onConfirm={confirmarDesativar}
        />
      )}
    </div>
  );
}

function tagPill(styleObj) {
  return {
    background: styleObj.bg,
    color: styleObj.color,
    borderRadius: 6,
    padding: "3px 12px",
    fontSize: 12,
    fontWeight: 600,
  };
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
  gap: 12,
  flexWrap: "wrap",
};

const pageTitle = {
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const searchRow = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  marginBottom: 20,
};

const searchInput = {
  width: "100%",
  height: 42,
  paddingLeft: 38,
  paddingRight: 16,
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  fontSize: 14,
  color: "#374151",
  background: "white",
  outline: "none",
  boxSizing: "border-box",
};

const newButton = {
  width: 42,
  height: 42,
  borderRadius: 10,
  background: "#2563eb",
  border: "none",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  overflow: "hidden",
  marginBottom: 16,
  background: "white",
};

const cardHeader = {
  padding: "14px 24px",
  background: "#f8fafc",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const cardBody = {
  padding: "20px 24px",
  display: "flex",
  gap: 18,
  alignItems: "flex-start",
};

const iconBox = {
  width: 52,
  height: 52,
  borderRadius: 10,
  background: "#f1f5f9",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  border: "1px solid #e2e8f0",
};

const lpTitle = {
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 6,
};

const lpDescription = {
  fontSize: 13,
  color: "#6b7280",
  lineHeight: 1.6,
  marginBottom: 12,
};

const rightBox = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 14,
  flexShrink: 0,
};

const statLabel = {
  fontSize: 11,
  color: "#9ca3af",
  marginBottom: 2,
};

const statValue = {
  fontSize: 16,
  fontWeight: 700,
  color: "#111827",
};

const editButton = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  padding: "6px 14px",
  fontSize: 13,
  color: "#374151",
  cursor: "pointer",
  fontWeight: 500,
};

const deactivateButton = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid #fecaca",
  borderRadius: 8,
  background: "white",
  padding: "6px 14px",
  fontSize: 13,
  color: "#dc2626",
  fontWeight: 500,
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

const loadingBox = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  color: "#6b7280",
  textAlign: "center",
};

const emptyBox = {
  textAlign: "center",
  padding: 48,
  color: "#9ca3af",
  fontSize: 14,
  background: "white",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
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

const modalLogoBox = {
  marginBottom: 16,
  display: "flex",
  justifyContent: "center",
};

const modalIconDanger = {
  width: 68,
  height: 68,
  margin: "0 auto 16px",
  borderRadius: "50%",
  background: "#fee2e2",
  color: "#dc2626",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
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

const modalUserBox = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
  marginBottom: 20,
  textAlign: "left",
};

const modalUserAvatar = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const modalUserName = {
  fontSize: 13,
  fontWeight: 700,
  color: "#111827",
};

const modalUserEmail = {
  fontSize: 11,
  color: "#6b7280",
  marginTop: 2,
  maxWidth: 230,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const modalUserRole = {
  background: "#eff6ff",
  color: "#2563eb",
  borderRadius: 999,
  padding: "4px 9px",
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: "nowrap",
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

const modalConfirmButton = {
  border: "none",
  background: "#dc2626",
  color: "white",
  borderRadius: 10,
  padding: "9px 15px",
  fontSize: 13,
  fontWeight: 700,
};

const compactBlock = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  flexWrap: "wrap",
};

const compactLine = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const compactLabel = {
  fontSize: 12,
  fontWeight: 700,
  color: "#64748b",
  minWidth: 90,
};

const compactTagsWrapper = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  flex: 1,
};

const compactTag = {
  background: "#eff6ff",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
  borderRadius: 999,
  padding: "3px 9px",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.4,
};

const compactEmpty = {
  fontSize: 12,
  color: "#9ca3af",
};

const verMaisButton = {
  border: "none",
  background: "#e0f2fe",
  color: "#0369a1",
  borderRadius: 999,
  padding: "3px 9px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

export default GestaoLearningPaths;