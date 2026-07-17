import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import {
  BiArrowBack,
  BiChevronLeft,
  BiChevronRight,
  BiDetail,
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
import { resolverUrlFicheiro } from "../../utils/fileUrl.js";

const ROWS_PER_PAGE = 5;

function formatarData(valor) {
  if (!valor) return "—";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return String(valor);
  }

  return data.toLocaleString("pt-PT");
}

function normalizarEstado(estado) {
  return String(estado || "PENDENTE")
    .trim()
    .toUpperCase()
    .replaceAll("Ã", "A");
}

function estadoLabel(estado) {
  const e = normalizarEstado(estado);

  const map = {
    PENDENTE: "Pendente",
    AGUARDA_TM: "Aguarda TM",
    EM_VALIDACAO_TM: "Em validação TM",
    EM_VALIDAÇÃO_TM: "Em validação TM",
    AGUARDA_SLL: "Aguarda SLL",
    EM_VALIDACAO_SLL: "Em validação SLL",
    EM_VALIDAÇÃO_SLL: "Em validação SLL",
    APROVADO: "Aprovado",
    APROVADA: "Aprovada",
    APROVADO_FINAL: "Aprovado final",
    REJEITADO: "Rejeitado",
    REJEITADA: "Rejeitada",
    REJEITADO_TM: "Rejeitado pelo TM",
    REJEITADO_SLL: "Rejeitado pelo SLL",
    REJEITADO_FINAL: "Rejeitado final",
    ATRIBUIDO: "Badge atribuído",
    ATRIBUÍDO: "Badge atribuído",
    SUBMETIDO: "Submetido",
  };

  return map[e] || String(estado || "Pendente");
}

function estadoStyle(estado) {
  const e = normalizarEstado(estado);

  if (
    e.includes("APROV") ||
    e.includes("ATRIBUID")
  ) {
    return {
      bg: "#dcfce7",
      color: "#15803d",
    };
  }

  if (e.includes("REJEIT")) {
    return {
      bg: "#fee2e2",
      color: "#b91c1c",
    };
  }

  if (
    e.includes("SLL") ||
    e.includes("TM") ||
    e.includes("VALIDACAO") ||
    e.includes("VALIDAÇÃO")
  ) {
    return {
      bg: "#dbeafe",
      color: "#1d4ed8",
    };
  }

  return {
    bg: "#fef9c3",
    color: "#854d0e",
  };
}

function normalizarPedido(pedido) {
  return {
    id:
      pedido.id_candidatura_pedido ||
      pedido.ID_CANDIDATURA_PEDIDO ||
      pedido.id,

    id_consultor:
      pedido.id_consultor ||
      pedido.ID_CONSULTOR,

    nome_consultor:
      pedido.nome_consultor ||
      pedido.NOME_CONSULTOR ||
      "Consultor",

    email_consultor:
      pedido.email_consultor ||
      pedido.EMAIL_CONSULTOR ||
      "",

    id_badge_modelo:
      pedido.id_badge_modelo ||
      pedido.ID_BADGE_MODELO,

    nome_badge:
      pedido.nome_badge ||
      pedido.NOME_BADGE ||
      "Badge",

    tipo_badge:
      pedido.tipo_badge ||
      pedido.TIPO_BADGE ||
      "",

    pontos:
      Number(pedido.pontos || 0),

    nome_area:
      pedido.nome_area ||
      pedido.NOME_AREA ||
      "Sem área",

    nome_serviceline:
      pedido.nome_serviceline ||
      pedido.NOME_SERVICELINE ||
      "Sem Service Line",

    nome_nivel:
      pedido.nome_nivel ||
      pedido.NOME_NIVEL ||
      "Sem nível",

    data_submisao:
      pedido.data_submisao ||
      pedido.DATA_SUBMISAO ||
      pedido.data_submissao,

    data_validacao:
      pedido.data_validacao ||
      pedido.DATA_VALIDACAO,

    estado_candidatura_pedido:
      pedido.estado_candidatura_pedido ||
      pedido.ESTADO_CANDIDATURA_PEDIDO,

    fase_atual:
      pedido.fase_atual ||
      pedido.FASE_ATUAL ||
      "PEDIDO SUBMETIDO",

    estado_global:
      pedido.estado_global ||
      pedido.ESTADO_GLOBAL ||
      pedido.estado_candidatura_pedido ||
      "PENDENTE",

    nome_tm:
      pedido.nome_tm ||
      pedido.NOME_TM ||
      "—",

    estado_candidaturatm:
      pedido.estado_candidaturatm ||
      pedido.ESTADO_CANDIDATURATM ||
      "—",

    comentarios_tm:
      pedido.comentarios_tm ||
      pedido.COMENTARIOS_TM ||
      "",

    nome_sll:
      pedido.nome_sll ||
      pedido.NOME_SLL ||
      "—",

    estado_candidaturasll:
      pedido.estado_candidaturasll ||
      pedido.ESTADO_CANDIDATURASLL ||
      "—",

    comentarios_sll:
      pedido.comentarios_sll ||
      pedido.COMENTARIOS_SLL ||
      "",

    estado_final:
      pedido.estado_final ||
      pedido.ESTADO_FINAL ||
      "",

    motivo_estado_final:
      pedido.motivo_estado_final ||
      pedido.MOTIVO_ESTADO_FINAL ||
      "",

    data_atribuicao:
      pedido.data_atribuicao ||
      pedido.DATA_ATRIBUICAO ||
      null,

    estado_badge_atribuido:
      pedido.estado_badge_atribuido ||
      pedido.ESTADO_BADGE_ATRIBUIDO ||
      "",

    total_requisitos:
      Number(pedido.total_requisitos || 0),

    total_evidencias:
      Number(pedido.total_evidencias || 0),

    requisitos_aprovados:
      Number(pedido.requisitos_aprovados || 0),

    requisitos_rejeitados:
      Number(pedido.requisitos_rejeitados || 0),

    requisitos_pendentes:
      Number(pedido.requisitos_pendentes || 0),
  };
}

