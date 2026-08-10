(() => {
  const SETTINGS_KEY = "enhancedElmSettings";
  const LEGACY_SETTINGS_KEY = "elmCleanModeSettings";
  const DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    hideGuidance: true,
    mathRepair: true,
    markdownCompatibility: false,
    markdownTools: true
  });

  function normaliseSettings(value) {
    const source = value && typeof value === "object" ? value : {};
    return { ...DEFAULT_SETTINGS, ...source };
  }

  globalThis.EnhancedELMSettings = Object.freeze({
    SETTINGS_KEY,
    LEGACY_SETTINGS_KEY,
    DEFAULT_SETTINGS,
    normaliseSettings
  });
})();
