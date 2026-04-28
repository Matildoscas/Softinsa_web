import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importação das suas páginas
import PaginaPrincipal from './PaginaPrincipal.jsx';
import LoginPage from './login.jsx';
import RegisterPage from './register.jsx';
import AreaPage from './areas.jsx';
import NotificacaoPage from './notificacao.jsx';
import LembretePage from './lembretes.jsx';
import PaginaPerfil from './PaginaPerfil.jsx';

// O componente App centraliza as rotas
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PaginaPrincipal />} />
        <Route path="/notificacoes" element={<NotificacaoPage />} />
        <Route path="/lembretes" element={<LembretePage />} />
        <Route path="/perfil" element={<PaginaPerfil />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/areas" element={<AreaPage />} />
      </Routes>
    </Router>
  );
}

// O render deve chamar o componente <App />
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);