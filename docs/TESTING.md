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

## Manual regression checks

- Toggle Enhanced ELM, Math Repair, Markdown tools, and guidance hiding from the popup; refresh after each important state change.
- In light and dark ELM themes, check readable text, disabled web search, selected web search, code blocks, and the composer.
- Open and close the sidebar. In the closed state, the reading column and composer should use the recovered width with no grey rail.
- Start a new chat and select a document without sending a prompt. In both states, the composer must remain at the bottom with no blank page scroll below it.
- Open a long model list. Change the Family field; ELM should choose the first native model in that family and the outer chat card must not scroll.
- Pin a model with the star button, refresh, and confirm the exact available native model is selected once. Clear the star to remove the preference.
- Send a message containing headings, a list, a link, a code block, inline math, and display math. Copy a message, code, and LaTeX; download the full conversation Markdown and inspect the file.
- Test Math Repair with a fully delimited inline formula, a `\\(...\\)` formula, a code-wrapped formula, and the split Celsius-range defect. Invalid or incomplete formulas must remain visible as original text.
- Save a snapshot with a folder and tags. Search it, download it from the Library, and confirm its text remains in local extension storage after a page refresh.
- Attach one and multiple files. The full-width file bar must not reserve space below the composer; the lower-right paperclip must show the count, open its native summary on hover/focus/click, and its **View All** action must still open ELM's native file view.
- Bookmark a user and ELM message, add notes, jump from the sidebar list, edit a note, then remove the bookmark.
- In a long conversation, click timeline nodes and confirm they scroll to the corresponding message.
- Inspect DevTools Console after the checks. There must be no uncaught extension errors and normal ELM sending/model controls must still work.
