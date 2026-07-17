import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form } from "react-bootstrap"; 
import { 
  BiUserCircle, BiBadge, BiBriefcase, BiBookOpen, 
  BiTimeFive, BiUser, BiMedal, BiEnvelope, BiAward
} from "react-icons/bi";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell,
  LineChart, Line
} from "recharts"; 

// Componentes Globais
import Header from "../../components/Header.jsx"; //!!NÃO TROQUES O HEADER POIS ESTE TEM RESPONSIVIDADE (E EM NENHUMA OUTRA PÁGINA TM)!!
import TmLeftSidebar from "../../components/TM_LeftBar.jsx";
import TmRightSidebar from "../../components/tm_right_sidebar.jsx";

// Chamadas de API externa
import api, { buildUploadUrl } from "../../services/api";

function obterUtilizadorGuardado() {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser);
  } catch (err) {
    console.error("Erro ao ler utilizador:", err);
    return null;
  }
}

const obterSaudacao = () => {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 20) return "Boa tarde";
  return "Boa noite";
};

function obterFotoPerfilSrc(user) {
  const foto =
    user?.foto_perfil ||
    user?.FOTO_PERFIL ||
    user?.foto ||
    user?.imagem ||
    null;

  if (!foto) {
    return null;
  }

  return buildUploadUrl(foto);
}

function WelcomeProfilePhoto({ user, size = 72 }) {
  const [erroImagem, setErroImagem] = useState(false);

  const fotoSrc = obterFotoPerfilSrc(user);

  if (!fotoSrc || erroImagem) {
    return (
      <div
        style={{
          ...welcomePhotoWrapper,
          width: size,
          height: size,
        }}
      >
        <BiUserCircle
          size={Math.round(size * 0.72)}
          color="rgba(255,255,255,0.85)"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...welcomePhotoWrapper,
        width: size,
        height: size,
      }}
    >
      <img
        src={fotoSrc}
        alt="Foto de perfil"
        style={welcomePhotoImage}
        onError={() => setErroImagem(true)}
      />
    </div>
  );
}

