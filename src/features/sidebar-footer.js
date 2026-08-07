(() => {
  const app = globalThis.EnhancedELM;
  const { makeId } = app.dom;
  const relocated = new Map();

  function mark() {
    const sidebar = document.querySelector("mat-drawer.elm-sidebar .sidemenu-container");
    const library = sidebar?.querySelector("[data-enhanced-elm-library]");
    if (!sidebar || !library) return;
    let footer = sidebar.querySelector("[data-enhanced-elm-sidebar-footer]");
    if (!footer) {
      footer = document.createElement("footer");
      footer.dataset.enhancedElmUi = "";
      footer.dataset.enhancedElmSidebarFooter = "";
      footer.dataset.elmCleanSidebarFooter = "";
      library.after(footer);
    }
    const candidates = [sidebar.querySelector("img[src*='uoe_logo']"), document.querySelector("edh-elm-new-footer")];
    for (const element of candidates) {
      if (!element || element.closest("[data-enhanced-elm-sidebar-footer]") === footer) continue;
      if (!relocated.has(element)) {
        const placeholder = document.createElement("span");
        placeholder.hidden = true;
        placeholder.dataset.enhancedElmUi = "";
        placeholder.dataset.enhancedElmFooterPlaceholder = makeId("footer-origin");
        element.parentNode?.insertBefore(placeholder, element);
        element.dataset.enhancedElmFooterOrigin = placeholder.dataset.enhancedElmFooterPlaceholder;
        relocated.set(element, { parent: element.parentNode, placeholder });
      }
      footer.append(element);
    }
  }

  function destroy() {
    for (const element of document.querySelectorAll("[data-enhanced-elm-footer-origin]")) {
      const placeholder = document.querySelector(`[data-enhanced-elm-footer-placeholder="${element.dataset.enhancedElmFooterOrigin}"]`);
      if (placeholder?.parentNode) placeholder.parentNode.insertBefore(element, placeholder);
      placeholder?.remove();
      element.removeAttribute("data-enhanced-elm-footer-origin");
    }
    relocated.clear();
  }

  app.features.sidebarFooter = { mark, destroy };
})();
