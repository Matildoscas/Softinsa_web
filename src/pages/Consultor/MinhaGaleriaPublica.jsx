import { useEffect, useState } from "react";
import { Alert, Button, Card, Spinner } from "react-bootstrap";
import { HiOutlineArrowLeft, HiOutlineExternalLink } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

import api from "../../services/api.js";
import Header from "../../components/Header.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";
import BadgeImage from "../../components/badge_image.jsx";

function MinhaGaleriaPublicaPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [badges, setBadges] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      setLoading(false);
      navigate("/login", { replace: true });
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      const idUtilizador = user.id_utilizador || user.ID_UTILIZADOR || user.id;

      if (!idUtilizador) {
        setLoading(false);
        navigate("/login", { replace: true });
        return;
      }

      setUserId(idUtilizador);

      api
        .get(`/badges/publico/${idUtilizador}`)
        .then((response) => {
          const lista = Array.isArray(response.data?.badges)
            ? response.data.badges
            : [];

          setBadges(lista);
        })
        .catch((err) => {
          console.error("Erro ao carregar minha galeria publica:", err);
          setErro("Nao foi possivel carregar a tua galeria publica.");
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (err) {
      console.error("Utilizador invalido:", err);
      setLoading(false);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

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
        <LeftSidebar />

        <main style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <Button
            variant="link"
            className="d-flex align-items-center text-decoration-none p-0 mb-3"
            style={{ color: "#4A5568", fontSize: "1.05rem" }}
            onClick={() => navigate("/perfil_consultor")}
          >
            <HiOutlineArrowLeft className="me-1" />
            <span style={{ fontWeight: 500 }}>Voltar ao perfil</span>
          </Button>

          <Card className="border-0 mb-3" style={{ borderRadius: 12 }}>
            <Card.Body>
              <h5 style={{ margin: 0, fontWeight: 700, color: "#1f2937" }}>
                Minha galeria publica
              </h5>

              <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>
                Aqui ves apenas os teus badges com consentimento publico ativo.
              </div>
            </Card.Body>
          </Card>

          {loading && (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{ height: 180 }}
            >
              <Spinner animation="border" variant="primary" />
            </div>
          )}

          {!loading && erro && <Alert variant="danger">{erro}</Alert>}

          {!loading && !erro && badges.length === 0 && (
            <Alert variant="light" className="border">
              Ainda nao tens badges visiveis publicamente.
            </Alert>
          )}

          {!loading && !erro && badges.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 14,
              }}
            >
              {badges.map((badge, index) => {
                const idBadge = badge.id_badge_modelo || badge.id || index;
                const dataConsentimento = badge.data_consentimento
                  ? new Date(badge.data_consentimento).toLocaleDateString("pt-PT")
                  : "-";

                return (
                  <Card key={idBadge} className="border-0" style={{ borderRadius: 12 }}>
                    <Card.Body>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <BadgeImage
                          badge={badge}
                          alt={badge.nome_badge || badge.nome || "Badge"}
                          size={56}
                        />

                        <div>
                          <div style={{ fontWeight: 700, color: "#111827" }}>
                            {badge.nome_badge || badge.nome || "Badge"}
                          </div>

                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {Number(badge.pontos || 0)} pontos
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 10, fontSize: 12, color: "#475569" }}>
                        Consentimento ativo desde: <strong>{dataConsentimento}</strong>
                      </div>

                      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() =>
                            navigate(
                              `/badges/${userId}/${idBadge}`,
                              {
                                state: {
                                  backTo: "/perfil_consultor",
                                  backLabel: "Voltar ao perfil",
                                },
                              }
                            )
                          }
                        >
                          Ver
                        </Button>

                        {badge.linkedin_url && (
                          <a
                            href={badge.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 12,
                              color: "#2563eb",
                              fontWeight: 600,
                              paddingTop: 8,
                            }}
                          >
                            <HiOutlineExternalLink size={14} />
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          )}
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

export default MinhaGaleriaPublicaPage;
