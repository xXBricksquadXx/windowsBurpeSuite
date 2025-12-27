# windowsBurpeSuite

A minimal, browser-based "Burp-like" toolbox (Interceptor / Repeater / Extender-style hooks).

This is intentionally **Vanilla HTML/CSS/JS (ES6 modules)**: simple is beautiful.

## What this is (and is not)

- **Is:** A clean UI for crafting requests, saving/replaying them, and applying small transform hooks ("extensions").
- **Is not:** A full proxy that can transparently intercept arbitrary browser traffic (browsers restrict this).

## Run locally

Option A (Python, if available):
```bash
cd src
python -m http.server 8000
```
Then open http://localhost:8000

Option B (Node, if available):
```bash
cd src
npx serve .
```

## Recommended route (practical)

1) Keep this **Vanilla** UI as the front-end foundation (fast iteration, no build step).
2) Add an **optional local companion backend** later (Python FastAPI or Node) to:
- proxy requests to avoid CORS issues
- support raw HTTP (custom headers, cookies, redirects) more faithfully
- enable "true repeater" with timing, diffing, and history persistence
3) Only introduce React/TS/Vue/Astro if the UI complexity grows (plugins marketplace, multi-pane layouts, heavy state).

See `docs/architecture.md` and `docs/roadmap.md`.
