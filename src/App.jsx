import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/login.jsx';
import RegisterPage from './pages/Login/register.jsx';
import AreaPage from './pages/Login/area_register.jsx';
import PaginaPrincipal from './pages/Consultor/Dashboard_Consultor.jsx';
import PaginaPerfil from './pages/Consultor/PaginaPerfil_Consultor.jsx';
import NotificacaoPage from './pages/Consultor/notificacao.jsx';
import LembretePage from './pages/Consultor/lembretes.jsx';
import ProgressoPage from './pages/Consultor/progresso_consultor.jsx';
import CatalogoBadgesPage from './pages/Consultor/catalogo_badges.jsx';
import PaginaPrincipalAdmin from './pages/Admin/Dashboard_Admin.jsx';
import HistoricoBadgesPage from './pages/Consultor/historico_badges.jsx';
// Importa as outras páginas (Admin, Consultor, etc.)

function App() {
  const isAuthenticated = !!localStorage.getItem('token');
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

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

        // Rotas Admin
        // <Route path="/pag_admin" element={<PaginaPrincipalAdmin />} />
        
      </Routes>
    </Router>
  );
}

export default App;