import React, { useState, useEffect } from 'react';
import { BiBell, BiTask, BiHistory, BiChevronRight, BiBadgeCheck } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Componente reutilizável para as Métricas Reais do TM
function IndicadorMetricaReal({ title, count, type, onClick }) {
    const getStyles = () => {
        switch(type) {
            case 'history': return { bg: '#f8fafc', iconColor: '#475569', icon: <BiHistory size={18} /> };
            default: return { bg: '#eff6ff', iconColor: '#2563eb', icon: <BiTask size={18} /> };
        }
    };

    const styles = getStyles();

    return (
        <div 
            onClick={onClick}
            style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '12px',
                background: 'white', 
                border: '1px solid #e5e7eb', 
                borderRadius: '12px', 
                padding: '12px', 
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'system-ui, sans-serif'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div style={{ 
                width: '36px', 
                height: '36px', 
                backgroundColor: styles.bg, 
                borderRadius: '10px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: styles.iconColor,
                flexShrink: 0
            }}>
                {styles.icon}
            </div>
            
            <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase' }}>
                    {title}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1f2937', marginTop: '1px' }}>
                    {count}
                </div>
            </div>
            <BiChevronRight size={16} color="#9ca3af" />
        </div>
    );
}

function RightSidebarTM() {
  const navigate = useNavigate();
  
  // Estados Reais vindos da BD
  const [totalPendentes, setTotalPendentes] = useState(0);
  const [totalHistorico, setTotalHistorico] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token"); // 🚀 1. Vai buscar o token

  // Se não houver utilizador ou token, não faz os pedidos
  if (!storedUser || !token) return;

  const user = JSON.parse(storedUser);
  const userId = user.id_utilizador;

  if (!userId) return;

  setLoading(true);

  // 🚀 2. Cria a configuração com o cabeçalho de autorização
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // 📡 1. Procura as Candidaturas Ativas na BD (Passando a config)
  const fetchSolicitacoes = api.get("/candidaturas/tm/candidaturas", config)
    .then(res => {
      const dados = Array.isArray(res.data) ? res.data : [];
      setTotalPendentes(dados.length);
    })
    .catch(err => console.error("Erro ao carregar contagem de solicitações:", err));

  // 📡 2. Procura o Histórico Geral na BD (Passando a config)
  const fetchHistorico = api.get("/candidaturas/tm/historico", config)
    .then(res => {
      const dados = Array.isArray(res.data) ? res.data : [];
      setTotalHistorico(dados.length);
    })
    .catch(err => console.error("Erro ao carregar contagem do histórico:", err));

  // 📡 3. Procura as Notificações Reais (Passando a config)
  const fetchNotificacoes = api.get(`/notificacoes/${userId}`, config)
    .then(res => {
      setNotifications(
        (Array.isArray(res.data) ? res.data : [])
          .sort((a, b) => {
            const dataA = new Date(a.data_envio || a.DATA_ENVIO || 0).getTime();
            const dataB = new Date(b.data_envio || b.DATA_ENVIO || 0).getTime();
            return dataB - dataA;
          })
          .slice(0, 5)
      );
    })
    .catch(err => console.error("Erro ao carregar notificações do TM:", err));

  // Desliga os loadings quando todas as promessas da BD terminarem
  Promise.all([fetchSolicitacoes, fetchHistorico, fetchNotificacoes])
    .finally(() => setLoading(false));

}, []);

  const containerStyle = { 
    width: '260px', 
    background: '#ffffff', 
    borderLeft: '1px solid #e9ecef', 
    padding: '24px 16px', 
    flexShrink: 0, 
    overflowY: 'auto', 
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    fontFamily: 'system-ui, sans-serif',
    minHeight: 'calc(100vh - 52px)' // Compensa exatamente a altura do teu Header
  };

  return (
    <div style={containerStyle}>
      
      {/* 📊 SEÇÃO 1: MÉTRICAS OPERACIONAIS DO POSTGRESQL */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Painel Operacional
        </div>
        
        <IndicadorMetricaReal 
          title="Pedidos por Analisar" 
          count={loading ? "..." : totalPendentes} 
          type="pending"
          onClick={() => navigate('/tm/Solicitacoes')}
        />
        
        <IndicadorMetricaReal 
          title="Total de Histórico" 
          count={loading ? "..." : totalHistorico} 
          type="history"
          onClick={() => navigate('/tm/HistoricoCandidaturas')}
        />
      </div>

      {/* 🔔 SEÇÃO 2: NOTIFICAÇÕES EM TEMPO REAL */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#adb5bd', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Notificações Recentes
        </div>
        
        {notifications.length > 0 ? (
          // Mostra as 5 notificações mais antigas para manter consistência no produto
          notifications.map((n, i) => (
            <div 
                key={i} 
                style={{ 
                    border: '1px solid #e9ecef', 
                    borderRadius: '12px', 
                    padding: '12px', 
                    marginBottom: '8px', 
                    display: 'flex', 
                    gap: '10px',
                    backgroundColor: '#ffffff'
                }}
            >
              <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  background: '#f1f3f5', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0 
              }}>
                <BiBell size={13} color="#495057" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '500', color: '#212529', lineHeight: '1.3', wordBreak: 'break-word' }}>
                    {n.conteudo}
                </div>
                <div style={{ fontSize: '10px', color: '#adb5bd', marginTop: '4px' }}>
                  {new Date(n.data_envio).toLocaleDateString('pt-PT')}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '30px 10px', 
            background: '#f8f9fa', 
            borderRadius: '12px', 
            border: '1px dashed #dee2e6',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}>
            <BiBadgeCheck size={20} color="#adb5bd" />
            <span style={{ fontSize: '12px', color: '#6c757d', fontWeight: '500' }}>Tudo em dia!</span>
            <span style={{ fontSize: '11px', color: '#adb5bd' }}>Sem alertas pendentes.</span>
          </div>
        )}
      </div>

      {/* Link de saída na base da barra */}
      <div style={{ borderTop: '1px solid #f1f3f5', paddingTop: '12px', textAlign: 'right' }}>
        <span 
            onClick={() => navigate('/tm/notificacoes')} 
            style={{ fontSize: '12px', color: '#0d6efd', cursor: 'pointer', fontWeight: '600' }}
        >
            Ver Notificações
        </span>
      </div>

    </div>
  );
}

export default RightSidebarTM;