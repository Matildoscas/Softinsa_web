import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Spinner } from "react-bootstrap";
import { HiOutlineArrowLeft } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

import Header from "../../components/Header.jsx";
import LeftSidebar from "../../components/LeftSidebar.jsx";
import RightSidebar from "../../components/RightSidebar.jsx";
import api from "../../services/api.js";

function obterUtilizador() {
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

function normalizarEstado(valor) {
  const estado = String(valor || "PENDENTE").toUpperCase();
  return estado.replace(/_/g, " ");
}

export default function DesafiosConsultorPage() {
  const navigate = useNavigate();
  const [desafios, setDesafios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState("");

  const utilizador = obterUtilizador();
  const idConsultor =
    utilizador?.id_utilizador ||
    utilizador?.ID_UTILIZADOR ||
    utilizador?.id ||
    null;

  async function carregarDesafios() {
    if (!idConsultor) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      const response = await api.get(`/lembretes/consultor/${idConsultor}`);
      const todos = Array.isArray(response.data?.todos) ? response.data.todos : [];

      setDesafios(
        todos.filter(
          (item) => String(item.tipo_lembrete || "").toUpperCase() === "DESAFIO_TM"
        )
      );
    } catch (err) {
      setErro(err.response?.data?.error || "Nao foi possivel carregar os desafios.");
      setDesafios([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    carregarDesafios();
  }, []);

  const ativos = useMemo(
    () =>
      desafios.filter((desafio) => {
        const estado = String(desafio.estado_lembrete || "").toUpperCase();
        return !estado.includes("CONCLUID") && !estado.includes("RECUS") && !estado.includes("CANCEL");
      }),
    [desafios]
  );

  const historico = useMemo(
    () => desafios.filter((desafio) => !ativos.some((item) => item.id_lembrete === desafio.id_lembrete)),
    [desafios, ativos]
  );

  return (
    <div style={pagina}>
      <Header />

      <div style={corpo}>
        <LeftSidebar />

        <main style={conteudo}>
          <button type="button" onClick={() => navigate("/pag_consultor")} style={voltarButton}>
            <HiOutlineArrowLeft size={18} />
            Voltar
          </button>

          <h1 style={titulo}>Desafios</h1>
          <div style={subtitulo}>Aqui encontras todos os desafios recebidos e o respetivo estado.</div>

          {erro && <Alert variant="danger">{erro}</Alert>}

          {isLoading ? (
            <div style={loadingBox}>
              <Spinner animation="border" size="sm" />
              A carregar desafios...
            </div>
          ) : (
            <>
              <section style={secao}>
                <div style={secaoTitulo}>Ativos ({ativos.length})</div>

                {ativos.length === 0 ? (
                  <div style={vazio}>Sem desafios ativos.</div>
                ) : (
                  ativos.map((desafio) => (
                    <article key={desafio.id_lembrete} style={card}>
                      <div style={linhaTopo}>
                        <strong>{desafio.titulo || "Desafio"}</strong>
                        <Badge bg="info">{normalizarEstado(desafio.estado_lembrete)}</Badge>
                      </div>

                      <div style={descricao}>{desafio.descricao || "Sem descricao."}</div>

                      <div style={meta}>
                        Badge: <strong>{desafio.nome_badge || "Sem badge associado"}</strong>
                      </div>

                      <div style={acoes}>
                        <button
                          type="button"
                          style={linkBtn}
                          onClick={() =>
                            desafio.id_badge_modelo
                              ? navigate(`/badge-detalhe/${desafio.id_badge_modelo}`)
                              : undefined
                          }
                          disabled={!desafio.id_badge_modelo}
                        >
                          Ver detalhe do badge
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </section>

              <section style={secao}>
                <div style={secaoTitulo}>Concluidos e recusados ({historico.length})</div>

                {historico.length === 0 ? (
                  <div style={vazio}>Sem historico de desafios.</div>
                ) : (
                  historico.map((desafio) => (
                    <article key={desafio.id_lembrete} style={cardHistorico}>
                      <div style={linhaTopo}>
                        <strong>{desafio.titulo || "Desafio"}</strong>
                        <Badge bg="secondary">{normalizarEstado(desafio.estado_lembrete)}</Badge>
                      </div>
                      <div style={descricao}>{desafio.descricao || "Sem descricao."}</div>
                    </article>
                  ))
                )}
              </section>
            </>
          )}
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

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
  padding: "24px 30px 48px",
};

const voltarButton = {
  border: "none",
  background: "transparent",
  color: "#2563eb",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
  padding: 0,
  marginBottom: 8,
};

const titulo = {
  margin: 0,
  fontSize: 24,
  fontWeight: 800,
  color: "#111827",
};

const subtitulo = {
  marginTop: 6,
  marginBottom: 18,
  color: "#64748b",
};

const secao = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 14,
  marginBottom: 14,
};

const secaoTitulo = {
  fontSize: 14,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 10,
};

const card = {
  border: "1px solid #dbeafe",
  background: "#f8fbff",
  borderRadius: 10,
  padding: 12,
  marginBottom: 10,
};

const cardHistorico = {
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  borderRadius: 10,
  padding: 12,
  marginBottom: 10,
};

const linhaTopo = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};

const descricao = {
  fontSize: 13,
  color: "#334155",
  marginTop: 8,
};

const meta = {
  fontSize: 12,
  color: "#475569",
  marginTop: 8,
};

const acoes = {
  marginTop: 10,
};

const linkBtn = {
  border: "none",
  background: "transparent",
  color: "#1d4ed8",
  fontSize: 13,
  fontWeight: 700,
  padding: 0,
  cursor: "pointer",
};

const vazio = {
  border: "1px dashed #cbd5e1",
  background: "#f8fafc",
  borderRadius: 10,
  padding: 14,
  color: "#64748b",
  fontSize: 13,
};

const loadingBox = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  color: "#475569",
};