import {
  useEffect,
  useState,
} from "react";

import {
  Card,
  Spinner,
} from "react-bootstrap";

import {
  BiBadge,
  BiBookOpen,
  BiGrid,
  BiLayer,
  BiMedal,
  BiShield,
  BiStar,
  BiUser,
  BiUserCircle,
  BiBriefcase,
  BiEnvelope,
  BiPhone,
  BiTimeFive,
  BiCheckCircle,
  BiCog,
} from "react-icons/bi";

import {
  useNavigate,
} from "react-router-dom";

import Header from "../../components/Header.jsx";
import AdminLeftSidebar from "../../components/admin_left_sidebar.jsx";
import AdminRightSidebar from "../../components/admin_right_sidebar.jsx";

import api, {
  buildUploadUrl,
} from "../../services/api.js";

function obterUtilizadorGuardado() {
  const guardado = localStorage.getItem("user");

  if (!guardado) {
    return null;
  }

  try {
    return JSON.parse(guardado);
  } catch {
    return null;
  }
}

function PerfilAdminPage() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);

  const [resumo, setResumo] = useState({
    total_consultores: 0,
    total_sll: 0,
    total_tm: 0,
    total_badges: 0,
    total_badges_atribuidos: 0,
  });

  const [atividade, setAtividade] = useState({
    ativos: 0,
    inativos: 0,
    total: 0,
    percentagem_ativos: 0,
    percentagem_inativos: 0,
  });

  const [areas, setAreas] = useState([]);
  const [topUtilizadores, setTopUtilizadores] = useState([]);
  const [badgesPorLearningPath, setBadgesPorLearningPath] = useState([]);
  const [badgesPorNivelLearningPath, setBadgesPorNivelLearningPath] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPerfilAdmin();
  }, []);

  async function carregarPerfilAdmin() {
    const userData = obterUtilizadorGuardado();

    if (!userData) {
      navigate("/login", { replace: true });
      return;
    }

    const userId =
      userData.id_utilizador ||
      userData.ID_UTILIZADOR ||
      userData.id;

    if (!userId) {
      localStorage.clear();
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);

      const [
        adminRes,
        resumoRes,
        atividadeRes,
        areasRes,
        topRes,
        badgesLpRes,
        badgesNivelRes,
      ] = await Promise.allSettled([
        api.get(`/utilizadores/${userId}/admin`),
        api.get("/dashboard/admin/resumo-principal"),
        api.get("/dashboard/admin/atividade-consultores"),
        api.get("/dashboard/admin/consultores-por-area"),
        api.get("/dashboard/admin/top-utilizadores"),
        api.get("/dashboard/admin/badges-por-learningpath"),
        api.get("/dashboard/admin/badges-por-nivel-learningpath"),
      ]);

      if (adminRes.status === "fulfilled") {
        const dadosAdmin = {
          ...userData,
          ...adminRes.value.data,
          tipo_utilizador: "Administrador",
        };

        setAdmin(dadosAdmin);

        localStorage.setItem(
          "user",
          JSON.stringify(dadosAdmin)
        );
      } else {
        setAdmin({
          ...userData,
          tipo_utilizador: "Administrador",
        });

        console.error(
          "Erro ao carregar dados do admin:",
          adminRes.reason
        );
      }

      if (resumoRes.status === "fulfilled") {
        setResumo({
          total_consultores: Number(resumoRes.value.data.total_consultores || 0),
          total_sll: Number(resumoRes.value.data.total_sll || 0),
          total_tm: Number(resumoRes.value.data.total_tm || 0),
          total_badges: Number(resumoRes.value.data.total_badges || 0),
          total_badges_atribuidos: Number(resumoRes.value.data.total_badges_atribuidos || 0),
        });
      }

      if (atividadeRes.status === "fulfilled") {
        setAtividade({
          ativos: Number(atividadeRes.value.data.ativos || 0),
          inativos: Number(atividadeRes.value.data.inativos || 0),
          total: Number(atividadeRes.value.data.total || 0),
          percentagem_ativos: Number(atividadeRes.value.data.percentagem_ativos || 0),
          percentagem_inativos: Number(atividadeRes.value.data.percentagem_inativos || 0),
        });
      }

      if (areasRes.status === "fulfilled") {
        setAreas(
          Array.isArray(areasRes.value.data)
            ? areasRes.value.data
            : []
        );
      }

      if (topRes.status === "fulfilled") {
        setTopUtilizadores(
          Array.isArray(topRes.value.data)
            ? topRes.value.data
            : []
        );
      }

      if (badgesLpRes.status === "fulfilled") {
        setBadgesPorLearningPath(
          Array.isArray(badgesLpRes.value.data)
            ? badgesLpRes.value.data
            : []
        );
      }

      if (badgesNivelRes.status === "fulfilled") {
        setBadgesPorNivelLearningPath(
          Array.isArray(badgesNivelRes.value.data)
            ? badgesNivelRes.value.data
            : []
        );
      }
    } catch (err) {
      console.error("Erro ao carregar perfil admin:", err);
    } finally {
      setLoading(false);
    }
  }

  const totalLearningPaths =
    badgesPorLearningPath.length;

  const totalAreas =
    areas.length;

  const totalBadgesPorNivel =
    badgesPorNivelLearningPath.reduce(
      (acc, item) =>
        acc + Number(item.total_badges || 0),
      0
    );

  if (loading) {
    return (
      <div style={pagina}>
        <Header />

        <div style={corpo}>
          <AdminLeftSidebar />

          <main style={mainStyle}>
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ minHeight: 300 }}
            >
              <Spinner animation="border" variant="primary" />
            </div>
          </main>

          <AdminRightSidebar />
        </div>
      </div>
    );
  }

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <AdminLeftSidebar />

        <main style={mainStyle}>
          <Card
            className="border-0 mb-3"
            style={welcomeCard}
          >
            <Card.Body
              className="
                p-4
                d-flex
                justify-content-between
                align-items-center
                text-white
              "
            >
              <div>
                <h5 style={welcomeTitle}>
                  Olá,{" "}
                  {admin?.nome_completo ||
                    admin?.NOME_COMPLETO ||
                    "Administrador"}
                  !
                </h5>

                <div style={welcomeStats}>
                  <WelcomeStat
                    icon={<BiUserCircle size={23} />}
                    label="Consultores"
                    value={`${resumo.total_consultores} consultores`}
                  />

                  <WelcomeStat
                    icon={<BiUser size={23} />}
                    label="Talent Managers"
                    value={`${resumo.total_tm} T.M.`}
                  />

                  <WelcomeStat
                    icon={<BiUser size={23} />}
                    label="Service Line Leaders"
                    value={`${resumo.total_sll} S.L.L.`}
                  />

                  <WelcomeStat
                    icon={<BiMedal size={23} />}
                    label="Badges"
                    value={`${resumo.total_badges} badges`}
                  />
                </div>
              </div>

              <div style={avatarGrande}>
                {admin?.foto_perfil ? (
                  <img
                    src={buildUploadUrl(admin.foto_perfil)}
                    alt="Perfil"
                    style={avatarImg}
                  />
                ) : (
                  <BiUserCircle
                    size={58}
                    color="rgba(255,255,255,0.85)"
                  />
                )}
              </div>
            </Card.Body>
          </Card>

          <div style={acoesRapidas}>
            <button
              type="button"
              onClick={() => navigate("/admin/definicoes")}
              style={quickButton}
            >
              <BiCog size={18} />
              Definições
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/contas")}
              style={quickButton}
            >
              <BiUser size={18} />
              Gestão de Contas
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/badges")}
              style={quickButton}
            >
              <BiBadge size={18} />
              Gestão de Badges
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/learning-paths")}
              style={quickButton}
            >
              <BiBookOpen size={18} />
              Learning Paths
            </button>
          </div>

          <SectionTitle
            title="Resumo do Administrador"
            sub="Dados gerais da conta e permissões principais"
          />

          <div style={perfilGrid}>
            <InfoCard
              icon={<BiUserCircle size={26} />}
              title="Nome completo"
              value={admin?.nome_completo || "Administrador"}
            />

            <InfoCard
              icon={<BiEnvelope size={26} />}
              title="E-mail pessoal"
              value={admin?.email || "Sem e-mail"}
            />

            <InfoCard
              icon={<BiEnvelope size={26} />}
              title="E-mail Softinsa"
              value={admin?.email_softinsa || "Não definido"}
            />

            <InfoCard
              icon={<BiPhone size={26} />}
              title="Contacto"
              value={admin?.contacto || "Não definido"}
            />

            <InfoCard
              icon={<BiShield size={26} />}
              title="Estado da conta"
              value={admin?.estado_conta || "Não definido"}
            />

            <InfoCard
              icon={<BiCheckCircle size={26} />}
              title="E-mail verificado"
              value={admin?.email_verificado ? "Sim" : "Não"}
            />

            <InfoCard
              icon={<BiTimeFive size={26} />}
              title="Último login"
              value={formatarDataHora(admin?.ultimo_login)}
            />

            <InfoCard
              icon={<BiBriefcase size={26} />}
              title="Entidades geridas"
              value={admin?.entidades_geridas || "Não definido"}
            />
          </div>

          <SectionTitle
            title="Métricas Globais"
            sub="Indicadores principais existentes na dashboard do administrador"
          />

          <div style={metricasGrid}>
            <MetricCard
              icon={<BiUserCircle size={27} />}
              label="Consultores"
              value={resumo.total_consultores}
              detail={`${atividade.ativos} ativos • ${atividade.inativos} inativos`}
            />

            <MetricCard
              icon={<BiUser size={27} />}
              label="Talent Managers"
              value={resumo.total_tm}
              detail="Gestores de talento registados"
            />

            <MetricCard
              icon={<BiUser size={27} />}
              label="Service Line Leaders"
              value={resumo.total_sll}
              detail="Responsáveis por Service Lines"
            />

            <MetricCard
              icon={<BiMedal size={27} />}
              label="Badges criados"
              value={resumo.total_badges}
              detail="Modelos de badges existentes"
            />

            <MetricCard
              icon={<BiStar size={27} />}
              label="Badges atribuídos"
              value={resumo.total_badges_atribuidos}
              detail="Badges conquistados pelos consultores"
            />

            <MetricCard
              icon={<BiBookOpen size={27} />}
              label="Learning Paths"
              value={totalLearningPaths}
              detail="Learning Paths com dados de badges"
            />

            <MetricCard
              icon={<BiLayer size={27} />}
              label="Áreas"
              value={totalAreas}
              detail="Áreas registadas no dashboard"
            />

            <MetricCard
              icon={<BiBadge size={27} />}
              label="Badges por níveis"
              value={totalBadgesPorNivel}
              detail="Total agregado por níveis de Learning Path"
            />
          </div>

          <div style={duasColunas}>
            <SectionCard
              title="Top Utilizadores"
              sub="Ranking por pontos atuais"
            >
              {topUtilizadores.length > 0 ? (
                topUtilizadores.map((user, index) => (
                  <RankingRow
                    key={user.id_utilizador || index}
                    user={user}
                    index={index}
                  />
                ))
              ) : (
                <EmptyText text="Ainda não existem utilizadores com pontos." />
              )}
            </SectionCard>

            <SectionCard
              title="Atividade dos Consultores"
              sub="Estado atual dos consultores registados"
            >
              <ProgressItem
                label="Consultores ativos"
                value={atividade.ativos}
                percent={atividade.percentagem_ativos}
                color="#2563eb"
              />

              <ProgressItem
                label="Consultores inativos"
                value={atividade.inativos}
                percent={atividade.percentagem_inativos}
                color="#93c5fd"
              />

              <div style={totalAtividade}>
                Total analisado:{" "}
                <strong>{atividade.total}</strong>
              </div>
            </SectionCard>
          </div>

          <div style={duasColunas}>
            <SectionCard
              title="Badges por Learning Path"
              sub="Distribuição dos badges criados por percurso"
            >
              {badgesPorLearningPath.length > 0 ? (
                badgesPorLearningPath.slice(0, 6).map((item, index) => (
                  <SimpleRow
                    key={item.id_learningpaths || index}
                    label={item.nome_learningpaths}
                    value={`${item.total_badges} badges`}
                  />
                ))
              ) : (
                <EmptyText text="Sem dados de Learning Paths." />
              )}
            </SectionCard>

            <SectionCard
              title="Consultores por Área"
              sub="Distribuição por área registada"
            >
              {areas.length > 0 ? (
                areas.slice(0, 6).map((area, index) => (
                  <SimpleRow
                    key={area.id_areas || index}
                    label={area.area || area.nome_area}
                    value={`${area.total} consultores`}
                  />
                ))
              ) : (
                <EmptyText text="Sem dados por área." />
              )}
            </SectionCard>
          </div>
        </main>

        <AdminRightSidebar />
      </div>
    </div>
  );
}

