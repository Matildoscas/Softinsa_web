import { useState, useEffect } from "react";
import { Button, Spinner, Alert } from 'react-bootstrap';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

import Header from '../../components/header.jsx';
import RightSidebar from '../../components/RightSidebar.jsx';
import LeftSidebar from '../../components/LeftSidebar.jsx';
import api from '../../services/api.js';

function NotificacaoPage() {
  const navigate = useNavigate();

  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      navigate("/login", { replace: true });
      return;
    }

    const user = JSON.parse(storedUser);
    const userId = user.id_utilizador || user.ID_UTILIZADOR;

    if (!userId) {
      navigate("/login", { replace: true });
      return;
    }

    api.get(`/notificacoes/${userId}`)
      .then((res) => {
        setNotificacoes(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Erro ao carregar notificações:", err);
        setErro("Não foi possível carregar as notificações.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftSidebar />

        <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
          <Button
            variant="link"
            className="d-flex align-items-center text-decoration-none p-0 mb-3"
            style={{ color: '#4A5568', fontSize: '1.1rem' }}
            onClick={() => navigate('/pag_consultor')}
          >
            <HiOutlineArrowLeft className="me-1" />
            <span style={{ fontWeight: '400' }}>Voltar</span>
          </Button>

          <h5 className="mb-3">Notificações</h5>

          {loading && (
            <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
              <Spinner animation="border" variant="primary" />
            </div>
          )}

          {erro && (
            <Alert variant="danger">{erro}</Alert>
          )}

          {!loading && !erro && notificacoes.length === 0 && (
            <Alert variant="light" className="border">
              Ainda não tem notificações.
            </Alert>
          )}

          {!loading && !erro && notificacoes.map((n) => (
            <NotificationCard
              key={n.id_notificacoes}
              title={n.tipo_notificacao || "Notificação"}
              desc={n.conteudo || ""}
              meta={n.estado_notificacao || "Enviada"}
              time={formatarDataRelativa(n.data_envio)}
            />
          ))}
        </div>

        <RightSidebar />
      </div>
    </div>
  );
}

function NotificationCard({ title, desc, meta, time }) {
  return (
    <div className="d-flex bg-white border rounded px-4 py-3 mb-2 gap-3" style={{ alignItems: "stretch" }}>
      <div className="d-flex flex-column align-items-center gap-1" style={{ minWidth: 80 }}>
        <div
          className="rounded-circle bg-secondary-subtle d-flex align-items-center justify-content-center"
          style={{ width: 44, height: 44 }}
        >
          🔔
        </div>

        <span className="text-muted text-center" style={{ fontSize: "0.72rem", lineHeight: 1.4 }}>
          {meta}
        </span>

        <span className="text-secondary text-center" style={{ fontSize: "0.70rem" }}>
          {time}
        </span>
      </div>

      <div className="border-start" />

      <div className="flex-grow-1 d-flex flex-column justify-content-center">
        <div className="fw-semibold text-dark" style={{ fontSize: "0.9rem" }}>
          {title}
        </div>
        <div className="text-muted" style={{ fontSize: "0.82rem" }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

function formatarDataRelativa(data) {
  if (!data) return "";

  const agora = new Date();
  const dataNotificacao = new Date(data);
  const diffMs = agora - dataNotificacao;

  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMin < 1) return "Agora mesmo";
  if (diffMin < 60) return `${diffMin} minuto(s) atrás`;
  if (diffHoras < 24) return `${diffHoras} hora(s) atrás`;
  if (diffDias < 7) return `${diffDias} dia(s) atrás`;

  return dataNotificacao.toLocaleDateString();
}

export default NotificacaoPage;