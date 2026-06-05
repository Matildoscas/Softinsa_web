import { useEffect, useState } from "react";
import { Spinner, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../../services/api.js";

function GaleriaBadgesPage() {
  const navigate = useNavigate();

  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pesquisa, setPesquisa] = useState("");
  const [areaFiltro, setAreaFiltro] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState("");

  useEffect(() => {
    api.get("/badges/galeria/publica")
      .then((res) => {
        setBadges(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Erro ao carregar galeria pública:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const areasDisponiveis = [
    ...new Set(
      badges
        .map((b) => b.nome_area)
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b, "pt-PT"));

  const badgesFiltrados = badges.filter((b) => {
    const texto = `${b.nome || ""} ${b.descricao || ""} ${b.nome_area || ""}`.toLowerCase();

    const matchPesquisa = texto.includes(pesquisa.toLowerCase());

    const matchArea = areaFiltro
      ? b.nome_area === areaFiltro
      : true;

    const matchNivel = nivelFiltro
      ? Number(b.id_nivel) === Number(nivelFiltro)
      : true;

    return matchPesquisa && matchArea && matchNivel;
  });

  if (loading) {
    return (
      <div style={center}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div style={page}>
      <header style={header}>
        <div style={logo}>SOFTINSA</div>

        <button
          style={loginBtn}
          onClick={() => navigate("/login")}
        >
          Entrar
        </button>
      </header>

      <main style={main}>
        <section style={hero}>
          <h1 style={title}>Galeria de Badges</h1>
          <p style={subtitle}>
            Explore todos os badges disponíveis na plataforma Softinsa.
          </p>
        </section>

        <section style={filters}>
          <Form.Control
            placeholder="Pesquisar badge..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            style={input}
          />

          <Form.Select
            value={areaFiltro}
            onChange={(e) => setAreaFiltro(e.target.value)}
            style={input}
          >
            <option value="">Todas as áreas</option>
            {areasDisponiveis.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </Form.Select>

          <Form.Select
            value={nivelFiltro}
            onChange={(e) => setNivelFiltro(e.target.value)}
            style={input}
          >
            <option value="">Todos os níveis</option>
            <option value="1">Nível A</option>
            <option value="2">Nível B</option>
            <option value="3">Nível C</option>
            <option value="4">Nível D</option>
            <option value="5">Nível E</option>
          </Form.Select>
        </section>

        <div style={count}>
          {badgesFiltrados.length} badge(s) encontrados
        </div>

        <section style={grid}>
          {badgesFiltrados.map((badge) => (
            <BadgePublicCard
              key={badge.id}
              badge={badge}
              onClick={() => navigate(`/galeria-badges/${badge.id}`)}
            />
          ))}
        </section>
      </main>
    </div>
  );
}

function BadgePublicCard({ badge, onClick }) {
  return (
    <div style={card} onClick={onClick}>
      <div style={icon}>🏅</div>

      <div style={cardTitle}>
        {badge.nome}
      </div>

      <div style={cardArea}>
        {badge.nome_area || "Área não definida"}
      </div>

      <div style={cardDesc}>
        {badge.descricao}
      </div>

      <div style={footer}>
        <span>Nível {nivelParaLetra(badge.id_nivel)}</span>
        <strong>{badge.pontos} pontos</strong>
      </div>
    </div>
  );
}

function nivelParaLetra(idNivel) {
  const nivel = Number(idNivel);

  if (nivel === 1) return "A";
  if (nivel === 2) return "B";
  if (nivel === 3) return "C";
  if (nivel === 4) return "D";
  if (nivel === 5) return "E";

  return "-";
}

const page = {
  minHeight: "100vh",
  background: "#f7f7f7",
};

const header = {
  height: 70,
  background: "white",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 48px",
};

const logo = {
  fontSize: 24,
  fontWeight: 800,
  color: "#4470AF",
  letterSpacing: 1,
};

const loginBtn = {
  border: "1px solid #4470AF",
  background: "white",
  color: "#4470AF",
  borderRadius: 999,
  padding: "8px 20px",
  fontWeight: 600,
  cursor: "pointer",
};

const main = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: "42px 24px",
};

const hero = {
  textAlign: "center",
  marginBottom: 30,
};

const title = {
  fontSize: 34,
  fontWeight: 800,
  color: "#111827",
};

const subtitle = {
  fontSize: 15,
  color: "#6b7280",
};

const filters = {
  display: "flex",
  gap: 12,
  marginBottom: 18,
  flexWrap: "wrap",
};

const input = {
  height: 42,
  borderRadius: 10,
  minWidth: 220,
  flex: 1,
};

const count = {
  fontSize: 13,
  color: "#6b7280",
  marginBottom: 18,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 18,
};

const card = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 16,
  padding: 20,
  cursor: "pointer",
  minHeight: 260,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

const icon = {
  width: 80,
  height: 80,
  borderRadius: "50%",
  background: "#eef6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 34,
  marginBottom: 12,
};

const cardTitle = {
  fontSize: 16,
  fontWeight: 700,
  color: "#111827",
  marginBottom: 6,
};

const cardArea = {
  fontSize: 12,
  color: "#4470AF",
  marginBottom: 10,
};

const cardDesc = {
  fontSize: 12,
  color: "#6b7280",
  lineHeight: 1.5,
  flex: 1,
};

const footer = {
  borderTop: "1px solid #e5e7eb",
  paddingTop: 12,
  marginTop: 14,
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  fontSize: 12,
  color: "#374151",
};

const center = {
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default GaleriaBadgesPage;