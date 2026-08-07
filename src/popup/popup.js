(() => {
  const { SETTINGS_KEY, LEGACY_SETTINGS_KEY, DEFAULT_SETTINGS, normaliseSettings } = globalThis.EnhancedELMSettings;
  const controls = [...document.querySelectorAll("[data-setting], input[type='checkbox']")];

  function readSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get({ [SETTINGS_KEY]: undefined, [LEGACY_SETTINGS_KEY]: undefined }, (result) => {
        resolve(normaliseSettings(result[SETTINGS_KEY] ?? result[LEGACY_SETTINGS_KEY] ?? DEFAULT_SETTINGS));
      });
    });
  }

  function writeSettings(settings) {
    chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  }

  readSettings().then((settings) => {
    for (const control of controls) {
      if (control.type === "checkbox") control.checked = Boolean(settings[control.id]);
      else control.value = settings[control.id];
    }

    for (const control of controls) {
      control.addEventListener("change", () => {
        const next = {
          ...settings,
          ...Object.fromEntries(
            controls.map((item) => [item.id, item.type === "checkbox" ? item.checked : item.value])
          )
        };
        Object.assign(settings, normaliseSettings(next));
        writeSettings(settings);
      });
    }
  });
})();
