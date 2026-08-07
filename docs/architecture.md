# Enhanced ELM architecture

## Runtime boundaries

```text
Chrome / Edge
  ├─ Toolbar popup
  │   └─ Enhanced ELM presentation and feature settings
  ├─ Background service worker
  │   └─ default-setting migration only
  └─ Content scripts on elm.edina.ac.uk/elm-new*
      ├─ core/          lifecycle, DOM helpers, local workspace store
      ├─ vendor/katex/  bundled local math renderer
      ├─ features/      independent interface enhancements
      └─ content.js     observes ELM route updates and coordinates modules
```

The extension is Manifest V3 and intentionally buildless. Content scripts run in a defined order from `manifest.json`; browser code never needs a bundler, dynamic import, or remote executable asset.

## Modules

| Location | Responsibility | Data ownership |
| --- | --- | --- |
| `src/shared/settings.js` | Defaults, setting normalisation, old-setting migration names | `enhancedElmSettings` |
| `src/core/extension.js` | Small feature registry, shared state, accessible toast | None |
| `src/core/dom.js` | DOM-safe utilities, local storage wrapper, copy helper | None |
| `src/core/workspace-store.js` | Validates, migrates, persists workspace data and notifies subscribers | `enhancedElmWorkspace` |
| `src/features/model-controls.js` | Family filter, native-model selection, explicit default-model preference | `enhancedElmModelPreference` |
| `src/features/math-repair.js` | Conservative local KaTeX repair | None |
| `src/features/markdown-tools.js` | DOM-to-Markdown serialisation and copy tools | None |
| `src/features/workspace-library.js` | Snapshot dialog, folders/tags/search, Markdown download | workspace snapshots/folders |
| `src/features/bookmarks.js` | Key-message buttons, local notes, sidebar jump list | workspace bookmarks |
| `src/features/timeline.js` | Visible-message navigation rail | None |
| `src/features/sidebar-footer.js` | Moves ELM-owned footer content into normal sidebar flow | None |
| `src/content.js` | Applies root classes, marks stable ELM surfaces, observes route rendering | None |

This division is intentional: features may call the shared DOM and workspace APIs, but they do not directly write another feature's storage key or own its rendering target.

## Local data schema

```json
{
  "version": 2,
  "folders": [{ "id": "inbox", "name": "Inbox" }],
  "snapshots": [{ "id": "…", "title": "…", "folderId": "inbox", "tags": [], "markdown": "…" }],
  "bookmarks": [{ "id": "…", "conversationId": "…", "messageId": "…", "role": "ELM", "excerpt": "…", "note": "…" }]
}
```

All values live in `chrome.storage.local`. Bookmarks use a stable local hash of the currently visible title/message content because ELM does not expose a durable chat ID in a stable page DOM. They never write to, rename, or delete ELM chats.

The store migrates the earlier `elmCleanModeLibrary` data to the `enhancedElmWorkspace` key the first time Enhanced ELM runs. The old appearance-setting key is read as a fallback and migrated by the background worker.

## Math Repair safety model

1. Only inspect visible ELM response content while the user enables Math Repair.
2. Require an entire delimited formula, a code-wrapped complete formula, an exact known Celsius-range failure, or up to three adjacent formula-only display blocks.
3. Ask bundled KaTeX to parse with `throwOnError: true` and `trust: false`.
4. Replace only the validated fragment; leave anything incomplete or invalid untouched.
5. Keep TeX source on the rendered fragment so Markdown export and Copy LaTeX retain the original formula.

No network call is made by Math Repair. The full KaTeX distribution, including fonts, is packaged under `src/vendor/katex/`.

## ELM integration limits

- Stable custom elements and semantic classes are preferred over Angular-generated attributes.
- The extension observes DOM rendering but does not hook ELM network calls, authentication, sending, or model APIs.
- The native ELM model menu remains the source of truth. Family selection only filters that menu and invokes one normal native menu-item click.
- Reasoning effort remains inside ELM's native model flow because its availability is model-specific.
- CSS is scoped beneath the Enhanced ELM root class. Disabling the extension removes the root class and injected feature UI.

## Product inspiration

Voyager demonstrated the value of local organisation, timeline navigation, formula copy, export, and default-model preferences. Enhanced ELM implements its own small Manifest V3 architecture and contains no Voyager source, assets, or styles. See [Voyager's repository](https://github.com/Nagi-ovo/voyager) for the separate GPL-3.0 project.