function WelcomeStat({
  icon,
  label,
  value,
}) {
  return (
    <div style={welcomeStat}>
      {icon}

      <div style={{ textAlign: "left" }}>
        <div style={welcomeStatLabel}>
          {label}
        </div>

        <div style={welcomeStatValue}>
          {value}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  sub,
}) {
  return (
    <div style={sectionTitleWrap}>
      <div style={sectionTitle}>
        {title}
      </div>

      <div style={sectionSub}>
        {sub}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
}) {
  return (
    <div style={infoCard}>
      <div style={infoIcon}>
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={infoTitle}>
          {title}
        </div>

        <div style={infoValue}>
          {value}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}) {
  return (
    <div style={metricCard}>
      <div style={metricIcon}>
        {icon}
      </div>

      <div>
        <div style={metricValue}>
          {value}
        </div>

        <div style={metricLabel}>
          {label}
        </div>

        <div style={metricDetail}>
          {detail}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  sub,
  children,
}) {
  return (
    <div style={sectionCard}>
      <div>
        <div style={cardTitle}>
          {title}
        </div>

        <div style={cardSub}>
          {sub}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        {children}
      </div>
    </div>
  );
}

function RankingRow({
  user,
  index,
}) {
  const medalhas = ["🥇", "🥈", "🥉"];

  return (
    <div style={rankingRow}>
      <div style={rankingAvatar}>
        {medalhas[index] || index + 1}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={rankingName}>
          {user.nome_completo || "Utilizador"}
        </div>

        <div style={rankingRole}>
          {user.tipo_utilizador || "Consultor"}
        </div>
      </div>

      <div style={rankingPoints}>
        {Number(user.total_pontos || user.pontos_atuais || 0)} pontos
      </div>
    </div>
  );
}

