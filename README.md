# windowsBurpeSuite

- A request builder (method / URL / headers / body)
- A history list (save, select, replay)
- A diff view (compare last replay response vs current)
- Scope rules + sitemap derived from captured traffic

**This is NOT (yet):**

- A system proxy
- CONNECT tunneling
- MITM TLS interception
- A CORS-bypass tool (browser rules still apply)

## Current status

### Phase 1 (Proxy workflow)

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
- **Select** = select for replay + prime Intercept without edit mode
- **Overwrite selected** (only enabled when you entered edit mode via row click)
- Scope badge per row (in-scope / out-of-scope)
- Optional **Hide out-of-scope** filter

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

### Phase 1.2 (Target: Scope + Site map)

**Target → Scope**

- Define in-scope hosts and path prefixes
- Scope can be enabled/disabled

**Target → Site map**

- Builds a host/path tree from saved history
- Optional “In-scope only” filter
- Click a node to load URL into **Proxy → Intercept** and navigate there
- Copy URL per node

## Run locally

### 1) Serve the UI (static)

From repo root:

```powershell
python -m http.server 5173 -d .\src
Start-Process "http://127.0.0.1:5173/"
```

2. Run local echo target (recommended)

From repo root:

```
python .\scripts\dev-echo.py
```

Sanity tests A)

```
 GET

Proxy → Intercept

Method: GET

URL: http://127.0.0.1:8787/hello

Send

Expected:

res-meta shows 200 OK + timing

res-body returns JSON or text from echo

B) POST JSON

Proxy → Intercept

Method: POST

URL: http://127.0.0.1:8787/api

Headers:

Accept: application/json

Content-Type: application/json

Body:{ "ping": "pong" }
```
