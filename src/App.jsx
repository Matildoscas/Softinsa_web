import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/login/Login.jsx';
import RegisterPage from './pages/login/Register.jsx';
import AreaPage from './pages/login/AreaRegister.jsx';
import PaginaPrincipal from './pages/consultor/DashboardConsultor.jsx';
import PaginaPerfil from './pages/consultor/PaginaPerfilConsultor.jsx';
import PaginaNotificacoes from './pages/consultor/Notificacao.jsx';

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