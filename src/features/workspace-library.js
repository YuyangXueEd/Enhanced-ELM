(() => {
  const app = globalThis.EnhancedELM;
  const store = app.workspaceStore;
  const { makeId } = app.dom;
  const MAX_SNAPSHOT_CHARACTERS = 240000;
  const MIN_LIBRARY_HEIGHT = 92;
  const MAX_LIBRARY_HEIGHT = 440;
  const RESIZE_STEP = 24;
  let pendingSnapshot;
  let renderTarget;
  let renderSignature = "";

  function reportActionError(error) {
    if (String(error?.message ?? error).includes("Extension context invalidated")) return;
    console.error("Enhanced ELM Library action failed", error);
  }

  function runAction(task) {
    void task.catch(reportActionError);
  }

  function applyCollapsedState(section) {
    const collapsed = Boolean(store.value.libraryCollapsed);
    const toggle = section.querySelector("[data-enhanced-elm-library-toggle]");
    section.toggleAttribute("data-elm-clean-library-collapsed", collapsed);
    if (!toggle) return;
    toggle.textContent = collapsed ? "expand_more" : "expand_less";
    toggle.title = collapsed ? "Expand Library" : "Collapse Library";
    toggle.setAttribute("aria-label", toggle.title);
    toggle.setAttribute("aria-expanded", String(!collapsed));
  }

  function libraryHeightBounds(section) {
    const sidebar = section.closest(".sidemenu-container");
    const history = sidebar?.querySelector("edh-elm-chat-history-menu-view");
    if (!sidebar || !history) return { min: MIN_LIBRARY_HEIGHT, max: MAX_LIBRARY_HEIGHT };
    const fixedHeight = [...sidebar.children]
      .filter((child) => child !== section && child !== history)
      .reduce((total, child) => total + elementLayoutHeight(child), 0);
    const max = Math.min(MAX_LIBRARY_HEIGHT, Math.max(
      MIN_LIBRARY_HEIGHT,
      sidebar.clientHeight - fixedHeight - libraryLayoutOverhead(section) - 184
    ));
    return { min: MIN_LIBRARY_HEIGHT, max };
  }

  function pixelValue(value) {
    return Number.parseFloat(value) || 0;
  }

  function elementLayoutHeight(element) {
    const styles = getComputedStyle(element);
    return element.getBoundingClientRect().height + pixelValue(styles.marginTop) + pixelValue(styles.marginBottom);
  }

  function libraryLayoutOverhead(section) {
    const styles = getComputedStyle(section);
    const margins = pixelValue(styles.marginTop) + pixelValue(styles.marginBottom);
    if (styles.boxSizing === "border-box") return margins;
    return margins + pixelValue(styles.paddingTop) + pixelValue(styles.paddingBottom)
      + pixelValue(styles.borderTopWidth) + pixelValue(styles.borderBottomWidth);
  }

  function libraryContentHeight(section) {
    const savedHeight = Number.parseFloat(section.style.getPropertyValue("--enhanced-elm-library-height"));
    if (Number.isFinite(savedHeight)) return savedHeight;
    const styles = getComputedStyle(section);
    const borderBoxHeight = section.getBoundingClientRect().height;
    if (styles.boxSizing === "border-box") return borderBoxHeight;
    return borderBoxHeight - pixelValue(styles.paddingTop) - pixelValue(styles.paddingBottom)
      - pixelValue(styles.borderTopWidth) - pixelValue(styles.borderBottomWidth);
  }

  function applyLibraryHeight(section) {
    const height = store.value.libraryHeight;
    const resizer = section.querySelector("[data-enhanced-elm-library-resizer]");
    const bounds = libraryHeightBounds(section);
    const nextHeight = Number.isFinite(height) ? Math.min(bounds.max, Math.max(bounds.min, height)) : undefined;
    if (Number.isFinite(nextHeight)) {
      section.style.setProperty("--enhanced-elm-library-height", `${nextHeight}px`);
      section.style.setProperty("--enhanced-elm-library-max-height", `${MAX_LIBRARY_HEIGHT}px`);
    } else {
      section.style.removeProperty("--enhanced-elm-library-height");
      section.style.removeProperty("--enhanced-elm-library-max-height");
    }
    if (!resizer) return;
    updateResizerValue(section, Number.isFinite(nextHeight) ? nextHeight : libraryContentHeight(section), bounds);
  }

  function updateResizerValue(section, height, bounds = libraryHeightBounds(section)) {
    const resizer = section.querySelector("[data-enhanced-elm-library-resizer]");
    if (!resizer) return;
    const current = Math.round(Math.min(bounds.max, Math.max(bounds.min, height)));
    resizer.setAttribute("aria-valuemin", String(bounds.min));
    resizer.setAttribute("aria-valuemax", String(bounds.max));
    resizer.setAttribute("aria-valuenow", String(current));
    resizer.setAttribute("aria-valuetext", `Library height ${current} pixels`);
  }

  function applyLibraryState(section) {
    applyCollapsedState(section);
    applyLibraryHeight(section);
  }

  async function persistLibraryHeight(section, height) {
    const bounds = libraryHeightBounds(section);
    const nextHeight = Math.round(Math.min(bounds.max, Math.max(bounds.min, height)));
    section.style.setProperty("--enhanced-elm-library-height", `${nextHeight}px`);
    section.style.setProperty("--enhanced-elm-library-max-height", `${MAX_LIBRARY_HEIGHT}px`);
    await store.mutate((draft) => {
      draft.libraryHeight = nextHeight;
      return draft;
    });
  }

  function beginResize(event) {
    if (event.button !== 0) return;
    const section = event.currentTarget.closest("[data-enhanced-elm-library]");
    if (!section || section.hasAttribute("data-elm-clean-library-collapsed")) return;
    const handle = event.currentTarget;
    const startY = event.clientY;
    const startHeight = libraryContentHeight(section);
    let nextHeight = startHeight;
    const move = (moveEvent) => {
      const bounds = libraryHeightBounds(section);
      nextHeight = Math.round(Math.min(bounds.max, Math.max(bounds.min, startHeight - (moveEvent.clientY - startY))));
      section.style.setProperty("--enhanced-elm-library-height", `${nextHeight}px`);
      section.style.setProperty("--enhanced-elm-library-max-height", `${MAX_LIBRARY_HEIGHT}px`);
      updateResizerValue(section, nextHeight, bounds);
    };
    const finish = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", finish);
      handle.removeEventListener("pointercancel", cancel);
      document.documentElement.classList.remove("enhanced-elm-library-resizing");
      runAction(persistLibraryHeight(section, nextHeight));
    };
    const cancel = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", finish);
      handle.removeEventListener("pointercancel", cancel);
      document.documentElement.classList.remove("enhanced-elm-library-resizing");
      applyLibraryHeight(section);
    };
    event.preventDefault();
    handle.setPointerCapture?.(event.pointerId);
    document.documentElement.classList.add("enhanced-elm-library-resizing");
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", finish);
    handle.addEventListener("pointercancel", cancel);
  }

  function resizeWithKeyboard(event) {
    if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const section = event.currentTarget.closest("[data-enhanced-elm-library]");
    if (!section || section.hasAttribute("data-elm-clean-library-collapsed")) return;
    event.preventDefault();
    const bounds = libraryHeightBounds(section);
    const current = libraryContentHeight(section);
    const next = event.key === "Home" ? bounds.min
      : event.key === "End" ? bounds.max
        : current + (event.key === "ArrowUp" ? RESIZE_STEP : -RESIZE_STEP);
    runAction(persistLibraryHeight(section, next));
  }

  function makeFilename(title) {
    const safe = title.replace(/[<>:"/\\|?*]+/g, "-").replace(/\s+/g, "-")
      .replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80).toLowerCase();
    return `${safe || "elm-chat"}.md`;
  }

  function downloadText(filename, content) {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function ensureSection() {
    const sidebar = document.querySelector("mat-drawer.elm-sidebar .sidemenu-container");
    const history = sidebar?.querySelector("edh-elm-chat-history-menu-view");
    if (!sidebar || !history) return undefined;
    let section = sidebar.querySelector("[data-enhanced-elm-library]");
    if (!section) {
      section = document.createElement("section");
      section.dataset.enhancedElmUi = "";
      section.dataset.enhancedElmLibrary = "";
      section.dataset.elmCleanLibrary = "";
      section.className = "enhanced-elm-library";
      section.innerHTML = `
        <div class="elm-clean-library-resizer" data-enhanced-elm-library-resizer role="separator" aria-label="Resize Library" aria-orientation="horizontal" tabindex="0"></div>
        <div class="elm-clean-library-heading">
          <span>Library</span>
          <div class="elm-clean-library-actions">
            <button type="button" data-enhanced-elm-action="toggle-library" data-enhanced-elm-library-toggle title="Collapse Library" aria-label="Collapse Library" aria-expanded="true">expand_less</button>
            <button type="button" data-enhanced-elm-action="save-snapshot" title="Save local snapshot" aria-label="Save local snapshot">bookmark_add</button>
            <button type="button" data-enhanced-elm-action="export-markdown" title="Download Markdown" aria-label="Download Markdown">file_download</button>
          </div>
        </div>
        <input class="enhanced-elm-library-search" data-enhanced-elm-library-search type="search" placeholder="Search saved chats" aria-label="Search saved chats" />
        <div data-enhanced-elm-library-list></div>`;
      history.after(section);
      section.querySelector("[data-enhanced-elm-library-search]").addEventListener("input", render);
      section.addEventListener("click", (event) => runAction(handleAction(event)));
      section.querySelector("[data-enhanced-elm-library-resizer]").addEventListener("pointerdown", beginResize);
      section.querySelector("[data-enhanced-elm-library-resizer]").addEventListener("keydown", resizeWithKeyboard);
    }
    applyLibraryState(section);
    return section;
  }

  function render() {
    const section = document.querySelector("[data-enhanced-elm-library]");
    const list = section?.querySelector("[data-enhanced-elm-library-list]");
    if (!list) return;
    applyLibraryState(section);
    const query = section.querySelector("[data-enhanced-elm-library-search]")?.value.trim().toLocaleLowerCase() ?? "";
    const workspace = store.value;
    const signature = JSON.stringify({ query, snapshots: workspace.snapshots, folders: workspace.folders });
    if (list === renderTarget && signature === renderSignature) return;
    renderTarget = list;
    renderSignature = signature;
    list.replaceChildren();
    if (!store.loaded) return;
    const snapshots = [...workspace.snapshots]
      .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
      .filter((snapshot) => !query || [snapshot.title, ...(snapshot.tags ?? [])].join(" ").toLocaleLowerCase().includes(query));
    if (!snapshots.length) {
      const empty = document.createElement("p");
      empty.className = "elm-clean-library-empty";
      empty.textContent = query ? "No matching saved chats." : "Save a chat to organise it here.";
      list.append(empty);
      return;
    }
    for (const snapshot of snapshots.slice(0, 8)) {
      const folder = workspace.folders.find((item) => item.id === snapshot.folderId)?.name ?? "Inbox";
      const row = document.createElement("button");
      row.type = "button";
      row.className = "elm-clean-library-row";
      row.dataset.enhancedElmAction = "download-snapshot";
      row.dataset.snapshotId = snapshot.id;
      row.title = `${folder}: ${snapshot.title}`;
      row.setAttribute("aria-label", `Download saved snapshot: ${snapshot.title}`);
      const title = document.createElement("span");
      title.textContent = snapshot.title;
      const meta = document.createElement("small");
      meta.textContent = [folder, ...(snapshot.tags ?? [])].join(" · ");
      row.append(title, meta);
      list.append(row);
    }
  }

  function folderOptions(select, selectedId = "inbox") {
    select.replaceChildren();
    for (const folder of store.value.folders) {
      const option = document.createElement("option");
      option.value = folder.id;
      option.textContent = folder.name;
      option.selected = folder.id === selectedId;
      select.append(option);
    }
  }

  function ensureSaveDialog() {
    let dialog = document.querySelector("[data-enhanced-elm-save-dialog]");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.dataset.enhancedElmUi = "";
    dialog.dataset.enhancedElmSaveDialog = "";
    dialog.className = "elm-clean-library-dialog";
    dialog.innerHTML = `
      <form method="dialog" class="elm-clean-library-dialog-card">
        <div class="elm-clean-library-dialog-title"><div><h2>Save local snapshot</h2><p>Only this saved copy stays in this browser.</p></div><button value="cancel" title="Close" aria-label="Close">close</button></div>
        <label>Title<input name="title" maxlength="120" required /></label>
        <label>Folder<select name="folder"></select></label>
        <label>Tags <small>Optional, comma-separated</small><input name="tags" maxlength="120" placeholder="research, draft" /></label>
        <div class="elm-clean-library-new-folder"><input name="new-folder" maxlength="60" placeholder="New folder name" /><button type="button" data-enhanced-elm-action="create-folder">Add folder</button></div>
        <p class="elm-clean-library-dialog-note" data-enhanced-elm-save-note></p>
        <div class="elm-clean-library-dialog-actions"><button value="cancel" class="elm-clean-secondary">Cancel</button><button value="save" class="elm-clean-primary">Save snapshot</button></div>
      </form>`;
    document.body.append(dialog);
    dialog.addEventListener("close", () => { if (dialog.returnValue === "save") void persistSnapshot(dialog); });
    dialog.addEventListener("click", (event) => void handleAction(event));
    return dialog;
  }

  function openSaveDialog() {
    const snapshot = app.markdown.getConversationSnapshot();
    if (!snapshot.messages.length) return app.showToast("There is no conversation to save yet");
    pendingSnapshot = snapshot;
    const dialog = ensureSaveDialog();
    dialog.querySelector('[name="title"]').value = snapshot.title;
    dialog.querySelector('[name="tags"]').value = "";
    dialog.querySelector('[name="new-folder"]').value = "";
    folderOptions(dialog.querySelector('[name="folder"]'));
    const truncated = snapshot.markdown.length > MAX_SNAPSHOT_CHARACTERS;
    dialog.querySelector("[data-enhanced-elm-save-note]").textContent = truncated
      ? "Long chat: the local snapshot will contain its first 240,000 characters. Markdown download remains complete."
      : `${snapshot.messages.length} messages will be saved locally.`;
    if (!dialog.open) dialog.showModal();
  }

  async function persistSnapshot(dialog) {
    if (!pendingSnapshot) return;
    const title = dialog.querySelector('[name="title"]').value.trim().slice(0, 120) || pendingSnapshot.title;
    const folderId = dialog.querySelector('[name="folder"]').value || "inbox";
    const tags = dialog.querySelector('[name="tags"]').value.split(",").map((tag) => tag.trim().replace(/\s+/g, " ").slice(0, 30))
      .filter(Boolean).filter((tag, index, all) => all.findIndex((item) => item.toLocaleLowerCase() === tag.toLocaleLowerCase()) === index).slice(0, 8);
    const truncated = pendingSnapshot.markdown.length > MAX_SNAPSHOT_CHARACTERS;
    const now = new Date().toISOString();
    await store.mutate((draft) => {
      draft.snapshots.unshift({ id: makeId("snapshot"), title, folderId, tags, markdown: pendingSnapshot.markdown.slice(0, MAX_SNAPSHOT_CHARACTERS), messageCount: pendingSnapshot.messages.length, truncated, createdAt: now, updatedAt: now });
      return draft;
    });
    pendingSnapshot = undefined;
    app.showToast(truncated ? "Snapshot saved locally (long chat shortened)" : "Snapshot saved locally");
  }

  async function handleAction(event) {
    const control = event.target.closest("[data-enhanced-elm-action]");
    if (!control || !app.state.settings.enabled) return;
    const action = control.dataset.enhancedElmAction;
    if (action === "toggle-library") {
      event.preventDefault();
      await store.mutate((draft) => {
        draft.libraryCollapsed = !draft.libraryCollapsed;
        return draft;
      });
      return;
    }
    if (action === "save-snapshot") { event.preventDefault(); openSaveDialog(); }
    if (action === "export-markdown") {
      event.preventDefault();
      const snapshot = app.markdown.getConversationSnapshot();
      if (!snapshot.messages.length) return app.showToast("There is no conversation to download yet");
      downloadText(makeFilename(snapshot.title), snapshot.markdown);
      app.showToast("Markdown download started");
    }
    if (action === "download-snapshot") {
      event.preventDefault();
      const snapshot = store.value.snapshots.find((item) => item.id === control.dataset.snapshotId);
      if (!snapshot) return;
      downloadText(makeFilename(snapshot.title), snapshot.markdown);
      app.showToast("Saved snapshot download started");
    }
    if (action === "create-folder") {
      event.preventDefault();
      const dialog = control.closest("dialog");
      const input = dialog?.querySelector('[name="new-folder"]');
      const folder = await store.addFolder(input?.value ?? "");
      if (folder) {
        folderOptions(dialog.querySelector('[name="folder"]'), folder.id);
        input.value = "";
      }
    }
  }

  app.features.library = {
    init() { store.subscribe(render); },
    mark() { ensureSection(); render(); }
  };
})();
