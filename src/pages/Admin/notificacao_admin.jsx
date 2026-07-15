import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BiArrowBack,
  BiBell,
  BiCheck,
  BiChevronLeft,
  BiChevronRight,
  BiRefresh,
  BiSearch,
  BiTrash,
  BiX,
} from "react-icons/bi";

import { useNavigate } from "react-router-dom";

import Header from "../../components/Header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

import api from "../../services/api.js";

import {
  EVENTO_NOTIFICACOES_ATUALIZADAS,
  emitirAtualizacaoNotificacoes,
  formatarTituloNotificacao,
  notificacaoNaoLida,
} from "../../utils/notificacoesUtils.js";

const PAGE_SIZE = 8;

const TIPOS_INTERNOS_OCULTOS = new Set([
  "CONFIG_ADMIN_NOTIFICACOES",
]);

function obterIdNotificacao(notificacao) {
  return (
    notificacao?.id_notificacoes ||
    notificacao?.id_notificacao ||
    notificacao?.id ||
    null
  );
}

function obterTipoNotificacao(notificacao) {
  return String(
    notificacao?.tipo_notificacao ||
      notificacao?.TIPO_NOTIFICACAO ||
      notificacao?.tipo ||
      "NOTIFICACAO"
  )
    .trim()
    .toUpperCase();
}

function obterConteudoNotificacao(notificacao) {
  return (
    notificacao?.conteudo ||
    notificacao?.CONTEUDO ||
    notificacao?.mensagem ||
    notificacao?.descricao ||
    ""
  );
}

function obterDataNotificacao(notificacao) {
  return (
    notificacao?.data_envio ||
    notificacao?.DATA_ENVIO ||
    notificacao?.created_at ||
    notificacao?.data_criacao ||
    null
  );
}

function obterTituloNotificacao(notificacao) {
  const tipo = String(
    notificacao?.tipo_notificacao ||
      notificacao?.TIPO_NOTIFICACAO ||
      "Notificação"
  )
    .replace(/^AVISO_ADMIN:/i, "")
    .trim();

  return formatarTituloNotificacao(
    tipo || "Notificação"
  );
}

function classificarNotificacao(tipo) {
  const valor = String(tipo || "").toUpperCase();

  if (valor.includes("SLA")) {
    return {
      chave: "SLA",
      nome: "SLA",
      icone: "⏱️",
      cor: "#dc2626",
      fundo: "#fef2f2",
      borda: "#fecaca",
    };
  }

  if (
    valor.includes("RELATÓRIO") ||
    valor.includes("RELATORIO")
  ) {
    return {
      chave: "RELATORIO",
      nome: "Relatórios",
      icone: "📊",
      cor: "#7c3aed",
      fundo: "#f5f3ff",
      borda: "#ddd6fe",
    };
  }

  if (
    valor.includes("CANDIDATURA") ||
    valor.includes("BADGE") ||
    valor.includes("REJEICAO") ||
    valor.includes("REJEIÇÃO") ||
    valor.includes("APROVACAO") ||
    valor.includes("APROVAÇÃO")
  ) {
    return {
      chave: "CANDIDATURA",
      nome: "Candidaturas e badges",
      icone: "🏅",
      cor: "#2563eb",
      fundo: "#eff6ff",
      borda: "#bfdbfe",
    };
  }

  if (
    valor.startsWith("AVISO_ADMIN:") ||
    valor === "SISTEMA" ||
    valor === "ALERTA"
  ) {
    return {
      chave: "AVISO",
      nome: "Avisos administrativos",
      icone: "📢",
      cor: "#d97706",
      fundo: "#fffbeb",
      borda: "#fde68a",
    };
  }

  if (
    valor.includes("DESAFIO") ||
    valor.includes("OBJETIVO") ||
    valor.includes("MARCO")
  ) {
    return {
      chave: "GAMIFICACAO",
      nome: "Gamificação",
      icone: "🎯",
      cor: "#059669",
      fundo: "#ecfdf5",
      borda: "#a7f3d0",
    };
  }

  return {
    chave: "OUTRAS",
    nome: "Outras",
    icone: "🔔",
    cor: "#475569",
    fundo: "#f8fafc",
    borda: "#e2e8f0",
  };
}