function ProgressItem({
  label,
  value,
  percent,
  color,
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={progressHeader}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div style={progressTrack}>
        <div
          style={{
            ...progressFill,
            width: `${Math.min(Number(percent || 0), 100)}%`,
            background: color,
          }}
        />
      </div>

      <div style={progressPercent}>
        {Number(percent || 0).toFixed(1)}%
      </div>
    </div>
  );
}

function SimpleRow({
  label,
  value,
}) {
  return (
    <div style={simpleRow}>
      <span style={simpleLabel}>
        {label}
      </span>

      <span style={simpleValue}>
        {value}
      </span>
    </div>
  );
}

function EmptyText({ text }) {
  return (
    <div style={emptyText}>
      {text}
    </div>
  );
}

function formatarDataHora(data) {
  if (!data) {
    return "Não registado";
  }

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return "Não registado";
  }

  return date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const pagina = {
  backgroundColor: "#f3f4f6",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};

const corpo = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const mainStyle = {
  flex: 1,
  minWidth: 0,
  overflowY: "auto",
  padding: "20px 28px 60px",
};

const welcomeCard = {
  background: "#1e3a6e",
  borderRadius: 12,
};

const welcomeTitle = {
  fontWeight: 700,
  marginBottom: 16,
  textAlign: "left",
  fontSize: 21,
};

