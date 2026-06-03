import React, { useState, useEffect } from 'react';
import { BiBell } from 'react-icons/bi';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

function BadgeCard({ name, points }) {
    return (
        <div style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', 
            background: 'white', border: '1px solid #e5e7eb', borderRadius: 20, 
            padding: '24px 0 16px 0', width: '100%', maxWidth: 350, textAlign: 'center', marginBottom: 12 
        }}>
            <div style={{ 
                width: 90, height: 90, backgroundColor: '#f0f7ff', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 35, marginBottom: 10, marginTop: -10
            }}>🥇</div>
            <div style={{ width: '100%', height: '1px', backgroundColor: '#f3f4f6', marginBottom: 6 }} />
            <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{name}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{points} Pontos</div>
            </div>
        </div>
    );
}

function RightSidebar() {
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [badges, setBadges] = useState([]);
  
  const showBadges = location.pathname === '/notificacoes' || location.pathname === '/lembretes';

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) return;

    const user = JSON.parse(storedUser);
    const userId = user.id_utilizador || user.ID_UTILIZADOR;

    if (!userId) return;

    api.get(`/notificacoes/${userId}`)
      .then(res => {
        setNotifications(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => console.error("Erro ao carregar notificações:", err));

    api.get(`/badges/conquistados/${userId}`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];

        const badgesUnicos = data.filter(
          (badge, index, self) =>
            index === self.findIndex(
              (b) =>
                String(b.id || b.id_badge_modelo) ===
                String(badge.id || badge.id_badge_modelo)
            )
        );

        setBadges(badgesUnicos);
      })
      .catch(err => console.error("Erro ao carregar badges:", err));
  }, [location.pathname]);

  const containerStyle = { 
    width: 250, background: 'white', borderLeft: '1px solid #e5e7eb', 
    padding: 16, flexShrink: 0, overflowY: 'auto', textAlign: 'left' 
  };

  if (showBadges) {
    return (
      <div style={containerStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', marginBottom: 12 }}>Os meus Badges</div>
        {badges.length > 0 ? (
          badges.slice(0, 3).map((b, i) => (
            <BadgeCard
              key={b.id || b.id_badge_modelo || i}
              name={b.nome || b.nome_badge || b.NOME || "Badge"}
              points={b.pontos || 0}
            />
          ))
        ) : (
          <div style={{ fontSize: 12, color: '#9ca3af' }}>Sem badges conquistados.</div>
        )}
        <div style={{ textAlign: 'right' }}>
          <a href="/catalogo-badges" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>Ver catálogo</a>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#2563eb', marginBottom: 12 }}>Notificações</div>
      {notifications.length > 0 ? (
        notifications.map((n, i) => (
          <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', marginBottom: 8, display: 'flex', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BiBell size={12} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{n.conteudo || n.CONTEUDO}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                {new Date(n.data_envio || n.DATA_ENVIO).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div style={{ fontSize: 12, color: '#9ca3af' }}>Sem notificações novas.</div>
      )}
      <div style={{ textAlign: 'right' }}>
        <a href="/notificacoes" style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>Ver todas</a>
      </div>
    </div>
  );
}

export default RightSidebar;