function formatarDataRelativa(data) {
  if (!data) return "";

  const dataNotificacao = new Date(data);

  if (Number.isNaN(dataNotificacao.getTime())) {
    return "";
  }

  const agora = new Date();
  const diffMs = agora.getTime() - dataNotificacao.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMin < 1) return "Agora mesmo";
  if (diffMin < 60) return `${diffMin} minuto(s) atrás`;
  if (diffHoras < 24) return `${diffHoras} hora(s) atrás`;
  if (diffDias < 7) return `${diffDias} dia(s) atrás`;

  return dataNotificacao.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function obterUtilizadorGuardado() {
  const guardado = localStorage.getItem("user");

  if (!guardado) return null;

  try {
    return JSON.parse(guardado);
  } catch {
    return null;
  }
}

function NotificacaoAdminPage() {
  const navigate = useNavigate();

  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [apagandoTodas, setApagandoTodas] = useState(false);
  const [apagandoId, setApagandoId] = useState(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [userId, setUserId] = useState(null);
  const [nomeAdmin, setNomeAdmin] = useState("Administrador");
  const [pesquisa, setPesquisa] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [modalApagar, setModalApagar] = useState(null);

  const carregarNotificacoes = useCallback(
    async (idUtilizador, { silencioso = false } = {}) => {
      if (!idUtilizador) return;

      try {
        if (!silencioso) setLoading(true);

        setErro("");

        const response = await api.get(
          `/notificacoes/${idUtilizador}`
        );

        const dados = Array.isArray(response.data)
          ? response.data
          : [];

        const lista = dados
          .filter((notificacao) => {
            const tipo = obterTipoNotificacao(notificacao);
            return !TIPOS_INTERNOS_OCULTOS.has(tipo);
          })
          .sort((a, b) => {
            const dataA = new Date(
              obterDataNotificacao(a) || 0
            ).getTime();

            const dataB = new Date(
              obterDataNotificacao(b) || 0
            ).getTime();

            return dataB - dataA;
          });

        setNotificacoes(lista);
      } catch (err) {
        console.error(
          "[NOTIFICAÇÕES ADMIN] Erro ao carregar:",
          err
        );

        setErro(
          err.response?.data?.error ||
            "Não foi possível carregar as notificações do Administrador."
        );
      } finally {
        if (!silencioso) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const user = obterUtilizadorGuardado();

    if (!user) {
      setLoading(false);
      navigate("/login", { replace: true });
      return;
    }

    const idUtilizador =
      user.id_utilizador ||
      user.ID_UTILIZADOR ||
      user.id;

    if (!idUtilizador) {
      setLoading(false);
      navigate("/login", { replace: true });
      return;
    }

    setUserId(idUtilizador);
    setNomeAdmin(
      user.nome_completo ||
        user.NOME_COMPLETO ||
        user.nome ||
        "Administrador"
    );

    carregarNotificacoes(idUtilizador);
  }, [navigate, carregarNotificacoes]);

  useEffect(() => {
    if (!userId) return undefined;

    const atualizar = () => {
      carregarNotificacoes(userId, {
        silencioso: true,
      });
    };

    window.addEventListener(
      EVENTO_NOTIFICACOES_ATUALIZADAS,
      atualizar
    );

    return () => {
      window.removeEventListener(
        EVENTO_NOTIFICACOES_ATUALIZADAS,
        atualizar
      );
    };
  }, [userId, carregarNotificacoes]);

  const totalNaoLidas = notificacoes.filter(
    notificacaoNaoLida
  ).length;

  const categoriasDisponiveis = useMemo(() => {
    const mapa = new Map();

    notificacoes.forEach((notificacao) => {
      const categoria = classificarNotificacao(
        obterTipoNotificacao(notificacao)
      );

      mapa.set(categoria.chave, categoria.nome);
    });

    return Array.from(mapa.entries()).map(
      ([chave, nome]) => ({ chave, nome })
    );
  }, [notificacoes]);

  const notificacoesFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return notificacoes.filter((notificacao) => {
      const naoLida = notificacaoNaoLida(notificacao);

      if (filtroEstado === "NAO_LIDA" && !naoLida) {
        return false;
      }

      if (filtroEstado === "LIDA" && naoLida) {
        return false;
      }

      const categoria = classificarNotificacao(
        obterTipoNotificacao(notificacao)
      );

      if (
        filtroCategoria &&
        categoria.chave !== filtroCategoria
      ) {
        return false;
      }

      if (!termo) return true;

      const titulo = obterTituloNotificacao(notificacao)
        .toLowerCase();

      const conteudo = obterConteudoNotificacao(notificacao)
        .toLowerCase();

      const tipo = obterTipoNotificacao(notificacao)
        .toLowerCase();

      return (
        titulo.includes(termo) ||
        conteudo.includes(termo) ||
        tipo.includes(termo)
      );
    });
  }, [
    notificacoes,
    pesquisa,
    filtroEstado,
    filtroCategoria,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(notificacoesFiltradas.length / PAGE_SIZE)
  );

  const paginaAjustada = Math.min(
    paginaAtual,
    totalPaginas
  );

  const indiceInicial =
    (paginaAjustada - 1) * PAGE_SIZE;

  const notificacoesPaginadas =
    notificacoesFiltradas.slice(
      indiceInicial,
      indiceInicial + PAGE_SIZE
    );

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  async function marcarComoLida(notificacao) {
    const idNotificacao = obterIdNotificacao(notificacao);

    if (!idNotificacao || !userId) return;

    try {
      setErro("");
      setSucesso("");

      await api.patch(
        `/notificacoes/${idNotificacao}/lida`,
        { id_utilizador: userId }
      );

      setNotificacoes((anteriores) =>
        anteriores.map((item) => {
          const idItem = obterIdNotificacao(item);

          if (String(idItem) !== String(idNotificacao)) {
            return item;
          }

          return {
            ...item,
            lida: true,
            lido: true,
            estado_leitura: "LIDA",
            estado_notificacao: "LIDA",
          };
        })
      );

      emitirAtualizacaoNotificacoes();
    } catch (err) {
      console.error(
        "[NOTIFICAÇÕES ADMIN] Erro ao marcar como lida:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível marcar a notificação como lida."
      );
    }
  }

  async function marcarTodasComoLidas() {
    if (!userId) return;

    try {
      setMarcandoTodas(true);
      setErro("");
      setSucesso("");

      await api.patch(
        `/notificacoes/utilizador/${userId}/lidas`
      );

      setNotificacoes((anteriores) =>
        anteriores.map((item) => ({
          ...item,
          lida: true,
          lido: true,
          estado_leitura: "LIDA",
          estado_notificacao: "LIDA",
        }))
      );

      setSucesso(
        "Todas as notificações foram marcadas como lidas."
      );

      emitirAtualizacaoNotificacoes();
    } catch (err) {
      console.error(
        "[NOTIFICAÇÕES ADMIN] Erro ao marcar todas como lidas:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível marcar todas as notificações como lidas."
      );
    } finally {
      setMarcandoTodas(false);
    }
  }

  async function apagarNotificacao(notificacao) {
    const idNotificacao = obterIdNotificacao(notificacao);

    if (!idNotificacao || !userId) return;

    try {
      setErro("");
      setSucesso("");
      setApagandoId(idNotificacao);

      await api.delete(
        `/notificacoes/${idNotificacao}`,
        {
          data: {
            id_utilizador: userId,
          },
        }
      );

      setNotificacoes((anteriores) =>
        anteriores.filter(
          (item) =>
            String(obterIdNotificacao(item)) !==
            String(idNotificacao)
        )
      );

      setSucesso(
        "Notificação removida da caixa do Administrador."
      );

      emitirAtualizacaoNotificacoes();
    } catch (err) {
      console.error(
        "[NOTIFICAÇÕES ADMIN] Erro ao apagar:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível apagar a notificação."
      );
    } finally {
      setApagandoId(null);
    }
  }

  async function apagarTodasNotificacoes() {
    if (!userId) return;

    try {
      setErro("");
      setSucesso("");
      setApagandoTodas(true);

      await api.delete(
        `/notificacoes/limpar/${userId}`
      );

      setNotificacoes([]);
      setPaginaAtual(1);

      setSucesso(
        "Todas as notificações foram removidas."
      );

      emitirAtualizacaoNotificacoes();
    } catch (err) {
      console.error(
        "[NOTIFICAÇÕES ADMIN] Erro ao apagar todas:",
        err
      );

      setErro(
        err.response?.data?.error ||
          "Não foi possível apagar todas as notificações."
      );
    } finally {
      setApagandoTodas(false);
    }
  }

  async function confirmarApagar() {
    if (modalApagar?.tipo === "todas") {
      setModalApagar(null);
      await apagarTodasNotificacoes();
      return;
    }

    if (
      modalApagar?.tipo === "uma" &&
      modalApagar.notificacao
    ) {
      const notificacao = modalApagar.notificacao;
      setModalApagar(null);
      await apagarNotificacao(notificacao);
    }
  }

  return (
    <div style={styles.pagina}>
      <Header />

      <div style={styles.corpo}>
        <AdminLeftSidebar />

        <main style={styles.main}>
          <button
            type="button"
            onClick={() => navigate("/admin")}
            style={styles.voltar}
          >
            <BiArrowBack size={18} />
            Voltar ao dashboard
          </button>

          <div style={styles.separador} />

          <div style={styles.cabecalho}>
            <div>
              <h1 style={styles.titulo}>
                Notificações do Administrador
              </h1>

              <p style={styles.subtitulo}>
                Consulta alertas de SLA, relatórios,
                candidaturas, badges e avisos destinados a
                {` ${nomeAdmin}`}.
              </p>
            </div>

            <button
              type="button"
              onClick={() => carregarNotificacoes(userId)}
              disabled={loading || !userId}
              style={{
                ...styles.atualizar,
                opacity: loading || !userId ? 0.6 : 1,
              }}
            >
              <BiRefresh size={18} />
              Atualizar
            </button>
          </div>

          <div style={styles.resumoGrid}>
            <ResumoCard
              titulo="Total"
              valor={notificacoes.length}
              icone="🔔"
            />

            <ResumoCard
              titulo="Não lidas"
              valor={totalNaoLidas}
              icone="📬"
              destaque={totalNaoLidas > 0}
            />

            <ResumoCard
              titulo="Lidas"
              valor={notificacoes.length - totalNaoLidas}
              icone="✅"
            />
          </div>

          <div style={styles.filtros}>
            <div style={styles.pesquisaWrap}>
              <BiSearch size={17} style={styles.pesquisaIcon} />

              <input
                value={pesquisa}
                onChange={(event) => {
                  setPesquisa(event.target.value);
                  setPaginaAtual(1);
                }}
                placeholder="Pesquisar por título, conteúdo ou tipo..."
                style={styles.inputPesquisa}
              />
            </div>

            <select
              value={filtroEstado}
              onChange={(event) => {
                setFiltroEstado(event.target.value);
                setPaginaAtual(1);
              }}
              style={styles.select}
            >
              <option value="">Todos os estados</option>
              <option value="NAO_LIDA">Não lidas</option>
              <option value="LIDA">Lidas</option>
            </select>

            <select
              value={filtroCategoria}
              onChange={(event) => {
                setFiltroCategoria(event.target.value);
                setPaginaAtual(1);
              }}
              style={styles.select}
            >
              <option value="">Todas as categorias</option>

              {categoriasDisponiveis.map((categoria) => (
                <option
                  key={categoria.chave}
                  value={categoria.chave}
                >
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.acoesLinha}>
            <span style={styles.totalResultados}>
              {notificacoesFiltradas.length} notificação(ões)
              encontrada(s)
            </span>

            <div style={styles.acoesBotoes}>
              <button
                type="button"
                onClick={marcarTodasComoLidas}
                disabled={
                  loading ||
                  marcandoTodas ||
                  totalNaoLidas === 0
                }
                style={{
                  ...styles.marcarTodas,
                  opacity:
                    loading ||
                    marcandoTodas ||
                    totalNaoLidas === 0
                      ? 0.55
                      : 1,
                }}
              >
                <BiCheck size={17} />
                {marcandoTodas
                  ? "A marcar..."
                  : "Marcar todas como lidas"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setModalApagar({ tipo: "todas" })
                }
                disabled={
                  loading ||
                  apagandoTodas ||
                  notificacoes.length === 0
                }
                style={{
                  ...styles.apagarTodas,
                  opacity:
                    loading ||
                    apagandoTodas ||
                    notificacoes.length === 0
                      ? 0.55
                      : 1,
                }}
              >
                <BiTrash size={17} />
                {apagandoTodas
                  ? "A apagar..."
                  : "Apagar todas"}
              </button>
            </div>
          </div>

          {erro && <div style={styles.erro}>{erro}</div>}
          {sucesso && <div style={styles.sucesso}>{sucesso}</div>}

          {loading ? (
            <div style={styles.estadoBox}>
              A carregar notificações...
            </div>
          ) : notificacoesPaginadas.length === 0 ? (
            <div style={styles.vazioBox}>
              <div style={styles.vazioIcone}>
                <BiBell size={36} />
              </div>

              <strong style={styles.vazioTitulo}>
                Sem notificações
              </strong>

              <span style={styles.vazioTexto}>
                Não existem notificações que correspondam aos
                filtros selecionados.
              </span>
            </div>
          ) : (
            <div style={styles.lista}>
              {notificacoesPaginadas.map(
                (notificacao, index) => {
                  const idNotificacao =
                    obterIdNotificacao(notificacao) ||
                    `notificacao-${index}`;

                  return (
                    <NotificationAdminCard
                      key={idNotificacao}
                      notificacao={notificacao}
                      apagando={
                        String(apagandoId) ===
                        String(idNotificacao)
                      }
                      onMarcarComoLida={() =>
                        marcarComoLida(notificacao)
                      }
                      onApagar={() =>
                        setModalApagar({
                          tipo: "uma",
                          notificacao,
                        })
                      }
                    />
                  );
                }
              )}

              <div style={styles.paginacao}>
                <button
                  type="button"
                  onClick={() =>
                    setPaginaAtual((pagina) =>
                      Math.max(1, pagina - 1)
                    )
                  }
                  disabled={paginaAjustada === 1}
                  style={pagButton(
                    false,
                    paginaAjustada === 1
                  )}
                >
                  <BiChevronLeft size={17} />
                </button>

                {Array.from(
                  { length: totalPaginas },
                  (_, index) => index + 1
                ).map((pagina) => (
                  <button
                    type="button"
                    key={pagina}
                    onClick={() => setPaginaAtual(pagina)}
                    style={pagButton(
                      pagina === paginaAjustada
                    )}
                  >
                    {pagina}
                  </button>
                ))}

                <span style={styles.indicadorPagina}>
                  {paginaAjustada}/{totalPaginas}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPaginaAtual((pagina) =>
                      Math.min(totalPaginas, pagina + 1)
                    )
                  }
                  disabled={paginaAjustada === totalPaginas}
                  style={pagButton(
                    false,
                    paginaAjustada === totalPaginas
                  )}
                >
                  <BiChevronRight size={17} />
                </button>
              </div>
            </div>
          )}
        </main>

        <AdminRightSidebar />
      </div>

      {modalApagar && (
        <ConfirmarApagarModal
          todas={modalApagar.tipo === "todas"}
          loading={apagandoTodas || Boolean(apagandoId)}
          onClose={() => setModalApagar(null)}
          onConfirm={confirmarApagar}
        />
      )}
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
  icone,
  destaque = false,
}) {
  return (
    <div
      style={{
        ...styles.resumoCard,
        borderColor: destaque ? "#93c5fd" : "#e5e7eb",
        background: destaque ? "#eff6ff" : "white",
      }}
    >
      <div style={styles.resumoIcone}>{icone}</div>

      <div>
        <div style={styles.resumoValor}>{valor}</div>
        <div style={styles.resumoTitulo}>{titulo}</div>
      </div>
    </div>
  );
}

function NotificationAdminCard({
  notificacao,
  apagando,
  onMarcarComoLida,
  onApagar,
}) {
  const naoLida = notificacaoNaoLida(notificacao);
  const tipo = obterTipoNotificacao(notificacao);
  const categoria = classificarNotificacao(tipo);

  return (
    <article
      style={{
        ...styles.cartao,
        borderLeft: `5px solid ${
          naoLida ? categoria.cor : "#cbd5e1"
        }`,
        background: naoLida ? categoria.fundo : "white",
      }}
    >
      <div
        style={{
          ...styles.cartaoIcone,
          color: categoria.cor,
          background: categoria.fundo,
          border: `1px solid ${categoria.borda}`,
        }}
      >
        {categoria.icone}
      </div>

      <div style={styles.cartaoCorpo}>
        <div style={styles.cartaoTopo}>
          <div>
            <div style={styles.tituloLinha}>
              <h2 style={styles.cartaoTitulo}>
                {obterTituloNotificacao(notificacao)}
              </h2>

              {naoLida && (
                <span style={styles.naoLidaPill}>
                  Não lida
                </span>
              )}
            </div>

            <div style={styles.categoriaTexto}>
              {categoria.nome}
            </div>
          </div>

          <div style={styles.dataTexto}>
            {formatarDataRelativa(
              obterDataNotificacao(notificacao)
            )}
          </div>
        </div>

        <p style={styles.conteudoTexto}>
          {obterConteudoNotificacao(notificacao) ||
            "Notificação sem conteúdo."}
        </p>

        <div style={styles.acoesCartao}>
          {naoLida && (
            <button
              type="button"
              onClick={onMarcarComoLida}
              style={styles.marcarLida}
            >
              <BiCheck size={16} />
              Marcar como lida
            </button>
          )}

          <button
            type="button"
            onClick={onApagar}
            disabled={apagando}
            style={{
              ...styles.apagarUma,
              opacity: apagando ? 0.6 : 1,
            }}
          >
            <BiTrash size={16} />
            {apagando ? "A apagar..." : "Apagar"}
          </button>
        </div>
      </div>
    </article>
  );
}

function ConfirmarApagarModal({
  todas,
  loading,
  onClose,
  onConfirm,
}) {
  return (
    <div
      style={styles.modalOverlay}
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        style={styles.modalCard}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          style={styles.modalFechar}
        >
          <BiX size={21} />
        </button>

        <div style={styles.modalIcone}>
          <BiTrash size={31} />
        </div>

        <h3 style={styles.modalTitulo}>
          {todas
            ? "Apagar todas as notificações?"
            : "Apagar esta notificação?"}
        </h3>

        <p style={styles.modalTexto}>
          {todas
            ? "As notificações serão removidas apenas da caixa deste Administrador."
            : "A notificação será removida apenas da caixa deste Administrador."}
        </p>

        <div style={styles.modalAcoes}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={styles.modalCancelar}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              ...styles.modalConfirmar,
              opacity: loading ? 0.65 : 1,
            }}
          >
            {loading ? "A apagar..." : "Sim, apagar"}
          </button>
        </div>
      </div>
    </div>
  );
}

