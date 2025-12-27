# windowsBurpeSuite

A minimal, browser-based “Burp-like” toolbox with a clean UI:

- **Dashboard** (target overview + quick actions)
- **Target** (site map, scope, issue definitions)
- **Proxy** (intercept, HTTP history, WebSockets history, proxy settings)
- **Intruder** (positions, payloads, resource pool, settings)

This stays **Vanilla HTML/CSS/JS (ES6 modules)**: simple is beautiful.

> Note: This repo includes a **companion backend scaffold** that can run an HTTPS UI and a basic forward proxy listener.
> It is *not* a full MITM intercepting proxy yet (CONNECT tunnels are pass-through). The TLS/CA docs are included for the next step.

## Run locally

### Option A: Static UI (no backend)
Open `src/index.html` directly, or serve `src/` with any static server.

Examples:
- Python: `python -m http.server 5173` (run inside `src/`)
- Node: `npx serve .` (run inside `src/`)

### Option B: Companion backend (recommended for “Burp-like” flow)
1) Generate/trust local certs (see `docs/tls-ca.md`)
2) Run backend:
- `cd backend`
- `node server.mjs`

Backend defaults:
- HTTPS UI: `https://localhost:8443`
- Proxy listener: `http://127.0.0.1:8080`

## FoxyProxy / Firefox setup
See `docs/foxyproxy.md`.

## GitLab deploy (static UI)
This repo includes a minimal GitLab Pages pipeline that publishes `src/` as static content.
See `.gitlab-ci.yml`.
