# Changelog

## 0.1.3 — 13 August 2026

- Adapted Enhanced ELM to ELM's current `/elm` workspace after the New look route was retired.
- Made the local Library independently scrollable and protected it from compression by a long native chat history.
- Added a compact Library chevron plus an accessible horizontal resize handle: drag it up/down or use Arrow keys, Home, and End. The chosen height and collapsed state stay local to the browser.
- Added a 100-chat Library stress fixture and release checks for long histories, keyboard resizing, collapse state, and common laptop viewport sizes.

## 0.1.2 — 11 August 2026

- Replaced the numbered timeline panel with a fixed-width, left-edge conversation rail that remains compact even in long chats.
- Grouped timeline markers into conversation turns and added local hover/focus previews of the user prompt and the opening of ELM's reply.
- Made the current reading position a distinct, longer marker; timeline jumps no longer fight ELM's outer scroll lock.
- Added a 120-message visual stress fixture for the timeline and documented its regression checks.
- Prevented long popup setting descriptions from shrinking or clipping their corresponding switches.

## 0.1.1 — 10 August 2026

- Preserved ELM's original UI and reading fonts; CaskaydiaCove Mono now applies only to code and other explicitly monospace content.
- Added bundled local font loading for the monospace code face, with no remote font requests.
- Improved Math Repair for formulas embedded in Markdown, split display expressions, and a narrow, default-off compatibility recovery for ELM's inline-math plus escaped-currency parsing defect.
- Added release, tester, store, and Edge Add-ons documentation plus a validated store-asset workflow.

## 0.1.0 — 8 August 2026

- First public Enhanced ELM release: compact New look workspace, native Family-to-Model workflow, local default model preference, Math Repair, snapshots, bookmarks, Markdown tools, timeline, and documentation.
- Added the compact attachment dock: attached files no longer reserve a full-width row below the composer.
- The lower-right paperclip shows the attachment count and opens ELM's native attachment summary on hover, focus, or click.
- Corrected composer positioning for attachment-only and normal replies by retaining ELM's own `margin-top: auto` flex contract rather than applying a message-dependent top margin.
- Made composer, response widths, sidebar, timeline, and attachment dock responsive for common 13/14/16-inch MacBook viewports.
- Extended Math Repair to safely render validated formula delimiters embedded within normal Markdown prose.
- Replaced the inherited dark Prism foreground with an explicit, high-contrast code palette for both light and dark themes.
- Limited long composer drafts to a local scrolling text area so their content cannot cover the model controls or send button.
- Removed the unreachable duplicate code-copy icon when ELM provides its native code-copy button.
