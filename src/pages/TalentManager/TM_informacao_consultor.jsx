import { useEffect, useMemo, useState } from "react";

import {
  BiArrowBack,
  BiBadge,
  BiBookOpen,
  BiCalendar,
  BiEnvelope,
  BiFile,
  BiMedal,
  BiSearch,
  BiSpreadsheet,
  BiStar,
  BiUserCircle,
} from "react-icons/bi";

import { useLocation, useNavigate, useParams } from "react-router-dom";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import api from "../../services/api.js";
import DebugBadgePanel from "../../components/DebugBadgePanel.jsx";

import Header from "../../components/TM_Header.jsx";
import TmLeftSidebar from "../../components/TM_LeftBar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";

/* =========================================================
   UTILIZADOR
========================================================= */

function obterUtilizadorGuardado() {
  const guardado = localStorage.getItem("user");

  if (!guardado) {
    return null;
  }

  try {
    return JSON.parse(guardado);
  } catch (err) {
    console.error("Erro ao ler utilizador:", err);

    return null;
  }
}

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function formatarData(data) {
  if (!data) {
    return "Não disponível";
  }

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return "Não disponível";
  }

  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function limparNomeFicheiro(valor) {
  return String(valor || "consultor")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

/* =========================================================
   PÁGINA
========================================================= */

function InformacaoConsultorTm() {
  const navigate = useNavigate();

  const location = useLocation();

  const { idConsultor } = useParams();

  const [dados, setDados] = useState(null);

  const [mostrarTodosBadges, setMostrarTodosBadges] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [erro, setErro] = useState("");


  const textoVoltar = location.state?.textoVoltar || "Voltar atrás";

  const lidarComVoltar = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/tm/consultores");
    }
  };

  useEffect(() => {
    carregarPerfil();
  }, [idConsultor]);

  async function carregarPerfil() {
    const utilizador = obterUtilizadorGuardado();

    const idUtilizadorTm = utilizador?.id_utilizador || utilizador?.ID_UTILIZADOR || utilizador?.id;

    if (!idUtilizadorTm) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      const response = await api.get(`/tm/${idUtilizadorTm}/consultores/${idConsultor}`);

      setDados(response.data);
    } catch (err) {
      console.error("Erro ao carregar consultor:", err);

      console.error("STATUS:", err.response?.status);

      console.error("BODY:", err.response?.data);

      setDados(null);

      setErro(err.response?.data?.error || "Não foi possível carregar o perfil do consultor.");
    } finally {
      setIsLoading(false);
    }
  }

  const consultor = dados?.consultor;

  const estatisticas = dados?.estatisticas || {
    total_pontos: 0,
    total_badges: 0,
    conquistas_especiais: 0,
    learning_paths_completas: 0,
  };

  const badges = Array.isArray(dados?.badges) ? dados.badges : [];

  const candidaturaAtual = dados?.candidatura_atual || null;

  const idCandidaturaDetalhe =
    location.state?.idCandidaturaOrigem || candidaturaAtual?.id_candidatura_pedido;

  const badgesVisiveis = useMemo(
    () => (mostrarTodosBadges ? badges : badges.slice(0, 3)),
    [badges, mostrarTodosBadges],
  );

  function gerarPdf() {
    if (!consultor) {
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      pdf.setFont("helvetica", "bold");

      pdf.setFontSize(19);

      pdf.text("Perfil do Consultor", 15, 18);

      pdf.setFontSize(14);
      pdf.setTextColor(37, 99, 235);

      pdf.text(consultor.nome_completo, 15, 29);

      pdf.setTextColor(17, 24, 39);

      autoTable(pdf, {
        startY: 38,

        head: [["Campo", "Informação"]],

        body: [
          ["Nome", consultor.nome_completo],
          ["Email", consultor.email],
          ["Contacto", consultor.contacto || "Não disponível"],
          ["Área", consultor.nome_area || "Não disponível"],
          ["Service Line", consultor.nome_serviceline || "Não disponível"],
          ["Entrada na empresa", formatarData(consultor.data_entrada_empresa)],
          ["Pontos totais", estatisticas.total_pontos],
          ["Badges totais", estatisticas.total_badges],
          ["Conquistas especiais", estatisticas.conquistas_especiais],
          ["Learning Paths completas", estatisticas.learning_paths_completas],
        ],

        styles: {
          fontSize: 9,
          cellPadding: 4,
        },

        headStyles: {
          fillColor: [37, 99, 235],
        },

        columnStyles: {
          0: {
            cellWidth: 60,
            fontStyle: "bold",
          },
        },
      });

      if (badges.length > 0) {
        const inicio = pdf.lastAutoTable.finalY + 12;

        pdf.setFontSize(14);

        pdf.text("Badges adquiridos", 15, inicio);

        autoTable(pdf, {
          startY: inicio + 6,

          head: [["Badge", "Nível", "Pontos", "Data"]],

          body: badges.map((badge) => [
            badge.nome_badge,
            badge.nome_nivel || "Sem nível",
            badge.pontos,
            formatarData(badge.data_atribuicao),
          ]),

          styles: {
            fontSize: 8,
          },

          headStyles: {
            fillColor: [37, 99, 235],
          },
        });
      }

      pdf.save(`perfil_${limparNomeFicheiro(consultor.nome_completo)}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);

      setErro("Não foi possível gerar o PDF.");
    }
  }

  function gerarExcel() {
    if (!consultor) {
      return;
    }

    const linhas = [
      ["PERFIL DO CONSULTOR", ""],
      ["Nome", consultor.nome_completo],
      ["Email", consultor.email],
      ["Contacto", consultor.contacto || "Não disponível"],
      ["Área", consultor.nome_area || "Não disponível"],
      ["Service Line", consultor.nome_serviceline || "Não disponível"],
      ["Entrada na empresa", formatarData(consultor.data_entrada_empresa)],
      ["Pontos totais", estatisticas.total_pontos],
      ["Badges totais", estatisticas.total_badges],
      ["Conquistas especiais", estatisticas.conquistas_especiais],
      ["Learning Paths completas", estatisticas.learning_paths_completas],
      [],
      ["BADGES ADQUIRIDOS"],
      ["Badge", "Nível", "Pontos", "Data"],
      ...badges.map((badge) => [
        badge.nome_badge,
        badge.nome_nivel || "Sem nível",
        badge.pontos,
        formatarData(badge.data_atribuicao),
      ]),
    ];

    const csv = linhas
      .map((linha) =>
        linha
          .map((valor) => {
            const texto = String(valor ?? "").replace(/"/g, '""');

            return `"${texto}"`;
          })
          .join(";"),
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `perfil_${limparNomeFicheiro(consultor.nome_completo)}.csv`;

    document.body.appendChild(link);

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
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

          {erro && <div style={erroBox}>{erro}</div>}

          {isLoading ? (
            <div style={mensagemBox}>A carregar perfil do consultor...</div>
          ) : consultor ? (
            <>
              {/* PERFIL */}

              <section style={perfilCard}>
                <h2 style={tituloCard}>Perfil do Consultor</h2>

                <div style={perfilConteudo}>
                  <div style={identidade}>
                    <div style={avatar}>
                      <BiUserCircle size={78} color="#6092bf" />
                    </div>

                    <div style={nomeConsultor}>{consultor.nome_completo}</div>

                    <span style={cargoBadge}>Consultor</span>
                  </div>

                  <div style={informacoesGrid}>
                    <InfoItem
                      icon={<BiEnvelope size={18} />}
                      label="Email"
                      value={consultor.email}
                    />

                    <InfoItem
                      icon={<BiCalendar size={18} />}
                      label="Data de entrada"
                      value={formatarData(consultor.data_entrada_empresa)}
                    />

                    <InfoItem
                      icon={<BiBookOpen size={18} />}
                      label="Área"
                      value={consultor.nome_area}
                    />

                    <InfoItem
                      icon={<BiBadge size={18} />}
                      label="Badges conquistados"
                      value={`${estatisticas.total_badges} badges`}
                    />
                  </div>

                  <div style={acoesPerfil}>
                    <button type="button" onClick={gerarPdf} style={acaoButton}>
                      <BiFile size={17} />
                      Gerar PDF
                    </button>

                    <button type="button" onClick={gerarExcel} style={acaoButton}>
                      <BiSpreadsheet size={17} />
                      Gerar Excel
                    </button>
                  </div>
                </div>
              </section>

              {/* ESTATÍSTICAS */}

              <section style={estatisticasCard}>
                <h2 style={tituloCard}>Resumo de Estatísticas</h2>

                <div style={estatisticasGrid}>
                  <Estatistica valor={`${estatisticas.total_pontos} pts`} label="Pontos Totais" />

                  <Estatistica valor={estatisticas.total_badges} label="Badges Totais" />

                  <Estatistica
                    valor={estatisticas.conquistas_especiais}
                    label="Conquistas Especiais"
                  />

                  <Estatistica
                    valor={estatisticas.learning_paths_completas}
                    label="Learning Paths Completas"
                  />
                </div>
              </section>

              {/* BADGES */}

              <section style={badgesCard}>
                <div style={secaoCabecalho}>
                  <h2 style={tituloCardSemMargem}>Badges Adquiridos</h2>

                  {badges.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setMostrarTodosBadges((valor) => !valor)}
                      style={verTodosButton}
                    >
                      <BiBookOpen size={15} />

                      {mostrarTodosBadges ? "Ver Menos" : "Ver Todos"}
                    </button>
                  )}
                </div>

                {badgesVisiveis.length > 0 ? (
                  <div style={badgesGrid}>
                    {badgesVisiveis.map((badge) => (
                      <BadgeCard key={badge.id_badge_atribuido} badge={badge} />
                    ))}
                  </div>
                ) : (
                  <div style={semDados}>Este consultor ainda não possui badges.</div>
                )}
              </section>

              {/* BADGE EM PROCESSO */}

              <section style={processoCard}>
                <h2 style={tituloCard}>Badge em processo</h2>

                {candidaturaAtual ? (
                  <div style={processoConteudo}>
                    <div style={processoImagem}>
                      {candidaturaAtual.imagem ? (
                        <img
                          src={candidaturaAtual.imagem}
                          alt={candidaturaAtual.nome_badge}
                          style={imagemBadge}
                        />
                      ) : (
                        <BiMedal size={32} color="#2563eb" />
                      )}
                    </div>

                    <div style={processoInfo}>
                      <div style={processoNome}>
                        {candidaturaAtual.nome_badge}

                        {candidaturaAtual.nome_nivel && ` - ${candidaturaAtual.nome_nivel}`}
                      </div>

                      <div style={processoDescricao}>{candidaturaAtual.descricao_badge_modelo}</div>

                      <span style={processoArea}>{candidaturaAtual.nome_area}</span>
                    </div>

                    <button
  type="button"
  onClick={() => {
    // Agora validamos diretamente com o ID que veio do banco de dados
    if (!candidaturaAtual?.id_candidatura) {
      setErro("Não foi possível identificar a candidatura.");
      return;
    }

    navigate(`/tm/solicitacoes/${candidaturaAtual.id_candidatura}`, {
      state: {
        voltarPara: location.pathname,
        textoVoltar: "Voltar ao perfil do consultor",
      },
    });
  }}
  style={detalhesButton}
>
  <BiSearch size={17} />
  Ver Detalhes
</button>
                  </div>
                ) : (
                  <div style={semDados}>Este consultor não tem nenhuma candidatura em curso.</div>
                )}
              </section>
            </>
          ) : (
            !erro && <div style={mensagemBox}>Consultor não encontrado.</div>
          )}
        </main>

        <TmRightSidebar />
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTES
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

function Estatistica({ valor, label }) {
  return (
    <div style={estatisticaItem}>
      <div style={estatisticaValor}>{valor}</div>

      <div style={estatisticaLabel}>{label}</div>
    </div>
  );
}

function BadgeCard({ badge }) {
  return (
    <article style={badgeCard}>
      <div style={badgeImagemCircle}>
        {badge.imagem ? (
          <img src={badge.imagem} alt={badge.nome_badge} style={imagemBadge} />
        ) : (
          <BiMedal size={31} color="#2563eb" />
        )}
      </div>

      <div style={badgeCardNome}>
        {badge.nome_badge}

        {badge.nome_nivel && ` - ${badge.nome_nivel}`}
      </div>

      <div style={badgeCardData}>Conquistado em {formatarData(badge.data_atribuicao)}</div>

      <DebugBadgePanel badge={badge} />
    </article>
  );
}

/* =========================================================
   ESTILOS
========================================================= */

const pagina = {
  minHeight: "100vh",
  background: "#f3f4f6",
  display: "flex",
  flexDirection: "column",
};

const corpo = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const conteudo = {
  flex: 1,
  minWidth: 0,
  overflowY: "auto",
  padding: "22px 30px 60px",
};

const voltarButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: 0,
  fontSize: 14,
  cursor: "pointer",
};

const separador = {
  height: 1,
  background: "#d1d5db",
  margin: "16px 0 20px",
};

const perfilCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "18px 20px",
  marginBottom: 18,
};

const tituloCard = {
  margin: "0 0 15px",
  fontSize: 15,
  fontWeight: 600,
  color: "#334155",
};

const tituloCardSemMargem = {
  margin: 0,
  fontSize: 15,
  fontWeight: 600,
  color: "#334155",
};

const perfilConteudo = {
  display: "grid",
  gridTemplateColumns: "190px minmax(0, 1fr) 300px",
  alignItems: "center",
  gap: 28,
};

const identidade = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const avatar = {
  width: 88,
  height: 88,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const nomeConsultor = {
  marginTop: 7,
  fontSize: 14,
  fontWeight: 600,
  color: "#111827",
};

const cargoBadge = {
  marginTop: 5,
  borderRadius: 999,
  background: "#dbeafe",
  color: "#2563eb",
  padding: "4px 18px",
  fontSize: 10,
};

const informacoesGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 20,
};

const infoItem = {
  display: "flex",
  alignItems: "flex-start",
  gap: 9,
  minWidth: 0, // <- 1. Adiciona isto para permitir que o flex item encolha com segurança
};

const infoIcon = {
  color: "#6092bf",
  marginTop: 2,
};

const infoLabel = {
  color: "#94a3b8",
  fontSize: 10,
};

const infoValue = {
  marginTop: 2,
  color: "#334155",
  fontSize: 12,
  fontWeight: 500,
  wordBreak: "break-all", // <- 2. Força a quebra do e-mail em qualquer letra se não couber
};

const acoesPerfil = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
};

const acaoButton = {
  minHeight: 40,
  border: "none",
  borderRadius: 8,
  background: "#e2e8f0",
  color: "#334155",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontSize: 12,
  cursor: "pointer",
};

const estatisticasCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "14px 20px",
  marginBottom: 18,
};

const estatisticasGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 20,
};

const estatisticaItem = {
  textAlign: "center",
  padding: "8px",
};

const estatisticaValor = {
  color: "#4470af",
  fontSize: 22,
  fontWeight: 800,
};

const estatisticaLabel = {
  marginTop: 3,
  color: "#334155",
  fontSize: 14,
};

const badgesCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "14px 18px 20px",
  marginBottom: 18,
};

const secaoCabecalho = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 15,
  marginBottom: 14,
};

const verTodosButton = {
  minHeight: 34,
  border: "1px solid #dbe3ef",
  borderRadius: 8,
  background: "white",
  color: "#334155",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "6px 12px",
  fontSize: 11,
  cursor: "pointer",
};

const badgesGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 28,
};

const badgeCard = {
  minHeight: 130,
  border: "1px solid #dbe3ef",
  borderRadius: 9,
  background: "white",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px",
  textAlign: "center",
};

const badgeImagemCircle = {
  width: 62,
  height: 62,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const imagemBadge = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
};

const badgeCardNome = {
  marginTop: 8,
  color: "#111827",
  fontSize: 11,
  fontWeight: 500,
};

const badgeCardData = {
  width: "100%",
  marginTop: 8,
  paddingTop: 6,
  borderTop: "1px solid #e5e7eb",
  color: "#64748b",
  fontSize: 9,
};

const processoCard = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "14px 18px 18px",
};

const processoConteudo = {
  display: "grid",
  gridTemplateColumns: "52px minmax(0, 1fr) 170px",
  alignItems: "center",
  gap: 14,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 9,
  padding: "13px 15px",
};

const processoImagem = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  background: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const processoInfo = {
  minWidth: 0,
};

const processoNome = {
  color: "#2563eb",
  fontSize: 13,
  fontWeight: 500,
};

const processoDescricao = {
  marginTop: 3,
  color: "#64748b",
  fontSize: 10,
};

const processoArea = {
  display: "inline-flex",
  marginTop: 5,
  background: "#dbeafe",
  color: "#2563eb",
  padding: "3px 7px",
  fontSize: 9,
};

const detalhesButton = {
  minHeight: 39,
  border: "none",
  borderRadius: 8,
  background: "#e2e8f0",
  color: "#334155",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  fontSize: 12,
  cursor: "pointer",
};

const semDados = {
  border: "1px dashed #cbd5e1",
  borderRadius: 9,
  padding: 25,
  textAlign: "center",
  color: "#64748b",
  fontSize: 12,
};

const erroBox = {
  background: "#fee2e2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: 12,
  color: "#991b1b",
  marginBottom: 18,
  fontSize: 13,
};

const mensagemBox = {
  width: "100%",
  boxSizing: "border-box",
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 40,
  textAlign: "center",
  color: "#64748b",
};

export default InformacaoConsultorTm;