function normalizarDetalhe(data) {
  const candidatura =
    data.candidatura ||
    {};

  return {
    candidatura: normalizarPedido(candidatura),
    bruto: candidatura,
    requisitos: Array.isArray(data.requisitos)
      ? data.requisitos
      : [],
  };
}

function GestaoPedidosBadges() {
  const navigate = useNavigate();

  const [lista, setLista] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [detalhe, setDetalhe] = useState(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  useEffect(() => {
    carregarPedidos();
  }, []);

  async function carregarPedidos() {
    try {
      setLoading(true);
      setErro("");

      const response =
        await api.get("/admin/pedidos-badges");

      const dados = Array.isArray(response.data)
        ? response.data
        : response.data?.pedidos || [];

      setLista(dados.map(normalizarPedido));
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar os pedidos de badges."
      );
    } finally {
      setLoading(false);
    }
  }

  async function abrirDetalhe(id) {
    try {
      setLoadingDetalhe(true);
      setErro("");

      const response =
        await api.get(`/admin/pedidos-badges/${id}`);

      setDetalhe(normalizarDetalhe(response.data));
    } catch (err) {
      console.error("Erro ao carregar detalhe:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar o detalhe do pedido."
      );
    } finally {
      setLoadingDetalhe(false);
    }
  }

  const listaFiltrada = lista.filter((pedido) => {
    const termo = pesquisa.toLowerCase();

    const texto = [
      pedido.id,
      pedido.nome_consultor,
      pedido.email_consultor,
      pedido.nome_badge,
      pedido.nome_area,
      pedido.nome_serviceline,
      pedido.nome_nivel,
      pedido.nome_tm,
      pedido.nome_sll,
      pedido.estado_global,
      pedido.fase_atual,
    ]
      .join(" ")
      .toLowerCase();

    const passaPesquisa = texto.includes(termo);

    const estado = normalizarEstado(pedido.estado_global);

    const passaEstado =
      filtroEstado === "TODOS" ||
      (filtroEstado === "APROVADOS" &&
        (estado.includes("APROV") || estado.includes("ATRIBUID"))) ||
      (filtroEstado === "REJEITADOS" &&
        estado.includes("REJEIT")) ||
      (filtroEstado === "EM_CURSO" &&
        !estado.includes("APROV") &&
        !estado.includes("REJEIT") &&
        !estado.includes("ATRIBUID"));

    return passaPesquisa && passaEstado;
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

  function prepararDadosExportacao() {
    return listaFiltrada.map((p) => ({
      ID: p.id,
      Consultor: p.nome_consultor,
      Email: p.email_consultor,
      Badge: p.nome_badge,
      "Service Line": p.nome_serviceline,
      Área: p.nome_area,
      Nível: p.nome_nivel,
      Fase: p.fase_atual,
      Estado: estadoLabel(p.estado_global),
      TM: p.nome_tm,
      "Estado TM": estadoLabel(p.estado_candidaturatm),
      SLL: p.nome_sll,
      "Estado SLL": estadoLabel(p.estado_candidaturasll),
      "Req. aprovados": p.requisitos_aprovados,
      "Req. rejeitados": p.requisitos_rejeitados,
      "Req. pendentes": p.requisitos_pendentes,
      "Data submissão": formatarData(p.data_submisao),
      "Data atribuição": formatarData(p.data_atribuicao),
    }));
  }

  function handleExcel() {
    const dados = prepararDadosExportacao();

    if (dados.length === 0) {
      alert("Não existem pedidos para exportar.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(dados);

    ws["!cols"] = [
      { wch: 8 },
      { wch: 28 },
      { wch: 32 },
      { wch: 35 },
      { wch: 28 },
      { wch: 28 },
      { wch: 16 },
      { wch: 20 },
      { wch: 20 },
      { wch: 24 },
      { wch: 18 },
      { wch: 24 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 24 },
      { wch: 24 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos de Badges");

    const data = new Date()
      .toLocaleDateString("pt-PT")
      .replaceAll("/", "-");

    XLSX.writeFile(wb, `pedidos_badges_${data}.xlsx`);
  }

  function handlePDF() {
    const dados = prepararDadosExportacao();

    if (dados.length === 0) {
      alert("Não existem pedidos para exportar.");
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
    doc.text("SOFTINSA - Gestão de Pedidos de Badges", 14, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Exportado em: ${data}`, 14, 23);
    doc.text(`Total de pedidos: ${dados.length}`, 14, 29);

    autoTable(doc, {
      startY: 36,
      head: [
        [
          "ID",
          "Consultor",
          "Badge",
          "Service Line",
          "Área",
          "Fase",
          "Estado",
          "TM",
          "SLL",
          "Req. A/R/P",
        ],
      ],
      body: dados.map((p) => [
        p.ID,
        p.Consultor,
        p.Badge,
        p["Service Line"],
        p.Área,
        p.Fase,
        p.Estado,
        p.TM,
        p.SLL,
        `${p["Req. aprovados"]}/${p["Req. rejeitados"]}/${p["Req. pendentes"]}`,
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
        1: { cellWidth: 28 },
        2: { cellWidth: 38 },
        3: { cellWidth: 35 },
        4: { cellWidth: 35 },
        5: { cellWidth: 24 },
        6: { cellWidth: 24 },
        7: { cellWidth: 26 },
        8: { cellWidth: 26 },
        9: { cellWidth: 20 },
      },
      margin: { top: 36, left: 14, right: 14 },
    });

    const ficheiro = new Date()
      .toLocaleDateString("pt-PT")
      .replaceAll("/", "-");

    doc.save(`pedidos_badges_${ficheiro}.pdf`);
  }

  return (
    <div style={pageWrapper}>
      <Header />

      <div style={layoutBody}>
        <AdminLeftSidebar />

        <main style={mainContent}>
          <button
            onClick={() => navigate("/admin")}
            style={backButton}
          >
            <BiArrowBack size={16} />
            Voltar
          </button>

          <div style={pageHeader}>
            <div>
              <h5 style={pageTitle}>
                Gestão de Pedidos de Badges
              </h5>

              <div style={pageSubtitle}>
                Total de {listaFiltrada.length} pedidos
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

          <div style={filtersRow}>
            <div style={searchWrapper}>
              <BiSearch size={16} style={searchIcon} />

              <input
                type="text"
                placeholder="Pesquisar por consultor, badge, TM, SLL, área..."
                value={pesquisa}
                onChange={(e) => {
                  setPesquisa(e.target.value);
                  setPaginaAtual(1);
                }}
                style={searchInput}
              />
            </div>

            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPaginaAtual(1);
              }}
              style={selectFiltro}
            >
              <option value="TODOS">Todos</option>
              <option value="EM_CURSO">Em curso</option>
              <option value="APROVADOS">Aprovados/Atribuídos</option>
              <option value="REJEITADOS">Rejeitados</option>
            </select>
          </div>

          {loading ? (
            <div style={loadingBox}>
              <Spinner animation="border" variant="primary" />
            </div>
          ) : listaFiltrada.length > 0 ? (
            <>
              {listaPagina.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onVerDetalhe={() => abrirDetalhe(pedido.id)}
                />
              ))}

              <div style={paginationBox}>
                <button
                  onClick={() =>
                    setPaginaAtual((p) => Math.max(1, p - 1))
                  }
                  disabled={paginaAtual === 1}
                  style={pagBtn(false, paginaAtual === 1)}
                >
                  <BiChevronLeft size={16} />
                </button>

                {Array.from(
                  { length: totalPaginas },
                  (_, i) => i + 1
                ).map((p) => (
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
                    setPaginaAtual((p) =>
                      Math.min(totalPaginas, p + 1)
                    )
                  }
                  disabled={paginaAtual === totalPaginas}
                  style={pagBtn(false, paginaAtual === totalPaginas)}
                >
                  <BiChevronRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <div style={emptyBox}>
              Nenhum pedido de badge encontrado.
            </div>
          )}
        </main>

        <AdminRightSidebar />
      </div>

      {loadingDetalhe && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <div style={loadingBox}>
              <Spinner animation="border" variant="primary" />
            </div>
          </div>
        </div>
      )}

      {detalhe && !loadingDetalhe && (
        <DetalhePedidoModal
          detalhe={detalhe}
          onClose={() => setDetalhe(null)}
        />
      )}
    </div>
  );
}

function PedidoCard({ pedido, onVerDetalhe }) {
  const styleEstado = estadoStyle(pedido.estado_global);

  return (
    <div
      className="pedido-card"
      style={pedidoCard}
    >
      <div className="pedido-card-layout">
        <div className="pedido-card-content">
          <div style={pedidoTitleRow}>
            <span
              style={{
                ...statusPill,
                background: styleEstado.bg,
                color: styleEstado.color,
              }}
            >
              {estadoLabel(pedido.estado_global)}
            </span>

            <span style={faseText}>{pedido.fase_atual}</span>
          </div>

          <div style={pedidoTitle}>
            {pedido.nome_badge}
          </div>

          <div style={pedidoDescription}>
            Pedido submetido por{" "}
            <strong>{pedido.nome_consultor}</strong>
            {" "}em {formatarData(pedido.data_submisao)}
          </div>

          <div className="pedido-card-meta">
            <InfoLine label="Service Line" value={pedido.nome_serviceline} />
            <InfoLine label="Área" value={pedido.nome_area} />
            <InfoLine label="Nível" value={pedido.nome_nivel} />
            <InfoLine label="Pontos" value={pedido.pontos} />
          </div>
        </div>

        <div className="pedido-card-right">
          <InfoLine label="Talent Manager" value={pedido.nome_tm} alignRight />
          <InfoLine label="Service Line Leader" value={pedido.nome_sll} alignRight />

          <div className="pedido-card-stats">
            <span style={statOk}>{pedido.requisitos_aprovados} aprov.</span>
            <span style={statBad}>{pedido.requisitos_rejeitados} rej.</span>
            <span style={statWarn}>{pedido.requisitos_pendentes} pend.</span>
          </div>

          <button
            type="button"
            onClick={onVerDetalhe}
            style={detailsButton}
          >
            <BiDetail size={15} />
            Ver detalhe
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoLine({
  label,
  value,
  alignRight = false,
}) {
  return (
    <div
      className={
        alignRight
          ? "pedido-info pedido-info-right"
          : "pedido-info"
      }
    >
      <div style={smallLabel}>
        {label}
      </div>

      <div style={smallValue}>
        {value || "—"}
      </div>
    </div>
  );
}

function DetalhePedidoModal({ detalhe, onClose }) {
  const pedido = detalhe.candidatura;
  const bruto = detalhe.bruto || {};
  const styleEstado = estadoStyle(pedido.estado_global);

  return (
    <div style={modalOverlay}>
      <div style={modalCardLarge}>
        <div style={modalHeader}>
          <div>
            <h5 style={modalTitle}>
              Detalhe do pedido #{pedido.id}
            </h5>

            <div style={modalSubtitle}>
              {pedido.nome_badge} · {pedido.nome_consultor}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={closeButton}
          >
            <BiX size={22} />
          </button>
        </div>

        <div style={modalSummary}>
          <span
            style={{
              ...statusPill,
              background: styleEstado.bg,
              color: styleEstado.color,
            }}
          >
            {estadoLabel(pedido.estado_global)}
          </span>

          <span style={faseText}>{pedido.fase_atual}</span>
        </div>

        <div style={detailGrid}>
          <DetailBox title="Consultor">
            <InfoLine label="Nome" value={pedido.nome_consultor} />
            <InfoLine label="Email" value={pedido.email_consultor} />
            <InfoLine label="Data de submissão" value={formatarData(pedido.data_submisao)} />
          </DetailBox>

          <DetailBox title="Badge">
            <InfoLine label="Nome" value={pedido.nome_badge} />
            <InfoLine label="Service Line" value={pedido.nome_serviceline} />
            <InfoLine label="Área" value={pedido.nome_area} />
            <InfoLine label="Nível" value={pedido.nome_nivel} />
            <InfoLine label="Pontos" value={pedido.pontos} />
          </DetailBox>

          <DetailBox title="Talent Manager">
            <InfoLine label="Nome" value={pedido.nome_tm} />
            <InfoLine label="Estado" value={estadoLabel(pedido.estado_candidaturatm)} />
            <InfoLine label="Receção" value={formatarData(bruto.data_rececao_tm)} />
            <InfoLine label="Conclusão" value={formatarData(bruto.data_conclusao_tm)} />
            <InfoLine label="Comentário" value={pedido.comentarios_tm || "—"} />
          </DetailBox>

          <DetailBox title="Service Line Leader">
            <InfoLine label="Nome" value={pedido.nome_sll} />
            <InfoLine label="Estado" value={estadoLabel(pedido.estado_candidaturasll)} />
            <InfoLine label="Receção" value={formatarData(bruto.data_rececao_sll)} />
            <InfoLine label="Conclusão" value={formatarData(bruto.data_conclusao_sll)} />
            <InfoLine label="Comentário" value={pedido.comentarios_sll || "—"} />
          </DetailBox>
        </div>

        <DetailBox title="Histórico / Atribuição">
          <div style={timelineGrid}>
            <InfoLine label="Estado final" value={estadoLabel(bruto.estado_final || pedido.estado_global)} />
            <InfoLine label="Motivo" value={pedido.motivo_estado_final || "—"} />
            <InfoLine label="Entrada no histórico" value={formatarData(bruto.data_entrada_historico)} />
            <InfoLine label="Badge atribuído em" value={formatarData(pedido.data_atribuicao)} />
            <InfoLine label="Estado do badge atribuído" value={pedido.estado_badge_atribuido || "—"} />
          </div>
        </DetailBox>

        <div style={{ marginTop: 18 }}>
          <h6 style={sectionTitle}>Requisitos e evidências</h6>

          {detalhe.requisitos.length > 0 ? (
            detalhe.requisitos.map((req) => (
              <RequisitoCard
                key={req.id_requisitos}
                requisito={req}
              />
            ))
          ) : (
            <div style={emptyBox}>
              Não existem requisitos associados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailBox({ title, children }) {
  return (
    <div style={detailBox}>
      <div style={detailTitle}>{title}</div>
      <div style={detailContent}>{children}</div>
    </div>
  );
}

function RequisitoCard({ requisito }) {
  const estado = requisito.estado_calculado || "PENDENTE";
  const styleEstado = estadoStyle(estado);
  const apiBaseUrl =
    (
      import.meta.env.VITE_SOCKET_URL ||
      "https://softinsa-api.onrender.com"
    ).replace(/\/$/, "");

  const evidencias = Array.isArray(requisito.evidencias)
    ? requisito.evidencias
    : [];

  return (
    <div style={reqCard}>
      <div style={reqHeader}>
        <div>
          <div style={reqTitle}>
            {requisito.titulo ||
              requisito.nome_requisito ||
              "Requisito"}
          </div>

          <div style={reqDescription}>
            {requisito.descricao_requisito ||
              "Sem descrição."}
          </div>
        </div>

        <span
          style={{
            ...statusPill,
            background: styleEstado.bg,
            color: styleEstado.color,
          }}
        >
          {estadoLabel(estado)}
        </span>
      </div>

      {evidencias.length > 0 ? (
        <div style={evidenciasList}>
          {evidencias.map((ev) => (
            <div key={ev.id_evidencia} style={evidenciaRow}>
              <div>
                <div style={evidenciaTitle}>
                  {ev.nome_ficheiro || ev.descricao || "Evidência"}
                </div>

                <div style={evidenciaMeta}>
                  TM: {estadoLabel(ev.estado_evidencia_tm || ev.estado_evidencia)} ·{" "}
                  SLL: {estadoLabel(ev.estado_evidencia_sll || ev.estado_evidencia)} ·{" "}
                  Final: {estadoLabel(ev.estado_final || ev.estado_evidencia)}
                </div>

                <div style={evidenciaMeta}>
                  Submetido em {formatarData(ev.data_submissao)}
                </div>
              </div>

              {ev.caminho_ficheiro && (
                <a
                  href={resolverUrlFicheiro(ev.caminho_ficheiro)}
                  target="_blank"
                  rel="noreferrer"
                  style={fileLink}
                >
                  Ver ficheiro
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={semEvidencia}>
          Sem evidência submetida para este requisito.
        </div>
      )}
    </div>
  );
}

export default GestaoPedidosBadges;

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

const filtersRow = {
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

const selectFiltro = {
  height: 42,
  minWidth: 180,
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "0 12px",
  background: "white",
  color: "#374151",
  fontSize: 14,
  outline: "none",
};

const pedidoCard = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "white",
  marginBottom: 16,
  padding: "20px 24px",
};

const pedidoTitleRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 8,
  flexWrap: "wrap",
};

const pedidoTitle = {
  fontSize: 16,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 6,
};

const pedidoDescription = {
  fontSize: 13,
  color: "#6b7280",
  lineHeight: 1.6,
  marginBottom: 14,
};

const statusPill = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 20,
  padding: "4px 12px",
  fontSize: 12,
  fontWeight: 700,
};

const faseText = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 600,
};

const smallLabel = {
  fontSize: 11,
  color: "#9ca3af",
  marginBottom: 3,
};

const smallValue = {
  fontSize: 13,
  color: "#111827",
  fontWeight: 600,
};

const statOk = {
  background: "#dcfce7",
  color: "#15803d",
  borderRadius: 6,
  padding: "3px 8px",
  fontSize: 11,
  fontWeight: 700,
};

const statBad = {
  background: "#fee2e2",
  color: "#b91c1c",
  borderRadius: 6,
  padding: "3px 8px",
  fontSize: 11,
  fontWeight: 700,
};

const statWarn = {
  background: "#fef9c3",
  color: "#854d0e",
  borderRadius: 6,
  padding: "3px 8px",
  fontSize: 11,
  fontWeight: 700,
};

const detailsButton = {
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

const loadingBox = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 50,
};

const emptyBox = {
  textAlign: "center",
  padding: 32,
  color: "#9ca3af",
  fontSize: 14,
  background: "white",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
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
  background: "white",
  borderRadius: 14,
  padding: 24,
  width: 430,
  boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
};

const modalCardLarge = {
  width: "100%",
  maxWidth: 1080,
  maxHeight: "92vh",
  overflowY: "auto",
  background: "white",
  borderRadius: 18,
  padding: "26px 28px",
  boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
  border: "1px solid #e5e7eb",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 16,
};

const modalTitle = {
  margin: 0,
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
};

const modalSubtitle = {
  marginTop: 4,
  fontSize: 13,
  color: "#6b7280",
};

const closeButton = {
  border: "1px solid #e5e7eb",
  borderRadius: "50%",
  width: 34,
  height: 34,
  background: "white",
  cursor: "pointer",
  color: "#6b7280",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalSummary = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 18,
};

const detailGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(280px, 1fr))",
  gap: 14,
};

const detailBox = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  background: "#f8fafc",
  marginBottom: 14,
};

const detailTitle = {
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 12,
};

const detailContent = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const timelineGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(120px, 1fr))",
  gap: 14,
};

const sectionTitle = {
  fontSize: 16,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 12,
};

const reqCard = {
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "white",
  padding: 16,
  marginBottom: 12,
};

const reqHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 12,
};

const reqTitle = {
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
};

const reqDescription = {
  marginTop: 4,
  fontSize: 13,
  color: "#6b7280",
  lineHeight: 1.5,
};

const evidenciasList = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const evidenciaRow = {
  border: "1px solid #f1f5f9",
  borderRadius: 10,
  padding: "10px 12px",
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "center",
  background: "#f8fafc",
};

const evidenciaTitle = {
  fontSize: 13,
  fontWeight: 700,
  color: "#111827",
};

const evidenciaMeta = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 3,
};

const fileLink = {
  fontSize: 12,
  color: "#2563eb",
  fontWeight: 700,
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const semEvidencia = {
  fontSize: 13,
  color: "#9ca3af",
  background: "#f9fafb",
  borderRadius: 8,
  padding: 10,
};