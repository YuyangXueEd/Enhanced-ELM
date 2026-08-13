(() => {
  const { storageGet, storageSet, makeId } = globalThis.EnhancedELM.dom;
  const KEY = "enhancedElmWorkspace";
  const LEGACY_KEY = "elmCleanModeLibrary";
  const MIN_LIBRARY_HEIGHT = 92;
  const MAX_LIBRARY_HEIGHT = 440;
  const DEFAULT_WORKSPACE = Object.freeze({
    version: 3,
    folders: [{ id: "inbox", name: "Inbox" }],
    snapshots: [],
    bookmarks: [],
    libraryCollapsed: false
  });
  let workspace = structuredClone(DEFAULT_WORKSPACE);
  let loaded = false;
  const listeners = new Set();

  function normaliseFolder(folder) {
    if (!folder || typeof folder.id !== "string" || typeof folder.name !== "string") return undefined;
    return { id: folder.id, name: folder.name.trim().slice(0, 60) || "Untitled" };
  }

  function normaliseLibraryHeight(value) {
    const height = Number(value);
    if (!Number.isFinite(height) || height < MIN_LIBRARY_HEIGHT) return undefined;
    return Math.round(Math.min(height, MAX_LIBRARY_HEIGHT));
  }

  function normaliseWorkspace(value) {
    const folders = Array.isArray(value?.folders) ? value.folders.map(normaliseFolder).filter(Boolean) : [];
    if (!folders.some((folder) => folder.id === "inbox")) folders.unshift({ id: "inbox", name: "Inbox" });
    return {
      version: 3,
      folders,
      snapshots: Array.isArray(value?.snapshots)
        ? value.snapshots.filter((snapshot) => snapshot && typeof snapshot.id === "string")
        : [],
      bookmarks: Array.isArray(value?.bookmarks)
        ? value.bookmarks.filter((bookmark) => bookmark && typeof bookmark.id === "string")
        : [],
      libraryCollapsed: Boolean(value?.libraryCollapsed),
      libraryHeight: normaliseLibraryHeight(value?.libraryHeight)
    };
  }

  function notify() {
    for (const listener of listeners) listener(workspace);
  }

  async function load() {
    const saved = await storageGet(KEY, undefined);
    const legacy = saved ? undefined : await storageGet(LEGACY_KEY, undefined);
    workspace = normaliseWorkspace(saved ?? legacy ?? DEFAULT_WORKSPACE);
    loaded = true;
    if (!saved && legacy) await storageSet(KEY, workspace);
    notify();
    return workspace;
  }

  async function mutate(mutator) {
    const draft = structuredClone(workspace);
    const next = mutator(draft) ?? draft;
    workspace = normaliseWorkspace(next);
    await storageSet(KEY, workspace);
    notify();
    return workspace;
  }

  function addFolder(name) {
    const compactName = name.trim().replace(/\s+/g, " ").slice(0, 60);
    if (!compactName) return Promise.resolve(undefined);
    const duplicate = workspace.folders.find(
      (folder) => folder.name.toLocaleLowerCase() === compactName.toLocaleLowerCase()
    );
    if (duplicate) return Promise.resolve(duplicate);
    const folder = { id: makeId("folder"), name: compactName };
    return mutate((draft) => {
      draft.folders.push(folder);
      return draft;
    }).then(() => folder);
  }

  globalThis.EnhancedELM.workspaceStore = Object.freeze({
    KEY,
    get value() { return workspace; },
    get loaded() { return loaded; },
    load,
    mutate,
    addFolder,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  });
})();
