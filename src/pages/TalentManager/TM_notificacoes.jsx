import { useEffect, useState } from "react";
import { BiArrowBack, BiBell, BiCheckDouble, BiTrash } from "react-icons/bi";
import { useNavigate } from "react-router-dom";
import Header from "../../components/TM_Header.jsx";
import TmLeftSidebar from "../../components/TM_LeftBar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";
import api from "../../services/api.js";
import {
  emitirAtualizacaoNotificacoes,
} from "../../utils/notificacoesUtils.js";

/* =========================================================
   UTILIZADOR AUTENTICADO
========================================================= */
function obterUtilizadorGuardado() {
  const guardado = localStorage.getItem("user");
  if (!guardado) return null;
  try {
    return JSON.parse(guardado);
  } catch (err) {
    console.error("Erro ao ler utilizador:", err);
    return null;
  }
}

/* =========================================================
   DATA RELATIVA
========================================================= */
function formatarDataRelativa(data) {
  if (!data) return "";
  const dataNotificacao = new Date(data);
  if (Number.isNaN(dataNotificacao.getTime())) return "";

  const agora = new Date();
  const diferenca = agora - dataNotificacao;
  const minutos = Math.floor(diferenca / 60000);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (minutos < 1) return "Agora mesmo";
  if (minutos < 60) return `${minutos} minuto(s) atrás`;
  if (horas < 24) return `${horas} hora(s) atrás`;
  if (dias < 7) return `${dias} dia(s) atrás`;

  return dataNotificacao.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* =========================================================
   PÁGINA PRINCIPAL
========================================================= */
function NotificacoesTm() {
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [isLimparLoading, setIsLimparLoading] = useState(false);
  const [isMarcarTodasLoading, setIsMarcarTodasLoading] = useState(false);
  const [marcandoLidasIds, setMarcandoLidasIds] = useState([]);
  
  // 🎯 NOVO ESTADO PARA O POP-UP PERSONALIZADO
  const [mostrarModal, setMostrarModal] = useState(false);

  const textoVoltar = location.state?.textoVoltar || "Voltar atrás";

  const lidarComVoltar = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/tm");
    }
  };

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  const obterIdLogado = () => {
    const utilizador = obterUtilizadorGuardado();
    return utilizador?.id_utilizador || utilizador?.ID_UTILIZADOR || utilizador?.id;
  };

  async function carregarNotificacoes() {
    const idUtilizador = obterIdLogado();
    if (!idUtilizador) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setIsLoading(true);
      setErro("");
      const response = await api.get(`/notificacoes/${idUtilizador}`);
      setNotificacoes(
        (Array.isArray(response.data) ? response.data : [])
          .sort((a, b) => {
            const dataA = new Date(a.data_envio || a.DATA_ENVIO || 0).getTime();
            const dataB = new Date(b.data_envio || b.DATA_ENVIO || 0).getTime();
            return dataA - dataB;
          })
          .slice(0, 5)
      );
    } catch (err) {
      console.error("Erro ao carregar notificações do TM:", err);
      setNotificacoes([]);
      setErro(err.response?.data?.error || "Não foi possível carregar as notificações.");
    } finally {
      setIsLoading(false);
    }
  }

  async function lidarMarcarComoLida(idNotificacao) {
    setMarcandoLidasIds((prev) => [...prev, idNotificacao]);
    try {
      const idUtilizador = obterIdLogado();

      await api.patch(`/notificacoes/${idNotificacao}/lida`, {
        id_utilizador: idUtilizador
      });
      
      setNotificacoes((prev) =>
        prev.map((notif) => {
          const currentId = notif.id_notificacoes || notif.id_notificacao || notif.id;
          if (currentId === idNotificacao) {
            return {
              ...notif,
              lida: true,
              lido: true,
              estado_leitura: "LIDA",
              estado_notificacao: "LIDA",
            };
          }
          return notif;
        })
      );

      emitirAtualizacaoNotificacoes();
    } catch (err) {
      console.error(err.response?.data);
      console.error(err);
    } finally {
      setMarcandoLidasIds((prev) => prev.filter((id) => id !== idNotificacao));
    }
  }

  async function lidarMarcarTodasComoLidas() {
    const idUtilizador = obterIdLogado();
    if (!idUtilizador) return;

    try {
      setIsMarcarTodasLoading(true);
      await api.patch(`/notificacoes/utilizador/${idUtilizador}/lidas`);

      setNotificacoes((prev) =>
        prev.map((notif) => ({
          ...notif,
          lida: true,
          lido: true,
          estado_leitura: "LIDA",
          estado_notificacao: "LIDA",
        }))
      );

      emitirAtualizacaoNotificacoes();
    } catch (err) {
      console.error("Erro ao marcar todas como lidas (TM):", err);
      setErro("Não foi possível marcar todas as notificações como lidas.");
    } finally {
      setIsMarcarTodasLoading(false);
    }
  }

  const totalNaoLidas = notificacoes.filter((n) => {
    const estado = String(
      n.estado_notificacao ||
      n.estado_leitura ||
      (n.lida === true || n.lido === true ? "LIDA" : "NAO_LIDA")
    ).trim().toUpperCase();

    return !["LIDA", "LIDO", "READ", "TRUE", "1"].includes(estado);
  }).length;

  // 🎯 AÇÃO DO POP-UP: Executa a limpeza real após a confirmação no Modal
  async function lidarLimparTodas() {
    const idUtilizador = obterIdLogado();
    if (!idUtilizador) return;

    try {
      setIsLimparLoading(true);
      setMostrarModal(false); // Fecha o pop-up imediatamente ao clicar em sim
      await api.delete(`/notificacoes/limpar/${idUtilizador}`);
      setNotificacoes([]); 
    } catch (err) {
      console.error("Erro ao limpar notificações:", err);
      alert("Não foi possível limpar as notificações.");
    } finally {
      setIsLimparLoading(false);
    }
  }

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

          <div style={cabecalhoContainer}>
            <div style={cabecalhoPagina}>
              <h1 style={titulo}>Notificações</h1>
              <div style={subtitulo}>
                Notificações recebidas pela sua conta de Talent Manager
              </div>
            </div>

            {notificacoes.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={lidarMarcarTodasComoLidas}
                  disabled={isMarcarTodasLoading || totalNaoLidas === 0}
                  style={{
                    ...marcarTodasBtn,
                    opacity: isMarcarTodasLoading || totalNaoLidas === 0 ? 0.6 : 1,
                    cursor: isMarcarTodasLoading || totalNaoLidas === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  <BiCheckDouble size={16} />
                  {isMarcarTodasLoading ? "A marcar..." : "Marcar todas como lidas"}
                </button>

                <button 
                  type="button" 
                  onClick={() => setMostrarModal(true)} // 🎯 Abre o pop-up customizado em vez do confirm nativo
                  disabled={isLimparLoading}
                  style={{
                    ...limparTudoBtn,
                    opacity: isLimparLoading ? 0.6 : 1,
                    cursor: isLimparLoading ? "not-allowed" : "pointer",
                  }}
                >
                  <BiTrash size={16} />
                  {isLimparLoading ? "A limpar..." : "Limpar Notificações"}
                </button>
              </div>
            )}
          </div>

          {erro && <div style={erroBox}>{erro}</div>}

          {isLoading ? (
            <div style={mensagemBox}>A carregar notificações...</div>
          ) : notificacoes.length > 0 ? (
            <div style={lista}>
              {notificacoes.map((notificacao, index) => {
                const idNotif = notificacao.id_notificacoes || notificacao.id_notificacao || notificacao.id || index;
                const estaEmLoading = marcandoLidasIds.includes(idNotif);

                return (
                  <NotificationCard
                    key={idNotif}
                    idNotificacao={idNotif}
                    notificacao={notificacao}
                    onMarcarLida={lidarMarcarComoLida}
                    isMarking={estaEmLoading}
                  />
                );
              })}
            </div>
          ) : (
            <div style={mensagemBox}>Ainda não tem notificações.</div>
          )}
        </main>

        <TmRightSidebar />
      </div>

      {/* =========================================================
         🎯 ECRÃ DE POP-UP / MODAL PERSONALIZADO (SUPER SIMPLES)
      ========================================================= */}
      {mostrarModal && (
        <div style={modalBackdrop}>
          <div style={modalContent}>
            <h3 style={modalTitulo}>Limpar Notificações</h3>
            <p style={modalTexto}>
              Tem a certeza que deseja limpar todas as suas notificações? Esta ação não pode ser desfeita.
            </p>
            <div style={modalAcoes}>
              <button 
                type="button" 
                onClick={() => setMostrarModal(false)} 
                style={modalCancelarBtn}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={lidarLimparTodas} 
                style={modalConfirmarBtn}
              >
                Sim, Limpar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   COMPONENT CARD DE NOTIFICAÇÃO
========================================================= */
function NotificationCard({ notificacao, idNotificacao, onMarcarLida, isMarking }) {
  const tituloNotificacao = notificacao.tipo_notificacao || notificacao.titulo || "Notificação";
  const descricao = notificacao.conteudo || notificacao.mensagem || notificacao.descricao || "";
  const estado = notificacao.estado_notificacao || "Enviada";
  const data = notificacao.data_envio || notificacao.data_criacao || notificacao.created_at || null;

  const estadoNormalizado = String(estado || "").trim().toUpperCase();
  const estaLida = ["LIDA", "LIDO", "READ", "TRUE", "1"].includes(estadoNormalizado);

  return (
    <article style={{ ...card, opacity: estaLida ? 0.65 : 1 }}>
      <div style={iconArea}>
        <div style={{ ...iconCircle, background: estaLida ? "#f3f4f6" : "#eff6ff" }}>
          <BiBell size={22} color={estaLida ? "#94a3b8" : "#2563eb"} />
        </div>
        <div style={{ ...estadoTexto, color: estaLida ? "#94a3b8" : "#1e40af" }}>
          {estaLida ? "Lida" : "Pendente"}
        </div>
        <div style={tempoTexto}>{formatarDataRelativa(data)}</div>
      </div>

      <div style={divisor} />

      <div style={textoArea}>
        <div style={tituloCard}>{tituloNotificacao}</div>
        <div style={descricaoCard}>{descricao}</div>
      </div>

      {/* Botão de Ação Lateral Individual */}
      {!estaLida && (
        <div style={acoesArea}>
          <button
            type="button"
            title={isMarking ? "A processar..." : "Marcar como lida"}
            onClick={() => onMarcarLida(idNotificacao)}
            disabled={isMarking}
            style={{
              ...marcarLidaBtn,
              opacity: isMarking ? 0.6 : 1,
              cursor: isMarking ? "not-allowed" : "pointer",
              background: isMarking ? "#e5e7eb" : "#f0fdf4",
              borderColor: isMarking ? "#d1d5db" : "#bbf7d0"
            }}
          >
            {isMarking ? (
              <span style={spinnerTexto}>...</span>
            ) : (
              <BiCheckDouble size={20} />
            )}
          </button>
        </div>
      )}
    </article>
  );
}

/* =========================================================
   ESTILOS VISUAIS
========================================================= */
const pagina = { minHeight: "100vh", background: "#f3f4f6", display: "flex", flexDirection: "column", position: "relative" };
const corpo = { display: "flex", flex: 1, overflow: "hidden" };
const conteudo = { flex: 1, minWidth: 0, overflowY: "auto", padding: "22px 30px 60px" };
const voltarButton = { border: "none", background: "transparent", color: "#2563eb", display: "inline-flex", alignItems: "center", gap: 7, padding: 0, fontSize: 14, cursor: "pointer" };
const separador = { height: 1, background: "#d1d5db", margin: "16px 0 20px" };
const cabecalhoContainer = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, gap: 16 };
const cabecalhoPagina = { flex: 1 };
const titulo = { margin: 0, color: "#111827", fontSize: 22, fontWeight: 800 };
const subtitulo = { marginTop: 4, color: "#64748b", fontSize: 12 };
const lista = { width: "100%", display: "flex", flexDirection: "column", gap: 14 };
const card = { width: "100%", minHeight: 115, boxSizing: "border-box", display: "flex", alignItems: "stretch", gap: 18, background: "white", border: "1px solid #dbe3ef", borderRadius: 12, padding: "17px 20px", boxShadow: "0 2px 6px rgba(15,23,42,0.04)", transition: "all 0.2s ease" };
const iconArea = { width: 110, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" };
const iconCircle = { width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" };
const estadoTexto = { marginTop: 7, fontSize: 10, fontWeight: 700, uppercase: "true" };
const tempoTexto = { marginTop: 3, color: "#94a3b8", fontSize: 9, textAlign: "center" };
const divisor = { width: 1, background: "#e2e8f0" };
const textoArea = { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" };
const tituloCard = { color: "#111827", fontSize: 14, fontWeight: 700 };
const descricaoCard = { marginTop: 7, color: "#64748b", fontSize: 12, lineHeight: 1.55 };
const acoesArea = { display: "flex", alignItems: "center", paddingLeft: 10 };
const erroBox = { background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10, padding: 12, color: "#991b1b", marginBottom: 18, fontSize: 13 };
const mensagemBox = { width: "100%", boxSizing: "border-box", background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 40, textAlign: "center", color: "#64748b" };

const limparTudoBtn = {
  background: "#fee2e2",
  color: "#dc2626",
  border: "1px solid #fca5a5",
  padding: "8px 14px",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  transition: "background 0.2s",
};

const marcarTodasBtn = {
  background: "#eff6ff",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  padding: "8px 14px",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  transition: "background 0.2s",
};

const marcarLidaBtn = {
  background: "#f0fdf4",
  color: "#16a34a",
  border: "1px solid #bbf7d0",
  width: 36,
  height: 36,
  borderRadius: "50%",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s",
};

const spinnerTexto = {
  fontSize: 14,
  fontWeight: "bold",
  color: "#94a3b8",
  letterSpacing: 1
};

/* 🎯 NOVOS ESTILOS DO POP-UP CUSTOMIZADO */
const modalBackdrop = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(15, 23, 42, 0.4)", // Sombra de fundo suave
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalContent = {
  background: "white",
  padding: "24px",
  borderRadius: "12px",
  width: "90%",
  maxWidth: "380px",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  textAlign: "center",
};

const modalTitulo = {
  margin: "0 0 10px 0",
  color: "#111827",
  fontSize: "16px",
  fontWeight: 700,
};

const modalTexto = {
  color: "#64748b",
  fontSize: "13px",
  margin: "0 0 22px 0",
  lineHeight: "1.5",
};

const modalAcoes = {
  display: "flex",
  gap: "10px",
  justifyContent: "center",
};

const modalCancelarBtn = {
  background: "#f3f4f6",
  color: "#374151",
  border: "1px solid #e5e7eb",
  padding: "8px 16px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.2s",
};

const modalConfirmarBtn = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.2s",
};

export default NotificacoesTm;