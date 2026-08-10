<div align="center">
  <a href="https://github.com/YuyangXueEd/Enhanced-ELM">
    <img src="assets/icon-128.png" width="92" height="92" alt="Enhanced ELM logo">
  </a>
  <h1>Enhanced ELM</h1>
  <p><strong>A calmer, more capable workspace for ELM New look.</strong></p>
  <p>Local-first organisation, readable conversations, safe Math Repair, and practical Markdown tools — without replacing ELM's own chat or model logic.</p>
  <p>
    <a href="https://chromewebstore.google.com/detail/enhanced-elm/edofogjhmphlpkmldacibdbibfamnnbp"><img src="https://img.shields.io/badge/Chrome%20Web%20Store-Available-1f5c4b?style=flat-square&logo=googlechrome&logoColor=white" alt="Available in the Chrome Web Store"></a>
    <a href="https://github.com/YuyangXueEd/Enhanced-ELM/releases/latest"><img src="https://img.shields.io/github/v/release/YuyangXueEd/Enhanced-ELM?display_name=tag&style=flat-square&color=1f5c4b" alt="Latest GitHub release"></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/YuyangXueEd/Enhanced-ELM?style=flat-square&color=1f5c4b" alt="MIT License"></a>
    <img src="https://img.shields.io/badge/Manifest-V3-1f5c4b?style=flat-square&logo=googlechrome&logoColor=white" alt="Manifest V3">
    <img src="https://img.shields.io/badge/Privacy-Local--first-547665?style=flat-square" alt="Local-first privacy">
  </p>
  <p>
    <a href="https://chromewebstore.google.com/detail/enhanced-elm/edofogjhmphlpkmldacibdbibfamnnbp"><strong>Install from the Chrome Web Store</strong></a>
    &nbsp;·&nbsp;
    <a href="https://github.com/YuyangXueEd/Enhanced-ELM/releases/latest">Download the latest release</a>
    &nbsp;·&nbsp;
    <a href="README.zh-CN.md">简体中文</a>
  </p>
</div>

<p align="center">
  <img src="store-assets/promo-marquee-1400x560-v2.png" alt="Enhanced ELM — a focused workspace for ELM New look" width="100%">
</p>

<p align="center"><sub>Independent, local-first companion for ELM New look.</sub></p>

