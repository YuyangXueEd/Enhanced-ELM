# Enhanced ELM

> A local-first productivity extension for [ELM](https://elm.edina.ac.uk/elm-new).

[简体中文](README.zh-CN.md) · [Architecture](docs/architecture.md) · [Privacy](docs/PRIVACY.md) · [Contributing](CONTRIBUTING.md)

Enhanced ELM gives ELM **New look** a compact, readable workspace without replacing its chat or model logic. Everything runs in the browser; the extension has no server, analytics, remote configuration, or cloud sync.

> Enhanced ELM is an independent project. It is not affiliated with, endorsed by, or operated by The University of Edinburgh, EDINA, or ELM.

## Highlights

| Area | What it adds |
| --- | --- |
| Clean workspace | Compact light/dark colour system, title-only chat list, full reading width when the sidebar is closed, and a bottom-pinned new-chat composer. |
| Model workflow | A **Family → ELM model** workflow. Switching family selects its first native model; ELM still owns the actual model menu and any reasoning-effort option. Pin the current model as the local default. |
| Math Repair | Conservative KaTeX rendering for complete recoverable LaTeX, code-wrapped formulas, double-escaped commands, and the observed split Celsius-range defect. Copy the resulting LaTeX source. |
| Local library | Explicit, user-saved Markdown snapshots with folders, tags, search, and download. No silent conversation mirroring. |
| Attachments | A count-badged lower-right paperclip dock. The native attachment summary opens on hover, focus, or click instead of reserving a full row below the composer. |
| Key messages | Bookmark a message, add a local note, and jump back to it from the sidebar. |
| Markdown tools | Copy an individual message as Markdown, copy code blocks, and download the current visible conversation as a Markdown file. |
| Navigation | A compact desktop timeline for jumping through the visible conversation. |

## Installation

### Chrome / Edge developer install

1. Download or clone this repository.
2. Open `chrome://extensions` or `edge://extensions` and enable **Developer mode**.
3. Select **Load unpacked**, then choose this repository folder.
4. In ELM, switch to **New look**, then open or refresh `https://elm.edina.ac.uk/elm-new`.
5. Open the toolbar popup to enable individual presentation, math, and Markdown options.

After a code change, use **Reload** on the extension card, then refresh ELM. The extension intentionally does not run on ELM's legacy interface. The current release is buildless: the folder itself is the unpacked extension.

## How local data works

- Preferences, saved snapshots, default-model preference, bookmarks, and notes use `chrome.storage.local` in the current browser profile.
- Conversation text is stored only when you deliberately save a snapshot or bookmark a message. Markdown export and copy actions stay local to the page/browser.
- Enhanced ELM does not send page content, saved data, or identifiers to the developer or to any third party.
- Removing the extension or clearing its extension data removes this local data.

Read the complete [privacy policy](docs/PRIVACY.md) before publishing to a store.

## Math Repair scope

Math Repair is intentionally conservative. It renders only a complete formula that KaTeX can validate. It does not guess through prose, run remote code, or replace arbitrary page content. If a formula cannot be safely parsed, Enhanced ELM leaves the original text visible. KaTeX 0.17.0 is bundled inside the extension; see [third-party notices](THIRD_PARTY_NOTICES.md).

## Local typography

Enhanced ELM preserves ELM's native interface and reading fonts. It bundles CaskaydiaCove Nerd Font locally for code and other explicit monospace content only. No font request is made to Google Fonts or any other third-party service. Formula rendering and Material icons retain their own dedicated fonts.

If [ELM Math Fixer](https://github.com/lambdacdm/ELM-Math-Fixer) is also installed, use one math-repair extension at a time while comparing results; both extensions may try to repair the same visible fragments.

## Development

```text
manifest.json                 Manifest V3 entry point
src/core/                     Feature registry, DOM helpers, local workspace store
src/features/                 Independent model, math, Markdown, library, bookmark, timeline, and sidebar modules
src/vendor/katex/             Bundled, local KaTeX runtime and fonts
src/content.js                Small lifecycle/orchestration script
src/content.css               Base Clean workspace styling
src/features.css              Feature-local styling
```

Run a fast syntax check after changing JavaScript:

```powershell
Get-ChildItem -Recurse -File src -Filter *.js |
  Where-Object { $_.FullName -notmatch '\\vendor\\' } |
  ForEach-Object { node --check $_.FullName }
```

See [the architecture guide](docs/architecture.md) for data boundaries and the [verification checklist](docs/TESTING.md) for manual regression tests.

## Contributing

Issues and pull requests are welcome. Please keep features scoped to ELM, avoid remote executable code, preserve local-first behaviour, and add a verification step for a new selector or DOM mutation. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Enhanced ELM is released under the [MIT License](LICENSE). KaTeX and its fonts retain their own MIT notice in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
