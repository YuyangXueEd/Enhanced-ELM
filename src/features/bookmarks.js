(() => {
  const app = globalThis.EnhancedELM;
  const store = app.workspaceStore;
  const { hashText, makeId, textFromNode } = app.dom;
  let activeBookmark;

  function messageDetails(response) {
    const content = response.querySelector(".markdown-user, .markdown");
    const markdown = app.markdown.cleanMarkdown(app.markdown.markdownForNode(content));
    const role = response.classList.contains("response-ai") ? "ELM" : "You";
    const conversationId = hashText(`${location.pathname}|${app.markdown.currentTitle()}`);
    const messageId = hashText(`${role}|${markdown}`);
    return { conversationId, messageId, role, markdown, excerpt: textFromNode(content).slice(0, 180) };
  }

  function bookmarkFor(details) {
    return store.value.bookmarks.find(
      (bookmark) => bookmark.conversationId === details.conversationId && bookmark.messageId === details.messageId
    );
  }

  function ensureButton(response) {
    if (response.hasAttribute("data-elm-clean-system-message")) return;
    const content = response.querySelector(".markdown-container, .markdown-user") ?? response;
    const details = messageDetails(response);
    response.dataset.enhancedElmMessageId = details.messageId;
    let button = content.querySelector("[data-enhanced-elm-bookmark-message]");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.dataset.enhancedElmUi = "";
      button.dataset.enhancedElmBookmarkMessage = "";
      button.className = "enhanced-elm-message-tool enhanced-elm-bookmark-message";
      button.addEventListener("click", () => openDialog(response));
      content.append(button);
    }
    const exists = Boolean(bookmarkFor(details));
    button.textContent = exists ? "bookmark" : "bookmark_border";
    button.title = exists ? "Edit key message note" : "Bookmark key message";
    button.setAttribute("aria-label", button.title);
    button.classList.toggle("enhanced-elm-bookmark-active", exists);
  }

  function ensureDialog() {
    let dialog = document.querySelector("[data-enhanced-elm-bookmark-dialog]");
    if (dialog) return dialog;
    dialog = document.createElement("dialog");
    dialog.dataset.enhancedElmUi = "";
    dialog.dataset.enhancedElmBookmarkDialog = "";
    dialog.className = "elm-clean-library-dialog enhanced-elm-bookmark-dialog";
    dialog.innerHTML = `
      <form method="dialog" class="elm-clean-library-dialog-card">
        <div class="elm-clean-library-dialog-title"><div><h2>Key message</h2><p data-enhanced-elm-bookmark-excerpt></p></div><button value="cancel" title="Close" aria-label="Close">close</button></div>
        <label>Note <small>Optional and stored locally.</small><textarea name="note" maxlength="2000" placeholder="Why is this useful?"></textarea></label>
        <div class="elm-clean-library-dialog-actions"><button type="button" class="elm-clean-secondary" data-enhanced-elm-bookmark-remove>Remove</button><button value="cancel" class="elm-clean-secondary">Cancel</button><button value="save" class="elm-clean-primary">Save note</button></div>
      </form>`;
    document.body.append(dialog);
    dialog.addEventListener("close", () => { if (dialog.returnValue === "save") void saveBookmark(); });
    dialog.querySelector("[data-enhanced-elm-bookmark-remove]").addEventListener("click", () => void removeBookmark());
    return dialog;
  }

  function openDialog(response) {
    const details = messageDetails(response);
    if (!details.markdown) return;
    activeBookmark = { response, details, existing: bookmarkFor(details) };
    const dialog = ensureDialog();
    dialog.querySelector("[data-enhanced-elm-bookmark-excerpt]").textContent = details.excerpt || "Saved message";
    dialog.querySelector('[name="note"]').value = activeBookmark.existing?.note ?? "";
    dialog.querySelector("[data-enhanced-elm-bookmark-remove]").hidden = !activeBookmark.existing;
    if (!dialog.open) dialog.showModal();
  }

  async function saveBookmark() {
    if (!activeBookmark) return;
    const dialog = document.querySelector("[data-enhanced-elm-bookmark-dialog]");
    const note = dialog?.querySelector('[name="note"]').value.trim().slice(0, 2000) ?? "";
    const { details, existing } = activeBookmark;
    const now = new Date().toISOString();
    await store.mutate((draft) => {
      const index = draft.bookmarks.findIndex((item) => item.id === existing?.id);
      const bookmark = {
        id: existing?.id ?? makeId("bookmark"),
        ...details,
        note,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      if (index >= 0) draft.bookmarks[index] = bookmark;
      else draft.bookmarks.unshift(bookmark);
      return draft;
    });
    app.showToast(existing ? "Key message note updated" : "Key message bookmarked");
    activeBookmark = undefined;
    mark();
  }

  async function removeBookmark() {
    if (!activeBookmark?.existing) return;
    const id = activeBookmark.existing.id;
    const dialog = document.querySelector("[data-enhanced-elm-bookmark-dialog]");
    if (dialog?.open) dialog.close("cancel");
    await store.mutate((draft) => {
      draft.bookmarks = draft.bookmarks.filter((item) => item.id !== id);
      return draft;
    });
    app.showToast("Key message removed");
    activeBookmark = undefined;
    mark();
  }

  function renderSidebar() {
    const library = document.querySelector("[data-enhanced-elm-library]");
    if (!library) return;
    let section = library.querySelector("[data-enhanced-elm-bookmark-list]");
    if (!section) {
      section = document.createElement("section");
      section.dataset.enhancedElmUi = "";
      section.dataset.enhancedElmBookmarkList = "";
      section.className = "enhanced-elm-bookmark-list";
      library.append(section);
    }
    section.replaceChildren();
    const currentConversation = hashText(`${location.pathname}|${app.markdown.currentTitle()}`);
    const bookmarks = store.value.bookmarks.filter((item) => item.conversationId === currentConversation).slice(0, 4);
    if (!bookmarks.length) return;
    const heading = document.createElement("p");
    heading.textContent = "KEY MESSAGES";
    section.append(heading);
    for (const bookmark of bookmarks) {
      const button = document.createElement("button");
      button.type = "button";
      button.title = bookmark.note || bookmark.excerpt;
      button.textContent = bookmark.note || bookmark.excerpt;
      button.addEventListener("click", () => {
        document.querySelector(`[data-enhanced-elm-message-id="${bookmark.messageId}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
      section.append(button);
    }
  }

  function mark() {
    if (!app.query) return;
    for (const response of app.query.querySelectorAll(".response")) ensureButton(response);
    renderSidebar();
  }

  app.features.bookmarks = { init() { store.subscribe(renderSidebar); }, mark };
})();
