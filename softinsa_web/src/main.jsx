import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PaginaPrincipal from './PaginaPrincipal.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import LoginPage from './login.jsx';
import RegisterPage from './register.jsx';
import AreaPage from './areas.jsx'
import NotificacaoPage from './notificacao.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NotificacaoPage />
  </StrictMode>,
)
