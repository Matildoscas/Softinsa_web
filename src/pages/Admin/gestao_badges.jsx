import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import {
  BiSearch,
    BiArrowBack,
    BiEdit,
    BiTrash,
    BiPlus,
    BiMedal,
    BiX,
    BiChevronLeft,
    BiChevronRight,
} from "react-icons/bi";
import { useNavigate } from "react-router-dom";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../../services/api.js";

import Header from "../../components/Header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

const ROWS_PER_PAGE = 5;

function nivelPorId(idNivel) {
  const id = Number(idNivel);

  if (id === 1) return "Iniciante";
  if (id === 2) return "Intermédio";
  if (id === 3) return "Avançado";
  if (id === 4) return "Expert";
  if (id === 5) return "Master";

  return "Sem nível";
}

function nivelStyle(nivel) {
  const map = {
    Iniciante: { bg: "#dcfce7", color: "#15803d" },
    Intermédio: { bg: "#dbeafe", color: "#1d4ed8" },
    Intermediário: { bg: "#dbeafe", color: "#1d4ed8" },
    Avançado: { bg: "#fef9c3", color: "#854d0e" },
    Expert: { bg: "#ede9fe", color: "#6d28d9" },
    Master: { bg: "#fee2e2", color: "#991b1b" },
    "Sem nível": { bg: "#f3f4f6", color: "#374151" },
  };

  return map[nivel] || { bg: "#f3f4f6", color: "#374151" };
}

function formatarExpiracao(valor) {
  if (!valor) return "Sem expiração";

  if (typeof valor === "string" && valor.includes("mês")) return valor;
  if (typeof valor === "string" && valor.includes("meses")) return valor;
  if (typeof valor === "string" && valor.includes("dia")) return valor;
  if (typeof valor === "string" && valor.includes("Expirado")) return valor;
  if (typeof valor === "string" && valor.includes("Sem expiração")) return valor;

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return String(valor);
  }

  const hoje = new Date();
  const diffMs = data.getTime() - hoje.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias <= 0) return "Expirado";

  const meses = Math.round(diffDias / 30);

  if (meses >= 1) {
    return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  }

  return `${diffDias} ${diffDias === 1 ? "dia" : "dias"}`;
}

function detetarMimeImagem(bytes) {
  if (!bytes || bytes.length < 4) return "image/png";

  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }

  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }

  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    return "image/webp";
  }

  return "image/png";
}

function bytesParaBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }

  return window.btoa(binary);
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

    if (valor.startsWith("\\x")) {
      const hex = valor.slice(2);
      const bytes = [];

      for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substring(i, i + 2), 16));
      }

      const mime = detetarMimeImagem(bytes);
      return `data:${mime};base64,${bytesParaBase64(bytes)}`;
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
      // continua para base64
    }

    const mime = detetarMimeImagem(bytes);
    return `data:${mime};base64,${bytesParaBase64(bytes)}`;
  }

  if (Array.isArray(imagem)) {
    const bytes = imagem;

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
      // continua para base64
    }

    const mime = detetarMimeImagem(bytes);
    return `data:${mime};base64,${bytesParaBase64(bytes)}`;
  }

  return null;
}

function normalizarBadge(badge) {
  const imagemSrc = normalizarImagemSrc(
    badge.imagem_url || badge.imagem || badge.url_imagem
  );

  return {
    ...badge,
    id: Number(badge.id || badge.id_badge_modelo),
    nome: badge.nome || badge.nome_badge || "Badge sem nome",
    descricao:
      badge.descricao ||
      badge.descricao_badge_modelo ||
      "Sem descrição.",
    pontos: Number(badge.pontos || 0),
    numero_requisitos: Number(badge.numero_requisitos || 0),
    nivel: badge.nivel || badge.nome_nivel || nivelPorId(badge.id_nivel),
    cursoAssociado:
      badge.cursoAssociado ||
      badge.curso_associado ||
      badge.nome_area ||
      badge.nome_serviceline ||
      "Área não definida",
    nome_area: badge.nome_area || "Área não definida",
    estado:
      badge.estado ||
      badge.estado_badge_modelo ||
      "ATIVO",
    expiracao:
      badge.expiracao ||
      formatarExpiracao(badge.tempo_expiracao),
    imagem: imagemSrc,
    imagem_url: imagemSrc,
  };
}

