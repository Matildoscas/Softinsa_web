import { useEffect, useState } from "react";
import { Spinner, Button, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BiTrophy, BiStar, BiUser, BiChevronUp, BiChevronDown } from "react-icons/bi";
import logoImg from "../../assets/logo.png";
import api from "../../services/api.js";

const GRUPOS_ORDEM = ["Junior", "Intermediate ou Partner", "Senior", "Specialist", "Leader"];
const niveis = ["A", "B", "C", "D", "E"];

function GaleriaBadgesPage() {
  const navigate = useNavigate();

  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [badgeSelecionado, setBadgeSelecionado] = useState(null);

  const areasPorPagina = 3;

  const normalizarArray = (valor) => {
    if (Array.isArray(valor)) return valor;
    if (typeof valor === "string") {
      try {
        const convertido = JSON.parse(valor);
        return Array.isArray(convertido) ? convertido : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const normalizarBadgesComRequisitos = (lista) => {
    const mapa = new Map();

    lista.forEach((linha) => {
      const badgeId = Number(linha.id || linha.id_badge_modelo);
      if (!badgeId) return;

      const consultoresPublicos = normalizarArray(linha.consultores_publicos);

      if (!mapa.has(badgeId)) {
        mapa.set(badgeId, {
          id: badgeId,
          id_badge_modelo: badgeId,
          nome: linha.nome || linha.nome_badge || "Badge",
          nome_badge: linha.nome_badge || linha.nome || "Badge",
          descricao: linha.descricao || linha.descricao_badge_modelo || "",
          descricao_badge_modelo: linha.descricao_badge_modelo || linha.descricao || "",
          pontos: Number(linha.pontos || 0),
          id_nivel: linha.id_nivel,
          codigo_nivel: linha.codigo_nivel || linha.nome_nivel,
          id_areas: linha.id_areas,
          nome_area: linha.nome_area || linha.nome_areas || linha.area || "Área não definida",
          imagem: linha.imagem_url || linha.imagem || linha.url_imagem || null,
          imagem_url: linha.imagem_url || linha.imagem || linha.url_imagem || null,
          total_consultores_publicos: Number(linha.total_consultores_publicos || consultoresPublicos.length || 0),
          consultores_publicos: consultoresPublicos,
          requisitos: [],
        });
      }

      const badgeAtual = mapa.get(badgeId);
      const totalLinha = Number(linha.total_consultores_publicos || consultoresPublicos.length || 0);

      if (totalLinha > Number(badgeAtual.total_consultores_publicos || 0)) {
        badgeAtual.total_consultores_publicos = totalLinha;
      }

      if (consultoresPublicos.length > 0) {
        const idsExistentes = new Set(badgeAtual.consultores_publicos.map((c) => String(c.id_utilizador)));
        consultoresPublicos.forEach((consultor) => {
          const idConsultor = String(consultor.id_utilizador);
          if (!idsExistentes.has(idConsultor)) {
            badgeAtual.consultores_publicos.push(consultor);
            idsExistentes.add(idConsultor);
          }
        });
      }

      if (Array.isArray(linha.requisitos)) {
        linha.requisitos.forEach((req) => {
          const reqId = req.id_requisito || req.id_requisitos || req.titulo || req.nome;
          const jaExiste = badgeAtual.requisitos.some((r) => String(r.id_requisito || r.id || r.titulo) === String(reqId));

          if (!jaExiste) {
            const links = normalizarArray(req.links || req.link || req.link_requisito || []);
            badgeAtual.requisitos.push({
              id_requisito: req.id_requisito || req.id_requisitos || null,
              id_requisitos: req.id_requisitos || req.id_requisito || null,
              id: req.id_requisito || req.id_requisitos || req.titulo || req.nome || "Requisito",
              titulo: req.nome || req.nome_requisito || req.titulo || "Requisito",
              descricao: req.descricao || req.descricao_requisito || "",
              links,
              link: req.link_requisito || req.link || links[0] || "",
            });
          }
        });
        return;
      }

      if (linha.titulo || linha.nome_requisito || linha.descricao_requisito) {
        const reqId = linha.id_requisito || linha.id_requisitos || linha.titulo || linha.nome_requisito;
        const jaExiste = badgeAtual.requisitos.some((r) => String(r.id_requisito || r.id || r.titulo) === String(reqId));

        if (!jaExiste) {
          const links = normalizarArray(linha.links || linha.link_requisito || linha.link || []);
          badgeAtual.requisitos.push({
            id_requisito: linha.id_requisito || linha.id_requisitos || null,
            id_requisitos: linha.id_requisitos || linha.id_requisito || null,
            id: linha.id_requisito || linha.id_requisitos || linha.titulo || linha.nome_requisito || "Requisito",
            titulo: linha.nome_requisito || linha.titulo || "Requisito",
            descricao: linha.descricao_requisito || "",
            links,
            link: linha.link_requisito || linha.link || links[0] || "",
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
        setBadges(normalizarBadgesComRequisitos(dados));
      })
      .catch((err) => {
        console.error("Erro ao carregar galeria.");
      })
      .finally(() => setLoading(false));
  }, []);

  const badgesAgrupadosPorArea = badges.reduce((acc, badge) => {
    const area = badge.nome_area || "Área não definida";
    if (!acc[area]) acc[area] = [];
    acc[area].push(badge);
    return acc;
  }, {});
// FUNÇÃO DE MAPEAMENTO: Converte o nível do badge para a nomenclatura correta
const obterGrupoPorNivel = (badge) => {
  const nivel = String(badge.codigo_nivel || nivelParaLetra(badge.id_nivel)).toUpperCase();
  
  if (nivel === "A" || nivel === "1") return "Junior";
  if (nivel === "B" || nivel === "2") return "Intermediate ou Partner";
  if (nivel === "C" || nivel === "3") return "Senior";
  if (nivel === "D" || nivel === "4") return "Specialist";
  if (nivel === "E" || nivel === "5") return "Leader"; 
  
  return "Junior"; // Fallback de segurança
};

// Agrupamento dos Badges pelos novos grupos de Senioridade
const badgesAgrupados = badges.reduce((acc, badge) => {
  const grupo = obterGrupoPorNivel(badge);
  if (!acc[grupo]) acc[grupo] = [];
  acc[grupo].push(badge);
  return acc;
}, {});

// Filtra apenas as categorias que realmente têm badges para não mostrar secções vazias
const gruposFiltrados = GRUPOS_ORDEM.filter(grupo => badgesAgrupados[grupo] && badgesAgrupados[grupo].length > 0);

// Paginação adaptada para a nova lista de grupos
const totalPaginas = Math.ceil(gruposFiltrados.length / gruposPorPagina);
const inicio = (paginaAtual - 1) * gruposPorPagina;
const fim = inicio + gruposPorPagina;
const gruposPaginaAtual = gruposFiltrados.slice(inicio, fim);
  const areasOrdenadas = Object.keys(badgesAgrupadosPorArea).sort((a, b) => a.localeCompare(b, "pt-PT"));
  const totalPaginas = Math.ceil(areasOrdenadas.length / areasPorPagina);
  const inicio = (paginaAtual - 1) * areasPorPagina;
  const fim = inicio + areasPorPagina;
  const areasPaginaAtual = areasOrdenadas.slice(inicio, fim);

  const totalPontos = badges.reduce((total, badge) => total + Number(badge.pontos || 0), 0);

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
                <div style={heroStatIcon}><BiTrophy size={20} /></div>
                <div>
                  <div style={heroStatLabel}>Badges</div>
                  <div style={heroStatValue}>{badges.length}</div>
                </div>
              </div>
              <div style={heroStatItem}>
                <div style={heroStatIcon}><BiStar size={20} /></div>
                <div>
                  <div style={heroStatLabel}>Total de pontos</div>
                  <div style={heroStatValue}>{totalPontos} pontos</div>
                </div>
              </div>
            </div>
          </div>
          <div style={heroUserCircle}><BiUser size={52} /></div>
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
          onProxima={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
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
          <Button variant="outline-primary" size="sm" onClick={onLogin} style={loginButton}>Login</Button>
          <Button variant="primary" size="sm" onClick={onRegister} style={registerButton}>Registar</Button>
        </div>
      </div>
    </header>
  );
}

function BadgeGalleryCard({ badge, onClick }) {
  const nome = badge.nome || badge.nome_badge || "Badge";
  const descricao = badge.descricao || badge.descricao_badge_modelo || "";
  const imagem = badge.imagem_url || badge.imagem || badge.url_imagem || null;
  const totalConsultores = Number(badge.total_consultores_publicos || 0);
  const temConsultores = totalConsultores > 0;

  const letraNivel = badge.codigo_nivel || nivelParaLetra(badge.id_nivel);

  const textoConsultores = temConsultores
    ? `${totalConsultores} consultor${totalConsultores === 1 ? "" : "es"} público${totalConsultores === 1 ? "" : "s"}`
    : "Ainda sem consultores públicos";

  return (
    <div
      style={badgeCard}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(37, 99, 235, 0.16)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 6px 15px rgba(15, 23, 42, 0.08)";
      }}
    >
      <div style={badgeCardTop}>
        <div style={badgeImageCircle}>
          {imagem ? <img src={imagem} alt={nome} style={badgeImage} /> : <span style={badgeEmoji}>🏅</span>}
        </div>
        <div style={badgeMainInfo}>
          <div style={badgeName}>{nome}</div>
          {letraNivel && (
            <div style={{ fontSize: 12, fontWeight: 600, color: "#4470AF", marginTop: 2 }}>
              Nível {letraNivel}
            </div>
          )}
          <div style={badgeDescription}>{descricao || "Ver detalhes deste badge"}</div>
        </div>
      </div>
      <div style={{ ...badgePublicFooter, ...(temConsultores ? badgePublicFooterActive : badgePublicFooterEmpty) }}>
        <BiUser size={14} />
        <span>{textoConsultores}</span>
      </div>
    </div>
  );
}

function BadgePublicModal({ badge, show, onClose }) {
  const navigate = useNavigate();
  if (!badge) return null;

  const nome = badge.nome || badge.nome_badge || "Badge";
  const imagem = badge.imagem_url || badge.imagem || badge.url_imagem || null;

  const handleLoginRedirect = () => {
    // Passa o ID do badge atual para que após o login o utilizador possa voltar para aqui
    navigate("/login", { state: { from: window.location.pathname, openBadgeId: badge.id } });
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg" backdrop="static">
      <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
        <Modal.Title style={{ fontSize: 18, fontWeight: 700 }}>Informação do Badge</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: "#f7f7f7", padding: 24 }}>
        <div style={heroBadgeCard}>
          <div style={heroIconWrap}>
            {imagem ? <img src={imagem} alt={nome} style={heroBadgeImage} /> : <span style={badgeEmoji}>🏅</span>}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginTop: 10 }}>{nome}</div>
          {badge.nome_area && <div style={{ fontSize: 13, color: "#4470AF", marginTop: 4 }}>{badge.nome_area}</div>}
          <div style={pointsPill}>{badge.pontos || 0} pontos</div>
        </div>

        <div style={sectionCard}>
          <div style={sectionTitle}>Descrição</div>
          <p style={descriptionText}>{badge.descricao || "Sem descrição disponível."}</p>
        </div>

        <NivelSelector nivelAtual={badge.codigo_nivel || nivelParaLetra(badge.id_nivel)} />

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Requisitos do Nível</div>
          {badge.requisitos?.length > 0 ? (
            badge.requisitos.map((req, i) => <RequisitoRow key={`${req.id}-${i}`} req={req} defaultOpen={i === 0} />)
          ) : (
            <div style={sectionCard}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Sem requisitos registados para este badge.</span>
            </div>
          )}
        </div>
        <ConsultoresPublicosSection badge={badge} consultores={badge.consultores_publicos || []} total={badge.total_consultores_publicos || 0} />
      </Modal.Body>
      <Modal.Footer style={{ borderTop: "1px solid #e5e7eb" }}>
        <Button variant="outline-secondary" onClick={onClose}>Fechar</Button>
        <Button variant="primary" onClick={handleLoginRedirect}>Iniciar sessão para submeter evidências</Button>
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
              border: n === nivelAtual ? "2px solid #e0a800" : "1.5px solid #d1d5db",
              color: n === nivelAtual ? "#7a5800" : "#374151",
              fontWeight: n === nivelAtual ? 700 : 500,
              boxShadow: n === nivelAtual ? "0 2px 8px rgba(245,197,24,0.35)" : "none",
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
  const idRequisito = req.id_requisito || req.id_requisitos || req.id || "";
  const links = Array.isArray(req.links) ? req.links : req.link ? [req.link] : [];

  return (
    <div style={requisitoCard}>
      <div style={requisitoHeader} onClick={() => setOpen((v) => !v)}>
        <div>
          <span style={{ fontWeight: 700, color: "#111827" }}>Requisito {idRequisito}</span>
          {" - "}
          <span style={{ color: "#4470AF", fontWeight: 600 }}>{req.titulo}</span>
        </div>
        {open ? <BiChevronUp size={22} color="#6b7280" /> : <BiChevronDown size={22} color="#6b7280" />}
      </div>
      {open && (
        <div style={requisitoBody}>
          <div style={{ marginBottom: links.length > 0 ? 10 : 0 }}>{req.descricao || "Sem descrição."}</div>
          {links.length > 0 && (
            <div style={linksBox}>
              <div style={linksTitle}>Links do curso</div>
              {links.map((link, index) => (
                <a key={`${link}-${index}`} href={link} target="_blank" rel="noreferrer" style={cursoLink}>{link}</a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PaginacaoGaleria({ paginaAtual, totalPaginas, onAnterior, onProxima }) {
  if (totalPaginas <= 1) return null;
  const disabledAnterior = paginaAtual === 1;
  const disabledProxima = paginaAtual === totalPaginas;

  return (
    <div style={paginationWrapper}>
      <button
        style={{ ...paginationButton, opacity: disabledAnterior ? 0.45 : 1, cursor: disabledAnterior ? "not-allowed" : "pointer" }}
        disabled={disabledAnterior}
        onClick={onAnterior}
      >
        {"<"}
      </button>
      <div style={paginationCurrent}>{paginaAtual}</div>
      <div style={paginationText}>{paginaAtual}/{totalPaginas}</div>
      <button
        style={{ ...paginationButton, opacity: disabledProxima ? 0.45 : 1, cursor: disabledProxima ? "not-allowed" : "pointer" }}
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

function ConsultoresPublicosSection({ badge, consultores, total }) {
  const navigate = useNavigate();
  const lista = Array.isArray(consultores) ? consultores : [];
  const idBadge = badge?.id || badge?.id_badge_modelo;

  return (
    <div style={sectionCard}>
      <div style={sectionTitle}>Consultores que conquistaram</div>
      <div style={{ fontSize: 13, color: "#475569", marginTop: 8, marginBottom: 12 }}>
        {Number(total || 0) === 0
          ? "Ainda não existem consultores com publicação autorizada para este badge."
          : `${total} consultor${Number(total) === 1 ? "" : "es"} autorizaram a publicação.`}
      </div>

      {lista.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {lista.map((consultor, index) => {
            const idUtilizador = consultor.id_utilizador || consultor.id || consultor.ID_UTILIZADOR;
            return (
              <div key={idUtilizador || index} style={consultorPublicoRow}>
                <div style={consultorAvatar}><BiUser size={20} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{consultor.nome_completo || "Consultor"}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{consultor.nome_area || "Sem área associada"}</div>
                  {consultor.data_atribuicao && (
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      Conquistado a {new Date(consultor.data_atribuicao).toLocaleDateString("pt-PT")}
                    </div>
                  )}
                </div>
                <div style={consultorActions}>
                  {idUtilizador && idBadge && (
                    <button
                      type="button"
                      style={verBadgeButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/badges/${idUtilizador}/${idBadge}`);
                      }}
                    >
                      Ver badge público
                    </button>
                  )}
                  {consultor.linkedin_url && (
                    <button
                      type="button"
                      style={linkedinButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(consultor.linkedin_url, "_blank", "noopener,noreferrer");
                      }}
                    >
                      LinkedIn
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Estilos mantidos originais do teu ficheiro
const consultorActions = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const verBadgeButton = {
  border: "1px solid #bfdbfe",
  background: "#eff6ff",
  color: "#1d4ed8",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
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

  padding:
    "clamp(18px, 3vw, 32px) clamp(16px, 3vw, 32px) 60px",
};

const heroCard = {
  background: "#4470AF",

  borderRadius: 12,

  minHeight: 150,

  padding:
    "clamp(22px, 3vw, 32px) clamp(22px, 4vw, 38px)",

  color: "white",

  display: "flex",

  alignItems: "center",

  justifyContent:
    "space-between",

  gap: 24,

  flexWrap: "wrap",

  boxShadow:
    "0 10px 22px rgba(0,0,0,0.18)",

  marginBottom:
    "clamp(32px, 5vw, 48px)",
};

const heroTitle = {
  fontSize: 22,
  fontWeight: 600,
  marginBottom: 34,
};

const heroStats = {
  display: "flex",

  alignItems: "center",

  gap: "18px 52px",

  flexWrap: "wrap",
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
  fontSize:
    "clamp(18px, 2.2vw, 21px)",

  fontWeight: 800,

  color: "#111827",

  marginBottom: 20,

  lineHeight: 1.2,
};

const badgeIcon = {
  width: 70,
  height: 70,
  borderRadius: "50%",
  background: "#e5e5e5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 28,
  flexShrink: 0,
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
  width: 92,
  height: 92,
  borderRadius: "50%",
  background: "#eef3fb",
  border: "2px solid #dbe3ef",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  padding: 6,
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

const badgePublicInfo = {
  marginTop: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  fontSize: 12,
  color: "#4470AF",
  fontWeight: 600,
};

const consultorPublicoRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "10px 12px",
};

const consultorAvatar = {
  width: 38,
  height: 38,
  borderRadius: "50%",
  background: "#eff6ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const linkedinButton = {
  border: "1px solid #0a66c2",
  background: "#0a66c2",
  color: "white",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const badgeGrid = {
  display: "grid",

  /*
   * Responsivo:
   * - desktop: 4 cards por linha
   * - tablet: 2 ou 3
   * - telemóvel: 1
   */
  gridTemplateColumns:
    "repeat(auto-fit, minmax(260px, 1fr))",

  gap: "24px 28px",

  alignItems: "stretch",
};

const badgeCard = {
  background: "white",

  border:
    "1.5px solid #4470AF",

  borderRadius: 12,

  minHeight: 158,

  overflow: "hidden",

  cursor: "pointer",

  display: "flex",

  flexDirection: "column",

  justifyContent:
    "space-between",

  boxShadow:
    "0 6px 15px rgba(15, 23, 42, 0.08)",

  transition:
    "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
};

const badgeCardTop = {
  flex: 1,

  display: "grid",

  gridTemplateColumns:
    "76px minmax(0, 1fr)",

  alignItems: "center",

  gap: 18,

  padding: "18px 18px 14px",
};

const badgeImageCircle = {
  width: 70,

  height: 70,

  borderRadius: "50%",

  background: "#f1f5f9",

  border:
    "1px solid #dbeafe",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  overflow: "hidden",

  flexShrink: 0,
};

const badgeImage = {
  width: "100%",

  height: "100%",

  objectFit: "cover",

  borderRadius: "50%",
};

const badgeEmoji = {
  fontSize: 28,
};

const badgeMainInfo = {
  minWidth: 0,

  display: "flex",

  flexDirection: "column",

  justifyContent: "center",
};

const badgeName = {
  fontSize: 15,

  fontWeight: 800,

  color: "#020617",

  lineHeight: 1.16,

  textAlign: "left",

  display: "-webkit-box",

  WebkitLineClamp: 3,

  WebkitBoxOrient: "vertical",

  overflow: "hidden",
};

const badgeDescription = {
  marginTop: 7,

  fontSize: 12,

  lineHeight: 1.35,

  color: "#64748b",

  display: "-webkit-box",

  WebkitLineClamp: 2,

  WebkitBoxOrient: "vertical",

  overflow: "hidden",
};

const badgePublicFooter = {
  borderTop:
    "1px solid #dbeafe",

  minHeight: 42,

  padding:
    "9px 12px",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

  gap: 6,

  textAlign: "center",

  fontSize: 12,

  fontWeight: 700,

  lineHeight: 1.35,
};

const badgePublicFooterActive = {
  background: "#eff6ff",

  color: "#1d4ed8",
};

const badgePublicFooterEmpty = {
  background: "#f8fafc",

  color: "#64748b",
};

const heroBadgeImage = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: "50%",
};

const linksBox = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 8,
  background: "#eff6ff",
  border: "1px solid #dbeafe",
};

const linksTitle = {
  fontSize: 12,
  fontWeight: 700,
  color: "#1e3a8a",
  marginBottom: 6,
};

const cursoLink = {
  display: "block",
  fontSize: 13,
  color: "#2563eb",
  fontWeight: 600,
  textDecoration: "none",
  marginTop: 4,
  overflowWrap: "anywhere",
};

export default GaleriaBadgesPage;