import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 🎯 CORRIGIDO: Pastas com 'L' e 'C' Maiúsculos para bater certo com o teu disco!
import LoginPage from './pages/Login/Login.jsx';
import RegisterPage from './pages/Login/Register.jsx';
import AreaPage from './pages/Login/AreaRegister.jsx';
import PaginaPrincipal from './pages/Consultor/DashboardConsultor.jsx';
import PaginaPerfil from './pages/Consultor/PaginaPerfilConsultor.jsx';
import PaginaNotificacoes from './pages/Consultor/Notificacao.jsx'; 

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirecionamento inicial para o login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Rota de Login com verificação de token */}
        <Route 
          path="/login" 
          element={
            localStorage.getItem('token') ? (
              <Navigate to="/pag_consultor" />
            ) : (
              <LoginPage />
            )
          } 
        />

        {/* Rotas Públicas de Registo */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-area" element={<AreaPage />} />

        {/* Rotas Protegidas do Consultor */}
        <Route path="/pag_consultor" element={<PaginaPrincipal />} />
        
        {/* Rotas componentes */}
        <Route path="/perfil" element={<PaginaPerfil />} />
        <Route path="/notificacoes" element={<PaginaNotificacoes />} />
        
      </Routes>
    </Router>
  );
}

export default App;