function GestaoBadges() {
  const navigate = useNavigate();

  const [pesquisa, setPesquisa] = useState("");
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [badgeAEliminar, setBadgeAEliminar] = useState(null);
  const [aEliminar, setAEliminar] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    carregarBadges();
  }, []);

  async function carregarBadges() {
    try {
      setLoading(true);
      setErro("");
      setSucesso("");

      const response = await api.get("/badges/admin/todos");

      const dados = Array.isArray(response.data)
        ? response.data
        : response.data?.badges || [];

      const badgesNormalizados = dados.map(normalizarBadge);

      setLista(badgesNormalizados);
    } catch (err) {
      console.error("Erro ao carregar badges:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar os badges."
      );
    } finally {
      setLoading(false);
    }
  }

  const listaFiltrada = lista.filter((badge) => {
    const termo = pesquisa.toLowerCase();

    return (
        String(badge.nome || "").toLowerCase().includes(termo) ||
        String(badge.descricao || "").toLowerCase().includes(termo) ||
        String(badge.cursoAssociado || "").toLowerCase().includes(termo) ||
        String(badge.nome_area || "").toLowerCase().includes(termo) ||
        String(badge.nivel || "").toLowerCase().includes(termo) ||
        String(badge.estado || "").toLowerCase().includes(termo)
    );
    });

    const totalPaginas = Math.max(
    1,
    Math.ceil(listaFiltrada.length / ROWS_PER_PAGE)
    );

    const listaPagina = listaFiltrada.slice(
    (paginaAtual - 1) * ROWS_PER_PAGE,
    paginaAtual * ROWS_PER_PAGE
    );

    useEffect(() => {
    if (paginaAtual > totalPaginas) {
        setPaginaAtual(totalPaginas);
    }
    }, [paginaAtual, totalPaginas]);

  function handleEditar(id) {
    navigate(`/admin/badges/editar/${id}`);
  }

  function handleNovo() {
    navigate("/admin/badges/novo");
  }

  async function confirmarEliminar() {
    if (!badgeAEliminar) return;

    try {
      setAEliminar(true);
      setErro("");
      setSucesso("");

      await api.delete(`/badges/admin/${badgeAEliminar.id}`);

      setLista((prev) =>
        prev.filter((badge) => Number(badge.id) !== Number(badgeAEliminar.id))
      );

      setSucesso("Badge desativado com sucesso.");
      setBadgeAEliminar(null);
    } catch (err) {
      console.error("Erro ao eliminar/desativar badge:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível desativar o badge."
      );
    } finally {
      setAEliminar(false);
    }
  }

  function prepararDadosExportacao() {
    return listaFiltrada.map((badge) => ({
      ID: badge.id,
      Nome: badge.nome,
      Descrição: badge.descricao,
      Nível: badge.nivel,
      "Área/Curso Associado": badge.cursoAssociado || badge.nome_area,
      Pontos: badge.pontos,
      Requisitos: badge.numero_requisitos,
      Expiração: badge.expiracao,
      Estado: badge.estado,
    }));
  }

  function handleExcel() {
    const dados = prepararDadosExportacao();

    if (dados.length === 0) {
      alert("Não existem badges para exportar.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(dados);

    ws["!cols"] = [
      { wch: 8 },
      { wch: 35 },
      { wch: 70 },
      { wch: 18 },
      { wch: 35 },
      { wch: 12 },
      { wch: 12 },
      { wch: 16 },
      { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Badges");

    const data = new Date()
      .toLocaleDateString("pt-PT")
      .replaceAll("/", "-");

    XLSX.writeFile(wb, `gestao_badges_${data}.xlsx`);
  }

  function handlePDF() {
    const dados = prepararDadosExportacao();

    if (dados.length === 0) {
      alert("Não existem badges para exportar.");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const data = new Date().toLocaleDateString("pt-PT");

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SOFTINSA - Gestão de Badges", 14, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Exportado em: ${data}`, 14, 23);
    doc.text(`Total de badges: ${dados.length}`, 14, 29);

    autoTable(doc, {
      startY: 36,
      head: [
        [
          "ID",
          "Nome",
          "Descrição",
          "Nível",
          "Área/Curso",
          "Pontos",
          "Requisitos",
          "Expiração",
          "Estado",
        ],
      ],
      body: dados.map((badge) => [
        badge.ID,
        badge.Nome,
        badge.Descrição,
        badge.Nível,
        badge["Área/Curso Associado"],
        badge.Pontos,
        badge.Requisitos,
        badge.Expiração,
        badge.Estado,
      ]),
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
        1: { cellWidth: 35 },
        2: { cellWidth: 75 },
        3: { cellWidth: 22 },
        4: { cellWidth: 35 },
        5: { cellWidth: 16 },
        6: { cellWidth: 20 },
        7: { cellWidth: 22 },
        8: { cellWidth: 20 },
      },
      margin: { top: 36, left: 14, right: 14 },
    });

    const ficheiro = new Date()
      .toLocaleDateString("pt-PT")
      .replaceAll("/", "-");

    doc.save(`gestao_badges_${ficheiro}.pdf`);
  }

  return (
    <div style={pageWrapper}>
      <Header />

      <div style={layoutBody}>
        <AdminLeftSidebar />

        <main style={mainContent}>
          <button onClick={() => navigate("/admin")} style={backButton}>
            <BiArrowBack size={16} />
            Voltar
          </button>

          <div style={pageHeader}>
            <div>
              <h5 style={pageTitle}>Gestão de Badges</h5>

              <div style={pageSubtitle}>
                Total de {listaFiltrada.length} badges
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

          <div style={searchRow}>
            <div style={searchWrapper}>
              <BiSearch size={16} style={searchIcon} />

              <input
                type="text"
                placeholder="Buscar badges..."
                value={pesquisa}
                onChange={(e) => {
                setPesquisa(e.target.value);
                setPaginaAtual(1);
                }}
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

          {loading ? (
            <div style={loadingBox}>
              <Spinner animation="border" variant="primary" />
            </div>
          ) : listaFiltrada.length > 0 ? (
            <>
                {listaPagina.map((badge) => (
                <BadgeCard
                    key={badge.id}
                    badge={badge}
                    onEditar={handleEditar}
                    onEliminar={() => setBadgeAEliminar(badge)}
                />
                ))}

                <div style={paginationBox}>
                <button
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    style={pagBtn(false, paginaAtual === 1)}
                >
                    <BiChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                    <button
                    key={p}
                    onClick={() => setPaginaAtual(p)}
                    style={pagBtn(p === paginaAtual)}
                    >
                    {p}
                    </button>
                ))}

                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    {paginaAtual}/{totalPaginas}
                </span>

                <button
                    onClick={() =>
                    setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                    }
                    disabled={paginaAtual === totalPaginas}
                    style={pagBtn(false, paginaAtual === totalPaginas)}
                >
                    <BiChevronRight size={16} />
                </button>
                </div>
            </>
            ) : (
            <div style={emptyBox}>Nenhum badge encontrado.</div>
            )}
        </main>

        <AdminRightSidebar />
      </div>

      {badgeAEliminar && (
        <ConfirmDeleteModal
          badge={badgeAEliminar}
          loading={aEliminar}
          onClose={() => setBadgeAEliminar(null)}
          onConfirm={confirmarEliminar}
        />
      )}
    </div>
  );
}

