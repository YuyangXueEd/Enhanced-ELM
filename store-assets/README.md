# Store assets

This directory contains listing-only assets. They are intentionally excluded from the extension ZIP.

- `promo-small-440x280-v2.png`: ImageGen-assisted Chrome Web Store small promo tile and optional Edge tile; 440 × 280 RGB PNG.
- `promo-marquee-1400x560-v2.png`: ImageGen-assisted optional Chrome marquee tile and optional Edge large promo tile; 1400 × 560 RGB PNG.
- `generated-promo-art-v1.png`: the text-free ImageGen source artwork used to create the v2 tiles. It is not itself sized for store upload.
- `promo-small-440x280.png` and `promo-marquee-1400x560.png`: earlier code-drawn alternatives, retained for comparison.
- `screenshot-compact-workspace-1280x800-rgb.png`: scrubbed real Chrome capture of the compact workspace, Markdown tools, Math Repair, and composer; converted to a 24-bit RGB PNG for dashboard upload.
- `screenshot-compact-workspace-1280x800.png`: original scrubbed capture retained as the source image.
- `promo-screenshot-1280x800-v1.png`: ImageGen-assisted 1280 × 800 supplementary promotional graphic, matching the small-tile visual system. It is not a replacement for a real product screenshot.
- `screenshot-before-after-1280x800-v1.png`: 1280 × 800 real-product comparison, using a scrubbed Original ELM New look capture on the left and an Enhanced ELM capture on the right. Use it as the first Chrome Web Store screenshot.
- Store screenshots must be real, scrubbed 1280 × 800 captures of Enhanced ELM. Never use a real conversation without explicit permission.

Regenerate the promo tiles with:

```powershell
.\scripts\create-store-promo-assets.ps1
```
