import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/login.jsx';
import RegisterPage from './pages/Login/register.jsx';
import AreaPage from './pages/Login/area_register.jsx';
import PaginaPrincipal from './pages/Consultor/Dashboard_Consultor.jsx';
import PaginaPerfil from './pages/Consultor/PaginaPerfil_Consultor.jsx';
// Importa as outras páginas (Admin, Consultor, etc.)

function App() {
  return (
    <Router>
      <Routes>
        // Redirecionamento para login
        <Route path="/" element={<Navigate to="/login" />} />

        // Rotas públicas
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-area" element={<AreaPage />} />

        // Rotas Consultor
        <Route path="/pag_consultor" element={<PaginaPrincipal />} />
        <Route path="/perfil_consultor" element={<PaginaPerfil />} />
        
      </Routes>
    </Router>
  );
}

export default App;