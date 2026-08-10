# Chrome Web Store release checklist

## Product metadata

| Field | Release value |
| --- | --- |
| Name | Enhanced ELM |
| Version | 0.1.1 |
| Category | Productivity |
| Short description | A local-first productivity enhancement for ELM New look conversations. |
| Single purpose | Improve organisation, readability, local Markdown workflow, and recoverable math rendering in ELM New look. |
| Required permission | `storage` only |
| Host scope | `https://elm.edina.ac.uk/*` only |

Use the reviewed English and Chinese copy in [`STORE-LISTING.md`](STORE-LISTING.md). It includes the non-affiliation statement and the exact local-data disclosure.

## Package before upload

1. Reload the unpacked extension and complete [`TESTING.md`](TESTING.md).
2. Confirm `manifest.json` is `0.1.1`. Every subsequent store submission must use a strictly higher version.
3. Build a ZIP where the ZIP root contains `manifest.json`, `src/`, `assets/`, `README.md`, `LICENSE`, and `THIRD_PARTY_NOTICES.md`; do not ZIP an outer project folder.
4. Exclude `.git/`, screenshots containing real conversations, temporary package sources, and development-only files.
5. Keep KaTeX local in the package. Do not substitute a CDN script or remote dynamic code.

## Store assets and disclosure

- Use `assets/icon-128.png` as the extension icon.
- Capture at least three scrubbed 1280×800 screenshots: compact conversation, model family/native model flow, and Library/bookmark/Markdown tools.
- Use demonstration content only; never upload student, research, personal, or API-key data in screenshots.
- Host [`PRIVACY.md`](PRIVACY.md) at a stable public HTTPS URL and add a monitored support email before submission.
- In Privacy practices, disclose local handling of page content for user-requested snapshots, bookmarks, copy, export, and math rendering. State that it is not transmitted, sold, or used for analytics.

The authoritative field values, support URL, privacy URL, and asset sizes are in [`STORE-LISTING.md`](STORE-LISTING.md).

## Submission flow

1. Register a Chrome Web Store developer account and complete the profile.
2. In the Developer Dashboard choose **Add new item**, upload the release ZIP, and complete the listing, privacy, distribution, and test-instruction fields from [`STORE-LISTING.md`](STORE-LISTING.md).
3. Start with **Unlisted** or **Private** distribution for testers if desired; review still applies.
4. Submit with deferred publishing, install the reviewed package, test it once more, then publish.

Official references: [developer registration](https://developer.chrome.com/docs/webstore/register/), [publishing](https://developer.chrome.com/docs/webstore/publish/), [privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy/), and [listing assets](https://developer.chrome.com/docs/webstore/cws-dashboard-listing/).
