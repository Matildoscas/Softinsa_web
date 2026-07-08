import { useEffect, useState } from "react";
import {
  BiArrowBack,
  BiEdit,
  BiTrash,
  BiPlus,
  BiX,
  BiBell,
  BiSearch,
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

const TITULOS_NOTIFICACAO = {
  MARCO_PRIMEIRO_BADGE: "Primeiro badge conquistado",
  BADGE_APROVADO: "Badge aprovado",
  BADGE_A_EXPIRAR: "Badge prestes a expirar",
  MARCO_NIVEL_E: "Marco de nível E",
  MARCO_5_BADGES: "Marco de 5 badges",
  DESAFIO_CONCLUIDO: "Desafio concluído",
  OBJETIVO_CONCLUIDO: "Objetivo concluído",
  BADGE_REJEITADO: "Badge rejeitado",
  BADGE_RETIFICACAO: "Pedido em retificação",
};

function normalizarEstado(estado) {
  const e = String(estado || "").trim().toUpperCase();

  if (e === "ATIVO" || e === "ATIVA" || e === "ACTIVE") return "ATIVO";
  if (e === "INATIVO" || e === "INATIVA" || e === "INACTIVE") return "INATIVO";

  return "ATIVO";
}

function formatarTituloNotificacao(tipo) {
  const raw = String(tipo || "").trim();

  if (!raw) {
    return "Aviso";
  }

  const chave = raw.toUpperCase();

  if (TITULOS_NOTIFICACAO[chave]) {
    return TITULOS_NOTIFICACAO[chave];
  }

  return raw
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function normalizarAviso(a) {
  const tipoOriginal =
    a.tipo_notificacao ||
    a.TIPO_NOTIFICACAO ||
    a.titulo ||
    "Aviso";

  return {
    id: a.id_notificacoes || a.ID_NOTIFICACOES || a.id || "",

    tipo_original: tipoOriginal,

    titulo: formatarTituloNotificacao(tipoOriginal),

    conteudo:
      a.conteudo ||
      a.CONTEUDO ||
      "",

    estado: normalizarEstado(
      a.estado_notificacao ||
        a.ESTADO_NOTIFICACAO ||
        a.estado
    ),

    data_envio:
      a.data_envio ||
      a.DATA_ENVIO ||
      null,

    total_destinatarios: Number(
      a.total_destinatarios ||
        a.TOTAL_DESTINATARIOS ||
        0
    ),

    destinatarios: Array.isArray(a.destinatarios)
      ? a.destinatarios
      : [],
  };
}

function normalizarUtilizador(u) {
  return {
    id: u.id_utilizador || u.ID_UTILIZADOR || u.id || "",

    nome:
      u.nome_completo ||
      u.NOME_COMPLETO ||
      u.nome ||
      "Utilizador",

    email:
      u.email ||
      u.email_softinsa ||
      "",

    funcao:
      u.tipo_utilizador ||
      u.funcao ||
      "",
  };
}

function AvisoModal({
  aviso,
  utilizadores,
  loading,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    titulo: aviso?.titulo || "",
    conteudo: aviso?.conteudo || "",
    estado: aviso?.estado || "ATIVO",

    destinatarios:
      aviso?.destinatarios?.length > 0
        ? aviso.destinatarios.map((u) =>
            String(u.id_utilizador || u.id)
          )
        : [],

    enviarTodos: !aviso || aviso?.destinatarios?.length === 0,
  });

  const [erro, setErro] = useState("");

  function toggleUtilizador(id) {
    const idStr = String(id);

    setForm((prev) => {
      const existe = prev.destinatarios.includes(idStr);

      return {
        ...prev,
        enviarTodos: false,
        destinatarios: existe
          ? prev.destinatarios.filter((x) => x !== idStr)
          : [...prev.destinatarios, idStr],
      };
    });

    setErro("");
  }

  function guardar() {
    if (!form.titulo.trim()) {
      setErro("O título/tipo é obrigatório.");
      return;
    }

    if (!form.conteudo.trim()) {
      setErro("O conteúdo é obrigatório.");
      return;
    }

    if (!form.enviarTodos && form.destinatarios.length === 0) {
      setErro("Escolhe pelo menos um utilizador ou seleciona enviar para todos.");
      return;
    }

    onSave({
      tipo_notificacao: form.titulo.trim(),
      conteudo: form.conteudo.trim(),
      estado_notificacao: form.estado,
      enviar_todos: form.enviarTodos,
      destinatarios: form.destinatarios.map(Number),
    });
  }

  return (
    <div style={modalOverlay}>
      <div style={modalCardLarge}>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          style={modalCloseButton}
        >
          <BiX size={22} />
        </button>

        <h3 style={modalTitle}>
          {aviso ? "Editar aviso/informação" : "Novo aviso/informação"}
        </h3>

        <p style={modalSubText}>
          Define a mensagem e escolhe os utilizadores que a vão receber.
        </p>

        {erro && <div style={errorBox}>{erro}</div>}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Título / Tipo</label>

          <input
            value={form.titulo}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, titulo: e.target.value }));
              setErro("");
            }}
            placeholder="Ex: Manutenção do sistema"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Conteúdo</label>

          <textarea
            value={form.conteudo}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, conteudo: e.target.value }));
              setErro("");
            }}
            placeholder="Escreve a mensagem..."
            rows={4}
            style={textareaStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Estado</label>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  estado: "INATIVO",
                }))
              }
              style={{
                ...statusButton,
                background: form.estado === "INATIVO" ? "#fee2e2" : "white",
                color: form.estado === "INATIVO" ? "#b91c1c" : "#6b7280",
                border:
                  form.estado === "INATIVO"
                    ? "1.5px solid #fca5a5"
                    : "1.5px solid #d1d5db",
              }}
            >
              Inativo
            </button>

            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  estado: "ATIVO",
                }))
              }
              style={{
                ...statusButton,
                background: form.estado === "ATIVO" ? "#16a34a" : "white",
                color: form.estado === "ATIVO" ? "white" : "#6b7280",
                border:
                  form.estado === "ATIVO"
                    ? "1.5px solid #16a34a"
                    : "1.5px solid #d1d5db",
              }}
            >
              Ativo
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Destinatários</label>

          <label style={checkRow}>
            <input
              type="checkbox"
              checked={form.enviarTodos}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  enviarTodos: e.target.checked,
                  destinatarios: e.target.checked ? [] : prev.destinatarios,
                }))
              }
            />

            Enviar para todos os utilizadores
          </label>

          {!form.enviarTodos && (
            <div style={usersBox}>
              {utilizadores.length > 0 ? (
                utilizadores.map((u) => {
                  const checked = form.destinatarios.includes(String(u.id));

                  return (
                    <label key={u.id} style={userCheckRow}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleUtilizador(u.id)}
                      />

                      <span>
                        <strong>{u.nome}</strong>
                        <span style={{ color: "#6b7280" }}>
                          {" "}
                          — {u.email || "sem email"}
                        </span>
                      </span>
                    </label>
                  );
                })
              ) : (
                <div style={{ color: "#9ca3af", fontSize: 13 }}>
                  Nenhum utilizador disponível.
                </div>
              )}
            </div>
          )}
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
            onClick={guardar}
            disabled={loading}
            style={{
              ...modalConfirmBlueButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "A guardar..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EliminarAvisoModal({
  aviso,
  loading,
  onClose,
  onConfirm,
}) {
  if (!aviso) return null;

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
          <BiTrash size={34} />
        </div>

        <h3 style={modalTitle}>Desativar aviso?</h3>

        <p style={modalText}>
          O aviso <strong>{aviso.titulo}</strong> será desativado.
        </p>

        <p style={modalSubText}>
          Esta ação não apaga o aviso da base de dados.
          Poderás voltar a ativá-lo mais tarde.
        </p>

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
              ...modalConfirmDangerButton,
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

function AvisoCard({
  aviso,
  onEditar,
  onEliminar,
  onToggleStatus,
}) {
  const ativo = aviso.estado === "ATIVO";

  return (
    <div style={avisoCard}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            ...statusPill,
            background: ativo ? "#dcfce7" : "#fee2e2",
            color: ativo ? "#15803d" : "#b91c1c",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: ativo ? "#16a34a" : "#dc2626",
              display: "inline-block",
            }}
          />

          {ativo ? "Ativo" : "Inativo"}
        </span>

        <span style={avisoTitle}>{aviso.titulo}</span>
      </div>

      <p style={avisoText}>{aviso.conteudo}</p>

      <div style={avisoMeta}>
        Destinatários:{" "}
        <strong>
          {aviso.total_destinatarios > 0
            ? aviso.total_destinatarios
            : "Todos/0"}
        </strong>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => onEditar(aviso)}
          style={editButton}
        >
          <BiEdit size={15} color="#2563eb" />
          Editar
        </button>

        <button
          type="button"
          onClick={() => onToggleStatus(aviso)}
          style={neutralButton}
        >
          {ativo ? "Desativar" : "Ativar"}
        </button>
      </div>
    </div>
  );
}

