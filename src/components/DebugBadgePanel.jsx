import { useEffect, useState } from "react";
import {
  getDebugModeEnabled,
  getDebugSwitchVisible,
} from "../services/debugMode.js";

function DebugBadgePanel({
  badge,
  variant = "badge",
  evidencias = [],
}) {
  const [enabled, setEnabled] = useState(
    getDebugSwitchVisible() && getDebugModeEnabled()
  );

  useEffect(() => {
    const onDebugChanged = () => {
      setEnabled(
        getDebugSwitchVisible() && getDebugModeEnabled()
      );
    };

    window.addEventListener("debug-mode-changed", onDebugChanged);

    return () => {
      window.removeEventListener("debug-mode-changed", onDebugChanged);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  const idBadge =
    badge?.debug?.ids?.id_badge_modelo ??
    badge?.id_badge_modelo ??
    badge?.id_badge_atribuido ??
    badge?.id_candidatura_historico ??
    badge?.id ??
    null;

  const idCandidatura =
    badge?.id_candidatura_pedido ??
    badge?.debug?.ids?.id_candidatura_pedido ??
    null;

  const area =
    badge?.debug?.database?.nome_area ??
    badge?.nome_area ??
    badge?.nome_areas ??
    badge?.nome_area_badge ??
    badge?.nome_area_consultor ??
    null;

  const serviceLine =
    badge?.debug?.database?.nome_serviceline ??
    badge?.nome_serviceline ??
    null;

  const estado =
    badge?.debug?.database?.estado_badge_modelo ??
    badge?.estado_badge_modelo ??
    badge?.estado_candidatura_pedido ??
    badge?.estado_atual ??
    badge?.estado ??
    null;

  const data =
    badge?.debug?.database?.data_atribuicao ??
    badge?.data_submissao ??
    badge?.data_submisao ??
    badge?.data_rececao_sll ??
    badge?.data_entrada_historico ??
    badge?.data_conquista ??
    badge?.data_atribuicao ??
    badge?.data_avaliacao_sll ??
    null;

  return (
    <div style={panel}>
      <div style={title}>Debug</div>

      <div style={row}>
        <span style={label}>Badge ID:</span>
        <span style={value}>{toText(idBadge)}</span>
      </div>

      <div style={row}>
        <span style={label}>Área:</span>
        <span style={value}>{toText(area)}</span>
      </div>

      <div style={row}>
        <span style={label}>Service Line:</span>
        <span style={value}>{toText(serviceLine)}</span>
      </div>

      {variant === "solicitacao" && (
        <>
          <div style={row}>
            <span style={label}>Candidatura ID:</span>
            <span style={value}>{toText(idCandidatura)}</span>
          </div>

          <div style={row}>
            <span style={label}>Estado:</span>
            <span style={value}>{toText(estado)}</span>
          </div>

          <div style={row}>
            <span style={label}>Data:</span>
            <span style={value}>{toText(data)}</span>
          </div>

          <div style={row}>
            <span style={label}>Evidências:</span>
            <span style={value}>{toText(evidencias.length)}</span>
          </div>

          {evidencias.length > 0 && (
            <pre style={debugJson}>
              {JSON.stringify(evidencias, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  );
}

function toText(value) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  return String(value);
}

const panel = {
  marginTop: 10,
  background: "#f8fafc",
  border: "1px dashed #cbd5e1",
  borderRadius: 8,
  padding: "8px 10px",
};

const title = {
  fontSize: 11,
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: 6,
};

const row = {
  display: "flex",
  gap: 8,
  marginBottom: 3,
};

const label = {
  fontSize: 11,
  color: "#64748b",
  minWidth: 72,
};

const value = {
  fontSize: 11,
  color: "#334155",
  wordBreak: "break-all",
};

const debugJson = {
  marginTop: 8,
  marginBottom: 0,
  maxHeight: 220,
  overflow: "auto",
  background: "#0f172a",
  color: "#e2e8f0",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 10,
  lineHeight: 1.35,
};

export default DebugBadgePanel;