import { useMemo } from 'react';
import logoImg from '../../assets/logo.png';

function MobileAppMinisite() {
  const installUrlDefault = import.meta.env.VITE_APP_INSTALL_URL || '';
  const installUrlAndroid = import.meta.env.VITE_APP_INSTALL_URL_ANDROID || '';
  const installUrlIos = import.meta.env.VITE_APP_INSTALL_URL_IOS || '';
  const appDeepLink = import.meta.env.VITE_APP_DEEP_LINK || '';

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroid = /Android/i.test(userAgent);
  const isIos = /iPhone|iPad|iPod/i.test(userAgent);

  const installUrl =
    (isAndroid && installUrlAndroid) ||
    (isIos && installUrlIos) ||
    installUrlDefault;

  const hasInstallUrl = Boolean(installUrl);
  const hasDeepLink = Boolean(appDeepLink);

  const features = useMemo(
    () => [
      'Consulta de badges e progresso em tempo real',
      'Submissao de evidencias diretamente no telemovel',
      'Notificacoes de aprovacoes e pedidos pendentes',
    ],
    []
  );

  const handleOpenAppClick = () => {
    if (!hasDeepLink) {
      window.alert('Deep link da app ainda nao foi configurado.');
      return;
    }

    window.location.href = appDeepLink;
  };

  const handleInstallClick = () => {
    if (!hasInstallUrl) {
      window.alert('URL de instalacao ainda nao foi configurada.');
      return;
    }

    window.location.href = installUrl;
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

        <button
          type="button"
          className="mobile-minisite-install"
          onClick={handleInstallClick}
          disabled={!hasInstallUrl}
        >
          {hasInstallUrl ? 'Instalar app' : 'Instalacao da app em breve'}
        </button>

        {hasDeepLink && (
          <button type="button" className="mobile-minisite-link" onClick={handleOpenAppClick}>
            Ja tens a app? Abrir agora
          </button>
        )}

        <p className="mobile-minisite-note">
          O acesso web em telemovel esta temporariamente bloqueado. Usa a app para continuar.
        </p>
      </section>
    </main>
  );
}

export default MobileAppMinisite;
