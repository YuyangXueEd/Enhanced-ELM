# Verification checklist

Run these checks after reloading the unpacked extension and refreshing `https://elm.edina.ac.uk/elm`.

## Fast static checks

```powershell
Get-ChildItem -Recurse -File src -Filter *.js |
  Where-Object { $_.FullName -notmatch '\\vendor\\' } |
  ForEach-Object { node --check $_.FullName }
```

- Confirm `manifest.json` parses as JSON and every listed content-script and CSS path exists.
- Confirm the package contains no remote JavaScript URL and no unexpected permission.
- Confirm every local font declared in `src/core/local-fonts.js` exists under `src/vendor/fonts/`, has a corresponding licence notice, and no Google Fonts or other remote font URL is present.

## Manual regression checks

- Toggle Enhanced ELM, Math Repair, Markdown tools, guidance hiding, and the experimental Markdown compatibility setting from the popup; refresh after each important state change.
- In light and dark ELM themes, check readable text, disabled web search, selected web search, code blocks, and the composer. Code foreground must remain readable against its code surface with no inherited white Prism text or text shadow in light mode.
- Confirm ELM's native UI and reading font are preserved, source code uses CaskaydiaCove Mono, and Material icons plus KaTeX continue using their dedicated fonts.
- Check responsive desktop layouts at approximately 1280×832, 1512×982, and 1728×1117 CSS pixels (or equivalent browser zoom). The composer must remain inside the card bottom, the reading column must remain comfortable, and sidebar/timeline/attachment dock controls must not overlap.
- Open and close the sidebar. In the closed state, the reading column and composer should use the recovered width with no grey rail.
- Start a new chat, select a document without sending a prompt, and test a chat with a normal reply. In all three states, the composer must remain inside the bottom edge of ELM's card with no blank page scroll below it.
- Open a long model list. Change the Family field; ELM should choose the first native model in that family and the outer chat card must not scroll.
- Pin a model with the star button, refresh, and confirm the exact available native model is selected once. Clear the star to remove the preference.
- Send a message containing headings, a list, a link, a code block, inline math, and display math. Copy a message and LaTeX; for code, verify ELM's single native **Copy** button works with no unreachable Enhanced ELM icon underneath it. Download the full conversation Markdown and inspect the file.
- Test Math Repair with a fully delimited inline formula embedded in prose, a display formula embedded in Markdown, a `\\(...\\)` formula, a code-wrapped formula, and the split Celsius-range defect. Invalid or incomplete formulas must remain visible as original text.
- Open `tests/math-repair-compatibility.html` through a local server for the fragmented-display regression: an opening `$$`, multiline TeX, and a standalone `-` that ELM converts into an empty list item. All six checks must pass, including cross-message safety and the Markdown export of native MathML.
- With experimental Markdown compatibility enabled, test `$x^2+y^2=z^2$ and an escaped \\$7 amount.` in a normal paragraph. The formula and `$7` must render as expected; an ordinary code block and a normal native inline formula must remain unchanged.
- Save a snapshot with a folder and tags. Search it, download it from the Library, and confirm its text remains in local extension storage after a page refresh.
- With a long native chat history, confirm Library retains its own scrollable area and the native history scrolls independently. Drag the thin horizontal handle above **Library** up/down to resize it; test Arrow Up/Down, Home, and End on the focused handle. Use the Library chevron to collapse it to one row, refresh ELM, and confirm the chosen expanded/collapsed state and selected height persist locally. For a repeatable 100-chat stress case, open `tests/sidebar-library-stress.html` through a local server.
- Attach one and multiple files. The full-width file bar must not reserve space below the composer; the lower-right paperclip must show the count, open its native summary on hover/focus/click, and its **View All** action must still open ELM's native file view.
- Paste a multi-paragraph draft into the composer. The input must stop growing at its local limit, display a usable vertical scrollbar, keep the model/control row below the text, and remain editable without moving the composer out of its card.
- Bookmark a user and ELM message, add notes, jump from the sidebar list, edit a note, then remove the bookmark.
- In a long desktop conversation, use the fixed-width left-edge timeline rail. Each short marker maps to a conversation turn; hover or keyboard-focus for a two-line preview of the user prompt and the start of ELM's reply, then click to jump. The darker, longer marker follows the current reading position. The rail is intentionally hidden until a conversation has at least two messages and on narrow/mobile layouts.
- Open `tests/timeline-stress.html` in Chrome for the 120-message/60-turn visual stress fixture. Confirm the rail remains 26px wide, its marker list scrolls vertically without horizontal page overflow, and previews stay within the viewport at the first, middle, and last marker.
- Inspect DevTools Console after the checks. There must be no uncaught extension errors and normal ELM sending/model controls must still work.
