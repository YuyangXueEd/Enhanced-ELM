(() => {
  const { DEFAULT_SETTINGS, normaliseSettings } = globalThis.EnhancedELMSettings;
  const state = {
    settings: normaliseSettings(DEFAULT_SETTINGS),
    toastTimer: undefined
  };

  function showToast(message) {
    let toast = document.querySelector("[data-enhanced-elm-toast]");
    if (!toast) {
      toast = document.createElement("div");
      toast.dataset.enhancedElmUi = "";
      toast.dataset.enhancedElmToast = "";
      toast.setAttribute("role", "status");
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.classList.add("enhanced-elm-toast-visible");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(
      () => toast.classList.remove("enhanced-elm-toast-visible"),
      2400
    );
  }

  function removeInjectedUi() {
    document.querySelectorAll("[data-enhanced-elm-ui]").forEach((element) => element.remove());
  }

  globalThis.EnhancedELM = {
    state,
    features: Object.create(null),
    showToast,
    removeInjectedUi,
    get query() {
      return document.querySelector("edh-elm-query");
    }
  };
})();