function DashboardTMUnificado() {
  const navigate = useNavigate();
  const location = useLocation();

  // Estados de Controle e Erro
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [erro, setErro] = useState("");
  
  // Filtro de Visão (Área vs Service Line) para o Gráfico
  const [visao, setVisao] = useState("area"); 

  // Novos Estados para os Filtros Dinâmicos do Ranking
  const [areaSelecionada, setAreaSelecionada] = useState("");
  const [slSelecionada, setSlSelecionada] = useState("");
  const [areaGraficoSelecionada, setAreaGraficoSelecionada] = useState("");
  const [learningPathSelecionada, setLearningPathSelecionada] = useState("");

  // Estados dos Dados
  const [resumo, setResumo] = useState({});
  const [consultores, setConsultores] = useState([]);
  const [consultoresPorArea, setConsultoresPorArea] = useState([]);
  const [badgesPorDatas, setBadgesPorDatas] = useState([]);
  const [badgesPorLearningPath, setBadgesPorLearningPath] = useState([]);
  const [tmUser, setTmUser] = useState(null);

  // Extração inteligente de Áreas e Service Lines únicas (baseado nos dados vindos do gráfico)
  const opcoesFiltros = useMemo(() => {
    const areasMap = new Map();
    const slMap = new Map();

    consultoresPorArea.forEach(item => {
      if (item.id_areas && item.nome_area) {
        areasMap.set(item.id_areas, item.nome_area);
      }
      if (item.id_serviceline && item.nome_serviceline) {
        slMap.set(item.id_serviceline, item.nome_serviceline);
      }
    });

    return {
      areas: Array.from(areasMap.entries()).map(([id, nome]) => ({ id, nome })),
      serviceLines: Array.from(slMap.entries()).map(([id, nome]) => ({ id, nome }))
    };
  }, [consultoresPorArea]);

  // Configuração dinâmica baseada no tipo de dados recebido do backend
  const obterConfiguracaoDashboard = (dados = {}) => {
  const totalConsultores = Number(dados.total_consultores || 0);
  const totalSllAtivos = Number(dados.total_sll_ativos || 0);

  return {
    descricaoConsultores: `${totalConsultores} Consultores Ativos`,
    descricaoBadges: `${Number(dados.badges_atribuidos_mes || 0)} atribuídos este mês`,
    descricaoSll: `${totalSllAtivos} Service Lines Ativas`,
    tituloLista: "Ranking de Consultores",
    descricaoLista: `Total de ${Number(dados.total_consultores_acompanhados || 0)} consultores`,
    graficoTitulo: "Distribuição de Consultores por Área / Service Line",

    cards: [
      {
        tipo: "CONSULTORES",
        valor: totalConsultores,
        label: "Total Consultores",
      },
      {
        tipo: "BADGES",
        valor: Number(dados.total_badges || 0),
        label: "Total Badges Atribuídos",
      },
    ],
  };
};

  const configuracao = obterConfiguracaoDashboard( resumo);

  const opcoesLearningPath = useMemo(
    () =>
      badgesPorLearningPath.map((item) => ({
        id: item.id_learningpaths,
        nome: item.nome_learningpaths,
      })),
    [badgesPorLearningPath]
  );

  // Carregamento Inicial do Dashboard (Resumo e Dados Gráfico)
  async function carregarDashboard() {
    const user = obterUtilizadorGuardado();
    setTmUser(user);
    const userId = user?.id_utilizador || user?.ID_UTILIZADOR || user?.id;

    if (!userId) {
      setErro("Não foi possível identificar o Talent Manager.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      const resultados = await Promise.allSettled([
        api.get(`/dashboard/tm/${userId}/resumo`),
        api.get(`/dashboard/tm/${userId}/consultores-por-area`),
        api.get(`/dashboard/tm/${userId}/badges-por-learningpath`),
      ]);

      // Processamento do Resumo
      const resumoResultado = resultados[0];
      if (resumoResultado.status === "rejected") throw resumoResultado.reason;
      
      const dadosResumo = resumoResultado.value.data || {};
      setResumo({
        nome_completo: dadosResumo.nome_completo || user?.nome_completo || user?.nome || "Talent Manager",
        total_consultores_acompanhados: Number(dadosResumo.total_consultores_acompanhados || 0),
        total_consultores: Number(dadosResumo.total_consultores || 0),
        total_badges: Number(dadosResumo.total_badges || 0),
        consultores_com_badges: Number(dadosResumo.consultores_com_badges || 0),
        badges_atribuidos_mes: Number(dadosResumo.badges_atribuidos_mes || 0),
        badges_expirados: Number(dadosResumo.badges_expirados || 0),
        novos_consultores_mes: Number(dadosResumo.novos_consultores_mes || 0),
        candidaturas_ativas: Number(dadosResumo.candidaturas_ativas || 0),
        candidaturas_por_ver: Number(dadosResumo.candidaturas_por_ver || 0),
        renovacoes_ativas: Number(dadosResumo.renovacoes_ativas || 0),
        total_sll_ativos: Number(dadosResumo.total_sll_ativos || 0),
        badges_por_datas: Number(dadosResumo.badges_por_datas || 0),
        badges_por_learning_paths: Number(dadosResumo.badges_por_learning_paths || 0),
        badges_por_niveis: Number(dadosResumo.badges_por_niveis || 0),
      });

      // Processamento do Gráfico
      const graficoResultado = resultados[1];
      if (graficoResultado.status === "fulfilled") {
        setConsultoresPorArea(Array.isArray(graficoResultado.value.data) ? graficoResultado.value.data : []);
      } else {
        console.error("Erro ao carregar dados do gráfico:", graficoResultado.reason);
        setConsultoresPorArea([]);
      }

      const badgesLpResultado = resultados[2];
      if (badgesLpResultado.status === "fulfilled") {
        setBadgesPorLearningPath(Array.isArray(badgesLpResultado.value.data) ? badgesLpResultado.value.data : []);
      } else {
        console.error("Erro ao carregar badges por Learning Path:", badgesLpResultado.reason);
        setBadgesPorLearningPath([]);
      }

    } catch (err) {
      console.error("Erro geral no dashboard:", err);
      setErro(err.response?.data?.error || "Não foi possível carregar o dashboard do Talent Manager.");
    } finally {
      setIsLoading(false);
    }
  }

  // Carregamento Isolado do Ranking Dependente dos Filtros Dropdown
  async function carregarRankingConsultores() {
    const user = obterUtilizadorGuardado();
    const userId = user?.id_utilizador || user?.ID_UTILIZADOR || user?.id;
    if (!userId) return;

    try {
      setIsLoadingRanking(true);
      // Passagem dos parâmetros selecionados para a rota de destaque do back
      const resposta = await api.get(`/dashboard/tm/${userId}/consultores-destaque`, {
        params: {
          idArea: areaSelecionada || undefined,
          idServiceline: slSelecionada || undefined
        }
      });
      setConsultores(Array.isArray(resposta.data) ? resposta.data : []);
    } catch (err) {
      console.error("Erro ao carregar ranking filtrado:", err);
      setConsultores([]);
    } finally {
      setIsLoadingRanking(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function carregarBadgesPorDatas() {
    const user = obterUtilizadorGuardado();
    const userId = user?.id_utilizador || user?.ID_UTILIZADOR || user?.id;

    if (!userId) {
      return;
    }

    try {
      const resposta = await api.get(
        `/dashboard/tm/${userId}/badges-por-datas`,
        {
          params: {
            idArea:
              areaGraficoSelecionada ||
              undefined,
            idLearningPath:
              learningPathSelecionada ||
              undefined,
          },
        }
      );

      setBadgesPorDatas(
        Array.isArray(resposta.data)
          ? resposta.data
          : []
      );
    } catch (err) {
      console.error(
        "Erro ao carregar badges por datas:",
        err
      );
      setBadgesPorDatas([]);
    }
  }

  // Monitoriza alterações nos filtros para disparar novas requisições do Ranking
  useEffect(() => {
    if (!isLoading) {
      carregarRankingConsultores();
    }
  }, [areaSelecionada, slSelecionada, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      carregarBadgesPorDatas();
    }
  }, [areaGraficoSelecionada, learningPathSelecionada, isLoading]);

  function abrirPerfil(consultor) {
    const idConsultor = consultor.id_utilizador || consultor.ID_UTILIZADOR || consultor.id;
    if (!idConsultor) return;

    navigate(`/tm/consultores/${idConsultor}`, {
      state: { voltarPara: location.pathname, textoVoltar: "Voltar ao dashboard" },
    });
  }

  const obterChaveEixoX = () => (visao === "area" ? "nome_area_curto" : "nome_serviceline");

  return (
    <div style={page}>
      <Header />

      <div
        className="tm-layout-body"
        style={body}
      >
        <TmLeftSidebar />

        <main
          className="tm-dashboard-main"
          style={main}
        >
          {erro && <div style={errorBox}>{erro}</div>}

          {isLoading ? (
            <div style={loadingBox}>A carregar dashboard...</div>
          ) : (
            <>
              {/* Cartão de Boas-Vindas */}
              <section
                className="tm-welcome-card"
                style={welcomeCard}
              >
                <div>
                  <h2 style={welcomeTitle}>{obterSaudacao()}, {resumo.nome_completo}!</h2>
                  <div
                    className="tm-welcome-stats"
                    style={welcomeStats}
                  >
                    <WelcomeItem icon={<BiUser size={20} />} label="Consultores" value={configuracao.descricaoConsultores} />
                    <WelcomeItem icon={<BiBadge size={20} />} label="Badges" value={configuracao.descricaoBadges} />
                    <WelcomeItem icon={<BiBriefcase size={20} />} label="Service Lines" value={configuracao.descricaoSll} />
                  </div>
                </div>
                <WelcomeProfilePhoto user={tmUser} size={68} />
              </section>

              {/* Grid de Métricas Expandido e Dinâmico */}
              <div
                className="tm-stats-grid"
                style={statsRow}
              >
                {configuracao.cards.map((card) => (
                  <StatCard
                    key={card.tipo}
                    icon={
                      card.tipo === "EXPIRADOS" || card.tipo === "CANDIDATURAS" || card.tipo === "RENOVACOES" || card.tipo === "METRICA_DATAS"
                        ? <BiTimeFive size={42} />
                        : card.tipo === "CONSULTORES" || card.tipo === "NOVOS"
                        ? <BiUser size={42} />
                        : card.tipo === "METRICA_PATHS"
                        ? <BiBookOpen size={42} />
                        : card.tipo === "METRICA_NIVEIS"
                        ? <BiTrendingUp size={42} />
                        : <BiMedal size={42} />
                    }
                    value={card.valor}
                    label={card.label}
                    secondary={card.tipo === "CANDIDATURAS" ? "Pendentes de avaliação" : null}
                    secondaryColor="#dc2626"
                  />
                ))}
              </div>

              {/* Secção: Ranking de Consultores com Dropdowns de Filtro */}
              <section
                className="tm-consultores-section"
                style={consultoresSection}
              >
                <div
                  className="tm-people-header"
                  style={peopleHeader}
                >
                  <div>
                    <h3 style={areaTitle}>{configuracao.tituloLista}</h3>
                    <div style={areaTotal}>{configuracao.descricaoLista}</div>
                  </div>

                  {/* Wrapper para agrupar os dois dropdowns lado a lado */}
                  <div
                    className="tm-ranking-filters"
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <Form.Select
                      className="tm-filter-select"
                      value={areaSelecionada}
                      onChange={(e) =>
                        setAreaSelecionada(
                          e.target.value
                        )
                      }
                      style={{
                        width: 160,
                        fontSize: 12,
                      }}
                    >
                      <option value="">Todas as Áreas</option>
                      {opcoesFiltros.areas.map(area => (
                        <option key={area.id} value={area.id}>{area.name || area.nome}</option>
                      ))}
                    </Form.Select>

                    <Form.Select
                      className="tm-filter-select"
                      value={slSelecionada}
                      onChange={(e) =>
                        setSlSelecionada(
                          e.target.value
                        )
                      }
                      style={{
                        width: 160,
                        fontSize: 12,
                      }}
                    >
                      <option value="">Todas as SL</option>
                      {opcoesFiltros.serviceLines.map(sl => (
                        <option key={sl.id} value={sl.id}>{sl.name || sl.nome}</option>
                      ))}
                    </Form.Select>

                    <button
                      className="tm-view-all-button"
                      type="button"
                      onClick={() =>
                        navigate(
                          "/tm/consultores"
                        )
                      }
                      style={viewAllButton}
                    >
                      <BiBookOpen size={15} />
                      Ver Todos
                    </button>
                  </div>
                </div>

                {isLoadingRanking ? (
                  <div style={{ ...emptyBox, padding: "40px" }}>A atualizar ranking...</div>
                ) : consultores.length > 0 ? (
                  consultores.slice(0, 3).map((consultor, index) => (
                    <ConsultorCard
                      key={consultor.id_utilizador || index}
                      consultor={consultor}
                      onVerPerfil={() => abrirPerfil(consultor)}
                    />
                  ))
                ) : (
                  <div style={emptyBox}>
                    Não foram encontrados consultores com os filtros selecionados.
                  </div>
                )}
              </section>

              {/* Secção do Gráfico */}
              <section
                className="tm-chart-panel"
                style={chartCard}
              >
                <div
                  className="tm-chart-header"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <h3 style={{ ...chartTitle, margin: 0 }}>{configuracao.graficoTitulo}</h3>
                  
                  <Form.Select 
                    className="tm-chart-select"
                    value={visao} 
                    onChange={(e) => setVisao(e.target.value)} 
                    style={{ width: "180px", fontSize: "12px" }}
                  >
                    <option value="area">Por Área</option>
                    <option value="serviceline">Por Service Line</option>
                  </Form.Select>
                </div>

                {consultoresPorArea.length > 0 ? (
                  <div
                    className="tm-chart-layout"
                    style={chartLayout}
                  >
                    <div
                      className="tm-chart-box"
                      style={chartArea}
                    >
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                        minWidth={1}
                        debounce={50}
                      >
                        <BarChart data={consultoresPorArea} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey={obterChaveEixoX()} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: "#9ca3af" }} 
                          />
                          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                          <Tooltip content={<AreaTooltip visao={visao} />} />
                          <Bar dataKey="total_consultores" radius={[8, 8, 0, 0]} maxBarSize={32} isAnimationActive={false}>
                            {consultoresPorArea.map((item, index) => (
                              <Cell key={item.id_areas || index} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div
                      className="tm-chart-legend"
                      style={chartLegend}
                    >
                      {consultoresPorArea.map((area, index) => (
                        <div key={area.id_areas || index} style={legendRow}>
                          <span style={{ ...legendDot, background: CORES_GRAFICO[index % CORES_GRAFICO.length] }} />
                          <span style={legendLabel}>
                            {visao === "area" && area.nome_serviceline ? `${area.nome_serviceline} - ` : ""}
                            {visao === "area" ? area.nome_area : area.nome_serviceline || "Sem Service Line"}
                          </span>
                          <strong style={legendValue}>{Number(area.total_consultores || 0)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={emptyChart}>Sem dados disponíveis para o gráfico.</div>
                )}
              </section>

              <section style={analyticsGrid}>
                <div style={metricChartCardWide}>
                  <div style={metricChartHeader}>
                    <div>
                      <h3 style={metricChartTitle}>Badges por Datas</h3>
                      <div style={metricChartSubtitle}>Comparação entre este ano e o ano passado</div>
                    </div>

                    <div style={metricChartFilters}>
                      <Form.Select
                        value={areaGraficoSelecionada}
                        onChange={(e) =>
                          setAreaGraficoSelecionada(
                            e.target.value
                          )
                        }
                        style={metricChartSelect}
                      >
                        <option value="">Todas as Áreas</option>
                        {opcoesFiltros.areas.map((area) => (
                          <option key={area.id} value={area.id}>{area.nome}</option>
                        ))}
                      </Form.Select>

                      <Form.Select
                        value={learningPathSelecionada}
                        onChange={(e) =>
                          setLearningPathSelecionada(
                            e.target.value
                          )
                        }
                        style={metricChartSelect}
                      >
                        <option value="">Todos os Learning Paths</option>
                        {opcoesLearningPath.map((learningPath) => (
                          <option key={learningPath.id} value={learningPath.id}>{learningPath.nome}</option>
                        ))}
                      </Form.Select>
                    </div>
                  </div>

                  {badgesPorDatas.length > 0 ? (
                    <div style={metricChartBody}>
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} debounce={50}>
                        <LineChart data={badgesPorDatas} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip content={<MetricDateTooltip />} />
                          <Line type="monotone" dataKey="badges_este_ano" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
                          <Line type="monotone" dataKey="badges_ano_passado" stroke="#94a3b8" strokeWidth={2} dot={false} strokeDasharray="4 2" isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={emptyChart}>Sem dados disponíveis para o gráfico.</div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>

        <TmRightSidebar/>
      </div>
    </div>
  );
}

/* =========================================================
    SUB-COMPONENTES AUXILIARES
========================================================= */

function WelcomeItem({ icon, label, value }) {
  return (
    <div style={welcomeItem}>
      <div style={welcomeItemIcon}>{icon}</div>
      <div>
        <div style={welcomeItemLabel}>{label}</div>
        <div style={welcomeItemValue}>{value}</div>
      </div>
    </div>
  );
}

function obterFotoConsultorSrc(consultor) {
  const foto =
    consultor?.foto_perfil ||
    consultor?.FOTO_PERFIL ||
    consultor?.foto ||
    consultor?.imagem ||
    null;

  if (!foto) return null;

  return buildUploadUrl(foto);
}

function ConsultorAvatar({ consultor }) {
  const [erroImagem, setErroImagem] = useState(false);

  const nome =
    consultor.nome_completo ||
    consultor.nome ||
    "Consultor";

  const fotoSrc = obterFotoConsultorSrc(consultor);

  if (!fotoSrc || erroImagem) {
    return (
      <div style={consultorAvatar}>
        <BiUserCircle
          size={42}
          color="#6092bf"
        />
      </div>
    );
  }

  return (
    <div style={consultorAvatar}>
      <img
        src={fotoSrc}
        alt={nome}
        style={consultorAvatarImg}
        onError={() => setErroImagem(true)}
      />
    </div>
  );
}

function ConsultorCard({ consultor, onVerPerfil }) {
  const nome = consultor.nome_completo || consultor.nome || "Consultor";
  const email = consultor.email || consultor.email_softinsa || "Sem email";
  const area = consultor.nome_area || "Sem área";
  const totalBadges = Number(consultor.total_badges || 0);

  return (
    <article
      className="tm-consultor-card"
      style={consultorCard}
    >
      <div
        className="tm-consultor-main"
        style={consultorMain}
      >
        <ConsultorAvatar consultor={consultor} />
        <div style={consultorInfo}>
          <div style={consultorTopLine}>
            <span style={consultorName}>{nome}</span>
            <span style={consultorEmail}><BiEnvelope size={14} />{email}</span>
          </div>
          <div style={consultorArea}>{area}</div>
        </div>
      </div>
      <div
        className="tm-consultor-footer"
        style={consultorFooter}
      >
        <div style={badgeCount}>
          <BiAward size={15} /> {totalBadges} {totalBadges === 1 ? "badge" : "badges"}
        </div>
        <button type="button" onClick={onVerPerfil} style={profileLink}>Ver perfil</button>
      </div>
    </article>
  );
}

// Restante dos estilos e sub-componentes inalterados para manter performance e design original
function StatCard({ icon, value, label, secondary, secondaryColor }) {
  return (
    <div
      className="tm-stat-card"
      style={statCard}
    >
      <div style={statIcon}>{icon}</div>
      <div style={statContent}>
        <div style={statValue}>{value}</div>
        <div style={statLabel}>{label}</div>
        {secondary && (
          <div style={{ ...statSecondary, color: secondaryColor || "#64748b" }}>{secondary}</div>
        )}
      </div>
    </div>
  );
}

function AreaTooltip({ active, payload, visao }) {
  if (!active || !payload?.length) return null;
  const area = payload[0].payload;
  const titulo = visao === "area" ? area.nome_area : area.nome_serviceline;

  return (
    <div style={tooltipBox}>
      <div style={tooltipTitle}>{titulo}</div>
      <div style={tooltipText}>{Number(area.total_consultores || 0)} consultores</div>
    </div>
  );
}

function MetricDateTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div style={tooltipBox}>
      <div style={tooltipTitle}>{label}</div>
      <div style={tooltipText}>Este ano: {Number(payload[0]?.value || 0)} badges</div>
      <div style={tooltipText}>Ano passado: {Number(payload[1]?.value || 0)} badges</div>
    </div>
  );
}

const CORES_GRAFICO = ["#9bb8e8", "#64d8cc", "#111111", "#f59e0b", "#8b5cf6"];
const page = { background: "#f3f4f6", minHeight: "100vh", display: "flex", flexDirection: "column" };
const body = {
  display: "flex",
  flex: 1,

  minWidth: 0,

  alignItems: "stretch",

  background: "white",
};
const main = {
  flex: 1,

  width: "100%",
  maxWidth: "100%",
  minWidth: 0,

  padding:
    "22px 30px 50px",

  overflowY: "auto",
  overflowX: "hidden",

  background: "#f3f4f6",
};
const welcomeCard = { background: "#1269ed", color: "white", borderRadius: 13, padding: "22px 36px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 8px 18px rgba(37, 99, 235, 0.22)", marginBottom: 18 };
const welcomeTitle = { fontSize: 18, fontWeight: 500, margin: "0 0 18px" };
const welcomeStats = { display: "flex", gap: 34, flexWrap: "wrap", alignItems: "center" };
const welcomeItem = { display: "flex", alignItems: "center", gap: 8 };
const welcomeItemIcon = { width: 34, height: 34, borderRadius: 7, background: "rgba(255,255,255,0.17)", display: "flex", alignItems: "center", justifyContent: "center" };
const welcomeItemLabel = { fontSize: 10, color: "rgba(255,255,255,0.78)" };
const welcomeItemValue = { fontSize: 12, fontWeight: 500 };
const welcomeAvatar = { width: 68, height: 68, borderRadius: "50%", background: "rgba(255,255,255,0.17)", display: "flex", alignItems: "center", justifyContent: "center" };
const statsRow = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginBottom: 22 };
const consultoresSection = { width: "100%", minWidth: 0, marginBottom: 18 };
const peopleHeader = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: "10px" };
const areaTitle = { fontSize: 17, fontWeight: 800, color: "#111827", margin: 0 };
const areaTotal = { fontSize: 12, color: "#111827", marginTop: 4 };
const viewAllButton = { display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid #d1d5db", borderRadius: 8, background: "white", color: "#111827", padding: "7px 13px", fontSize: 12, cursor: "pointer" };
const consultorCard = { width: "100%", background: "white", border: "1px solid #bfdbfe", borderRadius: 12, marginBottom: 14, overflow: "hidden", boxSizing: "border-box" };
const consultorMain = { display: "flex", alignItems: "center", gap: 14, padding: "16px 18px" };
const consultorAvatar = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  overflow: "hidden",
  border: "1px solid #dbeafe",
};
const consultorAvatarImg = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};
const consultorInfo = { flex: 1, minWidth: 0 };
const consultorTopLine = { display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" };
const consultorName = { fontSize: 14, color: "#111827", fontWeight: 500 };
const consultorEmail = { display: "inline-flex", alignItems: "center", gap: 5, color: "#64748b", fontSize: 11 };
const consultorFooter = { borderTop: "1px solid #e5e7eb", padding: "9px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" };
const badgeCount = { display: "inline-flex", alignItems: "center", gap: 5, color: "#475569", fontSize: 11 };
const profileLink = { border: "none", background: "none", padding: 0, color: "#2563eb", textDecoration: "underline", fontSize: 11, cursor: "pointer" };
const statCard = { minHeight: 104, background: "white", border: "1px solid #bfdbfe", borderRadius: 14, display: "flex", alignItems: "center", gap: 18, padding: "18px 22px", boxShadow: "0 2px 5px rgba(15,23,42,0.06)" };
const statIcon = { width: 58, height: 58, borderRadius: "50%", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", color: "#111827", flexShrink: 0 };
const statValue = { fontSize: 18, fontWeight: 800, color: "#111827" };
const statLabel = { marginTop: 3, fontSize: 13, color: "#111827", lineHeight: 1.3 };
const statSecondary = { marginTop: 4, fontSize: 12 };
const statContent = { flex: 1, minWidth: 0 };
const chartCard = { background: "white", borderRadius: 14, padding: "20px", marginTop: 18, minHeight: 290 };
const chartTitle = { margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#111827" };
const analyticsGrid = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 18,
  marginTop: 18,
};
const metricChartCard = {
  background: "white",
  borderRadius: 14,
  padding: "18px 18px 14px",
  border: "1px solid #e5e7eb",
  minHeight: 320,
  display: "flex",
  flexDirection: "column",
};
const metricChartCardWide = {
  ...metricChartCard,
  minHeight: 360,
};
const metricChartHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 14,
  marginBottom: 12,
};
const metricChartTitle = {
  margin: 0,
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
};
const metricChartSubtitle = {
  marginTop: 4,
  fontSize: 12,
  color: "#64748b",
};
const metricChartBody = {
  flex: 1,
  minHeight: 240,
};
const metricChartFilters = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};
const metricChartSelect = {
  width: 190,
  fontSize: 12,
};
const chartLayout = {
  display: "grid",

  gridTemplateColumns:
    "minmax(0, 1fr) minmax(220px, 340px)",

  gap: 28,

  alignItems: "center",

  minWidth: 0,
};

const chartArea = {
  position: "relative",

  width: "100%",
  minWidth: 1,

  height: 245,
};
const chartLegend = { display: "flex", flexDirection: "column", gap: 11 };
const legendRow = { display: "grid", gridTemplateColumns: "8px minmax(0, 1fr) auto", alignItems: "center", gap: 7 };
const legendDot = { width: 6, height: 6, borderRadius: "50%" };
const legendLabel = { fontSize: 10, color: "#111827" };
const legendValue = { fontSize: 10, color: "#111827" };
const tooltipBox = { background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", boxShadow: "0 5px 15px rgba(15,23,42,0.12)" };
const tooltipTitle = { fontSize: 12, fontWeight: 700, color: "#111827" };
const tooltipText = { marginTop: 3, fontSize: 11, color: "#64748b" };
const loadingBox = { background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 40, color: "#6b7280", textAlign: "center" };
const errorBox = { background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 12px", color: "#991b1b", fontSize: 13, marginBottom: 16 };
const emptyBox = { background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: 26, textAlign: "center", color: "#9ca3af", fontSize: 12 };
const emptyChart = { height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 };
const consultorArea = { color: "#111827", fontSize: 10, marginTop: 3 };
const welcomePhotoWrapper = {
  borderRadius: "50%",
  background: "rgba(255,255,255,0.17)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  border: "3px solid rgba(255,255,255,0.45)",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.18)",
  flexShrink: 0,
};

const welcomePhotoImage = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

export default DashboardTMUnificado;