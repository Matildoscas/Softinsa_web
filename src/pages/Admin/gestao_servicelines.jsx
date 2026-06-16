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
import logoImg from "../../assets/logo.png";
import api from "../../services/api.js";
import Header from "../../components/header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

function normalizarEstadoServiceLine(estado) {
  const e = String(estado || "").trim().toUpperCase();

  if (e === "ATIVO" || e === "ATIVA" || e === "ACTIVE") {
    return "ATIVO";
  }

  if (e === "INATIVO" || e === "INATIVA" || e === "INACTIVE") {
    return "INATIVO";
  }

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

    descricao:
      sl.descricao_serviceline ||
      sl.DESCRICAO_SERVICELINE ||
      sl.descricao ||
      "Sem descrição.",

    estado: normalizarEstadoServiceLine(
        sl.estado_serviceline ||
        sl.ESTADO_SERVICELINE ||
        "ATIVO"
    ),

    tipo:
      sl.tipo_serviceline ||
      sl.TIPO_SERVICELINE ||
      "Tecnologia",

    areas:
      Number(
        sl.numero_areas ||
          sl.NUMERO_AREAS ||
          sl.total_areas ||
          sl.areas ||
          0
      ),

    inscritos:
      Number(
        sl.total_inscritos ||
          sl.inscritos ||
          sl.consultores ||
          0
      ),

    responsavel:
      sl.nome_responsavel ||
      sl.responsavel ||
      "-",
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

function ServiceLineCard({ sl, onEditar, onDesativar }) {
  const estadoNormalizado = normalizarEstadoServiceLine(sl.estado);

    const estadoLabel =
    estadoNormalizado === "ATIVO" ? "Ativa" : "Inativa";

  const estadoStyle = tagStyle(estadoLabel);
  const tipoStyle = tagStyle(sl.tipo);

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
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
              <div style={serviceTitle}>{sl.nome}</div>

              <div style={serviceDescription}>{sl.descricao}</div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    background: tipoStyle.bg,
                    color: tipoStyle.color,
                    borderRadius: 6,
                    padding: "3px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {sl.tipo}
                </span>

                <span
                  style={{
                    background: estadoStyle.bg,
                    color: estadoStyle.color,
                    borderRadius: 6,
                    padding: "3px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {estadoLabel}
                </span>

                {sl.responsavel !== "-" && (
                  <span style={neutralTag}>
                    Responsável: {sl.responsavel}
                  </span>
                )}
              </div>
            </div>

            <div style={rightBox}>
              <div style={{ display: "flex", gap: 28, textAlign: "center" }}>
                <div>
                  <div style={statLabel}>Áreas</div>
                  <div style={statValue}>{sl.areas}</div>
                </div>

                <div>
                  <div style={statLabel}>Inscritos</div>
                  <div style={statValue}>{sl.inscritos}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => onEditar(sl.id)}
                  style={editButton}
                >
                  <BiEdit size={15} color="#2563eb" />
                  Editar
                </button>

                <button
                  onClick={() => onDesativar(sl)}
                  disabled={estadoNormalizado === "INATIVO"}
                style={{
                ...deactivateButton,
                opacity: estadoNormalizado === "INATIVO" ? 0.4 : 1,
                cursor: estadoNormalizado === "INATIVO" ? "not-allowed" : "pointer",
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

function GestaoServiceLines() {
  const navigate = useNavigate();

  const [pesquisa, setPesquisa] = useState("");
  const [lista, setLista] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modalDesativarAberta, setModalDesativarAberta] = useState(false);
    const [serviceLineSelecionada, setServiceLineSelecionada] = useState(null);
    const [aDesativar, setADesativar] = useState(false);

  useEffect(() => {
    carregarServiceLines();
  }, []);

  async function carregarServiceLines() {
    try {
      setIsLoading(true);
      setErro("");

      const res = await api.get("/servicelines");

      const dados = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.servicelines)
          ? res.data.servicelines
          : Array.isArray(res.data?.data)
            ? res.data.data
            : [];

      setLista(dados.map(normalizarServiceLine));
    } catch (err) {
      console.error("Erro ao carregar service lines:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar as Service Lines."
      );

      setLista([]);
    } finally {
      setIsLoading(false);
    }
  }

  const listaFiltrada = lista.filter((sl) => {
    const texto = pesquisa.toLowerCase();

    return (
      sl.nome.toLowerCase().includes(texto) ||
      sl.descricao.toLowerCase().includes(texto) ||
      sl.tipo.toLowerCase().includes(texto) ||
      sl.estado.toLowerCase().includes(texto)
    );
  });

  function handleEditar(id) {
    navigate(`/admin/service-lines/editar/${id}`);
  }

  function abrirModalDesativar(sl) {
    const estadoNormalizado = normalizarEstadoServiceLine(sl.estado);

    if (estadoNormalizado === "INATIVO") {
        return;
    }

    setServiceLineSelecionada(sl);
    setModalDesativarAberta(true);
    }

    function fecharModalDesativar() {
    if (aDesativar) return;

    setModalDesativarAberta(false);
    setServiceLineSelecionada(null);
    }

    async function confirmarDesativarServiceLine() {
    if (!serviceLineSelecionada) return;

    try {
        setADesativar(true);

        await api.put(`/servicelines/${serviceLineSelecionada.id}/desativar`);

        setLista((prev) =>
        prev.map((item) =>
            item.id === serviceLineSelecionada.id
            ? {
                ...item,
                estado: "INATIVO",
                }
            : item
        )
        );

        setModalDesativarAberta(false);
        setServiceLineSelecionada(null);
    } catch (err) {
        console.error("Erro ao desativar service line:", err);

        alert(
        err.response?.data?.error ||
            "Não foi possível desativar esta Service Line."
        );
    } finally {
        setADesativar(false);
    }
    }

  function handleNova() {
    navigate("/admin/service-lines/nova");
  }

  function handleExcel() {
    if (listaFiltrada.length === 0) {
        alert("Não existem Service Lines para exportar.");
        return;
    }

    const dadosExcel = listaFiltrada.map((sl) => ({
        ID: sl.id,
        "Nome da Service Line": sl.nome,
        Descrição: sl.descricao,
        Tipo: sl.tipo,
        Estado:
        normalizarEstadoServiceLine(sl.estado) === "ATIVO"
            ? "Ativa"
            : "Inativa",
        "N.º de Áreas": sl.areas,
        "N.º de Inscritos": sl.inscritos,
        Responsável: sl.responsavel,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosExcel);

    worksheet["!cols"] = [
        { wch: 8 },
        { wch: 32 },
        { wch: 70 },
        { wch: 18 },
        { wch: 12 },
        { wch: 14 },
        { wch: 16 },
        { wch: 28 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Service Lines"
    );

    const dataHoje = new Date()
        .toLocaleDateString("pt-PT")
        .replaceAll("/", "-");

    XLSX.writeFile(
        workbook,
        `service_lines_${dataHoje}.xlsx`
    );
    }

  function handlePDF() {
    if (listaFiltrada.length === 0) {
        alert("Não existem Service Lines para exportar.");
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
    doc.text("SOFTINSA - Gestão de Service Lines", 14, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Exportado em: ${dataHoje}`, 14, 23);
    doc.text(`Total: ${listaFiltrada.length} Service Lines`, 14, 29);

    const linhas = listaFiltrada.map((sl) => [
        sl.id,
        sl.nome,
        sl.tipo,
        normalizarEstadoServiceLine(sl.estado) === "ATIVO"
        ? "Ativa"
        : "Inativa",
        sl.areas,
        sl.inscritos,
        sl.responsavel,
        sl.descricao,
    ]);

    autoTable(doc, {
        startY: 36,
        head: [[
        "ID",
        "Nome",
        "Tipo",
        "Estado",
        "Áreas",
        "Inscritos",
        "Responsável",
        "Descrição",
        ]],
        body: linhas,
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
        0: { cellWidth: 12 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 16 },
        5: { cellWidth: 20 },
        6: { cellWidth: 35 },
        7: { cellWidth: 115 },
        },
        margin: { top: 36, left: 14, right: 14 },
    });

    const dataFicheiro = new Date()
        .toLocaleDateString("pt-PT")
        .replaceAll("/", "-");

    doc.save(`service_lines_${dataFicheiro}.pdf`);
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
              <h5 style={pageTitle}>Gestão de Service Lines</h5>

              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Total de {listaFiltrada.length} Service Lines
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
                placeholder="Pesquisar service lines..."
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

            <button onClick={handleNova} style={newButton}>
              <BiPlus size={24} />
            </button>
          </div>

          {erro && <div style={errorBox}>{erro}</div>}

          {isLoading ? (
            <div style={loadingBox}>A carregar Service Lines...</div>
          ) : listaFiltrada.length > 0 ? (
            listaFiltrada.map((sl) => (
              <ServiceLineCard
                key={sl.id}
                sl={sl}
                onEditar={handleEditar}
                onDesativar={abrirModalDesativar}
            />
            ))
          ) : (
            <div style={emptyBox}>
              Nenhuma Service Line encontrada.
            </div>
          )}
        </div>

        <AdminRightSidebar />
      </div>

      {modalDesativarAberta && (
        <DesativarServiceLineModal
            serviceLine={serviceLineSelecionada}
            loading={aDesativar}
            onClose={fecharModalDesativar}
            onConfirm={confirmarDesativarServiceLine}
        />
    )}
    </div>
  );
}

function DesativarServiceLineModal({
  serviceLine,
  loading,
  onClose,
  onConfirm,
}) {
  if (!serviceLine) return null;

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
          <img src={logoImg} alt="Softinsa" style={{ height: "40px" }} />
        </div>

        <div style={modalIconDanger}>
          <BiUserX size={34} />
        </div>

        <h3 style={modalTitle}>Desativar Service Line?</h3>

        <p style={modalText}>
          A Service Line <strong>{serviceLine.nome}</strong> será marcada como{" "}
          <strong>Inativa</strong>.
        </p>

        <p style={modalSubText}>
          Esta ação não apaga a Service Line da base de dados. O histórico,
          áreas associadas, consultores e registos continuam guardados para
          consulta administrativa.
        </p>

        <div style={modalUserBox}>
          <div style={modalUserAvatar}>
            <BiBook size={24} color="#2563eb" />
          </div>

          <div style={{ flex: 1 }}>
            <div style={modalUserName}>{serviceLine.nome}</div>
            <div style={modalUserEmail}>
              {serviceLine.descricao || "Sem descrição"}
            </div>
          </div>

          <span style={modalUserRole}>
            {serviceLine.tipo || "Service Line"}
          </span>
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
            {loading ? "A desativar..." : "Sim, desativar Service Line"}
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
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "20px 24px",
  marginBottom: 16,
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

const serviceTitle = {
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 6,
};

const serviceDescription = {
  fontSize: 13,
  color: "#6b7280",
  lineHeight: 1.6,
  marginBottom: 12,
};

const neutralTag = {
  background: "#f3f4f6",
  color: "#374151",
  borderRadius: 6,
  padding: "3px 12px",
  fontSize: 12,
  fontWeight: 600,
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

export default GestaoServiceLines;