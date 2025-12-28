# Changelog

## v0.4.1 (Phase 1.2+ — Classic UI + scope-aware navigation)

- UI: card title “title bar stripes” styling
- UI: classic scrollbars for code blocks and scrollable list panels
- Target → Site map:
- host/path tree derived from saved history
- click node to load URL into Proxy → Intercept and navigate there
- Copy URL action on nodes
- Proxy → HTTP history:
- scope match badge per row (in-scope / out-of-scope)
- “Hide out-of-scope” toggle

## v0.4 (Phase 1.2 — Target: Scope + Site map)

- Target → Scope: host + path prefix rules persisted locally
- Target → Site map: host/path tree derived from saved Proxy history
- Site map supports “in-scope only” filtering based on Target scope rules
- Site map auto-refreshes when history/scope changes

## v0.3 (Phase 1 — Proxy workflow upgrades)

- HTTP history row click loads into Intercept edit mode
- Overwrite selected history item from Intercept
- Raw request preview + Copy preview
- Reset request / Clear response utilities
- Replay Diff view compares against last replayed body per item

## v0.2 (Quality + tooling)

- Headers editor: row UI + raw import/export + persistence
- Proxy settings: pretty JSON, trim headers, lowercase header keys
- scripts/dev-echo.py local echo server for tests

## v0.1 (UI foundation)

- Tabbed layout (Dashboard / Target / Proxy / Intruder)
- Intercept request builder + response viewer
- LocalStorage persistence for nav + history
