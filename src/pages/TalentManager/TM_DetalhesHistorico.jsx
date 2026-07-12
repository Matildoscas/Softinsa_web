import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BiArrowBack,
  BiEnvelope,
  BiCalendar,
  BiMedal,
  BiBadgeCheck,
  BiFile,
  BiDownload,
  BiChevronUp,
  BiChevronDown,
  BiUserCircle,
  BiSpreadsheet,
  BiCheck,
  BiX,
  BiTimeFive
} from "react-icons/bi";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import Header from "../../components/TM_Header.jsx";
import TmLeftSidebar from "../../components/TM_LeftBar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";
import api from "../../services/api.js";

/* =========================================================
   FUNÇÕES AUXILIARES DE FORMATAÇÃO E ESTADOS
========================================================= */
function formatarData(data) {
  if (!data) return "Não disponível";
  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return data;
  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function limparNomeFicheiro(valor) {
  return String(valor || "candidatura")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function obterUrlFicheiro(caminho) {
  if (!caminho) return "";
  if (/^https?:\/\//i.test(caminho)) return caminho;
  const baseUrl = String(api.defaults.baseURL || "").replace(/\/api\/?$/, "");
  return `${baseUrl}${caminho.startsWith("/") ? "" : "/"}${caminho}`;
}

function obterEstadoVisual(estado) {
  const valor = String(estado || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

  if (valor.includes("APROV")) {
    return {
      texto: "Aprovado",
      background: "#dcfce7",
      color: "#15803d",
      border: "#86efac",
      icon: <BiCheck size={18} />,
    };
  }
  if (valor.includes("REJEIT") || valor.includes("RECUS")) {
    return {
      texto: "Recusado",
      background: "#fee2e2",
      color: "#dc2626",
      border: "#fca5a5",
      icon: <BiX size={18} />,
    };
  }
  return {
    texto: "Em Avaliação",
    background: "#fef3c7",
    color: "#a16207",
    border: "#fde68a",
    icon: <BiTimeFive size={18} />,
  };
}

// Determina qual o estado ativo seguindo a hierarquia do pipeline: Evidência -> SLL -> TM
function determinarEstadoItem(req) {
  return req.estado_evidencia || req.estado_sll || req.estado_tm || "PENDENTE";
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */
function DetalhesHistoricoTM() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [detalhes, setDetalhes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requisitoAberto, setRequisitoAberto] = useState(null);

  useEffect(() => {
    const fetchDetalhes = async () => {
      try {
        setLoading(true); 
        const response = await api.get(`/candidaturas/tm/detalhes/${id}`);
        setDetalhes(response.data);
        
        if (response.data?.requisitos?.length > 0) {
          setRequisitoAberto(response.data.requisitos[0].id_requisitos);
        }
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar os detalhes da candidatura:", err);
        setError("Não foi possível carregar os detalhes desta candidatura.");
        setLoading(false);
      }
    };

    if (id) fetchDetalhes();
  }, [id]);

  if (loading) {
    return (
      <div style={mensagemBox}>
        <p style={{ marginTop: 15 }}>A carregar detalhes da candidatura...</p>
      </div>
    );
  }

  if (error || !detalhes) {
    return <div style={erroBox}>{error || "Candidatura não encontrada."}</div>;
  }

  const estadoFinal = obterEstadoVisual(detalhes.estado_candidatura);
  const requisitos = Array.isArray(detalhes.requisitos) ? detalhes.requisitos : [];

  /* =========================================================
     EXPORTAR PDF
  ========================================================= */
  function gerarPdf() {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("Detalhes da Candidatura", 14, 17);

    pdf.setFontSize(13);
    pdf.setTextColor(37, 99, 235);
    pdf.text(detalhes.badge_nome || "Badge", 14, 27);

    pdf.setTextColor(17, 24, 39);
    autoTable(pdf, {
      startY: 34,
      head: [["Campo", "Informação"]],
      body: [
        ["Consultor", detalhes.consultor_nome || ""],
        ["Email", detalhes.consultor_email || ""],
        ["Badge", detalhes.badge_nome || ""],
        ["Categoria/Área", detalhes.badge_categoria || ""],
        ["Estado final", estadoFinal.texto],
        ["Data de submissão", detalhes.data_submissao_formatada || ""],
        ["Data de Conclusão", detalhes.data_conclusao_formatada || "N/A"],
        ["Avaliador", detalhes.avaliador_nome || "N/A"],
        ["Comentários do TM", detalhes.comentarios_tm || "Sem comentários"],
      ],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [37, 99, 235] },
      columnStyles: { 0: { cellWidth: 55, fontStyle: "bold" } },
    });

    if (requisitos.length > 0) {
      const inicio = pdf.lastAutoTable.finalY + 10;
      pdf.setFontSize(13);
      pdf.text("Requisitos", 14, inicio);

      autoTable(pdf, {
        startY: inicio + 5,
        head: [["Requisito", "Estado", "Evidência Documental"]],
        body: requisitos.map((req, index) => [
          `${index + 1} - ${req.titulo || req.nome_requisito}`,
          obterEstadoVisual(determinarEstadoItem(req)).texto,
          req.nome_ficheiro || "Sem documento",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] },
      });
    }

    pdf.save(`candidatura_${limparNomeFicheiro(detalhes.consultor_nome)}.pdf`);
  }

  /* =========================================================
     EXPORTAR EXCEL/CSV
  ========================================================= */
  function gerarExcel() {
    const linhas = [
      ["DETALHES DA CANDIDATURA"],
      ["Consultor", detalhes.consultor_nome],
      ["Email", detalhes.consultor_email],
      ["Badge", detalhes.badge_nome],
      ["Descrição", detalhes.badge_descricao],
      ["Categoria/Área", detalhes.badge_categoria],
      ["Estado final", estadoFinal.texto],
      ["Submissão", detalhes.data_submissao_formatada],
      ["Avaliado em", detalhes.data_conclusao_formatada],
      ["Avaliador", detalhes.avaliador_nome],
      ["Comentários", detalhes.comentarios_tm],
      [],
      ["REQUISITOS"],
      ["Número", "Requisito", "Estado Evidência", "Descrição Evidência", "Ficheiro"],
      ...requisitos.map((req, index) => [
        index + 1,
        req.titulo || req.nome_requisito,
        obterEstadoVisual(determinarEstadoItem(req)).texto,
        req.descricao_evidencia || "Sem descrição",
        req.nome_ficheiro || "Nenhum",
      ]),
    ];

    const csv = linhas
      .map((linha) => linha.map((valor) => `"${String(valor ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `candidatura_${limparNomeFicheiro(detalhes.consultor_nome)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const textoVoltar = location.state?.textoVoltar || "Voltar atrás";

  const lidarComVoltar = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/tm");
    }
  };

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <TmLeftSidebar />

        <main style={conteudo}>
          <button type="button" onClick={lidarComVoltar} style={voltarButton}>
            <BiArrowBack size={18} />
              {textoVoltar}
          </button>

          <div style={separador} />

          <div style={cabecalhoPagina}>
            <div>
              <h1 style={tituloPagina}>Detalhes da Candidatura</h1>
              <div style={subtituloPagina}>Informação completa do histórico de avaliação</div>
            </div>

            <div style={acoesExportacao}>
              <button type="button" onClick={gerarExcel} style={excelButton}>
                <BiSpreadsheet size={17} /> Excel
              </button>
              <button type="button" onClick={gerarPdf} style={pdfButton}>
                <BiFile size={17} /> PDF
              </button>
            </div>
          </div>

          <section style={perfilCard}>
            <h2 style={tituloCard}>Perfil do Consultor</h2>
            <div style={perfilGrid}>
              <div style={identidade}>
                <div style={avatar}>
                  <BiUserCircle size={76} color="#6092bf" />
                </div>
                <div style={nomeConsultor}>{detalhes.consultor_nome}</div>
                <span style={cargoBadge}>Consultor</span>
              </div>

              <div style={informacoesGrid}>
                <InfoItem icon={<BiEnvelope size={18} />} label="Email" value={detalhes.consultor_email} />
                <InfoItem icon={<BiCalendar size={18} />} label="Solicitado a" value={detalhes.data_submissao_formatada} />
                <InfoItem icon={<BiMedal size={18} />} label="Categoria" value={detalhes.badge_categoria} />
                <InfoItem icon={<BiBadgeCheck size={18} />} label="Estado Atual" value={estadoFinal.texto} />
              </div>
            </div>
          </section>

          <section style={badgeCard}>
            <div style={badgeImagemBox}>
              <BiMedal size={38} color="#2563eb" />
            </div>
            <div style={badgeInfo}>
              <div style={badgeNome}>{detalhes.badge_nome}</div>
              <div style={badgeDescricao}>{detalhes.badge_descricao}</div>
              <div style={chipsLinha}>
                <span style={chip}>{detalhes.badge_categoria || "Sem área"}</span>
              </div>
            </div>
            <div style={{ ...estadoFinalBox, background: estadoFinal.background, color: estadoFinal.color, border: `1px solid ${estadoFinal.border}` }}>
              {estadoFinal.icon}
              {estadoFinal.texto}
            </div>
          </section>

          {detalhes.avaliador_nome && (
            <section style={decisoesCard}>
              <h2 style={tituloCard}>Avaliação da Candidatura</h2>
              <div style={decisoesGrid}>
                <AvaliadorCard
                  titulo="Talent Manager"
                  nome={detalhes.avaliador_nome}
                  email={detalhes.avaliador_email}
                  data={detalhes.data_conclusao_formatada}
                  estado={detalhes.estado_candidatura}
                  comentario={detalhes.comentarios_tm}
                />
              </div>
            </section>
          )}

          <section>
            <h2 style={tituloRequisitos}>Requisitos e Evidências</h2>
            {requisitos.length > 0 ? (
              requisitos.map((requisito, index) => (
                <RequisitoHistoricoCard
                  key={requisito.id_requisitos}
                  requisito={requisito}
                  numero={index + 1}
                  aberto={requisitoAberto === requisito.id_requisitos}
                  onToggle={() => setRequisitoAberto(requisitoAberto === requisito.id_requisitos ? null : requisito.id_requisitos)}
                />
              ))
            ) : (
              <div style={mensagemBox}>Não existem requisitos registados.</div>
            )}
          </section>
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   SUB-COMPONENTES AUXILIARES
========================================================= */
function InfoItem({ icon, label, value }) {
  return (
    <div style={infoItem}>
      <div style={infoIcon}>{icon}</div>
      <div>
        <div style={infoLabel}>{label}</div>
        <div style={infoValue}>{value || "Não disponível"}</div>
      </div>
    </div>
  );
}

function AvaliadorCard({ titulo, nome, email, data, estado, comentario }) {
  const estadoVisual = obterEstadoVisual(estado);
  return (
    <article style={avaliadorCard}>
      <div style={avaliadorTopo}>
        <div style={avaliadorAvatar}>
          <BiUserCircle size={39} color="#6092bf" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={avaliadorTipo}>{titulo}</div>
          <div style={avaliadorNome}>{nome || "Não disponível"}</div>
          <div style={avaliadorEmail}>{email || "Sem email"}</div>
        </div>
        <div style={{ ...avaliadorEstado, background: estadoVisual.background, color: estadoVisual.color }}>
          {estadoVisual.texto}
        </div>
      </div>
      <div style={avaliadorData}>Avaliado em: {formatarData(data)}</div>
      <div style={comentarioAvaliador}>
        <strong>Comentário</strong>
        <p style={{ fontStyle: "italic", marginTop: 4 }}>"{comentario || "Não foi registado nenhum comentário."}"</p>
      </div>
    </article>
  );
}

function RequisitoHistoricoCard({ requisito, numero, aberto, onToggle }) {
  // CORRIGIDO: Consome dinamicamente a prioridade dos estados das evidências
  const estadoDefinitivo = determinarEstadoItem(requisito);
  const estado = obterEstadoVisual(estadoDefinitivo);

  return (
    <article style={requisitoCard}>
      <button type="button" onClick={onToggle} style={requisitoHeader}>
        <div style={requisitoTituloArea}>
          <strong>Requisito {numero}</strong>
          <span>- {requisito.titulo || requisito.nome_requisito}</span>
          <span style={{ ...requisitoEstado, background: estado.background, color: estado.color }}>
            {estado.texto}
          </span>
        </div>
        {aberto ? <BiChevronUp size={21} /> : <BiChevronDown size={21} />}
      </button>

      {aberto && (
        <div style={requisitoBody}>
          <div style={blocoTexto}>
            <strong>Descrição do Requisito</strong>
            <p style={{ color: "#64748b", marginTop: 4 }}>{requisito.descricao_requisito || "Sem descrição."}</p>
          </div>

          <div style={{ ...blocoTexto, marginTop: 14 }}>
            <strong>Evidência apresentada</strong>
            <p style={{ color: "#64748b", marginTop: 4 }}>{requisito.descricao_evidencia || "Nenhuma descrição textual fornecida."}</p>
          </div>

          {requisito.nome_ficheiro ? (
            <div style={documentoCard}>
              <BiFile size={20} color="#64748b" />
              <div style={documentoInfo}>
                <div style={documentoNome}>{requisito.nome_ficheiro}</div>
                <div style={documentoFormato}>{requisito.formato_ficheiro || "PDF"}</div>
              </div>
              {requisito.caminho_ficheiro && (
                <a href={obterUrlFicheiro(requisito.caminho_ficheiro)} target="_blank" rel="noreferrer" style={visualizarLink}>
                  <BiDownload size={16} /> Visualizar
                </a>
              )}
            </div>
          ) : (
            <div style={semEvidencias}>Não existem anexos associados a este requisito.</div>
          )}
        </div>
      )}
    </article>
  );
}

/* =========================================================
   ESTILOS INLINE (CORRIGIDO: identidad -> identidade)
========================================================= */
const pagina = { minHeight: "100vh", background: "#f4f5f7", display: "flex", flexDirection: "column" };
const corpo = { display: "flex", flex: 1, overflow: "hidden" };
const conteudo = { flex: 1, minWidth: 0, overflowY: "auto", padding: "32px 40px" };
const voltarButton = { border: "none", background: "transparent", color: "#6c757d", display: "inline-flex", alignItems: "center", gap: 7, padding: 0, fontSize: 14, cursor: "pointer" };
const separador = { height: 1, background: "#d1d5db", margin: "16px 0 20px" };
const cabecalhoPagina = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 22 };
const tituloPagina = { margin: 0, color: "#111827", fontSize: 21, fontWeight: 800 };
const subtituloPagina = { marginTop: 4, color: "#64748b", fontSize: 12 };
const acoesExportacao = { display: "flex", gap: 10 };
const excelButton = { minHeight: 40, border: "1px solid #ced4da", borderRadius: 8, background: "white", color: "#333", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "8px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" };
const pdfButton = { minHeight: 40, border: "none", borderRadius: 8, background: "#dc2626", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "8px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const perfilCard = { width: "100%", boxSizing: "border-box", background: "white", borderRadius: 16, padding: "24px", marginBottom: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" };
const tituloCard = { margin: "0 0 15px", color: "#111827", fontSize: 16, fontWeight: 700 };
const perfilGrid = { display: "grid", gridTemplateColumns: "190px minmax(0, 1fr)", gap: 28, alignItems: "center" };
const identidade = { display: "flex", flexDirection: "column", alignItems: "center" }; // Corrigido aqui!
const avatar = { width: 87, height: 87, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" };
const nomeConsultor = { marginTop: 8, color: "#111827", fontSize: 14, fontWeight: 600 };
const cargoBadge = { marginTop: 5, background: "#e9ecef", color: "#495057", borderRadius: 999, padding: "4px 17px", fontSize: 10 };
const informacoesGrid = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 20 };
const infoItem = { display: "flex", alignItems: "flex-start", gap: 9 };
const infoIcon = { color: "#6092bf", marginTop: 2 };
const infoLabel = { color: "#94a3b8", fontSize: 10 };
const infoValue = { marginTop: 2, color: "#334155", fontSize: 12, fontWeight: 500 };
const badgeCard = { width: "100%", boxSizing: "border-box", background: "#f5f8ff", border: "1px solid #e5edff", borderRadius: 16, padding: "16px 20px", display: "grid", gridTemplateColumns: "64px minmax(0, 1fr) 155px", gap: 18, alignItems: "center", marginBottom: 18 };
const badgeImagemBox = { width: 60, height: 60, borderRadius: "8px", background: "#e9ecef", display: "flex", alignItems: "center", justifyContent: "center" };
const badgeInfo = { minWidth: 0 };
const badgeNome = { color: "#0d6efd", fontSize: 15, fontWeight: 600 };
const badgeDescricao = { marginTop: 4, color: "#64748b", fontSize: 11, lineHeight: 1.5 };
const chipsLinha = { display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginTop: 8 };
const chip = { background: "#e5edff", color: "#0d6efd", borderRadius: 50, padding: "4px 12px", fontSize: 10, fontWeight: 500 };
const estadoFinalBox = { minHeight: 42, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "8px 12px", fontSize: 12, fontWeight: 600 };
const decisoesCard = { width: "100%", boxSizing: "border-box", background: "white", borderRadius: 16, padding: "18px 20px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" };
const decisoesGrid = { display: "grid", gridTemplateColumns: "1fr", gap: 18 };
const avaliadorCard = { border: "1px solid #e2e8f0", borderRadius: 10, background: "#f8fafc", padding: "14px 16px" };
const avaliadorTopo = { display: "flex", alignItems: "center", gap: 10 };
const avaliadorAvatar = { width: 45, height: 45, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" };
const avaliadorTipo = { color: "#6c757d", fontSize: 10, fontWeight: 600 };
const avaliadorNome = { color: "#111827", fontSize: 12, fontWeight: 600 };
const avaliadorEmail = { color: "#64748b", fontSize: 9 };
const avaliadorEstado = { borderRadius: 999, padding: "4px 9px", fontSize: 9, fontWeight: 600 };
const avaliadorData = { marginTop: 10, color: "#64748b", fontSize: 10 };
const comentarioAvaliador = { marginTop: 9, borderTop: "1px solid #e2e8f0", paddingTop: 9, color: "#334155", fontSize: 11 };
const tituloRequisitos = { margin: "0 0 12px", color: "#111827", fontSize: 16, fontWeight: 700 };
const requisitoCard = { width: "100%", boxSizing: "border-box", background: "white", borderRadius: 16, overflow: "hidden", marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" };
const requisitoHeader = { width: "100%", border: "none", background: "white", padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left" };
const requisitoTituloArea = { display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", color: "#111827", fontSize: 13 };
const requisitoEstado = { marginLeft: 10, borderRadius: 999, padding: "4px 10px", fontSize: 9, fontWeight: 600 };
const requisitoBody = { borderTop: "1px solid #e5e7eb", padding: "16px 18px 18px" };
const blocoTexto = { color: "#111827", fontSize: 12, lineHeight: 1.5 };
const documentoCard = { marginTop: 8, minHeight: 53, border: "1px solid #dbe3ef", borderRadius: 9, background: "#f8fafc", padding: "9px 12px", display: "flex", alignItems: "center", gap: 10 };
const documentoInfo = { flex: 1, minWidth: 0 };
const documentoNome = { color: "#334155", fontSize: 11, fontWeight: 600 };
const documentoFormato = { color: "#94a3b8", fontSize: 9 };
const visualizarLink = { display: "inline-flex", alignItems: "center", gap: 5, color: "#2563eb", fontSize: 11, textDecoration: "none", fontWeight: 600 };
const semEvidencias = { marginTop: 12, background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 8, padding: 14, color: "#64748b", fontSize: 11 };
const erroBox = { background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10, padding: 20, color: "#991b1b", margin: "40px", fontSize: 14, textAlign: "center" };
const mensagemBox = { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f4f5f7", color: "#64748b" };

export default DetalhesHistoricoTM;