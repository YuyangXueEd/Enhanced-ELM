(() => {
  const app = globalThis.EnhancedELM;
  const { SETTINGS_KEY, LEGACY_SETTINGS_KEY, DEFAULT_SETTINGS, normaliseSettings } = globalThis.EnhancedELMSettings;
  let observer;
  let markingQueued = false;
  document.documentElement.dataset.enhancedElmVersion = app.version;

  function markBaseUi() {
    document.querySelector("edh-elm-input")?.setAttribute("data-elm-clean-composer", "");
    document.querySelector("edh-elm-query")?.setAttribute("data-elm-clean-query", "");
    document.querySelector("edh-elm-info-boxes")?.setAttribute("data-elm-clean-guidance", "");
    document.querySelector("edh-elm-input textarea")?.setAttribute("placeholder", "Ask ELM anything");
    for (const response of document.querySelectorAll("edh-elm-query .response")) {
      const iconTitle = response.querySelector(".response-icon title")?.textContent?.trim();
      response.toggleAttribute("data-elm-clean-system-message", iconTitle === "Information Icon");
    }
    for (const alert of document.querySelectorAll('[role="alert"]')) {
      const text = alert.textContent?.replace(/\s+/g, " ").trim() ?? "";
      if (text.includes("Hi everyone!") && text.includes("Model Guides")) alert.setAttribute("data-elm-clean-announcement", "");
    }
    for (const button of document.querySelectorAll("header button, mat-drawer mat-list button, edh-elm-input button")) {
      const label = button.querySelector(".mdc-button__label")?.textContent?.trim();
      if (!label) continue;
      if (!button.hasAttribute("aria-label")) button.setAttribute("aria-label", label);
      if (!button.hasAttribute("title")) button.setAttribute("title", label);
    }
  }

  function lockOuterConversationScroll() {
    const card = document.querySelector(".mat-mdc-card.elm-card-container:has(edh-elm-query)");
    if (!card || card.dataset.enhancedElmScrollLock) return;
    const reset = () => {
      if (!app.state.settings.enabled || !card.isConnected) return;
      if (Date.now() < app.state.scrollLockPausedUntil) return;
      if (card.scrollTop) card.scrollTop = 0;
      if (card.scrollLeft) card.scrollLeft = 0;
    };
    card.dataset.enhancedElmScrollLock = "true";
    card.addEventListener("scroll", () => requestAnimationFrame(reset), { passive: true });
    reset();
  }

  function markUi() {
    markingQueued = false;
    if (!app.state.settings.enabled) return;
    markBaseUi();
    lockOuterConversationScroll();
    for (const feature of Object.values(app.features)) feature.mark?.();
  }

  function scheduleMarking() {
    if (markingQueued) return;
    markingQueued = true;
    requestAnimationFrame(markUi);
  }

  function applySettings(value) {
    app.state.settings = normaliseSettings(value);
    const root = document.documentElement;
    root.classList.toggle("enhanced-elm", app.state.settings.enabled);
    root.classList.toggle("elm-clean-mode", app.state.settings.enabled);
    root.classList.toggle("elm-clean-compact-conversation", app.state.settings.enabled);
    root.classList.toggle("elm-clean-hide-guidance", app.state.settings.enabled && app.state.settings.hideGuidance);
    if (!app.state.settings.enabled) {
      for (const feature of Object.values(app.features)) feature.destroy?.();
      app.removeInjectedUi();
    }
    scheduleMarking();
  }

  function observe() {
    observer?.disconnect();
    observer = new MutationObserver(scheduleMarking);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    scheduleMarking();
  }

  async function initialise() {
    const savedSettings = await app.dom.storageGet(SETTINGS_KEY, undefined);
    const legacySettings = savedSettings === undefined
      ? await app.dom.storageGet(LEGACY_SETTINGS_KEY, undefined)
      : undefined;
    const initialSettings = normaliseSettings(savedSettings ?? legacySettings ?? DEFAULT_SETTINGS);
    if (savedSettings === undefined && legacySettings !== undefined) {
      await app.dom.storageSet(SETTINGS_KEY, initialSettings);
    }
    applySettings(initialSettings);
    observe();
    await app.workspaceStore.load();
    for (const feature of Object.values(app.features)) feature.init?.();
    scheduleMarking();
  }

  void initialise();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[SETTINGS_KEY]) applySettings(changes[SETTINGS_KEY].newValue ?? DEFAULT_SETTINGS);
  });
})();
