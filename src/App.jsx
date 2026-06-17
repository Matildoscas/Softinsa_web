import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pastas com Maiúsculas e ficheiros em PascalCase (Alinhado com as tuas pastas reais)
import LoginPage from './pages/Login/Login.jsx';
import RegisterPage from './pages/Login/Register.jsx';
import AreaPage from './pages/Login/AreaRegister.jsx';
import PaginaPrincipal from './pages/Consultor/DashboardConsultor.jsx';
import PaginaPerfil from './pages/Consultor/PaginaPerfilConsultor.jsx';
import PaginaNotificacoes from './pages/Consultor/Notificacao.jsx'; 
import TM_Dashboard from './pages/TalentManager/TM_Dashboard.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirecionamento inicial para o login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Rotas Diretas sem lógica condicional no Router para evitar loops */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-area" element={<AreaPage />} />

        {/* Rotas do Consultor */}
        <Route path="/pag_consultor" element={<PaginaPrincipal />} />
        <Route path="/perfil" element={<PaginaPerfil />} />
        <Route path="/notificacoes" element={<PaginaNotificacoes />} />

        {/* Rotas para o Talent Manager */}
        <Route path="/talent_manager/dashboard" element={<TM_Dashboard />} />

        {/* Rota de segurança: se o utilizador digitar qualquer coisa errada, vai para o login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;