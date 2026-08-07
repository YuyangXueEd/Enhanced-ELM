(() => {
  const app = globalThis.EnhancedELM;
  const store = app.workspaceStore;
  const { makeId } = app.dom;
  const MAX_SNAPSHOT_CHARACTERS = 240000;
  let pendingSnapshot;
  let renderTarget;
  let renderSignature = "";

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
        <div class="elm-clean-library-heading">
          <span>Library</span>
          <div class="elm-clean-library-actions">
            <button type="button" data-enhanced-elm-action="save-snapshot" title="Save local snapshot" aria-label="Save local snapshot">bookmark_add</button>
            <button type="button" data-enhanced-elm-action="export-markdown" title="Download Markdown" aria-label="Download Markdown">file_download</button>
          </div>
        </div>
        <input class="enhanced-elm-library-search" data-enhanced-elm-library-search type="search" placeholder="Search saved chats" aria-label="Search saved chats" />
        <div data-enhanced-elm-library-list></div>`;
      history.after(section);
      section.querySelector("[data-enhanced-elm-library-search]").addEventListener("input", render);
      section.addEventListener("click", (event) => void handleAction(event));
    }
    return section;
  }

  function render() {
    const section = document.querySelector("[data-enhanced-elm-library]");
    const list = section?.querySelector("[data-enhanced-elm-library-list]");
    if (!list) return;
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
