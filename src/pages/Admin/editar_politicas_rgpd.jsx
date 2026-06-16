import { useEffect, useRef, useState } from "react";
import {
  BiArrowBack,
  BiBold,
  BiItalic,
  BiUnderline,
  BiStrikethrough,
  BiListUl,
  BiListOl,
  BiAlignLeft,
  BiAlignMiddle,
  BiUndo,
  BiRedo,
  BiSave,
  BiTrash,
  BiX,
} from "react-icons/bi";
import { useNavigate } from "react-router-dom";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../../services/api.js";
import Header from "../../components/Header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

const CONTEUDO_PADRAO_HTML = `
<h2>Políticas de RGPD</h2>
<p>A Softinsa Academy respeita a privacidade dos seus utilizadores e assegura a proteção dos dados pessoais recolhidos no âmbito da utilização da plataforma.</p>
<p>Os dados pessoais são utilizados apenas para fins relacionados com gestão de contas, candidaturas, badges, certificações, notificações e acompanhamento de progresso.</p>
<p>O utilizador tem direito de acesso, retificação, oposição, limitação, portabilidade e eliminação dos seus dados, nos termos previstos no Regulamento Geral sobre a Proteção de Dados.</p>
<p>Ao aceitar os Termos RGPD, o utilizador autoriza a utilização dos dados necessários para a partilha e validação de badges dentro da plataforma.</p>
`;

function isHtml(texto) {
  return /<\/?[a-z][\s\S]*>/i.test(String(texto || ""));
}

