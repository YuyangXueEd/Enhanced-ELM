(() => {
  const app = globalThis.EnhancedELM;
  const FONT_DEFINITIONS = Object.freeze([
    { family: "Enhanced ELM Mono", file: "CaskaydiaCoveNFM-Regular.ttf", weight: "400" },
    { family: "Enhanced ELM Mono", file: "CaskaydiaCoveNFM-SemiBold.ttf", weight: "600 900" }
  ]);
  const loaded = new Set();

  function keyFor(definition) {
    return `${definition.family}:${definition.weight}`;
  }

  async function loadFace(definition) {
    const key = keyFor(definition);
    if (loaded.has(key)) return;
    loaded.add(key);
    const source = `url("${chrome.runtime.getURL(`src/vendor/fonts/${definition.file}`)}") format("truetype")`;
    const face = new FontFace(definition.family, source, {
      display: "swap",
      style: "normal",
      weight: definition.weight
    });
    document.fonts.add(face);
    try {
      await face.load();
    } catch {
      // Keep the system fallback when a browser refuses a local font. No ELM
      // interaction should depend on a presentation asset being available.
      document.fonts.delete(face);
      loaded.delete(key);
    }
  }

  function ensureLocalFonts() {
    if (typeof FontFace !== "function" || !document.fonts) return Promise.resolve();
    return Promise.all(FONT_DEFINITIONS.map(loadFace)).then(() => undefined);
  }

  app.ensureLocalFonts = ensureLocalFonts;
  void ensureLocalFonts();
})();
