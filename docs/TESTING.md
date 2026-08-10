# Verification checklist

Run these checks after reloading the unpacked extension and refreshing `https://elm.edina.ac.uk/elm-new`.

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
- With experimental Markdown compatibility enabled, test `$x^2+y^2=z^2$ and an escaped \\$7 amount.` in a normal paragraph. The formula and `$7` must render as expected; an ordinary code block and a normal native inline formula must remain unchanged.
- Save a snapshot with a folder and tags. Search it, download it from the Library, and confirm its text remains in local extension storage after a page refresh.
- Attach one and multiple files. The full-width file bar must not reserve space below the composer; the lower-right paperclip must show the count, open its native summary on hover/focus/click, and its **View All** action must still open ELM's native file view.
- Paste a multi-paragraph draft into the composer. The input must stop growing at its local limit, display a usable vertical scrollbar, keep the model/control row below the text, and remain editable without moving the composer out of its card.
- Bookmark a user and ELM message, add notes, jump from the sidebar list, edit a note, then remove the bookmark.
- In a long conversation, click timeline nodes and confirm they scroll to the corresponding message.
- Inspect DevTools Console after the checks. There must be no uncaught extension errors and normal ELM sending/model controls must still work.
