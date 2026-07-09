import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import GaleriaBadgesPage from './pages/Galeria_Pública/GaleriaBadges.jsx';
import LoginPage from './pages/Login/Login.jsx';
import RegisterPage from './pages/Login/Register.jsx';
import AreaPage from './pages/Login/AreaRegister.jsx';
import BadgePublicoIndividualPage from './pages/Galeria_Pública/BadgePublicoIndividual.jsx';
import VerificarCertificadoPage from './pages/Galeria_Pública/VerificarCertificado.jsx';
import ConfirmarEmailPage from './pages/Login/confirmar_email.jsx';
import AtivarContaPage from './pages/Login/ativar_conta.jsx';

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
import ConfiguracaoAssinaturaPage from './pages/Consultor/configuracao_assinatura.jsx';
import IntegracaoSoftinsaPage from './pages/Consultor/integracao_softinsa.jsx';
import StatusCandidaturasConsultorPage from './pages/Consultor/status_candidaturas_consultor.jsx';
import ConfiguracaoSLA from "./pages/Admin/config_sla.jsx";

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
import GestaoBadges from "./pages/Admin/gestao_badges.jsx";
import CriarBadge from "./pages/Admin/criar_badges.jsx";
import EditarBadge from "./pages/Admin/editar_badges.jsx";
import GestaoPedidosBadges from "./pages/Admin/gestao_pedidos_badges.jsx";

import DashboardSll from "./pages/ServiceLineLeader/dashboard_sll.jsx";
import CatalogoBadgesSll from "./pages/ServiceLineLeader/catalogo_badges_sll.jsx";
import InformacaoBadgeSll from "./pages/ServiceLineLeader/informacao_badge_sll.jsx";
import SolicitacoesBadgesSll from "./pages/ServiceLineLeader/solicitacoes_badges_sll.jsx";
import DetalheSolicitacaoSll from "./pages/ServiceLineLeader/detalhe_solicitacao_sll.jsx";
import RankingBadgesSll from "./pages/ServiceLineLeader/ranking_badges_sll.jsx";
import HistoricoCandidaturasSll from "./pages/ServiceLineLeader/historico_candidaturas_sll.jsx";
import GerarCertificadoSll from "./pages/ServiceLineLeader/gerar_certificado_sll.jsx";
import GerarRelatorioSll from "./pages/ServiceLineLeader/gerar_relatorio.jsx";
import ListaConsultoresSll from "./pages/ServiceLineLeader/lista_consultores_sll.jsx";
import InformacaoConsultorSll from "./pages/ServiceLineLeader/informacao_consultor_sll.jsx";
import DefinicoesSllPage from "./pages/ServiceLineLeader/definicoes_sll.jsx";
import NotificacoesSllPage from "./pages/ServiceLineLeader/notificacoes_sll.jsx";
import StatusCandidaturasSllPage from "./pages/ServiceLineLeader/status_candidaturas_sll.jsx";

import DashboardTm from "./pages/TalentManager/dashboard_tm.jsx";
import CatalogoBadgesTm from "./pages/TalentManager/catalogo_badges_tm.jsx";
import InformacaoBadgeTm from "./pages/TalentManager/informacao_badge_tm.jsx";
import SolicitacoesBadgesTm from "./pages/TalentManager/solicitacoes_badges_tm.jsx";
import AvaliacaoBadgeTm from "./pages/TalentManager/avaliacao_badge_tm.jsx";
import InformacaoConsultorTm from "./pages/TalentManager/informacao_consultor_tm.jsx";
import HistoricoCandidaturasTm from "./pages/TalentManager/historico_candidaturas_tm.jsx";
import DetalheHistoricoTm from "./pages/TalentManager/detalhe_historico_tm.jsx";
import BadgesExpiracaoTm from "./pages/TalentManager/badges_expiracao_tm.jsx";
import DetalheExpiracaoBadgeTm from "./pages/TalentManager/detalhe_expiracao_badge_tm.jsx";
import GerarRelatorioTm from "./pages/TalentManager/gerar_relatorio_tm.jsx";
import ListaConsultoresTm from "./pages/TalentManager/lista_consultores_tm.jsx";
import NotificacoesTm from "./pages/TalentManager/notificacoes_tm.jsx";
import DefinicoesTm from "./pages/TalentManager/definicoes_tm.jsx";
import PerfilTm from "./pages/TalentManager/perfil_tm.jsx";
import GerarCertificadoTm from "./pages/TalentManager/gerar_certificado_tm.jsx";
import CriarDesafioTm from "./pages/TalentManager/criar_desafio_tm.jsx";


