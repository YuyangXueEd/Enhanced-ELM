# 0.1.2 code review

Reviewed: 11 August 2026

## Findings resolved

| Finding | Resolution |
| --- | --- |
| One large content script mixed UI, storage, model and export responsibilities. | Split into core helpers/store, isolated feature modules, and a small lifecycle orchestrator. |
| Existing saved library/settings used product-specific legacy keys. | Added normalised local-data migration paths for the legacy library and appearance settings. |
| Math output could not be reliably repaired because ELM does not expose a page-global renderer. | Bundled local KaTeX 0.17.0, added an MIT notice, and use strict validated rendering only. |
| Default model was not represented as an explicit local preference. | Added an opt-in star control; it saves only after the user pins the live native model. |
| User actions shared unclear storage ownership. | `workspace-store.js` is the single writer for folders, snapshots, bookmarks, and notes. |
| Extension disable could leave model observer state disconnected. | Model feature now resets/reconnects its observer state on the next enable. |
| Clearing a model preference attempted to store `undefined`. | Uses `chrome.storage.local.remove` through the shared storage helper. |
| Attached files reserved a large full-width row beneath the composer. | Keeps ELM's native file widget and View All action, but docks it as a count-badged lower-right hover/focus popup outside normal layout. |
| A numbered timeline grew horizontally as conversations grew and competed with the reading column. | Replaced it with a fixed 26px left-edge rail whose marker list scrolls only vertically. |
| A timeline click could be counteracted by the outer-card scroll guard. | The shared lifecycle now briefly pauses that guard for an explicit timeline jump. |
| Preview text included ELM avatar and extension-tool labels. | Timeline previews clone only the message body, remove controls and duplicate KaTeX semantic layers, then render a local two-line prompt/reply summary. |
| Long popup descriptions could compress switches beyond their visible width. | The text column may shrink while each switch retains a 38px flex basis. |

## Checks completed

- `manifest.json` parses, contains **Enhanced ELM** version **0.1.2**, has only the `storage` permission, and all declared resources exist.
- `node --check` passes for every non-vendor JavaScript file.
- A no-network scan finds no `fetch`, XHR, WebSocket, beacon, or HTTP URL in first-party source code.
- Bundled KaTeX validated four representative inputs: Celsius range, quadratic formula, aligned equations, and summation.
- On the live ELM New look page, verified clean prompt/reply previews, rail placement with the sidebar open and closed, timeline jump visibility, current-marker state, no horizontal overflow, and no console errors.
- The 120-message/60-turn `tests/timeline-stress.html` fixture exercises the rail's bounded vertical marker list without affecting packaged extension files.
- Documentation, store checklist, privacy policy, MIT license, and KaTeX third-party notice are present.

## Release-test items requiring the unpacked browser extension

The live page has to be refreshed after reloading the local unpacked extension. Run the model menu, sidebar/footer, snapshot, bookmark, Markdown, and Math Repair checks in [`TESTING.md`](TESTING.md) before a public store submission. This remains a manual gate because ELM is authenticated and its Angular DOM can change independently of the extension.

## Follow-up opportunities

- Export/import a complete local-workspace backup after defining a conflict policy.
- Add a user-controlled prompt vault only after deciding whether saved prompt text belongs in the same local workspace schema.
- Add Mermaid rendering only if it can be bundled locally and tested without executing remote diagram code.
- Add a feature-compatibility notice for concurrent third-party math repair extensions if users report double processing.
