import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import './App.css';

import ConfiguracaoSLA from './pages/Admin/config_sla.jsx';
import ConfigurarNotificacoes from './pages/Admin/config_notificacao.jsx';
import CriarArea from './pages/Admin/criar_areas.jsx';
import CriarBadge from './pages/Admin/criar_badges.jsx';
import CriarConta from './pages/Admin/criar_conta.jsx';
import CriarLearningPath from './pages/Admin/criar_learningpaths.jsx';
import CriarServiceLine from './pages/Admin/criar_servicelines.jsx';
import DashboardAdmin from './pages/Admin/Dashboard_Admin.jsx';
import EditarArea from './pages/Admin/editar_areas.jsx';
import EditarBadge from './pages/Admin/editar_badges.jsx';
import EditarConta from './pages/Admin/editar_contas.jsx';
import EditarLearningPath from './pages/Admin/editar_learningpaths.jsx';
import EditarServiceLine from './pages/Admin/editar_servicelines.jsx';
import GestaoAreas from './pages/Admin/gestao_areas.jsx';
import GestaoBadges from './pages/Admin/gestao_badges.jsx';
import GestaoContas from './pages/Admin/gestao_contas.jsx';
import GestaoLearningPaths from './pages/Admin/gestao_learningpaths.jsx';
import GestaoPedidosBadges from './pages/Admin/gestao_pedidos_badges.jsx';
import GestaoRequisitos from './pages/Admin/gestao_requisitos.jsx';
import GestaoServiceLines from './pages/Admin/gestao_servicelines.jsx';
import InformacoesAvisos from './pages/Admin/avisos_informacoes.jsx';
import PoliticasRGPD from './pages/Admin/politicas_rgpd.jsx';
import PerfilAdminPage from './pages/Admin/perfil_admin.jsx';
import DefinicoesAdminPage from './pages/Admin/definicoes_admin.jsx';

import CertificadoPage from './pages/Consultor/certificado.jsx';
import ConfiguracaoAssinaturaPage from './pages/Consultor/configuracao_assinatura.jsx';
import CatalogoBadgesPage from './pages/Consultor/catalogo_badges.jsx';
import DashboardConsultor from './pages/Consultor/DashboardConsultor.jsx';
import DesafiosConsultorPage from './pages/Consultor/desafios_consultor.jsx';
import DefinicoesConsultorPage from './pages/Consultor/definicoes_consultor.jsx';
import HistoricoBadgesPage from './pages/Consultor/historico_badges.jsx';
import IntegracaoSoftinsaPage from './pages/Consultor/integracao_softinsa.jsx';
import LembretePage from './pages/Consultor/Lembretes.jsx';
import MeusBadgesPage from './pages/Consultor/meus_badges.jsx';
import NotificacaoPage from './pages/Consultor/Notificacao.jsx';
import PaginaPerfil from './pages/Consultor/PaginaPerfilConsultor.jsx';
import ProgressoPage from './pages/Consultor/progresso_consultor.jsx';
import BadgeDetailPage from './pages/Consultor/informacao_badge.jsx';
import StatusCandidaturasConsultorPage from './pages/Consultor/status_candidaturas_consultor.jsx';
import SubmeterEvidenciasPage from './pages/Consultor/submissao_badge.jsx';

import BadgePublicoIndividualPage from './pages/Galeria_Pública/BadgePublicoIndividual.jsx';
import GaleriaBadgesPage from './pages/Galeria_Pública/GaleriaBadges.jsx';
import VerificarCertificadoPage from './pages/Galeria_Pública/VerificarCertificado.jsx';

import AtivarContaPage from './pages/Login/ativar_conta.jsx';
import AreaPage from './pages/Login/AreaRegister.jsx';
import ConfirmarEmailPage from './pages/Login/confirmar_email.jsx';
import LoginPage from './pages/Login/Login.jsx';
import RegisterPage from './pages/Login/Register.jsx';

import CatalogoBadgesSll from './pages/ServiceLineLeader/catalogo_badges_sll.jsx';
import DashboardSll from './pages/ServiceLineLeader/dashboard_sll.jsx';
import DefinicoesSllPage from './pages/ServiceLineLeader/definicoes_sll.jsx';
import DetalheSolicitacaoSll from './pages/ServiceLineLeader/detalhe_solicitacao_sll.jsx';
import GerarCertificadoSll from './pages/ServiceLineLeader/gerar_certificado_sll.jsx';
import GerarRelatorioSll from './pages/ServiceLineLeader/gerar_relatorio.jsx';
import HistoricoCandidaturasSll from './pages/ServiceLineLeader/historico_candidaturas_sll.jsx';
import InformacaoBadgeSll from './pages/ServiceLineLeader/informacao_badge_sll.jsx';
import InformacaoConsultorSll from './pages/ServiceLineLeader/informacao_consultor_sll.jsx';
import ListaConsultoresSll from './pages/ServiceLineLeader/lista_consultores_sll.jsx';
import NotificacoesSllPage from './pages/ServiceLineLeader/notificacoes_sll.jsx';
import RankingBadgesSll from './pages/ServiceLineLeader/ranking_badges_sll.jsx';
import SolicitacoesBadgesSll from './pages/ServiceLineLeader/solicitacoes_badges_sll.jsx';
import StatusCandidaturasSllPage from './pages/ServiceLineLeader/status_candidaturas_sll.jsx';

