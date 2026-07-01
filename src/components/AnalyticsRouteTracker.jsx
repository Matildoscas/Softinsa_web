import {
  useEffect,
  useRef,
} from "react";

import {
  useLocation,
} from "react-router-dom";

import {
  registarEvento,
} from "../services/firebaseAnalytics";

export default function AnalyticsRouteTracker() {
  const location = useLocation();
  const ultimaRota = useRef(null);

  useEffect(() => {
    const rotaAtual =
      `${location.pathname}${location.search}`;

    // Evita duplicações do StrictMode.
    if (
      ultimaRota.current === rotaAtual
    ) {
      return;
    }

    ultimaRota.current = rotaAtual;

    registarEvento(
      "page_view",
      {
        page_title:
          document.title,

        page_path:
          rotaAtual,

        page_location:
          window.location.href,
      },
    );
  }, [
    location.pathname,
    location.search,
  ]);

  return null;
}