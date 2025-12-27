# windowsBurpeSuite

A minimal, browser-based “Burp-like” toolbox for **manual request crafting + replay + diff**.

This is **not** a system proxy / MITM tool. It is a lightweight UI that sends requests via the browser (`fetch()`), saves them to local history, and supports replay + diff.

## Current status

**Phase 0 (current):**

- Proxy → **Intercept**: build a request (method / URL / headers / body), send, view response
- Proxy → **HTTP history**: save requests, select one, replay it
- **Replay**: Raw / Diff toggle
- **Headers editor**: row-based editor + raw import/export
- **Proxy settings** toggles: pretty-print JSON, lowercase header keys, trim response headers
- `scripts/dev-echo.py`: local echo target for sanity tests

**Phase 1 (next):**

- Editing/crafting flow between History ↔ Intercept (Edit / Save as new / Overwrite)
- Better request presets and templates
- Target scaffolding (scope list + sitemap placeholder)
- Optional: GitLab Pages deploy

## Run locally

### 1) Serve the UI (static)

From repo root:

```powershell
python -m http.server 5173 -d .\src
Start-Process "http://localhost:5173/"
```

### 2) Run local echo target (recommended)

From repo root:

```powershell
python .\scripts\dev-echo.py
```

## Phase 0 sanity tests

### A) GET

Proxy → Intercept

- Method: `GET`
- URL: `http://127.0.0.1:8787/hello`
- Send

### B) POST JSON

Proxy → Intercept

- Method: `POST`
- URL: `http://127.0.0.1:8787/api`
- Headers:

  - `Accept: application/json`
  - `Content-Type: application/json`

- Body:

```json
{ "ping": "pong" }
```

- Send

### C) Save + Replay + Diff

- Proxy → Intercept → **Save**
- Proxy → HTTP history → **Select** → **Replay**
- Toggle **Raw / Diff** to confirm diffs render

## Repo layout

```
windowsBurpeSuite/
  src/
    index.html
    css/styles.css
    js/
      app.js
      ui.js
      modules/
        interceptor.js
        repeater.js
        diff.js
        extender.js
        headersEditor.js
        storage.js
  scripts/
    dev-echo.py
  docs/
    TEST_UI.md
```

## Browser limitations (important)

Because this phase runs entirely in the browser:

- **CORS applies** (you can only call targets that allow it)
- some headers are browser-managed (can’t be manually set)
- no socket-level proxying / CONNECT tunneling

If you need to hit non-CORS targets, that becomes a later phase (optional lightweight companion backend).
