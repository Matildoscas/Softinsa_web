import {
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";

import {
  getAnalytics,
  isSupported,
  setUserId,
} from "firebase/analytics";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY,

  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,

  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID,

  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,

  messagingSenderId:
    import.meta.env
      .VITE_FIREBASE_MESSAGING_SENDER_ID,

  appId:
    import.meta.env.VITE_FIREBASE_APP_ID,

  measurementId:
    import.meta.env
      .VITE_FIREBASE_MEASUREMENT_ID,
};

const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

let analyticsPromise = null;

/**
 * Só é chamado depois de o utilizador
 * iniciar sessão corretamente.
 */
export function iniciarAnalytics() {
  if (analyticsPromise) {
    return analyticsPromise;
  }

  analyticsPromise = isSupported()
    .then((suportado) => {
      if (!suportado) {
        console.warn(
          "[ANALYTICS] Não suportado neste browser.",
        );

        return null;
      }

      const analytics =
        getAnalytics(firebaseApp);

      console.log(
        "[ANALYTICS] Analytics iniciado.",
      );

      return analytics;
    })
    .catch((error) => {
      console.warn(
        "[ANALYTICS] Erro ao iniciar:",
        error,
      );

      return null;
    });

  return analyticsPromise;
}

/**
 * Associa o Analytics ao utilizador autenticado.
 *
 * Deve ser usado apenas o ID interno.
 * Nunca usar email, nome ou contacto.
 */
export async function definirUtilizadorAnalytics(
  idUtilizador,
) {
  try {
    if (
      idUtilizador === null ||
      idUtilizador === undefined
    ) {
      console.warn(
        "[ANALYTICS] ID do utilizador inválido.",
      );

      return;
    }

    const analytics =
      await iniciarAnalytics();

    if (!analytics) {
      return;
    }

    setUserId(
      analytics,
      String(idUtilizador),
    );

    console.log(
      "[ANALYTICS] Utilizador associado:",
      idUtilizador,
    );
  } catch (error) {
    console.warn(
      "[ANALYTICS] Erro ao associar utilizador:",
      error,
    );
  }
}

/**
 * Remove a associação quando é feito logout.
 */
export async function limparUtilizadorAnalytics() {
  try {
    const analytics =
      await iniciarAnalytics();

    if (!analytics) {
      return;
    }

    setUserId(analytics, null);

    console.log(
      "[ANALYTICS] Utilizador removido.",
    );
  } catch (error) {
    console.warn(
      "[ANALYTICS] Erro ao limpar utilizador:",
      error,
    );
  }
}