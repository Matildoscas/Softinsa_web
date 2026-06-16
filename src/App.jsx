import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
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

import GestaoContas from "./pages/admin/gestao_contas.jsx";
import EditarConta from "./pages/admin/editar_contas.jsx";
import CriarConta from "./pages/admin/criar_conta.jsx";
import GestaoServiceLines from "./pages/admin/gestao_servicelines.jsx";
import CriarServiceLine from "./pages/admin/criar_servicelines.jsx";
import EditarServiceLine from "./pages/admin/editar_servicelines.jsx";
import GestaoAreas from "./pages/admin/gestao_areas.jsx";
import CriarArea from "./pages/admin/criar_areas.jsx";
import EditarArea from "./pages/admin/editar_areas.jsx";
import GestaoRequisitos from "./pages/admin/gestao_requisitos.jsx";
import GestaoLearningPaths from "./pages/admin/gestao_learningpaths.jsx";
import CriarLearningPath from "./pages/admin/criar_learningpaths.jsx";
import EditarLearningPath from "./pages/admin/editar_learningpaths.jsx";
import InformacoesAvisos from "./pages/admin/avisos_informacoes.jsx";
import PoliticasRGPD from "./pages/admin/politicas_rgpd.jsx";
import EdicaoRGPD from "./pages/admin/editar_politicas_rgpd.jsx";
import ConfigurarNotificacoes from "./pages/admin/config_notificacao.jsx";

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

        <Route path="/admin/badges" element={<div>Gestão de Badges</div>} />
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

      </Routes>
    </Router>
  );
}

export default App;