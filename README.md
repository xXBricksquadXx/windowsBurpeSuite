# windowsBurpeSuite

A minimal, browser-based “Burp-like” toolbox for **manual request crafting + local history + replay + diff**.

This is **not** a system proxy / MITM tool. It is a lightweight UI that sends requests via the browser (`fetch()`), saves them to local history (`localStorage`), and supports replay + diff.

## What this is / isn’t

**This is:**

- A request builder (method / URL / headers / body)
- A history list (save, select, replay)
- A simple diff view (compare last replay response vs current)
- A “raw request preview” you can copy/paste for notes

**This is NOT (yet):**

- A system proxy
- CONNECT tunneling
- MITM TLS interception
- A CORS-bypass tool (browser rules still apply)

## Current status

### Phase 1 (current)

**Proxy → Intercept**

- Build request: method / URL / headers / body
- **Send** (direct browser fetch)
- Response: status/meta + headers + body
- **Reset request** (panel-safe)
- **Clear response**
- **Raw request preview** + **Copy preview**

**Proxy → HTTP history**

- **Save as new** (creates a new history item)
- **Row click** = load into Intercept in **edit mode** and auto-select the URL field
- **Select button** = select for replay + prime Intercept without edit mode
- **Overwrite selected** (only enabled when you entered edit mode via row click)

**Replay**

- Replay selected request
- Toggle **Raw / Diff**
- Diff compares **last replay body** for that request id vs current replay body

**Headers editor**

- Row-based editor
- Raw import/export
- Persists to localStorage

**Proxy settings**

- Pretty-print JSON responses
- Lowercase header keys on send
- Trim response headers display

**Local echo target**

- `scripts/dev-echo.py` provides a CORS-friendly local target for sanity tests

### Phase 1.2 (next)

**Target tab becomes functional**

- **Scope**: define in-scope hosts/paths (string rules or regex)
- **Site map**: build a host/path tree from saved history
- Optional: highlight in-scope/out-of-scope items in History

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

## Sanity tests

### A) GET

Proxy → Intercept

- Method: `GET`
- URL: `http://127.0.0.1:8787/hello`
- Send

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
- Some headers are browser-managed (can’t be manually set)
- No socket-level proxying / CONNECT tunneling

If you need non-CORS targets, that becomes a later optional phase with a lightweight companion backend.
