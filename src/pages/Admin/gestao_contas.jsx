import { useEffect, useState } from "react";
import {
  BiUserCircle,
  BiArrowBack,
  BiFilter,
  BiSort,
  BiEdit,
  BiPlus,
  BiChevronRight,
  BiChevronLeft,
  BiUserX,
  BiX,
} from "react-icons/bi";
import { useNavigate } from "react-router-dom";

import logoImg from "../../assets/logo.png";

import api from "../../services/api.js";
import Header from "../../components/Header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

const ROWS_PER_PAGE = 8;

function FuncaoBadge({ funcao }) {
  const map = {
    "Talent Manager": { bg: "#dbeafe", color: "#1d4ed8", label: "T.M." },
    "Service Line Leader": { bg: "#d1fae5", color: "#065f46", label: "S.L.L." },
    "Consultor": { bg: "#f3f4f6", color: "#374151", label: "Consultor" },
  };

  const style = map[funcao] || map["Consultor"];

  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        borderRadius: 6,
        padding: "3px 8px",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
      title={funcao}
    >
      {style.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const ativo = status === "Ativo";

  return (
    <span
      style={{
        background: ativo ? "#dcfce7" : "#fee2e2",
        color: ativo ? "#15803d" : "#b91c1c",
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function formatarFuncao(tipo) {
  const t = String(tipo || "").toLowerCase();

  if (t.includes("admin")) return "Administrador";
  if (t.includes("talent") || t === "tm" || t === "t.m.") {
    return "Talent Manager";
  }
  if (
    t.includes("service") ||
    t.includes("leader") ||
    t === "sll" ||
    t === "s.l.l."
  ) {
    return "Service Line Leader";
  }

  return "Consultor";
}

function formatarData(raw) {
  if (!raw) return "-";

  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-PT");
  } catch {
    return "-";
  }
}

function normalizarConta(u) {
  const id = u.id_utilizador || u.ID_UTILIZADOR || u.id || u.ID;

  const nome =
    u.nome_completo ||
    u.NOME_COMPLETO ||
    u.nome ||
    u.NOME ||
    "Utilizador";

  const email =
    u.email ||
    u.EMAIL ||
    u.email_softinsa ||
    u.EMAIL_SOFTINSA ||
    "";

  const estado = u.estado_conta || u.ESTADO_CONTA || "ATIVO";

  const tipo =
    u.tipo_utilizador ||
    u.TIPO_UTILIZADOR ||
    u.cargo ||
    u.CARGO ||
    u.funcao ||
    u.FUNCAO ||
    "Consultor";

  const area =
    u.departamento ||
    u.DEPARTAMENTO ||
    u.nome_area ||
    u.NOME_AREA ||
    u.nome_serviceline ||
    u.NOME_SERVICELINE ||
    u.nome_service_line ||
    u.NOME_SERVICE_LINE ||
    "-";

  const badges =
    u.total_badges ||
    u.TOTAL_BADGES ||
    u.badges ||
    u.BADGES ||
    u.total_badges_atribuidos ||
    u.TOTAL_BADGES_ATRIBUIDOS ||
    0;

  const data =
    u.data_criacao_conta ||
    u.DATA_CRIACAO_CONTA ||
    u.data_registo ||
    u.DATA_REGISTO ||
    null;

  return {
    id,
    nome,
    email,
    funcao: formatarFuncao(tipo),
    departamento: area,
    badges: Number(badges || 0),
    dataRegisto: formatarData(data),
    status: estado?.toString().toUpperCase() === "ATIVO" ? "Ativo" : "Inativo",
  };
}

function GestaoContas() {
  const navigate = useNavigate();

  const [contas, setContas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filtroFuncao, setFiltroFuncao] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroNome, setFiltroNome] = useState("");
  const [ordenarPor, setOrdenarPor] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [modalDesativarAberta, setModalDesativarAberta] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState(null);
  const [aDesativar, setADesativar] = useState(false);

  useEffect(() => {
    carregarContas();
  }, []);

  async function carregarContas() {
    try {
      setIsLoading(true);

      const res = await api.get("/utilizadores");
      const dados = Array.isArray(res.data) ? res.data : [];

      setContas(dados.map(normalizarConta));
    } catch (err) {
      console.error("Erro ao carregar contas:", err);
      console.error("STATUS:", err.response?.status);
      console.error("BODY:", err.response?.data);
      setContas([]);
    } finally {
      setIsLoading(false);
    }
  }

  const dadosFiltrados = contas
    .filter((c) => c.funcao !== "Administrador")
    .filter((c) => (filtroFuncao ? c.funcao === filtroFuncao : true))
    .filter((c) => (filtroStatus ? c.status === filtroStatus : true))
    .filter((c) => {
      if (!filtroNome) return true;

      const texto = filtroNome.toLowerCase();

      return (
        c.nome.toLowerCase().includes(texto) ||
        c.email.toLowerCase().includes(texto) ||
        c.departamento.toLowerCase().includes(texto)
      );
    })
    .sort((a, b) => {
      if (ordenarPor === "nome") {
        return a.nome.localeCompare(b.nome, "pt-PT");
      }

      if (ordenarPor === "badges") {
        return b.badges - a.badges;
      }

      if (ordenarPor === "data") {
        return a.dataRegisto.localeCompare(b.dataRegisto, "pt-PT");
      }

      return Number(a.id || 0) - Number(b.id || 0);
    });

  const totalPaginas = Math.max(
    1,
    Math.ceil(dadosFiltrados.length / ROWS_PER_PAGE)
  );

  const dadosPagina = dadosFiltrados.slice(
    (paginaAtual - 1) * ROWS_PER_PAGE,
    paginaAtual * ROWS_PER_PAGE
  );

  function handleNovoUtilizador() {
    navigate("/admin/contas/novo");
  }

  function handleEditar(id) {
    navigate(`/admin/contas/editar/${id}`);
  }

  function abrirModalDesativar(conta) {
    if (conta.status === "Inativo") {
      return;
    }

    setContaSelecionada(conta);
    setModalDesativarAberta(true);
  }

  function fecharModalDesativar() {
    if (aDesativar) return;

    setModalDesativarAberta(false);
    setContaSelecionada(null);
  }

  async function confirmarDesativarConta() {
    if (!contaSelecionada) return;

    try {
      setADesativar(true);

      await api.put(`/utilizadores/${contaSelecionada.id}/desativar`);

      setContas((prev) =>
        prev.map((c) =>
          c.id === contaSelecionada.id
            ? {
                ...c,
                status: "Inativo",
              }
            : c
        )
      );

      setModalDesativarAberta(false);
      setContaSelecionada(null);
    } catch (err) {
      console.error("Erro ao desativar conta:", err);

      alert(
        err.response?.data?.error ||
          "Não foi possível desativar esta conta."
      );
    } finally {
      setADesativar(false);
    }
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

      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <AdminLeftSidebar />

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 24,
            minWidth: 0,
          }}
        >
          <button
            onClick={() => navigate("/admin")}
            style={{
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
            }}
          >
            <BiArrowBack size={16} /> Voltar
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h5
                style={{
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Gestão de Contas
              </h5>

              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Total de {dadosFiltrados.length} contas
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div>
                <div style={labelFiltro}>
                  <BiFilter size={13} /> Filtrar por Função
                </div>

                <select
                  value={filtroFuncao}
                  onChange={(e) => {
                    setFiltroFuncao(e.target.value);
                    setPaginaAtual(1);
                  }}
                  style={selectStyle}
                >
                  <option value="">Todas</option>
                  <option value="Consultor">Consultor</option>
                  <option value="Talent Manager">Talent Manager</option>
                  <option value="Service Line Leader">
                    Service Line Leader
                  </option>
                </select>
              </div>

              <div>
                <div style={labelFiltro}>
                  <BiFilter size={13} /> Status
                </div>

                <select
                  value={filtroStatus}
                  onChange={(e) => {
                    setFiltroStatus(e.target.value);
                    setPaginaAtual(1);
                  }}
                  style={selectStyle}
                >
                  <option value="">Todos</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              <div>
                <div style={labelFiltro}>
                  <BiFilter size={13} /> Pesquisar
                </div>

                <input
                  type="text"
                  placeholder="Nome, email ou área..."
                  value={filtroNome}
                  onChange={(e) => {
                    setFiltroNome(e.target.value);
                    setPaginaAtual(1);
                  }}
                  style={selectStyle}
                />
              </div>

              <div>
                <div style={labelFiltro}>
                  <BiSort size={13} /> Ordenar por
                </div>

                <select
                  value={ordenarPor}
                  onChange={(e) => {
                    setOrdenarPor(e.target.value);
                    setPaginaAtual(1);
                  }}
                  style={selectStyle}
                >
                  <option value="">ID</option>
                  <option value="nome">Nome</option>
                  <option value="badges">Badges</option>
                  <option value="data">Data Registo</option>
                </select>
              </div>

              <div style={{ marginTop: 18 }}>
                <button
                  onClick={handleNovoUtilizador}
                  style={novoButton}
                  title="Criar nova conta"
                >
                  <BiPlus size={22} />
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              overflow: "hidden",
              width: "100%",
            }}
          >
            {isLoading ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "#6b7280",
                }}
              >
                A carregar contas...
              </div>
            ) : (
              <>

              <div
                style={{
                  width: "100%",
                  overflowX: "auto",
                  overflowY: "hidden",
                }}
              >
                <table
                    style={{
                        width: "100%",
                        minWidth: 980,
                        borderCollapse: "collapse",
                        fontSize: 12,
                        tableLayout: "fixed",
                    }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      {[
                        { label: "ID", width: "55px" },
                        { label: "Utilizador", width: "150px" },
                        { label: "Email", width: "220px" },
                        { label: "Função", width: "145px" },
                        { label: "Departamento", width: "170px" },
                        { label: "Badges", width: "70px" },
                        { label: "Data", width: "100px" },
                        { label: "Status", width: "90px" },
                        { label: "Ações", width: "75px" },
                        ].map((col) => (
                        <th
                            key={col.label}
                            style={{
                            ...thStyle,
                            width: col.width,
                            }}
                        >
                            {col.label}
                        </th>
                        ))}
                    </tr>
                  </thead>

                  <tbody>
                    {dadosPagina.map((c, i) => (
                      <tr
                        key={c.id}
                        style={{
                          borderBottom: "1px solid #f3f4f6",
                          background: i % 2 === 0 ? "white" : "#fafafa",
                        }}
                      >
                        <td style={tdStyle}>#{c.id}</td>

                        <td style={tdStyle}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <div style={avatarMini}>
                              <BiUserCircle size={20} color="#d97706" />
                            </div>

                            <span
                                style={{
                                    fontWeight: 600,
                                    fontSize: 12,
                                    lineHeight: "16px",
                                    maxWidth: 95,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "block",
                                }}
                                title={c.nome}
                                >
                                {c.nome}
                            </span>
                          </div>
                        </td>

                        <td
                            style={{
                                ...tdStyle,
                                color: "#6b7280",
                                whiteSpace: "nowrap",
                            }}
                            title={c.email}
                            >
                            {c.email}
                        </td>

                        <td style={tdStyle}>
                          <FuncaoBadge funcao={c.funcao} />
                        </td>

                        <td
                            style={{
                                ...tdStyle,
                                whiteSpace: "normal",
                                lineHeight: "16px",
                            }}
                            title={c.departamento}
                            >
                            {c.departamento}
                        </td>

                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                          {c.badges}
                        </td>

                        <td style={{ ...tdStyle, color: "#6b7280" }}>
                          {c.dataRegisto}
                        </td>

                        <td style={tdStyle}>
                          <StatusBadge status={c.status} />
                        </td>

                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => handleEditar(c.id)}
                              style={iconButtonEdit}
                              title="Editar conta"
                            >
                              <BiEdit size={18} />
                            </button>

                            <button
                              onClick={() => abrirModalDesativar(c)}
                              style={{
                                ...iconButtonDeactivate,
                                opacity: c.status === "Inativo" ? 0.35 : 1,
                                cursor: c.status === "Inativo" ? "not-allowed" : "pointer",
                              }}
                              title={
                                c.status === "Inativo"
                                  ? "Conta já está inativa"
                                  : "Desativar conta"
                              }
                              disabled={c.status === "Inativo"}
                            >
                              <BiUserX size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {dadosPagina.length === 0 && (
                      <tr>
                        <td colSpan={9} style={emptyTable}>
                          Nenhum resultado encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

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

                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => setPaginaAtual(p)}
                        style={pagBtn(p === paginaAtual)}
                      >
                        {p}
                      </button>
                    )
                  )}

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
            )}
          </div>
        </div>

        <AdminRightSidebar />
      </div>

      {modalDesativarAberta && (
        <DesativarContaModal
          conta={contaSelecionada}
          loading={aDesativar}
          onClose={fecharModalDesativar}
          onConfirm={confirmarDesativarConta}
        />
      )}      

    </div>
  );
}