function InformacoesAvisos() {
  const navigate = useNavigate();

  const [avisos, setAvisos] = useState([]);
  const [utilizadores, setUtilizadores] = useState([]);
  const [pesquisa, setPesquisa] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [aEliminar, setAEliminar] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [modal, setModal] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setIsLoading(true);
      setErro("");

      const [avisosRes, usersRes] = await Promise.all([
        api.get("/avisos"),
        api.get("/utilizadores"),
      ]);

      const avisosData = avisosRes.data;
      const usersData = usersRes.data;

      const listaAvisos =
        Array.isArray(avisosData)
          ? avisosData
          : Array.isArray(avisosData.avisos)
            ? avisosData.avisos
            : Array.isArray(avisosData.data)
              ? avisosData.data
              : [];

      const listaUsers =
        Array.isArray(usersData)
          ? usersData
          : Array.isArray(usersData.utilizadores)
            ? usersData.utilizadores
            : Array.isArray(usersData.data)
              ? usersData.data
              : [];

      setAvisos(listaAvisos.map(normalizarAviso));
      setUtilizadores(listaUsers.map(normalizarUtilizador));
    } catch (err) {
      console.error("Erro ao carregar avisos:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível carregar os avisos."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const filtrados = avisos.filter((a) => {
    const t = pesquisa.toLowerCase();

    return (
      a.titulo.toLowerCase().includes(t) ||
      a.conteudo.toLowerCase().includes(t)
    );
  });

  const ativos = filtrados.filter((a) => a.estado === "ATIVO");
  const inativos = filtrados.filter((a) => a.estado === "INATIVO");

  async function guardarAviso(dados) {
    try {
      setAGuardar(true);
      setErro("");
      setSucesso("");

      if (modal?.mode === "editar") {
        await api.put(`/avisos/${modal.aviso.id}`, dados);
        setSucesso("Aviso atualizado com sucesso.");
      } else {
        await api.post("/avisos", dados);
        setSucesso("Aviso criado com sucesso.");
      }

      setModal(null);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao guardar aviso:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);

      setErro(
        err.response?.data?.error ||
          "Não foi possível guardar o aviso."
      );
    } finally {
      setAGuardar(false);
    }
  }

  async function toggleStatus(aviso) {
    try {
      const novoEstado = aviso.estado === "ATIVO" ? "INATIVO" : "ATIVO";

      await api.put(`/avisos/${aviso.id}/estado`, {
        estado_notificacao: novoEstado,
      });

      setAvisos((prev) =>
        prev.map((a) =>
          a.id === aviso.id ? { ...a, estado: novoEstado } : a
        )
      );
    } catch (err) {
      console.error("Erro ao alterar estado:", err);
      alert(
        err.response?.data?.error ||
          "Não foi possível alterar o estado."
      );
    }
  }

  async function confirmarEliminar() {
    if (!modalEliminar) return;

    try {
      setAEliminar(true);

      await api.delete(`/avisos/${modalEliminar.id}`);

      setAvisos((prev) =>
        prev.map((a) =>
          a.id === modalEliminar.id
            ? {
                ...a,
                estado: "INATIVO",
              }
            : a
        )
      );

      setModalEliminar(null);
      setSucesso("Aviso desativado com sucesso.");
    } catch (err) {
      console.error("Erro ao desativar aviso:", err);

      setErro(
        err.response?.data?.error ||
          "Não foi possível desativar o aviso."
      );
    } finally {
      setAEliminar(false);
    }
  }

  function handleExcel() {
    if (filtrados.length === 0) {
      alert("Não existem avisos para exportar.");
      return;
    }

    const dados = filtrados.map((a) => ({
      ID: a.id,
      Tipo: a.titulo,
      Conteúdo: a.conteudo,
      Estado: a.estado === "ATIVO" ? "Ativo" : "Inativo",
      "Data de envio": a.data_envio || "",
      Destinatários: a.total_destinatarios,
    }));

    const ws = XLSX.utils.json_to_sheet(dados);

    ws["!cols"] = [
      { wch: 8 },
      { wch: 32 },
      { wch: 80 },
      { wch: 14 },
      { wch: 24 },
      { wch: 16 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Avisos");

    const hoje = new Date()
      .toLocaleDateString("pt-PT")
      .replaceAll("/", "-");

    XLSX.writeFile(wb, `avisos_${hoje}.xlsx`);
  }

  function handlePDF() {
    if (filtrados.length === 0) {
      alert("Não existem avisos para exportar.");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const hoje = new Date().toLocaleDateString("pt-PT");

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SOFTINSA - Avisos e Informações", 14, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Exportado em: ${hoje}`, 14, 23);
    doc.text(`Total: ${filtrados.length}`, 14, 29);

    autoTable(doc, {
      startY: 36,
      head: [["ID", "Tipo", "Conteúdo", "Estado", "Data", "Destinatários"]],
      body: filtrados.map((a) => [
        a.id,
        a.titulo,
        a.conteudo,
        a.estado === "ATIVO" ? "Ativo" : "Inativo",
        a.data_envio || "",
        a.total_destinatarios,
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 38 },
        2: { cellWidth: 130 },
        3: { cellWidth: 22 },
        4: { cellWidth: 38 },
        5: { cellWidth: 24 },
      },
    });

    const ficheiro = new Date()
      .toLocaleDateString("pt-PT")
      .replaceAll("/", "-");

    doc.save(`avisos_${ficheiro}.pdf`);
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
              <h5 style={pageTitle}>Informações Genéricas e Avisos</h5>

              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Gerir mensagens globais ou direcionadas para utilizadores.
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
              <BiSearch size={16} style={searchIcon} />

              <input
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Pesquisar avisos..."
                style={searchInput}
              />
            </div>

            <button
              type="button"
              onClick={() => setModal({ mode: "novo" })}
              style={newButton}
            >
              <BiPlus size={24} />
            </button>
          </div>

          {erro && <div style={errorBox}>{erro}</div>}
          {sucesso && <div style={successBox}>{sucesso}</div>}

          {isLoading ? (
            <div style={loadingBox}>A carregar avisos...</div>
          ) : (
            <>
              <h5 style={sectionTitle}>Avisos ativos</h5>

              {ativos.length > 0 ? (
                <div style={gridCards}>
                  {ativos.map((aviso) => (
                    <AvisoCard
                      key={aviso.id}
                      aviso={aviso}
                      onEditar={(a) => setModal({ mode: "editar", aviso: a })}
                      onEliminar={setModalEliminar}
                      onToggleStatus={toggleStatus}
                    />
                  ))}
                </div>
              ) : (
                <div style={emptyBox}>Não existem avisos ativos.</div>
              )}

              <h5 style={sectionTitle}>Avisos inativos</h5>

              {inativos.length > 0 ? (
                <div style={gridCards}>
                  {inativos.map((aviso) => (
                    <AvisoCard
                      key={aviso.id}
                      aviso={aviso}
                      onEditar={(a) => setModal({ mode: "editar", aviso: a })}
                      onEliminar={setModalEliminar}
                      onToggleStatus={toggleStatus}
                    />
                  ))}
                </div>
              ) : (
                <div style={emptyBox}>Não existem avisos inativos.</div>
              )}
            </>
          )}
        </div>

        <AdminRightSidebar />
      </div>

      {modal && (
        <AvisoModal
          aviso={modal.aviso}
          utilizadores={utilizadores}
          loading={aGuardar}
          onClose={() => {
            if (aGuardar) return;
            setModal(null);
          }}
          onSave={guardarAviso}
        />
      )}

      {modalEliminar && (
        <EliminarAvisoModal
          aviso={modalEliminar}
          loading={aEliminar}
          onClose={() => {
            if (aEliminar) return;
            setModalEliminar(null);
          }}
          onConfirm={confirmarEliminar}
        />
      )}
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
  marginBottom: 22,
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

const sectionTitle = {
  fontWeight: 800,
  color: "#111827",
  margin: "0 0 16px",
  fontSize: 22,
};

const gridCards = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: 16,
  marginBottom: 32,
};

const avisoCard = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "20px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const statusPill = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  borderRadius: 20,
  padding: "3px 12px",
  fontSize: 12,
  fontWeight: 600,
  flexShrink: 0,
};

const avisoTitle = {
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
};

const avisoText = {
  fontSize: 13,
  color: "#6b7280",
  margin: 0,
  lineHeight: 1.6,
};

const avisoMeta = {
  fontSize: 12,
  color: "#64748b",
};

const editButton = {
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

const neutralButton = {
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "#f9fafb",
  padding: "6px 14px",
  fontSize: 13,
  color: "#374151",
  cursor: "pointer",
  fontWeight: 500,
};

const deleteButton = {
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
  padding: 32,
  color: "#9ca3af",
  fontSize: 14,
  background: "white",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  marginBottom: 30,
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

const modalCardLarge = {
  position: "relative",
  width: "100%",
  maxWidth: 720,
  maxHeight: "90vh",
  overflowY: "auto",
  background: "white",
  borderRadius: 18,
  padding: "28px 28px 24px",
  boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
  border: "1px solid #e5e7eb",
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
  textAlign: "center",
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
  textAlign: "center",
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: "#111827",
  display: "block",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  height: 40,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "0 12px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const textareaStyle = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: 10,
  fontSize: 14,
  resize: "vertical",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const statusButton = {
  padding: "8px 20px",
  borderRadius: 20,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
};

const checkRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "#374151",
  marginBottom: 10,
  cursor: "pointer",
};

const usersBox = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 12,
  maxHeight: 220,
  overflowY: "auto",
  background: "#f8fafc",
};

const userCheckRow = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  color: "#111827",
  padding: "7px 0",
  cursor: "pointer",
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

const modalConfirmBlueButton = {
  border: "none",
  background: "#2563eb",
  color: "white",
  borderRadius: 10,
  padding: "9px 15px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const modalConfirmDangerButton = {
  border: "none",
  background: "#dc2626",
  color: "white",
  borderRadius: 10,
  padding: "9px 15px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

export default InformacoesAvisos;