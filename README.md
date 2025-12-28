# windowsBurpeSuite

A minimal, browser-based **Burp-like** toolbox for:

- manual request crafting (method / URL / headers / body)
- local HTTP history (save, select, replay)
- replay + diff (compare last replay body vs current)
- **Target scope rules** + **site map derived from captured traffic**
- scope-aware history rows (**IN-SCOPE / OUT-OF-SCOPE**) + optional **Hide out-of-scope** filtering

This project is intentionally lightweight: **no backend** in the current phases. Everything runs in the browser and persists locally.

---

## What this is / isn’t

**This is:**

- a request builder UI (Proxy → Intercept)
- local history persisted in `localStorage` (Proxy → HTTP history)
- replay + diff tooling
- Target scope + sitemap helpers for organizing captured traffic

**This is NOT (yet):**

- a system proxy
- CONNECT tunneling
- MITM TLS interception
- a CORS-bypass tool (browser rules still apply)

---

## Current status

### Phase 1 (Proxy workflow) — shipped

**Proxy → Intercept**

- Build request: method / URL / headers / body
- **Send** (direct browser `fetch()`)
- Response view: status/meta + headers + body
- **Reset request** (panel-safe)
- **Clear response**
- **Raw request preview** + **Copy preview**

**Headers editor**

- Row-based editor
- Raw import/export
- Persists to `localStorage`

**Proxy settings**

- Pretty-print JSON responses
- Lowercase header keys on send
- Trim response headers display

**Proxy → HTTP history**

- **Save as new** (creates a new history item)
- **Row click** = load into Intercept in **edit mode** and auto-select the URL field
- **Select** = select for replay + prime Intercept without edit mode
- **Overwrite selected** (only enabled when you entered edit mode via row click)

**Replay**

- Replay selected request
- Toggle **Raw / Diff**
- Diff compares **last replay body** for that request id vs current replay body

### Phase 1.2 (Target: Scope + Site map) — shipped

**Target → Scope**

- Define in-scope hosts and path prefixes
- Scope can be enabled/disabled

**Target → Site map**

- Builds a host/path tree from saved history
- Optional “In-scope only” filter
- (If enabled in your build) click a node to load URL into **Proxy → Intercept** and navigate there
- (If enabled in your build) copy URL per node

**Proxy → HTTP history (scope integration)**

- Scope badge per row (**IN-SCOPE / OUT-OF-SCOPE**)
- Optional **Hide out-of-scope** filter

### Phase 1.3 (Workflow glue + polish) — next

- Site map node → auto-fill Proxy → Intercept URL + navigate
- Copy URL affordance on site map nodes
- Scope match badges everywhere they matter (history rows, map items)
- UI polish: title-bar stripes + classic scrollbars

---

## Run locally

### 1) Serve the UI (static)

From repo root:

```powershell
python -m http.server 5173 -d .\src
Start-Process "http://127.0.0.1:5173/"
```

### 2) Run local echo target (recommended)

From repo root:

```powershell
python .\scripts\dev-echo.py
```

---

## Sanity tests

### A) GET

Proxy → Intercept

- Method: `GET`
- URL: `http://127.0.0.1:8787/hello`
- Click **Send**

Expected:

- `res-meta` shows `200 OK` + timing
- `res-body` returns JSON or text from echo

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

Expected:

- Echo includes your body + headers

### C) Save + Edit + Overwrite

1. Intercept → **Save as new**
2. Proxy → HTTP history
3. **Click the row** (not Select)

   - Should jump to Intercept and highlight/select URL
   - **Overwrite selected** should enable

4. Edit URL/body, then click **Overwrite selected**
5. Go back to HTTP history → confirm the saved entry updated

### D) Replay + Diff

1. Select a request
2. Replay (Raw)
3. Change server response (or edit request) and Replay again
4. Switch to Diff view

---

## Notes / limitations

- Browser **CORS applies**; you can only call targets that allow it.
- Some headers are browser-managed and cannot be manually set.
- No socket-level proxying / CONNECT tunneling in these phases.

---

## Repo layout (typical)

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
