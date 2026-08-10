# Store listing copy — Enhanced ELM 0.1.1

Use this document as the single source of truth for Chrome Web Store and Microsoft Edge Add-ons metadata. Do not claim affiliation with The University of Edinburgh, EDINA, or ELM.

## Product fields

| Field | Value |
| --- | --- |
| Product name | Enhanced ELM |
| Version | 0.1.1 |
| Category | Productivity |
| Homepage | `https://github.com/YuyangXueEd/Enhanced-ELM` |
| Support URL | `https://github.com/YuyangXueEd/Enhanced-ELM/issues` |
| Privacy policy URL | `https://github.com/YuyangXueEd/Enhanced-ELM/blob/main/docs/PRIVACY.md` — publish the repository before using this URL |
| Extension scope | ELM **New look** at `https://elm.edina.ac.uk/elm-new` only |

## English listing

### Short description

Local-first productivity enhancements for ELM New look conversations.

### Detailed description

Enhanced ELM is an independent, local-first productivity extension for ELM New look.

It gives ELM a compact, readable workspace while preserving ELM's own conversation, model, and account logic. Features include a Family-to-native-Model workflow, a local default-model preference, a local snapshot library with folders and tags, message bookmarks and notes, timeline navigation, Markdown/code/LaTeX copy, Markdown conversation download, and conservative local Math Repair with KaTeX.

Enhanced ELM keeps attachments compact in a lower-right dock, supports a compact sidebar, and adds local typography for Chinese, Latin UI text, and code. It does not run on ELM's legacy interface.

Your conversation content stays in the browser. Enhanced ELM has no server, analytics, advertising, remote configuration, cloud sync, or remote executable code. Conversation text is retained only when you explicitly save a local snapshot or bookmark a message.

Enhanced ELM is not affiliated with, endorsed by, or operated by The University of Edinburgh, EDINA, or ELM.

## Chinese listing draft

### 简短说明

为 ELM New look 对话提供本地优先的效率增强功能。

### 详细说明

Enhanced ELM 是面向 ELM New look 的独立、本地优先效率增强扩展。它在不替换 ELM 对话、模型或账户逻辑的前提下，提供更紧凑、更易读的工作区。

功能包括模型家族到 ELM 原生模型的工作流、本地默认模型偏好、支持文件夹和标签的本地快照库、关键消息书签和笔记、时间线导航、Markdown/代码/LaTeX 复制、对话 Markdown 下载，以及基于 KaTeX 的保守数学公式修复。

对话内容保留在浏览器中。Enhanced ELM 没有服务器、分析、广告、远程配置、云同步或远程可执行代码；只有在你主动保存快照或创建书签时，对话文字才会保存到浏览器本地存储。

Enhanced ELM 与爱丁堡大学、EDINA 或 ELM 没有隶属、背书或运营关系。

## Privacy declarations

Use truthful answers that match the release package:

- **Single purpose:** Provide a compact, local-first productivity workspace for ELM New look conversations.
- **Permissions:** `storage` stores preferences and user-requested local snapshots, bookmarks, folders, tags, notes, and default-model preference. The ELM host permission is limited to applying visible enhancements and local tools on `elm.edina.ac.uk`.
- **User data:** The extension handles visible ELM website content and user-generated conversation text locally to provide features the user invokes. It does not transmit, sell, share, or use that data for analytics or advertising.
- **Remote code:** No. All JavaScript, KaTeX, and font resources are packaged with the extension.
- **Privacy policy:** Provide the hosted `docs/PRIVACY.md` URL after it is publicly reachable.

## Reviewer instructions

Enhanced ELM is active only after an authorised ELM user opens `https://elm.edina.ac.uk/elm-new` and switches on ELM **New look**. It requires no account, credential, or setup beyond the ELM service itself. All enhancements run client-side; no test credential is requested or stored by Enhanced ELM.

## Asset plan

Use only scrubbed demonstration conversations. Never include student, research, personal, or API-key content.

| Asset | Chrome Web Store | Microsoft Edge Add-ons | Status |
| --- | --- | --- | --- |
| Store icon | 128 × 128 PNG | Uses manifest icon | Ready: `assets/icon-128.png` |
| Before / after comparison | 1280 × 800 PNG | 1280 × 800 PNG | Ready: `store-assets/screenshot-before-after-1280x800-v1.png`; use as the first actual product screenshot. |
| Compact workspace screenshot | 1280 × 800 PNG | 1280 × 800 PNG | Ready: `store-assets/screenshot-compact-workspace-1280x800-rgb.png` |
| Supplementary promotional graphic | 1280 × 800 PNG | 1280 × 800 PNG | Optional: `store-assets/promo-screenshot-1280x800-v1.png`; do not use instead of a real product screenshot. |
| Models and composer screenshot | 1280 × 800 PNG | 1280 × 800 PNG | Create from a scrubbed demo |
| Library / bookmarks screenshot | 1280 × 800 PNG | 1280 × 800 PNG | Create from a scrubbed demo |
| Small promo tile | 440 × 280 PNG/JPEG | Optional, 440 × 280 PNG | Ready: `store-assets/promo-small-440x280-v2.png` |
| Marquee / large promo tile | 1400 × 560 PNG/JPEG, optional | Optional, 1400 × 560 PNG | Ready: `store-assets/promo-marquee-1400x560-v2.png` |

## Final publisher-only checks

1. Publish the GitHub repository so the privacy-policy and support URLs are publicly reachable.
2. Set a monitored publisher support email in each dashboard.
3. Upload the validated `Enhanced-ELM-0.1.1.zip` with `manifest.json` at its root.
4. Use deferred/staged publication and re-test the reviewed package before public release.