import TM_AvaliacaoSolicitacao from './pages/TalentManager/TM_AvaliacaoSolicitacao.jsx';
import TM_badges_expiracao from './pages/TalentManager/TM_badges_expiracao.jsx';
import TM_catalogo_badges from './pages/TalentManager/TM_catalogo_badges.jsx';
import TM_Consultor from './pages/TalentManager/TM_Consultor.jsx';
import TM_criar_desafio from './pages/TalentManager/TM_criar_desafio.jsx';
import TM_DashBoard from './pages/TalentManager/TM_DashBoard.jsx';
import TM_Definicoes from './pages/TalentManager/TM_Definicoes.jsx';
import TM_detalhe_expiracao_badge from './pages/TalentManager/TM_detalhe_expiracao_badge.jsx';
import TM_DetalhesHistorico from './pages/TalentManager/TM_DetalhesHistorico.jsx';
import TM_gerar_certificado from './pages/TalentManager/TM_gerar_certificado.jsx';
import TM_gerar_relatorio from './pages/TalentManager/TM_gerar_relatorio.jsx';
import TM_HistoricoCandidaturas from './pages/TalentManager/TM_HistoricoCandidaturas.jsx';
import TM_informacao_badge from './pages/TalentManager/TM_informacao_badge.jsx';
import TM_informacao_consultor from './pages/TalentManager/TM_informacao_consultor.jsx';
import TM_notificacoes from './pages/TalentManager/TM_notificacoes.jsx';
import TM_Perfil from './pages/TalentManager/TM_Perfil.jsx';
import TM_Solicitacoes from './pages/TalentManager/TM_Solicitacoes.jsx';
import TM_statuscandidatura from './pages/TalentManager/TM_statuscandidatura.jsx';

function App() {
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
        <Route path="/pag_consultor" element={<DashboardConsultor />} />
        <Route path="/perfil_consultor" element={<PaginaPerfil />} />
        <Route path="/notificacoes" element={<NotificacaoPage />} />
        <Route path="/desafios" element={<DesafiosConsultorPage />} />
        <Route path="/lembretes" element={<LembretePage />} />
        <Route path="/progresso" element={<StatusCandidaturasConsultorPage />} />
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
        <Route path="/admin" element={<DashboardAdmin />} />
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
        <Route path="/admin/notificacoes" element={<ConfigurarNotificacoes />} />
        <Route path="/admin/badges" element={<GestaoBadges />} />
        <Route path="/admin/badges/novo" element={<CriarBadge />} />
        <Route path="/admin/badges/editar/:id" element={<EditarBadge />} />
        <Route path="/admin/pedidos-badges" element={<GestaoPedidosBadges />}/>
        <Route path="/admin/sla" element={<ConfiguracaoSLA />}/>
        <Route path="/admin/perfil" element={<PerfilAdminPage />} />
        <Route path="/admin/definicoes" element={<DefinicoesAdminPage />} />

        // Rotas Service Line Leader
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

        {/* Rotas para o Talent Manager */}
        <Route path="/tm" element={<TM_DashBoard />} />
        <Route path="/tm/CatalogoBadgesCaga" element={<TM_catalogo_badges />} />
        <Route path="/tm/Solicitacoes" element={<TM_Solicitacoes />} />
        <Route path="/tm/avaliacao/:id" element={<TM_AvaliacaoSolicitacao />} />
        <Route path="/tm/avaliacao-solicitacao/:id" element={<TM_AvaliacaoSolicitacao />} />
        <Route path="/tm/HistoricoCandidaturas" element={<TM_HistoricoCandidaturas />} />
        <Route path="/tm/detalhes-historico/:id" element={<TM_DetalhesHistorico />} />
        <Route path="/tm/perfilCaga" element={<TM_Perfil />} />
        <Route path="/tm/definicoes" element={<TM_Definicoes />} />
        <Route path="/tm/consultores" element={<TM_Consultor />} />
        <Route path="/tm/status-candidaturas" element={<TM_statuscandidatura />} />
        <Route path="/tm/badges" element={<TM_catalogo_badges />} />
        <Route path="/tm/badges/:idBadge" element={<TM_informacao_badge />} />
        <Route path="/tm/solicitacoesCaga" element={<TM_Solicitacoes />} />
        <Route path="/tm/solicitacoes23/:idCandidatura" element={<TM_AvaliacaoSolicitacao />} />
        <Route path="/tm/consultores/:idConsultor" element={<TM_informacao_consultor />} />
        <Route path="/tm/historico" element={<TM_HistoricoCandidaturas />} />
        <Route path="/tm/historico/:idHistorico" element={<TM_DetalhesHistorico />} />
        <Route path="/tm/expiracao" element={<TM_badges_expiracao />} />
        <Route path="/tm/expiracao/:idBadgeAtribuido" element={<TM_detalhe_expiracao_badge />} />
        <Route path="/tm/relatorios" element={<TM_gerar_relatorio />} />
        <Route path="/tm/consultorescaga" element={<TM_Consultor />} />
        <Route path="/tm/notificacoes" element={<TM_notificacoes />} />
        <Route path="/tm/definicoescaga" element={<TM_Definicoes />} />
        <Route path="/tm/perfil" element={<TM_Perfil />} />
        <Route path="/tm/certificados" element={<TM_gerar_certificado />} />
        <Route path="/tm/desafios/novo" element={<TM_criar_desafio />} />

      </Routes>
    </Router>
  );
}

export default App;