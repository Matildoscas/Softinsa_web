import { useMemo } from 'react';
import logoImg from '../../assets/logo.png';

function MobileAppMinisite() {
  const features = useMemo(
    () => [
      'Consulta de badges e progresso em tempo real',
      'Submissao de evidencias diretamente no telemovel',
      'Notificacoes de aprovacoes e pedidos pendentes',
    ],
    []
  );

  const handleInstallClick = () => {
    // Placeholder until app stores and deep links are ready.
    window.alert('Botao de instalacao em preparacao. Vamos ativar em breve.');
  };

  return (
    <main className="mobile-minisite">
      <section className="mobile-minisite-card">
        <img src={logoImg} alt="Softinsa" className="mobile-minisite-logo" />

        <p className="mobile-minisite-eyebrow">Softinsa Academy</p>
        <h1 className="mobile-minisite-title">A app oficial esta a caminho.</h1>
        <p className="mobile-minisite-subtitle">
          Enquanto finalizamos a app, ja podes conhecer a experiencia que vai simplificar candidaturas,
          badges e notificacoes no teu dia a dia.
        </p>

        <ul className="mobile-minisite-list">
          {features.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <button type="button" className="mobile-minisite-install" onClick={handleInstallClick}>
          Instalar app (em breve)
        </button>

        <a className="mobile-minisite-link" href="/login">
          Continuar para a versao web
        </a>
      </section>
    </main>
  );
}

export default MobileAppMinisite;
