(() => {
  const app = globalThis.EnhancedELM;

  function fileCount(fileBar) {
    const match = fileBar.textContent?.match(/(\d+)\s+files?\s+attached/i);
    return match ? Number(match[1]) : 0;
  }

  function updateDock(fileBar) {
    const count = fileCount(fileBar);
    if (!count) return;
    fileBar.dataset.enhancedElmAttachmentDock = "";
    fileBar.dataset.enhancedElmAttachmentCount = String(count);
    fileBar.setAttribute("aria-label", `${count} attached file${count === 1 ? "" : "s"}`);
    fileBar.setAttribute("title", `${count} attached file${count === 1 ? "" : "s"}. Open attachments`);

    let toggle = fileBar.querySelector("[data-enhanced-elm-attachment-toggle]");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.dataset.enhancedElmUi = "";
      toggle.dataset.enhancedElmAttachmentToggle = "";
      toggle.className = "enhanced-elm-attachment-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = '<span aria-hidden="true">attach_file</span><small aria-hidden="true"></small>';
      toggle.addEventListener("click", () => {
        const isOpen = fileBar.toggleAttribute("data-enhanced-elm-attachments-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
        if (!isOpen) toggle.blur();
      });
      fileBar.append(toggle);
    }
    toggle.querySelector("small").textContent = String(count);
    toggle.setAttribute("aria-label", `Open ${count} attached file${count === 1 ? "" : "s"}`);
  }

  function mark() {
    for (const fileBar of document.querySelectorAll("edh-file-bar-widget")) updateDock(fileBar);
  }

  function destroy() {
    for (const fileBar of document.querySelectorAll("edh-file-bar-widget")) {
      fileBar.removeAttribute("data-enhanced-elm-attachment-dock");
      fileBar.removeAttribute("data-enhanced-elm-attachment-count");
      fileBar.removeAttribute("data-enhanced-elm-attachments-open");
    }
  }

  app.features.attachmentDock = { mark, destroy };
})();
