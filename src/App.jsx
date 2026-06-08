import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import GaleriaBadgesPage from './pages/Galeria_Pública/GaleriaBadges.jsx';
import LoginPage from './pages/Login/login.jsx';
import RegisterPage from './pages/Login/register.jsx';
import AreaPage from './pages/Login/AreaRegister.jsx';
import PaginaPrincipal from './pages/Consultor/DashboardConsultor.jsx';
import PaginaPerfil from './pages/Consultor/PaginaPerfilConsultor.jsx';
import NotificacaoPage from './pages/Consultor/Notificacao.jsx';
import LembretePage from './pages/Consultor/Lembretes.jsx';
import ProgressoPage from './pages/Consultor/progresso_consultor.jsx';
import CatalogoBadgesPage from './pages/Consultor/catalogo_badges.jsx';
import PaginaPrincipalAdmin from './pages/Admin/Dashboard_Admin.jsx';
import HistoricoBadgesPage from './pages/Consultor/historico_badges.jsx';
import MeusBadgesPage from './pages/Consultor/meus_badges.jsx';
import BadgeDetailPage from './pages/Consultor/informacao_badge.jsx';
import SubmeterEvidenciasPage from './pages/Consultor/submissao_badge.jsx';
import CertificadoPage from './pages/Consultor/certificado.jsx';
import DefinicoesConsultorPage from './pages/Consultor/definicoes_consultor.jsx';
// Importa as outras páginas (Admin, Consultor, etc.)

function App() {
  const isAuthenticated = !!localStorage.getItem('token');
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/galeria-badges" element={<GaleriaBadgesPage />} />

        // Rotas públicas
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-area" element={<AreaPage />} />

        // Rotas Consultor
        <Route path="/pag_consultor" element={<PaginaPrincipal />} />
        <Route path="/perfil_consultor" element={<PaginaPerfil />} />
        <Route path="/notificacoes" element={<NotificacaoPage />} />
        <Route path="/lembretes" element={<LembretePage />} />
        <Route path="/progresso" element={<ProgressoPage />} />
        <Route path="/catalogo-badges" element={<CatalogoBadgesPage />} />
        <Route path="/historico_badges" element={<HistoricoBadgesPage />} />
        <Route path="/meus_badges" element={<MeusBadgesPage />} />
        <Route path="/badge-detalhe/:id" element={<BadgeDetailPage />} />
        <Route path="/submeter-evidencias/:id" element={<SubmeterEvidenciasPage />} />
        <Route path="/certificado/:id" element={<CertificadoPage />} />
        <Route path="/definicoes" element={<DefinicoesConsultorPage />} />
        // Rotas Admin
        <Route path="/admin" element={<PaginaPrincipalAdmin />} />

        <Route path="/admin/learning-paths" element={<div>Gestão de Learning Paths</div>} />
        <Route path="/admin/service-lines" element={<div>Gestão de Service Lines</div>} />
        <Route path="/admin/areas" element={<div>Gestão de Áreas</div>} />
        <Route path="/admin/badges" element={<div>Gestão de Badges</div>} />
        <Route path="/admin/avisos" element={<div>Informações Genéricas e Avisos</div>} />
        <Route path="/admin/rgpd" element={<div>Políticas de RGPD</div>} />
        <Route path="/admin/notificacoes" element={<div>Configurar notificações</div>} />
        <Route path="/admin/utilizadores" element={<div>Todos os Utilizadores</div>} />
        
      </Routes>
    </Router>
  );
}

export default App;