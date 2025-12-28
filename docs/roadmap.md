## v0.4 (Phase 1.2 — Target: Scope + Site map)

- Target → Scope: host + path prefix rules persisted locally
- Target → Site map: host/path tree derived from saved Proxy history
- Site map supports “in-scope only” filtering
- Site map: click a host/path node → auto-fill Proxy → Intercept URL + navigate there
- Site map: Copy URL per node
- Proxy → HTTP history: scope match badges (in-scope / out-of-scope)
- Proxy → HTTP history: “Hide out-of-scope” toggle
- UI polish: classic “title bar stripes”, classic scrollbars for code + scrollable lists

## v0.5 (Projects / Workspace)

Goal: a “Project” is an isolated workspace instance (like Burp).

- Dashboard: project overview + health checks
- Create / rename / delete project
- Switch project (dropdown)
- Per-project persistence (history, scope rules, settings, notes)
- Import/export project JSON (backup / share)
- “Reset project” button (clears only the active project)

## v0.6 (Target: Issues + annotations)

- Issue definitions: templates (title, severity, evidence fields)
- Tag/label history items (notes + issue links)
- Simple rule engine: match URL/path/header/body patterns → suggest tags
- History search + filter (host, method, status, tags)

## v0.7 (Intruder MVP — client-side)

- Positions: mark insertion points in a request template
- Payloads: payload sets + iterators
- Runner: sequential attacks with throttling, pause/resume
- Results table + export

## v0.8 (Backend companion — optional)

- Local proxy endpoint to bypass CORS and enable richer HTTP
- Cookie jar + redirect tracing
- Timing metrics
- HAR import/export

## v0.9 (WebSockets capture — backend)

- Capture WS upgrades + frames through proxy
- History + replay

## v1.0 (Stability)

- Hardening, error surfaces, and storage migrations
- Documentation pass + example projects
