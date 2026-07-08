const KEY_SWITCH_VISIBLE = "debug_switch_visible";
const KEY_DEBUG_ENABLED = "debug_mode_enabled";

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["1", "true", "yes", "sim", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "nao", "não", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function emitDebugModeChanged(payload) {
  window.dispatchEvent(
    new CustomEvent("debug-mode-changed", {
      detail: payload,
    })
  );
}

export function getDebugSwitchVisible() {
  return parseBoolean(localStorage.getItem(KEY_SWITCH_VISIBLE), false);
}

export function setDebugSwitchVisible(visible) {
  localStorage.setItem(KEY_SWITCH_VISIBLE, visible ? "true" : "false");
  emitDebugModeChanged({
    switchVisible: Boolean(visible),
    enabled: getDebugModeEnabled(),
  });
}

export function getDebugModeEnabled() {
  return parseBoolean(localStorage.getItem(KEY_DEBUG_ENABLED), false);
}

export function setDebugModeEnabled(enabled) {
  localStorage.setItem(KEY_DEBUG_ENABLED, enabled ? "true" : "false");
  emitDebugModeChanged({
    switchVisible: getDebugSwitchVisible(),
    enabled: Boolean(enabled),
  });
}

export function resolveDebugEnabledForRequest() {
  const path = String(window?.location?.pathname || "");

  if (!path.startsWith("/sll")) {
    return false;
  }

  if (!getDebugSwitchVisible()) {
    return false;
  }

  return getDebugModeEnabled();
}

export async function syncDebugConfig(loadConfigFn) {
  try {
    const data = await loadConfigFn();
    const debug = data?.debug || {};

    const switchVisible = parseBoolean(
      debug.sidebarSwitchVisible,
      false
    );

    setDebugSwitchVisible(switchVisible);

    if (!switchVisible) {
      setDebugModeEnabled(false);
      return {
        sidebarSwitchVisible: false,
        defaultEnabled: false,
        tips: [],
      };
    }

    const alreadyDefined = localStorage.getItem(KEY_DEBUG_ENABLED);

    if (alreadyDefined === null) {
      setDebugModeEnabled(
        parseBoolean(debug.defaultEnabled, false)
      );
    }

    return {
      sidebarSwitchVisible: true,
      defaultEnabled: parseBoolean(debug.defaultEnabled, false),
      tips: Array.isArray(debug.tips) ? debug.tips : [],
    };
  } catch (error) {
    setDebugSwitchVisible(false);
    setDebugModeEnabled(false);

    return {
      sidebarSwitchVisible: false,
      defaultEnabled: false,
      tips: [],
      error,
    };
  }
}