function App() {
  const isAuthenticated = !!localStorage.getItem('token');
  return (
    <Router>
      <Routes>
        
        // Rotas públicas
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/galeria-badges" element={<GaleriaBadgesPage />} />
        <Route path="/badges/:userId/:badgeId" element={<BadgePublicoIndividualPage />}/>
        <Route path="/verificar/:codigo" element={<VerificarCertificadoPage />}/>

        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-area" element={<AreaPage />} />
        <Route path="/confirmar-email" element={<ConfirmarEmailPage />}/>
        <Route path="/ativar-conta" element={<AtivarContaPage />}/>

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
        <Route path="/configurar-assinatura" element={<ConfiguracaoAssinaturaPage />} />
        <Route path="/softinsa" element={<IntegracaoSoftinsaPage />} />
        <Route path="/status-candidaturas" element={<StatusCandidaturasConsultorPage />} />
        
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
        <Route path="/admin/badges" element={<GestaoBadges />} />
        <Route path="/admin/badges/novo" element={<CriarBadge />} />
        <Route path="/admin/badges/editar/:id" element={<EditarBadge />} />
        <Route path="/admin/pedidos-badges" element={<GestaoPedidosBadges />}/>
        <Route path="/admin/sla" element={<ConfiguracaoSLA />}/>

        <Route path="/sll" element={<DashboardSll />} />
        <Route path="/sll/badges" element={<CatalogoBadgesSll />} />
        <Route path="/sll/badges/:id" element={<InformacaoBadgeSll />}/>
        <Route path="/sll/solicitacoes" element={<SolicitacoesBadgesSll />} />
        <Route path="/sll/solicitacoes/:idCandidatura" element={<DetalheSolicitacaoSll />}/>
        <Route path="/sll/ranking" element={<RankingBadgesSll />} />
        <Route path="/sll/historico-candidaturas" element={<HistoricoCandidaturasSll />}/>
        <Route path="/sll/certificados" element={<GerarCertificadoSll />} />
        <Route path="/sll/relatorios" element={<GerarRelatorioSll />} />
        <Route path="/sll/consultores" element={<ListaConsultoresSll />}/>
        <Route path="/sll/consultores/:idConsultor" element={<InformacaoConsultorSll />}/>
        <Route path="/sll/definicoes" element={<DefinicoesSllPage />}/>
        <Route path="/sll/notificacoes" element={<NotificacoesSllPage />}/>
        <Route path="/sll/status-candidaturas" element={<StatusCandidaturasSllPage />}/>

        <Route path="/tm" element={<DashboardTm />} />
        <Route path="/tm/badges" element={<CatalogoBadgesTm />}/>
        <Route path="/tm/badges/:idBadge" element={<InformacaoBadgeTm />}/>
        <Route path="/tm/solicitacoes" element={<SolicitacoesBadgesTm />}/>
        <Route path="/tm/solicitacoes/:idCandidatura" element={<AvaliacaoBadgeTm />}/>
        <Route path="/tm/consultores/:idConsultor" element={<InformacaoConsultorTm />}/>
        <Route path="/tm/historico" element={<HistoricoCandidaturasTm />}/>
        <Route path="/tm/historico/:idHistorico" element={<DetalheHistoricoTm />}/>
        <Route path="/tm/expiracao" element={<BadgesExpiracaoTm />}/>
        <Route path="/tm/expiracao/:idBadgeAtribuido" element={<DetalheExpiracaoBadgeTm />}/>
        <Route path="/tm/relatorios" element={<GerarRelatorioTm />}/>
        <Route path="/tm/consultores" element={<ListaConsultoresTm />}/>
        <Route path="/tm/notificacoes" element={<NotificacoesTm />}/>
        <Route path="/tm/definicoes" element={<DefinicoesTm />}/>
        <Route path="/tm/perfil" element={<PerfilTm />}/>
        <Route path="/tm/certificados" element={<GerarCertificadoTm />}/>
        <Route path="/tm/desafios/novo" element={<CriarDesafioTm />}/>

      </Routes>
    </Router>
  );
}

export default App;