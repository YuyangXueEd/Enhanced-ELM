# Changelog

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