const pagButton = (active, disabled = false) => ({
  width: 30,
  height: 30,
  borderRadius: 6,
  border: active ? "none" : "1px solid #e2e8f0",
  background: active ? "#2563eb" : "white",
  color: active
    ? "white"
    : disabled
      ? "#cbd5e1"
      : "#374151",
  fontSize: 12,
  fontWeight: active ? 800 : 500,
  cursor: disabled ? "not-allowed" : "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: disabled ? 0.55 : 1,
});

const styles = {
  pagina: {
    backgroundColor: "#f0f2f5",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  corpo: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  main: {
    flex: 1,
    minWidth: 0,
    overflowY: "auto",
    padding: "22px 28px 50px",
  },
  voltar: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: 0,
    fontSize: 14,
    cursor: "pointer",
  },
  separador: {
    height: 1,
    background: "#d1d5db",
    margin: "16px 0 18px",
  },
  cabecalho: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  titulo: {
    margin: 0,
    color: "#111827",
    fontSize: 23,
    fontWeight: 800,
  },
  subtitulo: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: 12,
    maxWidth: 720,
  },
  atualizar: {
    minHeight: 38,
    border: "1px solid #cbd5e1",
    borderRadius: 9,
    background: "white",
    color: "#2563eb",
    padding: "8px 13px",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  resumoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(150px, 1fr))",
    gap: 14,
    marginBottom: 18,
  },
  resumoCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "15px 17px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  resumoIcone: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
  },
  resumoValor: {
    color: "#111827",
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1,
  },
  resumoTitulo: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },
  filtros: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1fr) 190px 220px",
    gap: 10,
    marginBottom: 12,
  },
  pesquisaWrap: {
    position: "relative",
  },
  pesquisaIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
  },
  inputPesquisa: {
    width: "100%",
    height: 40,
    border: "1px solid #dbe3ef",
    borderRadius: 9,
    padding: "0 12px 0 38px",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    height: 40,
    border: "1px solid #dbe3ef",
    borderRadius: 9,
    padding: "0 10px",
    background: "white",
    color: "#374151",
    fontSize: 13,
    outline: "none",
  },
  acoesLinha: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  totalResultados: {
    color: "#64748b",
    fontSize: 12,
  },
  acoesBotoes: {
    display: "flex",
    gap: 9,
    flexWrap: "wrap",
  },
  marcarTodas: {
    border: "1px solid #93c5fd",
    borderRadius: 8,
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "7px 11px",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  apagarTodas: {
    border: "1px solid #fecaca",
    borderRadius: 8,
    background: "#fff1f2",
    color: "#dc2626",
    padding: "7px 11px",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  erro: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: "10px 13px",
    fontSize: 13,
    marginBottom: 14,
  },
  sucesso: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: 10,
    padding: "10px 13px",
    fontSize: 13,
    marginBottom: 14,
  },
  estadoBox: {
    minHeight: 210,
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontSize: 13,
  },
  vazioBox: {
    minHeight: 240,
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 30,
  },
  vazioIcone: {
    width: 70,
    height: 70,
    borderRadius: "50%",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  vazioTitulo: {
    color: "#111827",
    fontSize: 16,
  },
  vazioTexto: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 5,
  },
  lista: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  },
  cartao: {
    display: "flex",
    gap: 14,
    padding: "17px 18px",
    borderBottom: "1px solid #eef2f7",
  },
  cartaoIcone: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    flexShrink: 0,
  },
  cartaoCorpo: {
    flex: 1,
    minWidth: 0,
  },
  cartaoTopo: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  tituloLinha: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  cartaoTitulo: {
    margin: 0,
    color: "#111827",
    fontSize: 14,
    fontWeight: 800,
  },
  categoriaTexto: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 3,
  },
  dataTexto: {
    color: "#94a3b8",
    fontSize: 11,
    whiteSpace: "nowrap",
  },
  naoLidaPill: {
    borderRadius: 999,
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "3px 8px",
    fontSize: 10,
    fontWeight: 800,
  },
  conteudoTexto: {
    margin: "10px 0 0",
    color: "#475569",
    fontSize: 13,
    lineHeight: 1.55,
  },
  acoesCartao: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 12,
  },
  marcarLida: {
    border: "1px solid #93c5fd",
    borderRadius: 7,
    background: "white",
    color: "#2563eb",
    padding: "6px 9px",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  },
  apagarUma: {
    border: "1px solid #fecaca",
    borderRadius: 7,
    background: "white",
    color: "#dc2626",
    padding: "6px 9px",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  },
  paginacao: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
    padding: "12px 15px",
    background: "#f8fafc",
  },
  indicadorPagina: {
    color: "#94a3b8",
    fontSize: 12,
    margin: "0 3px",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 20,
  },
  modalCard: {
    position: "relative",
    width: "100%",
    maxWidth: 450,
    borderRadius: 16,
    background: "white",
    border: "1px solid #e5e7eb",
    padding: "26px 26px 22px",
    textAlign: "center",
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
  },
  modalFechar: {
    position: "absolute",
    top: 13,
    right: 13,
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "1px solid #e5e7eb",
    background: "white",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  modalIcone: {
    width: 66,
    height: 66,
    borderRadius: "50%",
    background: "#fee2e2",
    color: "#dc2626",
    margin: "5px auto 15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitulo: {
    margin: "0 0 8px",
    color: "#111827",
    fontSize: 19,
    fontWeight: 800,
  },
  modalTexto: {
    margin: "0 0 19px",
    color: "#64748b",
    fontSize: 13,
    lineHeight: 1.55,
  },
  modalAcoes: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 9,
  },
  modalCancelar: {
    border: "1px solid #d1d5db",
    borderRadius: 9,
    background: "white",
    color: "#374151",
    padding: "8px 13px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
  modalConfirmar: {
    border: "none",
    borderRadius: 9,
    background: "#dc2626",
    color: "white",
    padding: "8px 13px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default NotificacaoAdminPage;