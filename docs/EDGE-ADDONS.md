# Microsoft Edge Add-ons submission checklist

Enhanced ELM uses the same validated `Enhanced-ELM-0.1.3.zip` package for Microsoft Edge Add-ons as for the Chrome Web Store. Edge Add-ons accepts extension ZIP packages and converts them for distribution.

## Partner Center fields

Copy the title, descriptions, reviewer instructions, privacy disclosure, and asset plan from [`STORE-LISTING.md`](STORE-LISTING.md).

Use these Edge-specific answers:

| Partner Center field | Submission value |
| --- | --- |
| Single purpose | Provide a compact, local-first productivity workspace for ELM conversations. |
| Permissions justification | `storage` saves preferences and user-requested local workspace data. The ELM host permission limits all page interaction to `elm.edina.ac.uk`. |
| Remote code | No. All code, KaTeX, and font resources are packaged locally. |
| Data usage | The extension processes visible ELM website content and user-generated conversation text locally for user-invoked features. It does not transmit, sell, share, or use data for advertising or analytics. |
| Privacy policy | Use the public HTTPS URL for [`PRIVACY.md`](PRIVACY.md) after the GitHub repository is published. |
| Support | Use the repository Issues URL plus a monitored publisher support email. |

## Submission sequence

1. Register and verify the publisher account in Microsoft Partner Center.
2. Create a Microsoft Edge Add-ons extension submission and upload `Enhanced-ELM-0.1.3.zip`.
3. Complete the Properties, Privacy, and Store listings pages with the values above.
4. Upload the scrubbed 1280 × 800 screenshots. Optional tiles may use 440 × 280 and 1400 × 560 PNG files.
5. Submit for certification with deferred publication if that option is available, then test the certified package before releasing it publicly.

## Policy safeguards

- Keep the product description narrowly focused on improving ELM.
- Retain the non-affiliation statement in the listing.
- Do not claim access to live ELM data, change ELM models, or provide University of Edinburgh services.
- Keep permission, local-storage, and no-transfer statements consistent with the package and privacy policy.
