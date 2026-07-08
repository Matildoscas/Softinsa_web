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
import Header from "../../components/Header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";
import logoImg from "../../assets/logo.png";

function normalizarEstadoArea(estado) {
  const e = String(estado || "").trim().toUpperCase();

  if (e === "ATIVO" || e === "ATIVA" || e === "ACTIVE") return "ATIVO";
  if (e === "INATIVO" || e === "INATIVA" || e === "INACTIVE") return "INATIVO";

  return "ATIVO";
}

function normalizarArea(a) {
  return {
    id: a.id_areas || a.ID_AREAS || a.id_area || a.id || "",

    nome:
      a.nome_area ||
      a.NOME_AREA ||
      a.nome ||
      "Área sem nome",

    descricao:
      a.descricao_area ||
      a.DESCRICAO_AREA ||
      a.descricao ||
      "Sem descrição.",

    estado: normalizarEstadoArea(
      a.estado_area ||
        a.ESTADO_AREA ||
        a.estado ||
        "ATIVO"
    ),

    serviceLine:
      a.nome_serviceline ||
      a.NOME_SERVICELINE ||
      a.service_line ||
      a.serviceLine ||
      "Sem Service Line",

    id_serviceline:
      a.id_serviceline ||
      a.ID_SERVICELINE ||
      null,

    niveis: Number(
      a.total_niveis ||
        a.niveis ||
        a.NIVEIS ||
        0
    ),

    inscritos: Number(
      a.total_inscritos ||
        a.numero_consultores ||
        a.inscritos ||
        a.consultores ||
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

function AreaCard({ area, onEditar, onDesativar }) {
  const estadoNormalizado = normalizarEstadoArea(area.estado);
  const estadoLabel = estadoNormalizado === "ATIVO" ? "Ativa" : "Inativa";
  const estadoStyle = tagStyle(estadoLabel);

  return (
    <div style={areaCard}>
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
              <div style={areaTitle}>{area.nome}</div>

              <div style={areaDescription}>{area.descricao}</div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                
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
              </div>
            </div>

            <div style={rightBox}>
              <div style={{ display: "flex", gap: 28, textAlign: "center" }}>
                <div>
                  <div style={statLabel}>Níveis</div>
                  <div style={statValue}>{area.niveis}</div>
                </div>

                <div>
                  <div style={statLabel}>Inscritos</div>
                  <div style={statValue}>{area.inscritos}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => onEditar(area.id)}
                  style={editButton}
                >
                  <BiEdit size={15} color="#2563eb" />
                  Editar
                </button>

                <button
                  onClick={() => onDesativar(area)}
                  disabled={estadoNormalizado === "INATIVO"}
                  style={{
                    ...deactivateButton,
                    opacity: estadoNormalizado === "INATIVO" ? 0.4 : 1,
                    cursor:
                      estadoNormalizado === "INATIVO"
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

function ServiceLineGroup({ grupo, onEditar, onDesativar }) {
  return (
    <div style={groupCard}>
      <div style={groupHeader}>
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          Service Line:{" "}
          <span style={{ color: "#2563eb", fontWeight: 700 }}>
            {grupo.serviceLine}
          </span>
        </span>

        <span style={{ fontSize: 12, color: "#9ca3af" }}>
          {grupo.areas.length} área(s)
        </span>
      </div>

      {grupo.areas.map((area, i) => (
        <div key={area.id}>
          <AreaCard
            area={area}
            onEditar={onEditar}
            onDesativar={onDesativar}
          />

          {i < grupo.areas.length - 1 && (
            <div
              style={{
                height: 1,
                background: "#f3f4f6",
                margin: "0 24px",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function GestaoAreas() {
  const navigate = useNavigate();

  const [pesquisa, setPesquisa] = useState("");
  const [areas, setAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modalDesativarAberta, setModalDesativarAberta] = useState(false);
  const [areaSelecionada, setAreaSelecionada] = useState(null);
  const [aDesativar, setADesativar] = useState(false);

  useEffect(() => {
    carregarAreas();
  }, []);

  async function carregarAreas() {
    try {
      setIsLoading(true);
      setErro("");

      const res = await api.get("/areas");

      const data = res.data;

      const lista =
        Array.isArray(data)
          ? data
          : Array.isArray(data.areas)
            ? data.areas
            : Array.isArray(data.data)
              ? data.data
              : [];

      setAreas(lista.map(normalizarArea));
    } catch (err) {
      console.error("Erro ao carregar áreas:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar as áreas."
      );

      setAreas([]);
    } finally {
      setIsLoading(false);
    }
  }

  const areasFiltradas = areas.filter((area) => {
    const texto = pesquisa.toLowerCase();

    return (
      area.nome.toLowerCase().includes(texto) ||
      area.descricao.toLowerCase().includes(texto) ||
      area.serviceLine.toLowerCase().includes(texto) ||
      area.estado.toLowerCase().includes(texto)
    );
  });

  const gruposFiltrados = Object.values(
    areasFiltradas.reduce((acc, area) => {
      const key = area.serviceLine || "Sem Service Line";

      if (!acc[key]) {
        acc[key] = {
          serviceLine: key,
          areas: [],
        };
      }

      acc[key].areas.push(area);
      return acc;
    }, {})
  );

  const totalAreas = areasFiltradas.length;

  function handleEditar(id) {
    navigate(`/admin/areas/editar/${id}`);
  }

  function abrirModalDesativar(area) {
    const estadoNormalizado = normalizarEstadoArea(area.estado);

    if (estadoNormalizado === "INATIVO") {
        return;
    }

    setAreaSelecionada(area);
    setModalDesativarAberta(true);
    }

    function fecharModalDesativar() {
    if (aDesativar) return;

    setModalDesativarAberta(false);
    setAreaSelecionada(null);
    }

    async function confirmarDesativarArea() {
    if (!areaSelecionada) return;

    try {
        setADesativar(true);

        await api.put(`/areas/${areaSelecionada.id}/desativar`);

        setAreas((prev) =>
        prev.map((item) =>
            item.id === areaSelecionada.id
            ? {
                ...item,
                estado: "INATIVO",
                }
            : item
        )
        );

        setModalDesativarAberta(false);
        setAreaSelecionada(null);
    } catch (err) {
        console.error("Erro ao desativar área:", err);

        alert(
        err.response?.data?.error ||
            "Não foi possível desativar esta área."
        );
    } finally {
        setADesativar(false);
    }
    }

  function handleNova() {
    navigate("/admin/areas/nova");
  }

  function handleExcel() {
    if (areasFiltradas.length === 0) {
        alert("Não existem áreas para exportar.");
        return;
    }

    const dadosExcel = areasFiltradas.map((area) => ({
      ID: area.id,
      "Nome da Área": area.nome,
      Descrição: area.descricao,
      Estado:
        normalizarEstadoArea(area.estado) === "ATIVO"
          ? "Ativa"
          : "Inativa",
      "Service Line": area.serviceLine,
      "N.º de Níveis": area.niveis,
      "N.º de Inscritos": area.inscritos,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosExcel);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 32 },
      { wch: 70 },
      { wch: 12 },
      { wch: 32 },
      { wch: 14 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Áreas"
    );

    const dataHoje = new Date()
        .toLocaleDateString("pt-PT")
        .replaceAll("/", "-");

    XLSX.writeFile(workbook, `areas_${dataHoje}.xlsx`);
    }

  function handlePDF() {
    if (areasFiltradas.length === 0) {
        alert("Não existem áreas para exportar.");
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
    doc.text("SOFTINSA - Gestão de Áreas", 14, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Exportado em: ${dataHoje}`, 14, 23);
    doc.text(`Total: ${areasFiltradas.length} áreas`, 14, 29);

    const linhas = areasFiltradas.map((area) => [
      area.id,
      area.nome,
      area.serviceLine,
      normalizarEstadoArea(area.estado) === "ATIVO"
        ? "Ativa"
        : "Inativa",
      area.niveis,
      area.inscritos,
      area.descricao,
    ]);

    autoTable(doc, {
        startY: 36,
        head: [[
          "ID",
          "Nome",
          "Service Line",
          "Estado",
          "Níveis",
          "Inscritos",
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
          2: { cellWidth: 42 },
          3: { cellWidth: 20 },
          4: { cellWidth: 16 },
          5: { cellWidth: 20 },
          6: { cellWidth: 130 },
        },
        margin: { top: 36, left: 14, right: 14 },
    });

    const dataFicheiro = new Date()
        .toLocaleDateString("pt-PT")
        .replaceAll("/", "-");

    doc.save(`areas_${dataFicheiro}.pdf`);
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
              <h5 style={pageTitle}>Gestão de Áreas</h5>

              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Total de {totalAreas} áreas
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
                placeholder="Pesquisar áreas..."
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
            <div style={loadingBox}>A carregar áreas...</div>
          ) : gruposFiltrados.length > 0 ? (
            gruposFiltrados.map((grupo) => (
              <ServiceLineGroup
                key={grupo.serviceLine}
                grupo={grupo}
                onEditar={handleEditar}
                onDesativar={abrirModalDesativar}
              />
            ))
          ) : (
            <div style={emptyBox}>Nenhuma área encontrada.</div>
          )}
        </div>

        <AdminRightSidebar />
      </div>

          {modalDesativarAberta && (
            <DesativarAreaModal
                area={areaSelecionada}
                loading={aDesativar}
                onClose={fecharModalDesativar}
                onConfirm={confirmarDesativarArea}
            />
        )}

    </div>
  );
}

function DesativarAreaModal({ area, loading, onClose, onConfirm }) {
  if (!area) return null;

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

        <h3 style={modalTitle}>Desativar área?</h3>

        <p style={modalText}>
          A área <strong>{area.nome}</strong> será marcada como{" "}
          <strong>Inativa</strong>.
        </p>

        <p style={modalSubText}>
          Esta ação não apaga a área da base de dados. O histórico, badges,
          consultores associados e registos continuam guardados para consulta
          administrativa.
        </p>

        <div style={modalUserBox}>
          <div style={modalUserAvatar}>
            <BiBook size={24} color="#2563eb" />
          </div>

          <div style={{ flex: 1 }}>
            <div style={modalUserName}>{area.nome}</div>

            <div style={modalUserEmail}>
              Service Line: {area.serviceLine || "Sem Service Line"}
            </div>
          </div>

          <span style={modalUserRole}>
            {normalizarEstadoArea(area.estado) === "ATIVO" ? "Ativa" : "Inativa"}
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
            {loading ? "A desativar..." : "Sim, desativar área"}
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

const groupCard = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  overflow: "hidden",
  marginBottom: 16,
  background: "white",
};

const groupHeader = {
  padding: "10px 24px",
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
};

const areaCard = {
  background: "white",
  padding: "20px 24px",
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

const areaTitle = {
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 6,
};

const areaDescription = {
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

export default GestaoAreas;