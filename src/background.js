importScripts("shared/settings.js");

const { SETTINGS_KEY, LEGACY_SETTINGS_KEY, DEFAULT_SETTINGS, normaliseSettings } = globalThis.EnhancedELMSettings;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ [SETTINGS_KEY]: undefined, [LEGACY_SETTINGS_KEY]: undefined }, (result) => {
    const existing = result[SETTINGS_KEY] ?? result[LEGACY_SETTINGS_KEY] ?? DEFAULT_SETTINGS;
    chrome.storage.local.set({ [SETTINGS_KEY]: normaliseSettings(existing) });
  });
});
