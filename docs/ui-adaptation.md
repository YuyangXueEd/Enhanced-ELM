# ELM UI adaptation map

Enhanced ELM targets the production Angular page at `https://elm.edina.ac.uk/elm-new` using stable custom elements and semantic classes rather than generated Angular attributes.

| Surface | ELM hook | Enhanced ELM treatment |
| --- | --- | --- |
| Composer | `edh-elm-input`, `.query-form-container`, `.query-form` | Compact surface, no redundant inner focus outline, bottom-pinned empty state. |
| Model control | Composer button containing `mat-icon` `memory` | ELM remains the native model selector; a family filter and default-model star are inserted before it. |
| Native model menu | `.model-source-subheader`, `button[role="menuitem"]` | Filters the menu to the selected provider family and clicks only a native menu item. |
| Conversation | `edh-elm-query`, `.query-response`, `.response` | Compact reading width, user-right/ELM-left message alignment, outer-scroll lock. |
| Markdown | `.markdown`, `.markdown-user`, `pre` | Serialises visible rich output into local Markdown and supplies copy buttons. |
| Math | `.katex`, KaTeX TeX annotations | Copies TeX source and repairs only complete, validated formula candidates. |
| History | `edh-elm-chat-history-menu-view` | Keeps ELM's own title list; mounts the local Library below it. |
| Sidebar | `mat-drawer.elm-sidebar .sidemenu-container` | Adds local snapshots/bookmarks and relocates ELM's original footer into a flex-owned bottom section. |
| New-chat guidance | `edh-elm-info-boxes`, known announcement alert | Hides only while the explicit local setting is enabled. |

## Integration rules

- `MutationObserver` is used only to discover Angular-rendered content and re-run idempotent markings.
- Every selector failure is a no-op; it must not prevent a normal ELM action.
- ELM's chat sending, authentication, remote requests, model selection, and reasoning effort are never reimplemented.
- The outer chat card uses `overflow: clip` plus a zero-scroll guard so a long native model menu cannot reveal a false blank scroll area below the composer.
- In collapsed-sidebar state, the drawer margin is removed and composer/response width increases instead of leaving a grey reserved rail.

## Known compatibility limits

- ELM does not expose a stable durable chat ID in the current visible DOM. Saved snapshots are therefore independent local Markdown copies; bookmarks identify current-message text locally and do not modify ELM history.
- Reasoning effort is model-dependent and remains inside the ELM-owned native model flow rather than being duplicated in an extension control.
- Math repair deliberately leaves ambiguous or invalid LaTeX untouched.
