(() => {
  const app = globalThis.EnhancedELM;
  const { storageGet, storageSet, storageRemove } = app.dom;
  const MODEL_PREFERENCE_KEY = "enhancedElmModelPreference";
  const FAMILIES = [
    { key: "VLLM", label: "Local", nativeLabel: "Locally Hosted", sources: ["VLLM"], match: /^(Qwen|Llama|EuroLLM)/i },
    { key: "ANTHROPIC", label: "Anthropic", nativeLabel: "Anthropic", sources: ["ANTHROPIC"], match: /^Claude/i },
    { key: "GOOGLE", label: "Google", nativeLabel: "Google", sources: ["GOOGLE"], match: /^Gemini/i },
    { key: "OPENAI", label: "OpenAI", nativeLabel: "OpenAI", sources: ["OPENAI", "OPENAI_REASONING", "OPENAI_PREVIEW"], match: /^(GPT|o\d)/i }
  ];
  let selectedFamilyKey;
  let familyManuallySelected = false;
  let lastKnownModelName = "";
  let observedModelButton;
  let modelLabelObserver;
  let updateQueued = false;
  let preference;
  let preferenceLoaded = false;
  let preferenceAttempted = false;

  function findFamily({ name = "", source = "" } = {}) {
    return FAMILIES.find((family) => family.sources.includes(source) || family.match.test(name));
  }

  function getModelButton() {
    return Array.from(document.querySelectorAll("edh-elm-input button")).find(
      (button) => button.querySelector("mat-icon")?.textContent?.trim() === "memory"
    );
  }

  function getCurrentModel(button = getModelButton()) {
    const name = button?.querySelector(".mdc-button__label")?.textContent?.trim()
      || button?.getAttribute("aria-label")?.trim()
      || "";
    return { name };
  }

  function shortModelName(name, family) {
    if (!name) return "Model";
    const prefix = family?.label === "Local" ? "" : `${family?.label ?? ""} `;
    return prefix && name.startsWith(prefix) ? name.slice(prefix.length) : name;
  }

  function selectedFamily() {
    return FAMILIES.find((family) => family.key === selectedFamilyKey);
  }

  function updateControls() {
    const modelButton = getModelButton();
    const controls = document.querySelector("[data-enhanced-elm-model-controls]");
    if (!modelButton || !controls) return;
    const currentModel = getCurrentModel(modelButton);
    const inferredFamily = findFamily(currentModel);
    const familySelect = controls.querySelector("select");

    if (currentModel.name !== lastKnownModelName) {
      lastKnownModelName = currentModel.name;
      familyManuallySelected = false;
    }
    if (!selectedFamilyKey) selectedFamilyKey = inferredFamily?.key ?? "VLLM";
    if (inferredFamily && !familyManuallySelected) selectedFamilyKey = inferredFamily.key;
    familySelect.value = selectedFamilyKey;
    if (currentModel.name) {
      modelButton.setAttribute("aria-label", currentModel.name);
      modelButton.setAttribute("title", currentModel.name);
    }
    modelButton.dataset.elmCleanModelShortName = shortModelName(currentModel.name, inferredFamily);
    modelButton.dataset.elmCleanModelControl = "";

    const defaultButton = controls.querySelector("[data-enhanced-elm-default-model]");
    const isDefault = Boolean(
      preference && preference.familyKey === inferredFamily?.key && preference.modelName === currentModel.name
    );
    defaultButton.classList.toggle("enhanced-elm-default-model-active", isDefault);
    defaultButton.textContent = isDefault ? "star" : "star_border";
    defaultButton.title = isDefault ? "This is your default model" : "Set this model as default";
    defaultButton.setAttribute("aria-label", defaultButton.title);
  }

  function scheduleUpdate() {
    if (updateQueued) return;
    updateQueued = true;
    requestAnimationFrame(() => {
      updateQueued = false;
      updateControls();
      filterNativeMenu();
    });
  }

  function observeNativeModelLabel(modelButton) {
    if (observedModelButton === modelButton) return;
    modelLabelObserver?.disconnect();
    observedModelButton = modelButton;
    modelLabelObserver = new MutationObserver(scheduleUpdate);
    modelLabelObserver.observe(modelButton, { childList: true, characterData: true, subtree: true });
  }

  function filterNativeMenu() {
    const activeFamily = selectedFamily();
    if (!activeFamily) return;
    for (const header of document.querySelectorAll(".model-source-subheader")) {
      if (header.classList.contains("learn-more-container")) continue;
      const family = FAMILIES.find((item) => item.nativeLabel === header.textContent?.trim());
      if (!family) continue;
      const hideGroup = family.key !== activeFamily.key;
      let element = header;
      while (element) {
        element.classList.toggle("elm-clean-hidden-model-family", hideGroup);
        element = element.nextElementSibling;
        if (element?.classList.contains("model-source-subheader")) break;
      }
    }
  }

  function firstVisibleModelForFamily() {
    const activeFamily = selectedFamily();
    if (!activeFamily) return undefined;
    const header = Array.from(document.querySelectorAll(".model-source-subheader")).find(
      (item) => item.textContent?.trim() === activeFamily.nativeLabel
    );
    if (!header) return undefined;
    let element = header.nextElementSibling;
    while (element && !element.classList.contains("model-source-subheader")) {
      if (element.matches('button[role="menuitem"]') && !element.classList.contains("elm-clean-hidden-model-family")) {
        return element;
      }
      element = element.nextElementSibling;
    }
    return undefined;
  }

  function matchingModelByName(modelName) {
    return Array.from(document.querySelectorAll('button[role="menuitem"]')).find((item) => {
      const label = item.querySelector(".mdc-button__label")?.textContent?.trim() || item.textContent?.trim();
      return label === modelName || label?.endsWith(modelName);
    });
  }

  function chooseModel({ exactName, attempt = 0 }) {
    filterNativeMenu();
    const candidate = exactName ? matchingModelByName(exactName) : firstVisibleModelForFamily();
    if (candidate) {
      candidate.click();
      requestAnimationFrame(() => requestAnimationFrame(scheduleUpdate));
      return;
    }
    if (attempt > 2) {
      if (!exactName) app.showToast("The selected model family is unavailable");
      return;
    }
    const button = getModelButton();
    if (attempt === 0 && button) button.click();
    requestAnimationFrame(() => requestAnimationFrame(() => chooseModel({ exactName, attempt: attempt + 1 })));
  }

  async function loadPreference() {
    preference = await storageGet(MODEL_PREFERENCE_KEY, undefined);
    if (!preference || typeof preference.modelName !== "string" || typeof preference.familyKey !== "string") {
      preference = undefined;
    }
    preferenceLoaded = true;
    updateControls();
  }

  function applyDefaultOnce() {
    if (!preferenceLoaded || preferenceAttempted || !preference) return;
    const modelButton = getModelButton();
    if (!modelButton) return;
    const current = getCurrentModel(modelButton);
    preferenceAttempted = true;
    if (current.name === preference.modelName && findFamily(current)?.key === preference.familyKey) return;
    selectedFamilyKey = preference.familyKey;
    familyManuallySelected = true;
    updateControls();
    chooseModel({ exactName: preference.modelName });
  }

  async function toggleDefaultModel() {
    const current = getCurrentModel();
    const family = findFamily(current);
    if (!current.name || !family) return;
    if (preference?.familyKey === family.key && preference.modelName === current.name) {
      preference = undefined;
      await storageRemove(MODEL_PREFERENCE_KEY);
      app.showToast("Default model cleared");
    } else {
      preference = { familyKey: family.key, modelName: current.name, updatedAt: new Date().toISOString() };
      await storageSet(MODEL_PREFERENCE_KEY, preference);
      app.showToast(`${current.name} is now your default model`);
    }
    updateControls();
  }

  function ensureControls() {
    const modelButton = getModelButton();
    if (!modelButton) return;
    let controls = document.querySelector("[data-enhanced-elm-model-controls]");
    if (!controls) {
      controls = document.createElement("span");
      controls.dataset.enhancedElmUi = "";
      controls.dataset.enhancedElmModelControls = "";
      controls.className = "elm-clean-model-controls enhanced-elm-model-controls";
      const familySelect = document.createElement("select");
      familySelect.className = "elm-clean-family-select";
      familySelect.setAttribute("aria-label", "Model family");
      familySelect.title = "Model family";
      for (const family of FAMILIES) {
        const option = document.createElement("option");
        option.value = family.key;
        option.textContent = family.label;
        familySelect.append(option);
      }
      familySelect.addEventListener("change", () => {
        selectedFamilyKey = familySelect.value;
        familyManuallySelected = true;
        filterNativeMenu();
        chooseModel({ exactName: undefined });
      });
      const defaultButton = document.createElement("button");
      defaultButton.type = "button";
      defaultButton.dataset.enhancedElmUi = "";
      defaultButton.dataset.enhancedElmDefaultModel = "";
      defaultButton.className = "enhanced-elm-default-model";
      defaultButton.addEventListener("click", () => void toggleDefaultModel());
      controls.append(familySelect, defaultButton);
      modelButton.before(controls);
    }
    if (!modelButton.dataset.enhancedElmModelFilterListener) {
      modelButton.dataset.enhancedElmModelFilterListener = "true";
      modelButton.addEventListener("click", () => {
        requestAnimationFrame(() => requestAnimationFrame(filterNativeMenu));
      });
    }
    observeNativeModelLabel(modelButton);
    updateControls();
    applyDefaultOnce();
  }

  app.features.models = {
    init() { void loadPreference(); },
    mark() { ensureControls(); },
    destroy() {
      modelLabelObserver?.disconnect();
      modelLabelObserver = undefined;
      observedModelButton = undefined;
    }
  };
})();