const welcomeStats = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const welcomeStat = {
  background: "rgba(255,255,255,0.18)",
  borderRadius: 9,
  padding: "7px 13px",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
};

const welcomeStatLabel = {
  fontSize: 10,
  opacity: 0.85,
};

const welcomeStatValue = {
  fontWeight: 700,
};

const avatarGrande = {
  width: 78,
  height: 78,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.18)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  flexShrink: 0,
};

const avatarImg = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const acoesRapidas = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "center",
  marginBottom: 24,
};

const quickButton = {
  height: 40,
  padding: "0 18px",
  border: "1px solid #d6dbe1",
  borderRadius: 8,
  background: "white",
  color: "#344054",
  fontSize: 14,
  fontWeight: 600,
  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  cursor: "pointer",
};

const sectionTitleWrap = {
  marginBottom: 12,
};

const sectionTitle = {
  fontSize: 16,
  fontWeight: 800,
  color: "#111827",
};

const sectionSub = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 2,
};

const perfilGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 14,
  marginBottom: 24,
};

const infoCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "14px 16px",
  display: "flex",
  alignItems: "center",
  gap: 14,
  minWidth: 0,
};

const infoIcon = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  background: "#eff6ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const infoTitle = {
  fontSize: 11,
  color: "#64748b",
  fontWeight: 700,
  textTransform: "uppercase",
};

