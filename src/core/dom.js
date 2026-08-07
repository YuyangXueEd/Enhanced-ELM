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

  function storageGet(key, fallback) {
    return new Promise((resolve) => {
      chrome.storage.local.get({ [key]: fallback }, (result) => resolve(result[key]));
    });
  }

  function storageSet(key, value) {
    return new Promise((resolve) => chrome.storage.local.set({ [key]: value }, resolve));
  }

  function storageRemove(key) {
    return new Promise((resolve) => chrome.storage.local.remove(key, resolve));
  }

  app.dom = Object.freeze({ textFromNode, makeId, hashText, copyText, storageGet, storageSet, storageRemove });
})();
