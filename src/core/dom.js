(() => {
  const app = globalThis.EnhancedELM;

  function textFromNode(node) {
    return node?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  }

  function makeId(prefix) {
    const random = globalThis.crypto?.randomUUID?.()
      ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${random}`;
  }

  function hashText(value) {
    let hash = 2166136261;
    for (const character of value) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function copyText(value) {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
    const fallback = document.createElement("textarea");
    fallback.value = value;
    fallback.setAttribute("readonly", "");
    fallback.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.append(fallback);
    fallback.select();
    const copied = document.execCommand("copy");
    fallback.remove();
    return copied ? Promise.resolve() : Promise.reject(new Error("Copy failed"));
  }

  function contextHasStorageError() {
    try {
      return Boolean(chrome.runtime?.lastError);
    } catch {
      return true;
    }
  }

  function extensionContextAvailable() {
    try {
      return Boolean(chrome.runtime?.id && chrome.storage?.local);
    } catch {
      return false;
    }
  }

  function storageGet(key, fallback) {
    return new Promise((resolve) => {
      if (!extensionContextAvailable()) return resolve(fallback);
      try {
        chrome.storage.local.get({ [key]: fallback }, (result) => {
          resolve(contextHasStorageError() ? fallback : (result?.[key] ?? fallback));
        });
      } catch {
        // An extension reload invalidates the old content-script context before
        // the page refreshes. Treat its late storage work as a no-op instead of
        // producing an unhandled Promise rejection in the page's console.
        resolve(fallback);
      }
    });
  }

  function storageSet(key, value) {
    return new Promise((resolve) => {
      if (!extensionContextAvailable()) return resolve(false);
      try {
        chrome.storage.local.set({ [key]: value }, () => resolve(!contextHasStorageError()));
      } catch {
        resolve(false);
      }
    });
  }

  function storageRemove(key) {
    return new Promise((resolve) => {
      if (!extensionContextAvailable()) return resolve(false);
      try {
        chrome.storage.local.remove(key, () => resolve(!contextHasStorageError()));
      } catch {
        resolve(false);
      }
    });
  }

  app.dom = Object.freeze({ textFromNode, makeId, hashText, copyText, storageGet, storageSet, storageRemove });
})();
