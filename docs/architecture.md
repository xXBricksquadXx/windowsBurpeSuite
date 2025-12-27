# Architecture

## Design goals

- Simple, readable, minimal dependencies
- Works as a static site (no build step)
- ES6 modules for structure

## Constraints (browser reality)

- A static web app cannot act as a transparent proxy for your system/browser traffic.
- `fetch()` is constrained by CORS and cannot fully replicate raw HTTP (especially some headers).

## Suggested evolution path

### Phase 1 (this repo)

- Interceptor UI: craft requests (method/url/headers/body) and send
- Repeater: save requests + resend + compare
- Extender: small hook system to transform requests/responses

### Phase 2 (optional local companion backend)

- Add a tiny local server (Python FastAPI recommended for speed + clarity)
- Provide endpoints like:
  - POST /proxy  -> performs outbound request server-side (bypasses CORS)
  - POST /replay -> request history + diffing

### Phase 3 (optional UI framework)

- Only if you need complex state, plugin management UI, docking panels, etc.
- If you go framework later, prefer:
  - React + TS (largest ecosystem), or
  - Vue + TS (ergonomic), or
  - Astro (content-heavy + islands)

Recommendation: stay Vanilla until Phase 2 is stable.
