import React, { useState, useEffect } from 'react';
import { Popover, ListGroup, Spinner } from 'react-bootstrap';
import { BiUserCircle } from 'react-icons/bi';
import api from '../services/api';

const NotificationPopover = React.forwardRef(({ style, ...props }, ref) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const userId = user.id_utilizador || user.ID_UTILIZADOR; // [cite: 105, 115]

      api.get(`/notificacoes/${userId}`)
        .then(res => {
          setNotifications(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Erro ao carregar notificações popover:", err);
          setLoading(false);
        });
    }
  }, []);

  // Função auxiliar para formatar a data (podes melhorar isto com a lib 'date-fns' depois)
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Popover 
      id="popover-notifications" 
      ref={ref} 
      style={{ ...style, width: '320px', maxWidth: 'none', borderRadius: '12px' }} 
      {...props} 
    >
      <Popover.Body className="p-1">
        <ListGroup variant="flush">
          {loading ? (
            <div className="text-center py-3"><Spinner size="sm" animation="border" /></div>
          ) : notifications.length > 0 ? (
            // Mostra apenas as 4 mais recentes no popover
            notifications.slice(0, 4).map((n, i) => (
              <ListGroup.Item key={n.id_notificacao || i} className="py-3 border-bottom">
                <div className="d-flex align-items-start gap-2">
                  <div className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 40, height: 40 }}>
                    <BiUserCircle size={30} color="#6c757d" />
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold" style={{ fontSize: '13px' }}>{n.conteudo || n.CONTEUDO}</h6>
                    <small className="text-muted d-block mb-1">
                      {formatTime(n.data_envio || n.DATA_ENVIO)}
                    </small>
                  </div>
                </div>
              </ListGroup.Item>
            ))
          ) : (
            <ListGroup.Item className="py-3 text-center text-muted small">
              Não tem notificações novas.
            </ListGroup.Item>
          )}

          <ListGroup.Item className="text-center py-2">
            <a href="/notificacoes" className="text-decoration-none small fw-bold" style={{ color: '#0056b3' }}>
              Ver todas as notificações
            </a>
          </ListGroup.Item>
        </ListGroup>
      </Popover.Body>
    </Popover>
  );
});

NotificationPopover.displayName = 'NotificationPopover';

export default NotificationPopover;