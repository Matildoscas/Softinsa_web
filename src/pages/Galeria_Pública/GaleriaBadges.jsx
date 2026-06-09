import { useEffect, useState } from "react";
import { Spinner, Button, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BiTrophy, BiStar, BiUser, BiChevronUp, BiChevronDown } from "react-icons/bi";
import logoImg from "../../assets/logo.png";
import api from "../../services/api.js";

const niveis = ["A", "B", "C", "D", "E"];

// Fallback visual em SVG caso algum badge fique sem imagem na BD (assim não quebra o layout)
const IMAGEM_PROVISORIA = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%234470AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'></circle><polygon points='12 8 16 16 8 16'></polygon></svg>";

function GaleriaBadgesPage() {
  const navigate = useNavigate();

  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [badgeSelecionado, setBadgeSelecionado] = useState(null);

  const areasPorPagina = 3;

  const normalizarBadgesComRequisitos = (lista) => {
  const mapa = new Map();

  lista.forEach((linha) => {
    // Garante que apanha o ID correto do badge
    const badgeId = Number(linha.id || linha.id_badge_modelo);
    if (!badgeId) return;

    if (!mapa.has(badgeId)) {
      mapa.set(badgeId, {
        id: badgeId,
        nome: linha.nome || linha.nome_badge,
        descricao: linha.descricao || linha.descricao_badge_modelo,
        pontos: Number(linha.pontos || 0),
        id_nivel: linha.id_nivel,
        id_areas: linha.id_areas,
        
        // ☁️ LÊ DIRETAMENTE APROPRIEDADE QUE ESTÁ NO POSTMAN:
        imagem: linha.imagem || null, 

        nome_area: linha.nome_area || "Área não definida",
        requisitos: [],
      });
    }

    const badgeAtual = mapa.get(badgeId);

    // Processa os requisitos caso existam dentro do array
    if (Array.isArray(linha.requisitos)) {
      linha.requisitos.forEach((req) => {
        const reqId = req.id_requisito || req.id || req.titulo;
        const jaExiste = badgeAtual.requisitos.some(
          (r) => String(r.id_requisito || r.id) === String(reqId)
        );

        if (!jaExiste) {
          badgeAtual.requisitos.push({
            id_requisito: req.id_requisito || req.id || null,
            id: req.titulo || "Requisito",
            titulo: req.nome || req.nome_requisito || req.titulo || "Requisito",
            descricao: req.descricao || req.descricao_requisito || "",
            link: req.link_requisito || req.link || "",
          });
        }
      });
    }
  });

  return Array.from(mapa.values());
};

      const badgeAtual = mapa.get(badgeId);

      // Caso 1: API já vem com requisitos agrupados
      if (Array.isArray(linha.requisitos)) {
        linha.requisitos.forEach((req) => {
          const reqId =
            req.id_requisito ||
            req.id_requisitos ||
            req.titulo ||
            req.nome;

          const jaExiste = badgeAtual.requisitos.some(
            (r) =>
              String(r.id_requisito || r.id || r.titulo) === String(reqId)
          );

          if (!jaExiste) {
            badgeAtual.requisitos.push({
              id_requisito: req.id_requisito || req.id_requisitos || null,
              id: req.titulo || req.nome || "Requisito",
              titulo: req.nome || req.nome_requisito || req.titulo || "Requisito",
              descricao:
                req.descricao ||
                req.descricao_requisito ||
                "",
              link: req.link_requisito || req.link || "",
            });
          }
        });

        return;
      }

      // Caso 2: API vem linha a linha com requisitos
      if (linha.titulo || linha.nome_requisito || linha.descricao_requisito) {
        const reqId =
          linha.id_requisito ||
          linha.id_requisitos ||
          linha.titulo ||
          linha.nome_requisito;

        const jaExiste = badgeAtual.requisitos.some(
          (r) =>
            String(r.id_requisito || r.id || r.titulo) === String(reqId)
        );

        if (!jaExiste) {
          badgeAtual.requisitos.push({
            id_requisito: linha.id_requisito || linha.id_requisitos || null,
            id: linha.titulo || linha.nome_requisito || "Requisito",
            titulo: linha.nome_requisito || linha.titulo || "Requisito",
            descricao: linha.descricao_requisito || "",
            link: linha.link_requisito || linha.link || "",
          });
        }
      }
    });

    return Array.from(mapa.values());
  };

  useEffect(() => {
    api
      .get("/badges/galeria/publica")
      .then((res) => {
        const dados = Array.isArray(res.data) ? res.data : [];
        const badgesNormalizados = normalizarBadgesComRequisitos(dados);
        
        // 🔍 Dá um console.log aqui para veres exatamente o que a tua API está a trazer do Cloudinary
        console.log("MEUS BADGES CARREGADOS:", badgesNormalizados);

        setBadges(badgesNormalizados);
      })
      .catch((err) => {
        console.error("Erro ao carregar galeria:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const badgesAgrupadosPorArea = badges.reduce((acc, badge) => {
    const area = badge.nome_area || "Área não definida";

    if (!acc[area]) {
      acc[area] = [];
    }

    acc[acc.area ? badge.nome_area : area].push(badge); // simplificado para manter a estrutura original estável
    return acc;
  }, {});

  // Ajustado fallback seguro para o reducer não falhar
  const areasOrdenadas = Object.keys(badgesAgrupadosPorArea).sort((a, b) =>
    a.localeCompare(b, "pt-PT")
  );

  const totalPaginas = Math.ceil(areasOrdenadas.length / areasPorPagina);

  const inicio = (paginaAtual - 1) * areasPorPagina;
  const fim = inicio + areasPorPagina;
  const areasPaginaAtual = areasOrdenadas.slice(inicio, fim);

  const totalPontos = badges.reduce(
    (total, badge) => total + Number(badge.pontos || 0),
    0
  );

  if (loading) {
    return (
      <div style={center}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div style={page}>
      <PublicHeader
        onLogin={() => navigate("/login")}
        onRegister={() => navigate("/register")}
      />

      <main style={main}>
        <section style={heroCard}>
          <div>
            <div style={heroTitle}>Galeria de Badges</div>

            <div style={heroStats}>
              <div style={heroStatItem}>
                <div style={heroStatIcon}>
                  <BiTrophy size={20} />
                </div>
                <div>
                  <div style={heroStatLabel}>Badges</div>
                  <div style={heroStatValue}>{badges.length}</div>
                </div>
              </div>

              <div style={heroStatItem}>
                <div style={heroStatIcon}>
                  <BiStar size={20} />
                </div>
                <div>
                  <div style={heroStatLabel}>Total de pontos</div>
                  <div style={heroStatValue}>{totalPontos} pontos</div>
                </div>
              </div>
            </div>
          </div>

          <div style={heroUserCircle}>
            <BiUser size={52} />
          </div>
        </section>

        <div style={contentWrapper}>
          {areasPaginaAtual.map((area) => (
            <section key={area} style={areaSection}>
              <h3 style={areaTitle}>{area}</h3>

              <div style={badgeGrid}>
                {badgesAgrupadosPorArea[area].map((badge) => (
                  <BadgeGalleryCard
                    key={badge.id}
                    badge={badge}
                    onClick={() => setBadgeSelecionado(badge)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <PaginacaoGaleria
          paginaAtual={paginaAtual}
          totalPaginas={totalPaginas}
          onAnterior={() => setPaginaAtual((p) => Math.max(1, p - 1))}
          onProxima={() =>
            setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
          }
        />
      </main>

      <BadgePublicModal
        badge={badgeSelecionado}
        show={!!badgeSelecionado}
        onClose={() => setBadgeSelecionado(null)}
      />
    </div>
  );
}

function PublicHeader({ onLogin, onRegister }) {
  return (
    <header style={header}>
      <div style={headerInner}>
        <img src={logoImg} alt="Softinsa" style={logoImgStyle} />

        <div style={headerActions}>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={onLogin}
            style={loginButton}
          >
            Login
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onRegister}
            style={registerButton}
          >
            Registar
          </Button>
        </div>
      </div>
    </header>
  );
}

// 🖼️ CARD DA LISTA: Mostra a imagem real que guardaste no Cloudinary
function BadgeGalleryCard({ badge, onClick }) {
  return (
    <div style={badgeCard} onClick={onClick}>
      <div style={badgeIcon}>
        <img 
          src={badge.imagem || IMAGEM_PROVISORIA} 
          alt={badge.nome} 
          style={imageInsideCircle}
          onError={(e) => { e.target.src = IMAGEM_PROVISORIA; }}
        />
      </div>

      <div style={badgeName}>
        {badge.nome || "Badge"}
      </div>
    </div>
  );
}

// 🖼️ MODAL DE DETALHES: Mostra a tua imagem do Cloudinary ampliada no Popup
function BadgePublicModal({ badge, show, onClose }) {
  if (!badge) return null;

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size="lg"
      backdrop="static"
    >
      <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
        <Modal.Title style={{ fontSize: 18, fontWeight: 700 }}>
          Informação do Badge
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ background: "#f7f7f7", padding: 24 }}>
        <div style={heroBadgeCard}>
          <div style={heroIconWrap}>
            <img 
              src={badge.imagem || IMAGEM_PROVISORIA} 
              alt={badge.nome} 
              style={imageInsideCircle}
              onError={(e) => { e.target.src = IMAGEM_PROVISORIA; }}
            />
          </div>

          <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginTop: 10 }}>
            {badge.nome}
          </div>

          {badge.nome_area && (
            <div style={{ fontSize: 13, color: "#4470AF", marginTop: 4 }}>
              {badge.nome_area}
            </div>
          )}

          <div style={pointsPill}>
            {badge.pontos || 0} pontos
          </div>
        </div>

        <div style={sectionCard}>
          <div style={sectionTitle}>Descrição</div>
          <p style={descriptionText}>
            {badge.descricao || "Sem descrição disponível."}
          </p>
        </div>

        <NivelSelector nivelAtual={nivelParaLetra(badge.id_nivel)} />

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
            Requisitos do Nível
          </div>

          {badge.requisitos?.length > 0 ? (
            badge.requisitos.map((req, i) => (
              <RequisitoRow
                key={`${req.id}-${i}`}
                req={req}
                defaultOpen={i === 0}
              />
            ))
          ) : (
            <div style={sectionCard}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                Sem requisitos registados para este badge.
              </span>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer style={{ borderTop: "1px solid #e5e7eb" }}>
        <Button variant="outline-secondary" onClick={onClose}>
          Fechar
        </Button>

        <Button variant="primary" onClick={() => window.location.href = "/login"}>
          Iniciar sessão para submeter evidências
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function NivelSelector({ nivelAtual }) {
  return (
    <div style={sectionCard}>
      <div style={sectionTitle}>Nível</div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        {niveis.map((n) => (
          <div
            key={n}
            style={{
              ...nivelCircle,
              background: n === nivelAtual ? "#F5C518" : "#f0f0f0",
              border:
                n === nivelAtual
                  ? "2px solid #e0a800"
                  : "1.5px solid #d1d5db",
              color: n === nivelAtual ? "#7a5800" : "#374151",
              fontWeight: n === nivelAtual ? 700 : 500,
              boxShadow:
                n === nivelAtual
                  ? "0 2px 8px rgba(245,197,24,0.35)"
                  : "none",
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

function RequisitoRow({ req, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);

  return (
    <div style={requisitoCard}>
      <div style={requisitoHeader} onClick={() => setOpen((v) => !v)}>
        <div>
          <span style={{ fontWeight: 700, color: "#111827" }}>
            Requisito {req.id}
          </span>
          {" - "}
          <span style={{ color: "#4470AF", fontWeight: 500 }}>
            {req.titulo}
          </span>
        </div>

        {open ? (
          <BiChevronUp size={22} color="#6b7280" />
        ) : (
          <BiChevronDown size={22} color="#6b7280" />
        )}
      </div>

      {open && (
        <div style={requisitoBody}>
          <span style={{ fontWeight: 700 }}>{req.id}</span>
          {" - "}
          {req.descricao || "Sem descrição."}

          {req.link && (
            <div style={{ marginTop: 4 }}>
              <a
                href={req.link}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#4470AF", fontSize: 13 }}
              >
                {req.link}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PaginacaoGaleria({
  paginaAtual,
  totalPaginas,
  onAnterior,
  onProxima,
}) {
  if (totalPaginas <= 1) return null;

  const disabledAnterior = paginaAtual === 1;
  const disabledProxima = paginaAtual === totalPaginas;

  return (
    <div style={paginationWrapper}>
      <button
        style={{
          ...paginationButton,
          opacity: disabledAnterior ? 0.45 : 1,
          cursor: disabledAnterior ? "not-allowed" : "pointer",
        }}
        disabled={disabledAnterior}
        onClick={onAnterior}
      >
        {"<"}
      </button>

      <div style={paginationCurrent}>{paginaAtual}</div>

      <div style={paginationText}>
        {paginaAtual}/{totalPaginas}
      </div>

      <button
        style={{
          ...paginationButton,
          opacity: disabledProxima ? 0.45 : 1,
          cursor: disabledProxima ? "not-allowed" : "pointer",
        }}
        disabled={disabledProxima}
        onClick={onProxima}
      >
        {">"}
      </button>
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

  return "";
}

// ======================================================
// ESTILOS AJUSTADOS PARA AS IMAGENS REAIS
// ======================================================

const imageInsideCircle = {
  width: "100%",
  height: "100%",
  borderRadius: "50%",
  objectFit: "cover", // Garante que as tuas imagens não ficam distorcidas!
};

const page = {
  minHeight: "100vh",
  background: "#f7f7f7",
};

const header = {
  height: 72,
  background: "white",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
};

const headerInner = {
  width: "100%",
  maxWidth: 1500,
  margin: "0 auto",
  padding: "0 32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const logoImgStyle = {
  height: 42,
  objectFit: "contain",
};

const headerActions = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const loginButton = {
  borderRadius: 999,
  padding: "6px 18px",
  fontWeight: 600,
};

const registerButton = {
  borderRadius: 999,
  padding: "6px 18px",
  fontWeight: 600,
  background: "#4470AF",
  borderColor: "#4470AF",
};

const main = {
  width: "100%",
  maxWidth: 1500,
  margin: "0 auto",
  padding: "32px 32px 60px",
};

const heroCard = {
  background: "#4470AF",
  borderRadius: 12,
  minHeight: 150,
  padding: "26px 38px",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
  marginBottom: 48,
};

const heroTitle = {
  fontSize: 22,
  fontWeight: 600,
  marginBottom: 34,
};

const heroStats = {
  display: "flex",
  alignItems: "center",
  gap: 70,
};

const heroStatItem = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const heroStatIcon = {
  width: 38,
  height: 38,
  borderRadius: 7,
  background: "rgba(255,255,255,0.25)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const heroStatLabel = {
  fontSize: 12,
  opacity: 0.9,
};

const heroStatValue = {
  fontSize: 14,
  fontWeight: 700,
};

const heroUserCircle = {
  width: 82,
  height: 82,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const contentWrapper = {
  width: "100%",
  maxWidth: 1320,
  margin: "0 auto",
};

const areaSection = {
  marginBottom: 42,
};

const areaTitle = {
  fontSize: 21,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 20,
};

const badgeGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "24px 34px",
};

const badgeCard = {
  height: 104,
  background: "white",
  border: "1.5px solid #4470AF",
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "0 16px",
  cursor: "pointer",
  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
};

const badgeIcon = {
  width: 70,
  height: 70,
  borderRadius: "50%",
  background: "#f3f4f6", // Fundo neutro suave para as imagens
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  overflow: "hidden", // Garante o formato circular perfeito
};

const badgeName = {
  flex: 1,
  fontSize: 15,
  fontWeight: 600,
  color: "#111827",
  textAlign: "center",
  lineHeight: 1.15,
};

const paginationWrapper = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 8,
  marginTop: 10,
  paddingRight: 60,
};

const paginationButton = {
  width: 38,
  height: 38,
  border: "none",
  borderRadius: 8,
  background: "#e9eef5",
  color: "#2f3d4f",
  fontSize: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const paginationCurrent = {
  width: 38,
  height: 38,
  borderRadius: 8,
  background: "#dfe6ef",
  color: "#2f3d4f",
  fontSize: 16,
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const paginationText = {
  minWidth: 42,
  textAlign: "center",
  fontSize: 13,
  color: "#2f3d4f",
};

const heroBadgeCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "28px 20px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginBottom: 16,
};

const heroIconWrap = {
  width: 90,
  height: 90,
  borderRadius: "50%",
  background: "#f3f4f6",
  border: "2px solid #dbe3ef",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const pointsPill = {
  marginTop: 10,
  background: "#eef6ff",
  color: "#4470AF",
  border: "1px solid #dbe3ef",
  borderRadius: 999,
  padding: "4px 14px",
  fontSize: 12,
  fontWeight: 700,
};

const sectionCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 12,
  padding: "16px 20px",
  marginBottom: 16,
};

const sectionTitle = {
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
};

const descriptionText = {
  fontSize: 13,
  color: "#374151",
  marginTop: 8,
  marginBottom: 0,
  lineHeight: 1.65,
};

const nivelCircle = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
};

const requisitoCard = {
  background: "white",
  border: "1px solid #dbe3ef",
  borderRadius: 10,
  marginBottom: 10,
  overflow: "hidden",
};

const requisitoHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 18px",
  cursor: "pointer",
  fontSize: 13,
  userSelect: "none",
};

const requisitoBody = {
  padding: "10px 18px 16px",
  fontSize: 13,
  color: "#374151",
  borderTop: "1px solid #e5e7eb",
  background: "#fafbff",
};

const center = {
  height: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default GaleriaBadgesPage;