function DesativarContaModal({ conta, loading, onClose, onConfirm }) {
  if (!conta) return null;

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

        <h3 style={modalTitle}>Desativar conta?</h3>

        <p style={modalText}>
          A conta de <strong>{conta.nome}</strong> será marcada como{" "}
          <strong>Inativa</strong>.
        </p>

        <p style={modalSubText}>
          Esta ação não apaga o utilizador da base de dados. O histórico da
          conta, badges, candidaturas e registos continuam guardados para
          consulta administrativa.
        </p>

        <div style={modalUserBox}>
          <div style={modalUserAvatar}>
            <BiUserCircle size={24} color="#d97706" />
          </div>

          <div style={{ flex: 1 }}>
            <div style={modalUserName}>{conta.nome}</div>
            <div style={modalUserEmail}>{conta.email}</div>
          </div>

          <span style={modalUserRole}>{conta.funcao}</span>
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
            {loading ? "A desativar..." : "Sim, desativar conta"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelFiltro = {
  fontSize: 11,
  color: "#6b7280",
  marginBottom: 3,
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const selectStyle = {
  height: 34,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 13,
  padding: "0 10px",
  color: "#374151",
  background: "white",
  outline: "none",
  minWidth: 150,
};

const thStyle = {
  padding: "10px 10px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 700,
  color: "#374151",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "11px 10px",
  color: "#111827",
  verticalAlign: "middle",
  fontSize: 12,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const avatarMini = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "#fef3c7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const novoButton = {
  width: 38,
  height: 38,
  borderRadius: 10,
  background: "#2563eb",
  border: "none",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const iconButtonEdit = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#2563eb",
  padding: 2,
};

const iconButtonDeactivate = {
  background: "none",
  border: "none",
  color: "#dc2626",
  padding: 2,
};

const emptyTable = {
  padding: 32,
  textAlign: "center",
  color: "#9ca3af",
  fontSize: 13,
};

const paginationBox = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 6,
  padding: "12px 16px",
  borderTop: "1px solid #f3f4f6",
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
  background: "#fef3c7",
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

export default GestaoContas;