function BadgeCard({ badge, onEditar, onEliminar }) {
  const nStyle = nivelStyle(badge.nivel);

  return (
    <div style={badgeCard}>
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
        <BadgeImage imageUrl={badge.imagem_url || badge.imagem} />

        <div style={{ flex: 1 }}>
          <div style={badgeCardInner}>
            <div style={{ flex: 1 }}>
              <div style={badgeTitle}>{badge.nome}</div>

              <div style={badgeDescription}>
                {badge.descricao || "Sem descrição."}
              </div>

              <span
                style={{
                  background: nStyle.bg,
                  color: nStyle.color,
                  borderRadius: 6,
                  padding: "3px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {badge.nivel}
              </span>
            </div>

            <div style={badgeInfoColumn}>
              <div style={{ textAlign: "right" }}>
                <div style={smallLabel}>Curso Associado:</div>

                <div style={courseText}>
                  {badge.cursoAssociado || badge.nome_area || "Área não definida"}
                </div>

                <div style={smallInfo}>Pontos: {badge.pontos || 0}</div>

                <div style={smallInfo}>
                  Expiração: {badge.expiracao || "Sem expiração"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => onEditar(badge.id)}
                  style={editButton}
                >
                  <BiEdit size={15} color="#2563eb" />
                  Editar
                </button>

                <button onClick={onEliminar} style={deleteButton}>
                  <BiTrash size={15} />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BadgeImage({ imageUrl }) {
  const src = normalizarImagemSrc(imageUrl);
  const hasImage = src && String(src).trim() !== "";

  if (!hasImage) {
    return (
      <div style={badgeImageFallback}>
        <BiMedal size={28} color="#f59e0b" />
      </div>
    );
  }

  return (
    <div style={badgeImageBox}>
      <img
        src={src}
        alt="Badge"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          padding: 6,
        }}
        onError={(e) => {
          console.error("Erro ao carregar imagem do badge:", src);

          e.currentTarget.style.display = "none";

          const parent = e.currentTarget.parentElement;

          if (parent) {
            parent.innerHTML = `
              <div style="
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #f59e0b;
                font-size: 28px;
              ">
                🏅
              </div>
            `;
          }
        }}
      />
    </div>
  );
}

function ConfirmDeleteModal({ badge, loading, onClose, onConfirm }) {
  return (
    <div style={modalOverlay}>
      <div style={modalCard}>
        <div style={modalHeader}>
          <h6 style={modalTitle}>Eliminar badge</h6>

          <button onClick={onClose} style={closeButton} disabled={loading}>
            <BiX size={22} />
          </button>
        </div>

        <p style={modalText}>
          Tens a certeza que queres eliminar/desativar o badge{" "}
          <strong>{badge.nome}</strong>?
        </p>

        <div style={modalActions}>
          <button onClick={onClose} style={cancelButton} disabled={loading}>
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            style={{
              ...confirmDeleteButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "A eliminar..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GestaoBadges;

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

const searchRow = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  marginBottom: 20,
};

const searchWrapper = {
  position: "relative",
  flex: 1,
};

const searchIcon = {
  position: "absolute",
  left: 12,
  top: "50%",
  transform: "translateY(-50%)",
  color: "#9ca3af",
  pointerEvents: "none",
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

const badgeCard = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "white",
  marginBottom: 16,
  padding: "20px 24px",
};

const badgeCardInner = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
};

const badgeTitle = {
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 6,
};

const badgeDescription = {
  fontSize: 13,
  color: "#6b7280",
  lineHeight: 1.6,
  marginBottom: 12,
};

const badgeInfoColumn = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 14,
  flexShrink: 0,
  minWidth: 180,
};

const smallLabel = {
  fontSize: 11,
  color: "#9ca3af",
  marginBottom: 4,
};

const courseText = {
  fontSize: 13,
  fontWeight: 600,
  color: "#111827",
  marginBottom: 4,
};

const smallInfo = {
  fontSize: 12,
  color: "#6b7280",
  marginBottom: 2,
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

const deleteButton = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid #fecaca",
  borderRadius: 8,
  background: "white",
  padding: "6px 14px",
  fontSize: 13,
  color: "#dc2626",
  cursor: "pointer",
  fontWeight: 500,
};

const badgeImageBox = {
  width: 56,
  height: 56,
  borderRadius: 12,
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  border: "1px solid #dbeafe",
  overflow: "hidden",
};

const badgeImageFallback = {
  width: 56,
  height: 56,
  borderRadius: 12,
  background: "#fef9c3",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  border: "1px solid #fde68a",
};

const loadingBox = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 50,
};

const emptyBox = {
  textAlign: "center",
  padding: 48,
  color: "#9ca3af",
  fontSize: 14,
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

const confirmDeleteButton = {
  border: "none",
  borderRadius: 8,
  background: "#dc2626",
  padding: "8px 18px",
  fontSize: 13,
  color: "white",
  fontWeight: 600,
};

const paginationBox = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 6,
  padding: "12px 16px",
  borderTop: "1px solid #f3f4f6",
  marginTop: 8,
};

const pagBtn = (active, disabled = false) => ({
  width: 30,
  height: 30,
  borderRadius: 6,
  border: active ? "none" : "1px solid #e5e7eb",
  background: active ? "#2563eb" : "white",
  color: active ? "white" : disabled ? "#cbd5e1" : "#374151",
  fontWeight: active ? 700 : 400,
  fontSize: 13,
  cursor: disabled ? "not-allowed" : "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: disabled ? 0.5 : 1,
});