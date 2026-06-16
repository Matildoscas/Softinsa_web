import { useEffect, useState } from "react";
import {
  BiArrowBack,
  BiEdit,
  BiSave,
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

function RenderPolitica({ texto }) {
  const linhas = String(texto || "").split("\n");

  return (
    <div style={politicaText}>
      {linhas.map((linha, i) => {
        const trimmed = linha.trim();

        if (!trimmed) {
          return <div key={i} style={{ height: 8 }} />;
        }

        const isBullet =
          trimmed.startsWith("•") ||
          trimmed.startsWith("-") ||
          trimmed.startsWith("*");

        if (isBullet) {
          return (
            <div key={i} style={bulletLine}>
              <span style={bulletDot}>•</span>
              <span>{trimmed.replace(/^[•\-*]\s*/, "")}</span>
            </div>
          );
        }

        const isSectionTitle =
          trimmed.length < 70 &&
          !trimmed.endsWith(".") &&
          !trimmed.endsWith(",") &&
          i > 0;

        if (isSectionTitle) {
          return (
            <div key={i} style={sectionTextTitle}>
              {trimmed}
            </div>
          );
        }

        return <div key={i}>{trimmed}</div>;
      })}
    </div>
  );
}

function PoliticasRGPD() {
  const navigate = useNavigate();

  const [politica, setPolitica] = useState(null);
  const [texto, setTexto] = useState("");
  const [textoEditando, setTextoEditando] = useState("");
  const [modoEdicao, setModoEdicao] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    carregarPolitica();
  }, []);

  async function carregarPolitica() {
    try {
      setIsLoading(true);
      setErro("");

      const res = await api.get("/rgpd/politica");

      const data = res.data?.politica || res.data;

      setPolitica(data);
      setTexto(data?.conteudo || "");
    } catch (err) {
      console.error("Erro ao carregar política RGPD:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar a política de RGPD."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleEditar() {
    setTextoEditando(texto);
    setModoEdicao(true);
    setErro("");
    setSucesso("");
  }

  function handleCancelar() {
    setTextoEditando("");
    setModoEdicao(false);
    setErro("");
  }

  async function handleGuardar() {
    if (!textoEditando.trim()) {
      setErro("O conteúdo da política RGPD não pode ficar vazio.");
      return;
    }

    try {
      setAGuardar(true);
      setErro("");
      setSucesso("");

      const res = await api.put("/rgpd/politica", {
        titulo: "Políticas de RGPD",
        conteudo: textoEditando.trim(),
        estado_politica: "ATIVO",
      });

      const data = res.data?.politica || res.data;

      setPolitica(data);
      setTexto(data?.conteudo || textoEditando.trim());
      setTextoEditando("");
      setModoEdicao(false);
      setSucesso("Política RGPD atualizada com sucesso.");
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

  const linhas = String(modoEdicao ? textoEditando : texto)
    .split("\n")
    .filter((l) => l.trim()).length;

  function handleExcel() {
    const conteudo = modoEdicao ? textoEditando : texto;

    if (!conteudo.trim()) {
      alert("Não existe política RGPD para exportar.");
      return;
    }

    const linhasExport = conteudo.split("\n").map((linha, index) => ({
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
    const conteudo = modoEdicao ? textoEditando : texto;

    if (!conteudo.trim()) {
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

    const linhasPDF = conteudo
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

        <div style={{ flex: 1, overflowY: "auto", padding: 24, minWidth: 0 }}>
          <button onClick={() => navigate("/admin")} style={backButton}>
            <BiArrowBack size={16} />
            Voltar
          </button>

          <div style={pageHeader}>
            <div>
              <h5 style={pageTitle}>Políticas de RGPD</h5>

              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                Total de {linhas} linhas
                {politica?.data_atualizacao && (
                  <>
                    {" · "}
                    Última atualização:{" "}
                    {new Date(politica.data_atualizacao).toLocaleString("pt-PT")}
                  </>
                )}
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

          {erro && <div style={errorBox}>{erro}</div>}
          {sucesso && <div style={successBox}>{sucesso}</div>}

          {isLoading ? (
            <div style={loadingBox}>A carregar política RGPD...</div>
          ) : (
            <div style={contentCard}>
              <div style={contentArea}>
                {modoEdicao ? (
                  <textarea
                    value={textoEditando}
                    onChange={(e) => {
                      setTextoEditando(e.target.value);
                      setErro("");
                    }}
                    style={textareaStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#d1d5db";
                    }}
                  />
                ) : (
                  <RenderPolitica texto={texto} />
                )}
              </div>

              <div style={footerBar}>
                <label style={previewCheckLabel}>
                  <input
                    type="checkbox"
                    checked={true}
                    readOnly
                    style={previewCheck}
                  />

                  <span>
                    Texto apresentado aos utilizadores nos{" "}
                    <span style={termsLink}>Termos RGPD</span> para partilha de badge
                  </span>
                </label>

                {modoEdicao ? (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={handleCancelar}
                      disabled={aGuardar}
                      style={cancelButton}
                    >
                      <BiX size={16} />
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
                      <BiSave size={16} />
                      {aGuardar ? "A guardar..." : "Guardar"}
                    </button>
                  </div>
                ) : (
                  <button onClick={handleEditar} style={editButton}>
                    <BiEdit size={15} color="#2563eb" />
                    Editar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <AdminRightSidebar />
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
  gap: 12,
  flexWrap: "wrap",
};

const pageTitle = {
  fontWeight: 700,
  color: "#111827",
  margin: 0,
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

const contentCard = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  overflow: "hidden",
};

const contentArea = {
  padding: "24px 28px",
  maxHeight: 560,
  overflowY: "auto",
};

const politicaText = {
  fontSize: 14,
  color: "#374151",
  lineHeight: 1.8,
  whiteSpace: "normal",
};

const bulletLine = {
  display: "flex",
  gap: 8,
  paddingLeft: 16,
  marginBottom: 2,
};

const bulletDot = {
  color: "#6b7280",
  flexShrink: 0,
};

const sectionTextTitle = {
  fontWeight: 700,
  color: "#111827",
  marginTop: 12,
  marginBottom: 4,
};

const textareaStyle = {
  width: "100%",
  minHeight: 480,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: 16,
  fontSize: 14,
  color: "#374151",
  lineHeight: 1.8,
  resize: "vertical",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const footerBar = {
  borderTop: "1px solid #e5e7eb",
  padding: "14px 28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  background: "#fafafa",
  flexWrap: "wrap",
};

const previewCheckLabel = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 14,
  color: "#374151",
};

const previewCheck = {
  width: 16,
  height: 16,
  accentColor: "#2563eb",
};

const termsLink = {
  color: "#2563eb",
  fontWeight: 600,
  textDecoration: "underline",
};

const editButton = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  padding: "7px 16px",
  fontSize: 13,
  color: "#374151",
  cursor: "pointer",
  fontWeight: 500,
};

const cancelButton = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "white",
  padding: "7px 16px",
  fontSize: 13,
  color: "#374151",
  cursor: "pointer",
  fontWeight: 500,
};

const saveButton = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  borderRadius: 8,
  background: "#2563eb",
  padding: "7px 16px",
  fontSize: 13,
  color: "white",
  cursor: "pointer",
  fontWeight: 600,
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

export default PoliticasRGPD;