const infoValue = {
  fontSize: 14,
  color: "#111827",
  fontWeight: 700,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const metricasGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 14,
  marginBottom: 24,
};

const metricCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "16px",
  display: "flex",
  alignItems: "center",
  gap: 13,
};

const metricIcon = {
  width: 46,
  height: 46,
  borderRadius: "50%",
  background: "#eff6ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const metricValue = {
  fontSize: 23,
  fontWeight: 800,
  color: "#111827",
  lineHeight: 1.1,
};

const metricLabel = {
  fontSize: 12,
  color: "#374151",
  fontWeight: 700,
};

const metricDetail = {
  fontSize: 11,
  color: "#94a3b8",
  marginTop: 2,
};

const duasColunas = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 16,
  marginBottom: 20,
};

const sectionCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: 20,
  minHeight: 220,
};

const cardTitle = {
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
};

const cardSub = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 2,
};

const rankingRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  borderBottom: "1px solid #f1f5f9",
  padding: "10px 0",
};

const rankingAvatar = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  flexShrink: 0,
};

const rankingName = {
  fontSize: 13,
  fontWeight: 800,
  color: "#111827",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const rankingRole = {
  fontSize: 11,
  color: "#64748b",
};

const rankingPoints = {
  fontSize: 12,
  fontWeight: 800,
  color: "#2563eb",
  whiteSpace: "nowrap",
};

const progressHeader = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 12,
  color: "#374151",
  marginBottom: 6,
};

const progressTrack = {
  height: 8,
  borderRadius: 999,
  background: "#e5e7eb",
  overflow: "hidden",
};

const progressFill = {
  height: "100%",
  borderRadius: 999,
};

const progressPercent = {
  fontSize: 11,
  color: "#64748b",
  marginTop: 4,
};

const totalAtividade = {
  marginTop: 18,
  fontSize: 12,
  color: "#475569",
  background: "#f8fafc",
  borderRadius: 8,
  padding: "8px 10px",
};

const simpleRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #f1f5f9",
  padding: "9px 0",
  gap: 10,
};

const simpleLabel = {
  fontSize: 12,
  color: "#374151",
  fontWeight: 700,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const simpleValue = {
  fontSize: 12,
  color: "#2563eb",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const emptyText = {
  fontSize: 12,
  color: "#94a3b8",
  padding: "12px 0",
};

export default PerfilAdminPage;