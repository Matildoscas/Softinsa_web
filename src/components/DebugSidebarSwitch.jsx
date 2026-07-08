import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api.js";
import {
  getDebugModeEnabled,
  getDebugSwitchVisible,
  setDebugModeEnabled,
  syncDebugConfig,
} from "../services/debugMode.js";

function DebugSidebarSwitch() {
  const location = useLocation();
  const [visible, setVisible] = useState(getDebugSwitchVisible());
  const [enabled, setEnabled] = useState(getDebugModeEnabled());
  const [tips, setTips] = useState([]);

  useEffect(() => {
    let ativo = true;

    async function carregarConfig() {
      const config = await syncDebugConfig(async () => {
        const response = await api.get("/debug/config");
        return response.data;
      });

      if (!ativo) {
        return;
      }

      setVisible(Boolean(config.sidebarSwitchVisible));
      setEnabled(getDebugModeEnabled());
      setTips(Array.isArray(config.tips) ? config.tips : []);
    }

    const onDebugChanged = () => {
      setVisible(getDebugSwitchVisible());
      setEnabled(getDebugModeEnabled());
    };

    carregarConfig();
    window.addEventListener("debug-mode-changed", onDebugChanged);

    return () => {
      ativo = false;
      window.removeEventListener("debug-mode-changed", onDebugChanged);
    };
  }, []);

  if (!location.pathname.startsWith("/sll")) {
    return null;
  }

  if (!visible) {
    return null;
  }

  return (
    <div style={container}>
      <div style={headerRow}>
        <div>
          <div style={title}>Modo Debug</div>
          <div style={subtitle}>Mostrar campos técnicos e IDs</div>
        </div>

        <label style={switchLabel}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => {
              const value = Boolean(event.target.checked);
              setEnabled(value);
              setDebugModeEnabled(value);
            }}
            style={{ display: "none" }}
          />
          <span style={{ ...switchTrack, ...(enabled ? switchOn : null) }}>
            <span style={{ ...switchThumb, ...(enabled ? switchThumbOn : null) }} />
          </span>
        </label>
      </div>

      {tips.length > 0 && (
        <ul style={tipsList}>
          {tips.slice(0, 3).map((tip, index) => (
            <li key={`${tip}-${index}`} style={tipItem}>
              {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const container = {
  margin: "14px",
  padding: "10px 12px",
  border: "1px dashed #cbd5e1",
  borderRadius: 10,
  background: "#f8fafc",
};

const headerRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const title = {
  fontSize: 12,
  fontWeight: 700,
  color: "#1e293b",
};

const subtitle = {
  fontSize: 11,
  color: "#64748b",
};

const switchLabel = {
  cursor: "pointer",
};

const switchTrack = {
  width: 36,
  height: 20,
  borderRadius: 999,
  background: "#cbd5e1",
  display: "inline-flex",
  alignItems: "center",
  padding: 2,
  transition: "all 0.2s ease",
};

const switchOn = {
  background: "#2563eb",
};

const switchThumb = {
  width: 16,
  height: 16,
  borderRadius: "50%",
  background: "#ffffff",
  transform: "translateX(0)",
  transition: "all 0.2s ease",
};

const switchThumbOn = {
  transform: "translateX(16px)",
};

const tipsList = {
  margin: "8px 0 0",
  paddingLeft: 16,
};

const tipItem = {
  fontSize: 11,
  color: "#475569",
  marginBottom: 3,
};

export default DebugSidebarSwitch;