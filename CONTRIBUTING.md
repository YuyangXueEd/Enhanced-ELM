# Contributing to Enhanced ELM

Thanks for helping improve ELM responsibly.

## Development principles

- Keep the extension local-first. Do not add analytics, telemetry, cloud sync, remote configuration, or remote executable code without a separate product and privacy review.
- Scope page access to ELM. Do not broaden host permissions for convenience.
- Prefer a small feature module in `src/features/` over adding behaviour to `src/content.js`.
- ELM owns chat sending, authentication, model choice, and reasoning effort. Enhance visible workflow without reimplementing or intercepting those services.
- Treat ELM selectors as unstable integration points. A selector mismatch must degrade gracefully and must never block normal ELM controls.

## Before opening a pull request

1. Update the relevant module and its feature-local styles.
2. Run `node --check` for all non-vendor JavaScript files.
3. Load the extension locally, refresh ELM, and complete the applicable checks in [`docs/TESTING.md`](docs/TESTING.md).
4. Document any new stored field in `docs/architecture.md` and `docs/PRIVACY.md`.
5. Do not commit generated packages, personal screenshots, downloaded chats, or credentials.

## Suggested change shape

- One behaviour change per pull request.
- Explain the ELM DOM hook used and the manual test that exercises it.
- For UI changes, include a scrubbed screenshot at desktop width and dark mode if the colours are affected.
- For a data migration, preserve old local data or describe the migration path explicitly.