> [!IMPORTANT]
> Enhanced ELM runs on [ELM **New look**](https://elm.edina.ac.uk/elm-new) only. It is an independent project and is not affiliated with, endorsed by, or operated by The University of Edinburgh, EDINA, or ELM.

## A small extension with useful weight

Enhanced ELM makes the ELM interface easier to live in while leaving ELM in charge of conversations, model availability, and generation. There is no extension server, analytics, remote configuration, or cloud sync.

| Work more calmly | Find your place | Keep useful answers |
| --- | --- | --- |
| Compact, responsive light/dark workspace; a title-only chat list; full reading width with the sidebar closed; and a bottom-pinned composer for new conversations. | Explicit local Markdown snapshots with folders, tags, search, download, message bookmarks, local notes, and a compact conversation timeline. | Per-message Markdown copy, code-block copy, whole-conversation Markdown downloads, a low-profile attachment dock, and conservative KaTeX Math Repair. |

<p align="center">
  <img src="store-assets/screenshot-before-after-1280x800-v1.png" alt="Side-by-side comparison of Original ELM and Enhanced ELM" width="960">
</p>

<p align="center"><sub>Same ELM New look workspace: Original ELM on the left, Enhanced ELM on the right.</sub></p>

## What it adds

### A more focused reading surface

- Tight, legible spacing with a light and dark colour scheme designed around ELM's existing interface.
- Compact chat navigation that shows titles instead of bulky conversation cards.
- A sidebar that gives the conversation the full available width when collapsed.
- A composer that remains usable near the bottom of a new or long conversation, across common laptop and desktop viewport sizes.

### Native model controls, made easier to scan

- A **family → ELM model** workflow: changing family selects that family's first model.
- ELM remains the source of truth for the actual model menu and any available reasoning effort.
- Save the active model as a local default preference; it never alters server-side account settings.

### A local research library

- Save a Markdown snapshot only when you choose to; nothing is silently mirrored.
- Organise saved snapshots with folders, tags, text search, and local downloads.
- Bookmark a useful message, add a private note, and jump back to it from the sidebar.

### More useful output

- Copy one message as Markdown, copy code blocks directly, or download the visible conversation as Markdown.
- Keep file selections out of the composer flow with a paperclip dock that expands only on hover, focus, or click.
- Repair only complete, recoverable LaTeX fragments with bundled KaTeX and offer the repaired source for copying.

## Install in two minutes

### Chrome Web Store

Open [Enhanced ELM on the Chrome Web Store](https://chromewebstore.google.com/detail/enhanced-elm/edofogjhmphlpkmldacibdbibfamnnbp), select **Add to Chrome**, then open or refresh [ELM New look](https://elm.edina.ac.uk/elm-new).

### Manual / tester install (Chrome or Edge)

1. Download the [latest release](https://github.com/YuyangXueEd/Enhanced-ELM/releases/latest) and unzip it, or clone this repository.
2. Open `chrome://extensions` or `edge://extensions`, then enable **Developer mode**.
3. Select **Load unpacked** and choose the unzipped release folder (the folder containing `manifest.json`).
4. Switch ELM to **New look**, open or refresh `https://elm.edina.ac.uk/elm-new`, and open the extension popup to choose the optional presentation, Math Repair, and Markdown tools.

After a source-code change, use **Reload** on the extension card and refresh ELM. The project is buildless: the repository folder itself can be loaded as an unpacked extension.

For a short testing hand-off, see the [tester guide](docs/TESTER-GUIDE.md).

## Local by design

- Preferences, snapshots, default-model preference, bookmarks, and notes stay in `chrome.storage.local` in the current browser profile.
- Conversation text becomes persistent only when you explicitly save a snapshot or bookmark a message. Copy and export actions stay in the browser.
- Enhanced ELM does not send page content, saved data, or identifiers to the developer or another third party.
- Removing the extension or clearing its extension data removes its local data.

Read the complete [privacy policy](docs/PRIVACY.md) for the store-facing details.

## Math Repair, deliberately conservative

Math Repair renders only a complete formula that bundled KaTeX can validate. It supports recoverable LaTeX fragments, code-wrapped formulas, double-escaped commands, and the observed split Celsius-range defect. It does not guess through prose, execute remote code, or replace arbitrary page content. When a fragment cannot be safely parsed, it remains visible as original text.

KaTeX 0.17.0 is bundled inside the extension; see [third-party notices](THIRD_PARTY_NOTICES.md). If [ELM Math Fixer](https://github.com/lambdacdm/ELM-Math-Fixer) is also installed, enable one math-repair extension at a time while comparing results so both extensions do not modify the same visible fragment.

## Typography that respects ELM

Enhanced ELM keeps ELM's native interface and reading fonts. It bundles CaskaydiaCove Nerd Font locally for code and other explicit monospace content only. No font request is made to Google Fonts or any other third-party service; formula rendering and Material icons retain their dedicated fonts.

## Develop or contribute

```text
manifest.json                 Manifest V3 entry point
src/core/                     Feature registry, DOM helpers, local workspace store
src/features/                 Independent model, math, Markdown, library, bookmark, timeline, and sidebar modules
src/vendor/katex/             Bundled, local KaTeX runtime and fonts
src/content.js                Small lifecycle/orchestration script
src/content.css               Base Clean workspace styling
src/features.css              Feature-local styling
```

Run a quick JavaScript syntax check after changing source files:

```powershell
Get-ChildItem -Recurse -File src -Filter *.js |
  Where-Object { $_.FullName -notmatch '\\vendor\\' } |
  ForEach-Object { node --check $_.FullName }
```

The [architecture guide](docs/architecture.md) explains the data boundaries, and [TESTING.md](docs/TESTING.md) records the manual regression checks. Issues and pull requests are welcome; please read [CONTRIBUTING.md](CONTRIBUTING.md) and keep changes ELM-scoped, local-first, and independently testable.

### Release automation

Pushing a matching tag such as `v0.1.2` packages the extension and publishes a GitHub Release automatically. The workflow refuses to release unless the tag, `manifest.json`, and `CHANGELOG.md` agree; store uploads remain manual. See [RELEASING.md](docs/RELEASING.md) for the complete checklist.

## License

Enhanced ELM is released under the [MIT License](LICENSE). KaTeX and its fonts retain their own MIT notice in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
