import React from "react";
import { Link } from "react-router-dom";

import {
  Award,
  BadgeCheck,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  FileText,
  Globe2,
  Layers3,
  MailCheck,
  Network,
  Rocket,
  Server,
  Share2,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";

import logoImg from "../../assets/logo.png";
import "./MicrositeProjeto.css";

const corAzul = "#4470AF";

const perfis = [
  {
    titulo: "Consultor",
    texto:
      "Perfil responsável por consultar badges, submeter evidências, acompanhar candidaturas, visualizar progresso, obter certificados e partilhar conquistas.",
    itens: [
      "Catálogo de badges",
      "Upload de evidências",
      "Histórico e estado das candidaturas",
      "Certificados PDF/Excel",
      "Partilha no LinkedIn",
    ],
  },
  {
    titulo: "Talent Manager",
    texto:
      "Perfil responsável pela primeira validação das evidências submetidas pelos consultores, garantindo que os requisitos apresentados são válidos.",
    itens: [
      "Validação de evidências",
      "Histórico de candidaturas",
      "Relatórios e exportações",
      "Notificações de aprovação/rejeição",
      "Consulta de badges próximos da expiração",
    ],
  },
  {
    titulo: "Service Line Leader",
    texto:
      "Perfil responsável pela validação final das candidaturas da sua Service Line, acompanhando consultores, rankings e relatórios da sua área.",
    itens: [
      "Validação final de badges",
      "Ranking de consultores",
      "Dashboard da Service Line",
      "Relatórios por área/período",
      "Geração de certificados",
    ],
  },
  {
    titulo: "Administrador",
    texto:
      "Perfil de gestão global da plataforma, responsável por utilizadores, permissões, learning paths, service lines, áreas, badges, requisitos, RGPD e SLA.",
    itens: [
      "Gestão de utilizadores",
      "Gestão de badges e requisitos",
      "Gestão de Learning Paths",
      "Configuração de RGPD",
      "Configuração de SLA e notificações",
    ],
  },
];

const tecnologias = [
  {
    nome: "React",
    descricao: "Frontend web responsivo com páginas por perfil.",
  },
  {
    nome: "Node.js + Express",
    descricao: "Backend REST responsável pela lógica de negócio.",
  },
  {
    nome: "PostgreSQL",
    descricao: "Base de dados relacional com candidaturas, badges e histórico.",
  },
  {
    nome: "Flutter",
    descricao: "Aplicação mobile para o perfil Consultor.",
  },
  {
    nome: "Firebase / FCM",
    descricao: "Notificações push e integração mobile.",
  },
  {
    nome: "Render",
    descricao: "Deploy público da aplicação web e API.",
  },
  {
    nome: "Cloudinary",
    descricao: "Gestão e alojamento de imagens dos badges.",
  },
  {
    nome: "PDF / Excel",
    descricao: "Exportação de certificados, relatórios e dados.",
  },
];

const funcionalidades = [
  {
    icon: <Layers3 size={24} />,
    titulo: "Learning Paths",
    texto:
      "Organização da evolução profissional por Learning Path, Service Line, Área, Nível e Requisitos.",
  },
  {
    icon: <Award size={24} />,
    titulo: "Badges digitais",
    texto:
      "Cada badge representa competências certificadas através de requisitos e evidências aprovadas.",
  },
  {
    icon: <FileText size={24} />,
    titulo: "Submissão de evidências",
    texto:
      "O consultor submete certificados, diplomas, relatórios ou outros documentos para validação.",
  },
  {
    icon: <CheckCircle2 size={24} />,
    titulo: "Workflow de aprovação",
    texto:
      "A candidatura passa por validação do Talent Manager e depois pelo Service Line Leader.",
  },
  {
    icon: <BarChart3 size={24} />,
    titulo: "Gamificação",
    texto:
      "Sistema de pontos, rankings, métricas de progresso e celebração de marcos alcançados.",
  },
  {
    icon: <BadgeCheck size={24} />,
    titulo: "Certificados verificáveis",
    texto:
      "Cada badge aprovado gera certificado com código e link único de verificação pública.",
  },
  {
    icon: <Bell size={24} />,
    titulo: "Notificações",
    texto:
      "Notificações internas, push mobile, alertas de aprovação, rejeição e expiração de badges.",
  },
  {
    icon: <Share2 size={24} />,
    titulo: "Partilha externa",
    texto:
      "Galeria pública, página individual do badge e integração com LinkedIn/assinatura de email.",
  },
];

const requisitosMobile = [
  "Dashboard pessoal com progresso nos Learning Paths",
  "Catálogo de badges disponíveis",
  "Consulta de requisitos por badge",
  "Upload de evidências",
  "Status das candidaturas em tempo real",
  "Histórico de badges obtidos e em processo",
  "Pontos e métricas de progresso",
  "Badges especiais e marcos alcançados",
  "Recomendações de próximos badges",
  "Certificados personalizados em PDF",
  "Notificações de aprovação/rejeição",
  "Alertas de expiração",
  "Lembretes e objetivos",
  "Página pública/verificação por link único",
  "Competências certificadas detalhadas",
  "Timeline profissional",
  "Push de SLA ultrapassados",
];

function MicrositeProjeto({ mobileBlocked = false }) {
  const installUrlDefault = import.meta.env.VITE_APP_INSTALL_URL || "";
  const installUrlAndroid = import.meta.env.VITE_APP_INSTALL_URL_ANDROID || "";
  const installUrlIos = import.meta.env.VITE_APP_INSTALL_URL_IOS || "";
  const appDeepLink = import.meta.env.VITE_APP_DEEP_LINK || "";

  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isAndroid = /Android/i.test(userAgent);
  const isIos = /iPhone|iPad|iPod/i.test(userAgent);

  const installUrl =
    (isAndroid && installUrlAndroid) ||
    (isIos && installUrlIos) ||
    installUrlDefault;

  const hasInstallUrl = Boolean(installUrl);
  const hasDeepLink = Boolean(appDeepLink);

  const handleInstallClick = () => {
    if (!hasInstallUrl) {
      window.alert("URL de instalação ainda não foi configurada.");
      return;
    }

    window.location.href = installUrl;
  };

  const handleOpenAppClick = () => {
    if (!hasDeepLink) {
      window.alert("Deep link da app ainda não foi configurado.");
      return;
    }

    window.location.href = appDeepLink;
  };

  return (
    <main className="microsite">
      <header className="microsite-navbar">
        <Link to="/login" className="microsite-logo-area">
          <img src={logoImg} alt="Softinsa" />
        </Link>

        <nav className="microsite-nav-links">
          <a href="#projeto">Projeto</a>
          <a href="#perfis">Perfis</a>
          <a href="#arquitetura">Arquitetura</a>
          <a href="#mobile">Mobile</a>
          <a href="#tecnologias">Tecnologias</a>
        </nav>

        <div className="microsite-nav-actions">
          {mobileBlocked ? (
            <>
              {hasDeepLink && (
                <button type="button" className="btn-secundario" onClick={handleOpenAppClick}>
                  Abrir app
                </button>
              )}
              <button
                type="button"
                className="btn-primario"
                onClick={handleInstallClick}
                disabled={!hasInstallUrl}
              >
                {hasInstallUrl ? "Download da app" : "Download em breve"}
              </button>
            </>
          ) : (
            <>
              <Link to="/galeria-badges" className="btn-secundario">
                Galeria pública
              </Link>

              <Link to="/login" className="btn-primario">
                Entrar
              </Link>
            </>
          )}
        </div>
      </header>

      {mobileBlocked && (
        <section className="mobile-block-banner">
          <p>
            O acesso web está bloqueado em telemóvel. Para continuar, instala a app oficial.
          </p>
        </section>
      )}

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <Rocket size={16} />
            Projeto PINT 2025 · Plataforma de Badges
          </div>

          <h1>
            Plataforma de Badges Digitais da{" "}
            <span>Softinsa</span>
          </h1>

          <p>
            Uma solução web e mobile para certificar competências,
            acompanhar a evolução profissional dos consultores e
            transformar formação contínua em credenciais verificáveis.
          </p>

          <div className="hero-actions">
            <a href="#projeto" className="btn-hero-primary">
              Conhecer o projeto
            </a>

            <a href="#workflow" className="btn-hero-secondary">
              Ver workflow
            </a>
          </div>

          <div className="hero-stats">
            <div>
              <strong>4</strong>
              <span>perfis web</span>
            </div>
            <div>
              <strong>1</strong>
              <span>app mobile</span>
            </div>
            <div>
              <strong>26+</strong>
              <span>requisitos</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>foco em certificação</span>
            </div>
          </div>
        </div>

        <div className="hero-panel">
          <div className="mock-window">
            <div className="mock-topbar">
              <span />
              <span />
              <span />
            </div>

            <div className="mock-card blue">
              <div>
                <small>Softinsa Academy</small>
                <strong>Badge certificado</strong>
              </div>
              <Award size={34} />
            </div>

            <div className="mock-row">
              <div className="mock-icon">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <strong>Evidências aprovadas</strong>
                <span>Talent Manager validou requisitos</span>
              </div>
            </div>

            <div className="mock-row">
              <div className="mock-icon gold">
                <BadgeCheck size={18} />
              </div>
              <div>
                <strong>Validação final</strong>
                <span>Service Line Leader aprovou o badge</span>
              </div>
            </div>

            <div className="mock-progress">
              <div>
                <span>Progresso do Learning Path</span>
                <strong>82%</strong>
              </div>
              <div className="progress-line">
                <span style={{ width: "82%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="projeto" className="section">
        <div className="section-heading">
          <span>Contexto</span>
          <h2>O problema que o projeto resolve</h2>
          <p>
            A Softinsa precisava de uma plataforma capaz de evidenciar
            competências adquiridas, validar formações externas,
            motivar a aprendizagem contínua e disponibilizar
            credenciais profissionais verificáveis.
          </p>
        </div>

        <div className="problem-grid">
          <InfoCard
            icon={<ShieldCheck />}
            title="Validação de competências"
            text="As competências dos consultores deixam de depender apenas de registos dispersos e passam a ser comprovadas por evidências e validações."
          />

          <InfoCard
            icon={<BarChart3 />}
            title="Gamificação"
            text="A atribuição de pontos, rankings e marcos ajuda a estimular formação contínua e crescimento profissional."
          />

          <InfoCard
            icon={<Globe2 />}
            title="Credenciais públicas"
            text="Cada badge pode ter uma página pública e um link de verificação, aumentando a visibilidade das competências da empresa."
          />
        </div>
      </section>

      <section className="section section-soft">
        <div className="two-columns">
          <div>
            <span className="eyebrow">Estrutura funcional</span>
            <h2>Learning Paths, Service Lines, Áreas e Níveis</h2>
            <p>
              A plataforma organiza a progressão técnica através de
              Learning Paths. Cada Learning Path pode conter várias
              Service Lines, cada Service Line contém Áreas, e cada Área
              possui níveis de progressão associados a requisitos.
            </p>

            <p>
              Para cada nível existe um badge. O consultor pode
              candidatar-se a um badge desde que cumpra os requisitos
              definidos, mesmo que ainda não tenha badges de níveis
              anteriores.
            </p>
          </div>

          <div className="hierarchy-card">
            <HierarchyItem label="Learning Path" value="Jornada Técnica" />
            <HierarchyItem label="Service Line" value="Hybrid Cloud" />
            <HierarchyItem label="Área" value="Low Code / Outsystems" />
            <HierarchyItem label="Níveis" value="A · B · C · D · E" />
            <HierarchyItem label="Requisitos" value="A1, A2, A3..." />
            <HierarchyItem label="Resultado" value="Badge certificado" />
          </div>
        </div>
      </section>

      <section id="perfis" className="section">
        <div className="section-heading">
          <span>Perfis da plataforma</span>
          <h2>Uma solução para todos os intervenientes</h2>
          <p>
            O sistema foi desenhado para quatro perfis web principais e
            uma aplicação mobile dedicada ao consultor.
          </p>
        </div>

        <div className="profiles-grid">
          {perfis.map((perfil) => (
            <article key={perfil.titulo} className="profile-card">
              <div className="profile-icon">
                <Users size={24} />
              </div>

              <h3>{perfil.titulo}</h3>
              <p>{perfil.texto}</p>

              <ul>
                {perfil.itens.map((item) => (
                  <li key={item}>
                    <CheckCircle2 size={15} />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="section section-dark">
        <div className="section-heading light">
          <span>Workflow</span>
          <h2>Fluxo de candidatura a um badge</h2>
          <p>
            O processo garante rastreabilidade, validação em duas fases
            e histórico auditável de decisões.
          </p>
        </div>

        <div className="workflow">
          <WorkflowStep
            number="01"
            title="Submissão"
            text="O consultor escolhe um badge e submete evidências para todos os requisitos."
          />
          <WorkflowStep
            number="02"
            title="Validação TM"
            text="O Talent Manager valida as evidências e aprova, rejeita ou pede retificação."
          />
          <WorkflowStep
            number="03"
            title="Validação SLL"
            text="O Service Line Leader faz a validação final da candidatura."
          />
          <WorkflowStep
            number="04"
            title="Certificação"
            text="Se aprovado, o badge é atribuído, entra no histórico e gera certificado verificável."
          />
        </div>
      </section>

      <section id="funcionalidades" className="section">
        <div className="section-heading">
          <span>Funcionalidades</span>
          <h2>Principais módulos implementados</h2>
          <p>
            O projeto combina gestão de competências, workflow de
            validação, gamificação, certificados, notificações e
            publicação pública de badges.
          </p>
        </div>

        <div className="features-grid">
          {funcionalidades.map((item) => (
            <InfoCard
              key={item.titulo}
              icon={item.icon}
              title={item.titulo}
              text={item.texto}
            />
          ))}
        </div>
      </section>

      <section id="arquitetura" className="section section-soft">
        <div className="section-heading">
          <span>Arquitetura</span>
          <h2>Como a solução está organizada</h2>
          <p>
            A plataforma é composta por frontend web, backend API,
            base de dados relacional, aplicação mobile e serviços de
            notificações.
          </p>
        </div>

        <div className="architecture-grid">
          <ArchitectureCard
            icon={<Globe2 />}
            title="Frontend Web"
            text="Portal React com páginas para Administrador, Consultor, Talent Manager e Service Line Leader."
          />
          <ArchitectureCard
            icon={<Server />}
            title="Backend API"
            text="API Node.js/Express responsável por autenticação, candidaturas, validações, badges e certificados."
          />
          <ArchitectureCard
            icon={<Database />}
            title="PostgreSQL"
            text="Armazena utilizadores, learning paths, áreas, badges, requisitos, candidaturas e histórico."
          />
          <ArchitectureCard
            icon={<Smartphone />}
            title="Mobile Flutter"
            text="Aplicação dedicada ao consultor, com submissão de evidências, certificados e push notifications."
          />
          <ArchitectureCard
            icon={<Bell />}
            title="Firebase FCM"
            text="Envio e receção de notificações push para eventos importantes da plataforma."
          />
          <ArchitectureCard
            icon={<ShieldCheck />}
            title="RGPD e segurança"
            text="JWT, permissões por perfil, consentimento de publicação e páginas públicas verificáveis."
          />
        </div>
      </section>

      <section id="mobile" className="section">
        <div className="two-columns">
          <div>
            <span className="eyebrow">Aplicação mobile</span>
            <h2>Experiência dedicada ao consultor</h2>
            <p>
              A app mobile permite ao consultor acompanhar a sua evolução,
              consultar badges, submeter evidências, receber notificações
              e aceder aos certificados diretamente no telemóvel.
            </p>

            <div className="mobile-highlight">
              <Smartphone size={28} />
              <div>
                <strong>Mobile-first para o consultor</strong>
                <span>
                  A plataforma web gere o ecossistema completo; a app
                  simplifica o percurso individual do consultor.
                </span>
              </div>
            </div>
          </div>

          <div className="requirements-list">
            {requisitosMobile.map((req) => (
              <div key={req}>
                <CheckCircle2 size={15} />
                <span>{req}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="section-heading">
          <span>Certificação pública</span>
          <h2>Badges verificáveis e partilháveis</h2>
          <p>
            Cada badge aprovado pode ser apresentado publicamente,
            partilhado e verificado por link único, reforçando a
            credibilidade das competências certificadas.
          </p>
        </div>

        <div className="public-grid">
          <PublicCard
            icon={<Globe2 />}
            title="Galeria pública"
            text="Página pública com badges obtidos e credenciais visíveis."
            link="/galeria-badges"
            label="Ver galeria"
          />

          <PublicCard
            icon={<BadgeCheck />}
            title="Página individual do badge"
            text="Cada badge pode ter página própria associada ao consultor e à Softinsa."
            link="/badges/1/1"
            label="Exemplo de rota"
          />

          <PublicCard
            icon={<ExternalLink />}
            title="Verificação por código"
            text="Certificados possuem código único do tipo CERT-IDHISTORICO-IDUTILIZADOR."
            link="/verificar/CERT-1-1"
            label="Verificar exemplo"
          />
        </div>
      </section>

      <section id="tecnologias" className="section">
        <div className="section-heading">
          <span>Tecnologias</span>
          <h2>Stack técnica utilizada</h2>
          <p>
            A solução junta tecnologias web, mobile, backend, base de
            dados, cloud e exportação documental.
          </p>
        </div>

        <div className="tech-grid">
          {tecnologias.map((tech) => (
            <div key={tech.nome} className="tech-card">
              <span>{tech.nome}</span>
              <p>{tech.descricao}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-dark">
        <div className="section-heading light">
          <span>Resultado final</span>
          <h2>Uma plataforma completa de evolução profissional</h2>
          <p>
            O projeto entrega um ecossistema integrado para gerir,
            validar, certificar e divulgar competências dos consultores
            da Softinsa.
          </p>
        </div>

        <div className="final-grid">
          <FinalItem icon={<MailCheck />} text="Emails de confirmação e candidatura" />
          <FinalItem icon={<Bell />} text="Notificações internas e push" />
          <FinalItem icon={<Clock />} text="Alertas de expiração e SLA" />
          <FinalItem icon={<FileText />} text="Exportação PDF e Excel" />
          <FinalItem icon={<Share2 />} text="Partilha pública e LinkedIn" />
          <FinalItem icon={<Network />} text="Histórico e workflow auditável" />
        </div>

        <div className="cta-card">
          <div>
            <h3>Softinsa Badges Academy</h3>
            <p>
              Uma solução académica com aplicação prática para gestão de
              competências, validação de evidências e certificação digital.
            </p>
          </div>

          {mobileBlocked ? (
            <button
              type="button"
              className="btn-cta"
              onClick={handleInstallClick}
              disabled={!hasInstallUrl}
            >
              {hasInstallUrl ? "Instalar app" : "Instalação em breve"}
            </button>
          ) : (
            <Link to="/login" className="btn-cta">
              Aceder à plataforma
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

function InfoCard({ icon, title, text }) {
  return (
    <article className="info-card">
      <div className="info-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function HierarchyItem({ label, value }) {
  return (
    <div className="hierarchy-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function WorkflowStep({ number, title, text }) {
  return (
    <div className="workflow-step">
      <div className="workflow-number">{number}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function ArchitectureCard({ icon, title, text }) {
  return (
    <article className="architecture-card">
      <div>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function PublicCard({ icon, title, text, link, label }) {
  return (
    <article className="public-card">
      <div className="public-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>

      <Link to={link}>
        {label}
        <ExternalLink size={14} />
      </Link>
    </article>
  );
}

function FinalItem({ icon, text }) {
  return (
    <div className="final-item">
      {icon}
      <span>{text}</span>
    </div>
  );
}

export default MicrositeProjeto;