function escapeHtml(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textoParaHtml(texto) {
  const linhas = String(texto || "").split("\n");

  return linhas
    .map((linha) => {
      const trimmed = linha.trim();

      if (!trimmed) return "<p><br></p>";

      const isBullet =
        trimmed.startsWith("•") ||
        trimmed.startsWith("-") ||
        trimmed.startsWith("*");

      if (isBullet) {
        return `<ul><li>${escapeHtml(trimmed.replace(/^[•\-*]\s*/, ""))}</li></ul>`;
      }

      const isTitulo =
        trimmed.length < 70 &&
        !trimmed.endsWith(".") &&
        !trimmed.endsWith(",");

      if (isTitulo) {
        return `<h3>${escapeHtml(trimmed)}</h3>`;
      }

      return `<p>${escapeHtml(trimmed)}</p>`;
    })
    .join("");
}

function normalizarConteudoParaEditor(conteudo) {
  const valor = String(conteudo || "").trim();

  if (!valor) return CONTEUDO_PADRAO_HTML;

  return isHtml(valor) ? valor : textoParaHtml(valor);
}

function ToolBtn({ onClick, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      style={toolButton}
    >
      {children}
    </button>
  );
}

function ConfirmModal({ onClose, onConfirm }) {
  return (
    <div style={modalOverlay}>
      <div style={modalCard}>
        <div style={modalHeader}>
          <h6 style={modalTitle}>Excluir alterações</h6>
          <button onClick={onClose} style={closeButton}>
            <BiX size={22} />
          </button>
        </div>

        <p style={modalText}>
          Tens a certeza que queres excluir as alterações feitas no editor?
          O texto volta à última versão guardada.
        </p>

        <div style={modalActions}>
          <button onClick={onClose} style={cancelButton}>
            Cancelar
          </button>

          <button onClick={onConfirm} style={dangerButton}>
            Excluir alterações
          </button>
        </div>
      </div>
    </div>
  );
}

function EdicaoRGPD() {
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const [politica, setPolitica] = useState(null);
  const [conteudoOriginal, setConteudoOriginal] = useState(CONTEUDO_PADRAO_HTML);
  const [headingValue, setHeadingValue] = useState("Heading 2");
  const [linhas, setLinhas] = useState(0);
  const [aceite, setAceite] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [mostrarModalExcluir, setMostrarModalExcluir] = useState(false);

  useEffect(() => {
    carregarPolitica();
  }, []);

  async function carregarPolitica() {
    try {
      setIsLoading(true);
      setErro("");
      setSucesso("");

      const res = await api.get("/rgpd/politica");
      const data = res.data?.politica || res.data;

      const html = normalizarConteudoParaEditor(data?.conteudo);

      setPolitica(data);
      setConteudoOriginal(html);

      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = html;
          contarLinhas();
        }
      }, 0);
    } catch (err) {
      console.error("Erro ao carregar política RGPD:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      const html = CONTEUDO_PADRAO_HTML;

      setConteudoOriginal(html);

      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = html;
          contarLinhas();
        }
      }, 0);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar a política de RGPD. Foi apresentado o texto padrão."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function contarLinhas() {
    const texto = editorRef.current?.innerText || "";
    const total = texto.split("\n").filter((linha) => linha.trim()).length;
    setLinhas(total);
  }

  function exec(cmd, val = null) {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    contarLinhas();
    setErro("");
    setSucesso("");
  }

  function aplicarHeading(val) {
    setHeadingValue(val);

    const tag =
      val === "Normal"
        ? "p"
        : val === "Heading 1"
          ? "h1"
          : val === "Heading 2"
            ? "h2"
            : val === "Heading 3"
              ? "h3"
              : "p";

    exec("formatBlock", tag);
  }

  function getConteudoHtml() {
    return editorRef.current?.innerHTML || "";
  }

  function getConteudoTexto() {
    return editorRef.current?.innerText || "";
  }

  async function handleGuardar() {
    const html = getConteudoHtml().trim();
    const texto = getConteudoTexto().trim();

    if (!texto) {
      setErro("O conteúdo da política RGPD não pode ficar vazio.");
      return;
    }

    try {
      setAGuardar(true);
      setErro("");
      setSucesso("");

      const res = await api.put("/rgpd/politica", {
        titulo: politica?.titulo || "Políticas de RGPD",
        conteudo: html,
        estado_politica: "ATIVO",
      });

      const data = res.data?.politica || res.data;

      setPolitica(data);
      setConteudoOriginal(html);
      setSucesso("Política RGPD atualizada com sucesso.");

      setTimeout(() => {
        navigate("/admin/rgpd");
      }, 600);
    } catch (err) {
      console.error("Erro ao guardar política RGPD:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível guardar a política de RGPD."
      );
    } finally {
      setAGuardar(false);
    }
  }

  function handleExcluirAlteracoes() {
    if (editorRef.current) {
      editorRef.current.innerHTML = conteudoOriginal;
      contarLinhas();
    }

    setMostrarModalExcluir(false);
    setErro("");
    setSucesso("Alterações descartadas.");
  }

  function handleExcel() {
    const texto = getConteudoTexto();

    if (!texto.trim()) {
      alert("Não existe política RGPD para exportar.");
      return;
    }

    const linhasExport = texto.split("\n").map((linha, index) => ({
      Linha: index + 1,
      Conteúdo: linha,
    }));

    const ws = XLSX.utils.json_to_sheet(linhasExport);

    ws["!cols"] = [
      { wch: 10 },
      { wch: 120 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Políticas RGPD");

    const hoje = new Date()
      .toLocaleDateString("pt-PT")
      .replaceAll("/", "-");

    XLSX.writeFile(wb, `politicas_rgpd_${hoje}.xlsx`);
  }

  function handlePDF() {
    const texto = getConteudoTexto();

    if (!texto.trim()) {
      alert("Não existe política RGPD para exportar.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const hoje = new Date().toLocaleDateString("pt-PT");

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SOFTINSA - Políticas de RGPD", 14, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Exportado em: ${hoje}`, 14, 23);
    doc.text(`Total de linhas: ${linhas}`, 14, 29);

    const linhasPDF = texto
      .split("\n")
      .map((linha, index) => [index + 1, linha]);

    autoTable(doc, {
      startY: 36,
      head: [["Linha", "Conteúdo"]],
      body: linhasPDF,
      styles: {
        fontSize: 8,
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
        0: { cellWidth: 16 },
        1: { cellWidth: 164 },
      },
      margin: { top: 36, left: 14, right: 14 },
    });

    const ficheiro = new Date()
      .toLocaleDateString("pt-PT")
      .replaceAll("/", "-");

    doc.save(`politicas_rgpd_${ficheiro}.pdf`);
  }

  const menuItems = ["File", "Edit", "View", "Insert", "Format", "Help"];

  return (
    <div style={pageWrapper}>
      <Header />

      <div style={layoutBody}>
        <AdminLeftSidebar />

        <main style={mainContent}>
          <button onClick={() => navigate("/admin/rgpd")} style={backButton}>
            <BiArrowBack size={16} />
            Voltar
          </button>

          <div style={pageHeader}>
            <div>
              <h5 style={pageTitle}>Edição do RGPD</h5>

              <div style={pageSubtitle}>
                Total de {linhas} linhas
                {politica?.data_atualizacao && (
                  <>
                    {" · "}
                    Última atualização:{" "}
                    {new Date(politica.data_atualizacao).toLocaleString(
                      "pt-PT"
                    )}
                  </>
                )}
              </div>
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

          <div style={editorCard}>
            <div style={menuBar}>
              {menuItems.map((item) => (
                <button key={item} style={menuButton}>
                  {item}
                </button>
              ))}
            </div>

            <div style={toolbar}>
              <ToolBtn onClick={() => exec("undo")} title="Undo">
                <BiUndo size={16} />
              </ToolBtn>

              <ToolBtn onClick={() => exec("redo")} title="Redo">
                <BiRedo size={16} />
              </ToolBtn>

              <div style={separator} />

              <select
                value={headingValue}
                onChange={(e) => aplicarHeading(e.target.value)}
                style={selectStyle}
              >
                <option>Normal</option>
                <option>Heading 1</option>
                <option>Heading 2</option>
                <option>Heading 3</option>
              </select>

              <div style={separator} />

              <ToolBtn onClick={() => exec("bold")} title="Bold">
                <BiBold size={16} />
              </ToolBtn>

              <ToolBtn onClick={() => exec("italic")} title="Italic">
                <BiItalic size={16} />
              </ToolBtn>

              <ToolBtn onClick={() => exec("underline")} title="Underline">
                <BiUnderline size={16} />
              </ToolBtn>

              <ToolBtn onClick={() => exec("strikeThrough")} title="Strikethrough">
                <BiStrikethrough size={16} />
              </ToolBtn>

              <div style={separator} />

              <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullet list">
                <BiListUl size={16} />
              </ToolBtn>

              <ToolBtn onClick={() => exec("insertOrderedList")} title="Ordered list">
                <BiListOl size={16} />
              </ToolBtn>

              <ToolBtn onClick={() => exec("justifyLeft")} title="Align left">
                <BiAlignLeft size={16} />
              </ToolBtn>

              <ToolBtn onClick={() => exec("justifyCenter")} title="Align center">
                <BiAlignMiddle size={16} />
              </ToolBtn>
            </div>

            {isLoading ? (
              <div style={loadingBox}>A carregar política RGPD...</div>
            ) : (
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={contarLinhas}
                style={editorArea}
              />
            )}

            <div style={editorFooter}>
              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={aceite}
                  onChange={(e) => setAceite(e.target.checked)}
                  style={checkboxStyle}
                />

                <span>
                  Aceita os nossos{" "}
                  <span style={termsLink}>Termos RGPD</span> para partilha de
                  badge
                </span>
              </label>
            </div>
          </div>

          <div style={bottomActions}>
            <button
              onClick={handleGuardar}
              disabled={aGuardar || isLoading}
              style={{
                ...saveButton,
                opacity: aGuardar || isLoading ? 0.7 : 1,
                cursor: aGuardar || isLoading ? "not-allowed" : "pointer",
              }}
            >
              <BiSave size={18} />
              {aGuardar ? "A guardar..." : "Aplicar Alterações"}
            </button>

            <button
              onClick={() => setMostrarModalExcluir(true)}
              disabled={isLoading}
              style={{
                ...deleteButton,
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              <BiTrash size={18} />
              Excluir Alterações
            </button>
          </div>
        </main>

        <AdminRightSidebar />
      </div>

      {mostrarModalExcluir && (
        <ConfirmModal
          onClose={() => setMostrarModalExcluir(false)}
          onConfirm={handleExcluirAlteracoes}
        />
      )}
    </div>
  );
}

export default EdicaoRGPD;

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
  gap: 16,
  marginBottom: 20,
};

const pageTitle = {
  fontWeight: 700,
  color: "#111827",
  margin: 0,
};

const pageSubtitle = {
  fontSize: 12,
  color: "#6b7280",
  marginTop: 2,
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
  padding: "8px 16px",
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
  padding: "8px 16px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
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

const editorCard = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  overflow: "hidden",
};

const menuBar = {
  display: "flex",
  gap: 0,
  borderBottom: "1px solid #e5e7eb",
  padding: "6px 12px",
  background: "#fafafa",
};

const menuButton = {
  background: "none",
  border: "none",
  padding: "4px 10px",
  fontSize: 13,
  color: "#374151",
  cursor: "pointer",
  borderRadius: 4,
};

const toolbar = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 12px",
  borderBottom: "1px solid #e5e7eb",
  flexWrap: "wrap",
  background: "#fafafa",
};

const toolButton = {
  width: 30,
  height: 28,
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  background: "transparent",
  color: "#374151",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
};

const separator = {
  width: 1,
  height: 20,
  background: "#d1d5db",
  margin: "0 4px",
};

const selectStyle = {
  height: 28,
  border: "1px solid #d1d5db",
  borderRadius: 4,
  padding: "0 8px",
  fontSize: 13,
  color: "#374151",
  outline: "none",
  background: "white",
  cursor: "pointer",
};

const editorArea = {
  minHeight: 480,
  maxHeight: 560,
  overflowY: "auto",
  padding: "20px 28px",
  fontSize: 14,
  color: "#111827",
  lineHeight: 1.8,
  outline: "none",
  borderBottom: "1px solid #e5e7eb",
};

const loadingBox = {
  minHeight: 480,
  padding: 28,
  fontSize: 14,
  color: "#6b7280",
};

const editorFooter = {
  padding: "14px 28px",
  background: "#fafafa",
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const checkboxLabel = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
  fontSize: 14,
  color: "#374151",
};

const checkboxStyle = {
  width: 16,
  height: 16,
  cursor: "pointer",
  accentColor: "#2563eb",
};

const termsLink = {
  color: "#2563eb",
  fontWeight: 500,
  textDecoration: "underline",
  cursor: "pointer",
};

const bottomActions = {
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

const deleteButton = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "14px 0",
  fontSize: 15,
  fontWeight: 600,
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
  width: 430,
  boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const modalTitle = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: "#111827",
};

const closeButton = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  color: "#6b7280",
};

const modalText = {
  fontSize: 14,
  color: "#4b5563",
  lineHeight: 1.6,
  marginBottom: 20,
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

const dangerButton = {
  border: "none",
  borderRadius: 8,
  background: "#dc2626",
  padding: "8px 18px",
  fontSize: 13,
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};