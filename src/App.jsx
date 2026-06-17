import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
// consultor
import GaleriaBadgesPage from './pages/Galeria_Pública/GaleriaBadges.jsx';
import LoginPage from './pages/Login/Login.jsx';
import RegisterPage from './pages/Login/Register.jsx';
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

//admin
import GestaoBadges from "./pages/Admin/gestao_badges.jsx";
import CriarBadges from "./pages/Admin/criar_badges.jsx";
import EditarBadges from "./pages/Admin/editar_badges.jsx";
import GestaoContas from "./pages/Admin/gestao_contas.jsx";
import EditarConta from "./pages/Admin/editar_contas.jsx";
import CriarConta from "./pages/Admin/criar_conta.jsx";
import GestaoServiceLines from "./pages/Admin/gestao_servicelines.jsx";
import CriarServiceLine from "./pages/Admin/criar_servicelines.jsx";
import EditarServiceLine from "./pages/Admin/editar_servicelines.jsx";
import GestaoAreas from "./pages/Admin/gestao_areas.jsx";
import CriarArea from "./pages/Admin/criar_areas.jsx";
import EditarArea from "./pages/Admin/editar_areas.jsx";
import GestaoRequisitos from "./pages/Admin/gestao_requisitos.jsx";
import GestaoLearningPaths from "./pages/Admin/gestao_learningpaths.jsx";
import CriarLearningPath from "./pages/Admin/criar_learningpaths.jsx";
import EditarLearningPath from "./pages/Admin/editar_learningpaths.jsx";
import InformacoesAvisos from "./pages/Admin/avisos_informacoes.jsx";
import PoliticasRGPD from "./pages/Admin/politicas_rgpd.jsx";
import EdicaoRGPD from "./pages/Admin/editar_politicas_rgpd.jsx";
import ConfigurarNotificacoes from "./pages/Admin/config_notificacao.jsx";
import PaginaNotificacoes from './pages/Consultor/Notificacao.jsx'; 

// Talent Manager
import TM_Dashboard from './pages/TalentManager/TM_DashBoard.jsx';

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

        {/* Rotas do Consultor */}
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
        <Route path="/admin/utilizadores" element={<div>Todos os Utilizadores</div>} />
        <Route path="/admin/contas" element={<GestaoContas />} />
        <Route path="/admin/contas/novo" element={<CriarConta />} />
        <Route path="/admin/contas/editar/:id" element={<EditarConta />} />
        <Route path="/admin/service-lines" element={<GestaoServiceLines />} />
        <Route path="/admin/service-lines/nova" element={<CriarServiceLine />} />
        <Route path="/admin/service-lines/editar/:id" element={<EditarServiceLine />} />
        <Route path="/admin/areas" element={<GestaoAreas />} />
        <Route path="/admin/areas/nova" element={<CriarArea />} />
        <Route path="/admin/areas/editar/:id" element={<EditarArea />} />
        <Route path="/admin/niveis/:idNivel/requisitos" element={<GestaoRequisitos />} />
        <Route path="/admin/learning-paths" element={<GestaoLearningPaths />} />
        <Route path="/admin/learning-paths/novo" element={<CriarLearningPath />} />
        <Route path="/admin/learning-paths/editar/:id" element={<EditarLearningPath />} />
        <Route path="/admin/avisos" element={<InformacoesAvisos />} />
        <Route path="/admin/rgpd" element={<PoliticasRGPD />} />
        <Route path="/admin/rgpd/editar" element={<EdicaoRGPD />} />
        <Route path="/admin/notificacoes" element={<ConfigurarNotificacoes />} />
        <Route path="/admin/badges" element={<GestaoBadges/>} />
        <Route path="/admin/badges/novo" element={<CriarBadge/>} />
        <Route path="/admin/badges/editar/:id" element={<EditarBadge />} />

        <Route path="/perfil" element={<PaginaPerfil />} />
        <Route path="/notificacoes" element={<PaginaNotificacoes />} />

        {/* Rotas para o Talent Manager */}
        <Route path="/talent_manager" element={<TM_Dashboard />} />

        {/* Rota de segurança: se o utilizador digitar qualquer coisa errada, vai para o login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;