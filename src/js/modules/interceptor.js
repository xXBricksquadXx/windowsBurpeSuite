import {
  maybePrettyJson,
  maybeTrimHeaders,
  maybeLowercaseHeaderKeys,
} from "./extender.js";
import { loadSaved, saveSaved } from "./storage.js";

function byId(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  const el = byId(id);
  if (el) el.textContent = text;
}

function hideHeaderIO() {
  const io = byId("hdr-io");
  if (io) io.classList.add("is-hidden");
}

export function clearResponsePanel() {
  setText("res-meta", "—");
  setText("res-headers", "—");
  setText("res-body", "—");
}

export function focusUrlField({ select = true } = {}) {
  const el = byId("req-url");
  if (!el) return;
  el.focus();
  if (select && typeof el.select === "function") el.select();
}

export function resetRequestForm() {
  const method = byId("req-method");
  const url = byId("req-url");
  const body = byId("req-body");

  if (method) method.value = "GET";
  if (url) url.value = "";
  if (body) body.value = "";

  // Reset headers to a sensible default.
  // This intentionally overwrites persisted headers (explicit action).
  const defaultHeaders = { Accept: "application/json" };
  window.__wbsHeaders?.set?.(defaultHeaders);

  hideHeaderIO();
}

export function loadRequestToForm(item) {
  if (!item) return;

  const method = byId("req-method");
  const url = byId("req-url");
  const body = byId("req-body");

  if (method) method.value = String(item.method || "GET").toUpperCase();
  if (url) url.value = String(item.url || "");
  if (body) body.value = String(item.body || "");

  window.__wbsHeaders?.set?.(item.headers || {});
  hideHeaderIO();
}

function bindInterceptorUtilities() {
  const btnReset = byId("btn-reset-request");
  const btnClearRes = byId("btn-clear-response");

  // Avoid double-binding if app hot-reloads or re-imports.
  if (btnReset && !btnReset.dataset.bound) {
    btnReset.dataset.bound = "1";
    btnReset.addEventListener("click", () => resetRequestForm());
  }

  if (btnClearRes && !btnClearRes.dataset.bound) {
    btnClearRes.dataset.bound = "1";
    btnClearRes.addEventListener("click", () => clearResponsePanel());
  }
}

// Bind immediately (script loads at end of body).
bindInterceptorUtilities();

export async function sendFromForm(cfg) {
  const method = byId("req-method").value.trim().toUpperCase() || "GET";
  const url = byId("req-url").value.trim();
  const body = byId("req-body").value;

  if (!url) {
    alert("URL required");
    return;
  }

  setText("res-meta", "Sending…");
  setText("res-headers", "—");
  setText("res-body", "—");

  const hdrs = window.__wbsHeaders?.get?.() || {};
  const headers = maybeLowercaseHeaderKeys(hdrs, cfg);

  const init = { method, headers };
  const hasBody = !["GET", "HEAD"].includes(method);
  if (hasBody && body.trim().length) init.body = body;

  try {
    const t0 = performance.now();
    const res = await fetch(url, init);
    const t1 = performance.now();

    setText(
      "res-meta",
      `${res.status} ${res.statusText} • ${(t1 - t0).toFixed(0)}ms`
    );

    const headerLines = [];
    res.headers.forEach((v, k) => headerLines.push(`${k}: ${v}`));
    setText(
      "res-headers",
      maybeTrimHeaders(headerLines.join("\n"), cfg) || "—"
    );

    const raw = await res.text();
    const ct = res.headers.get("content-type") || "";
    setText("res-body", maybePrettyJson(raw, cfg, ct) || "—");
  } catch (err) {
    const msg =
      err && err.message ? err.message : String(err || "Unknown error");
    setText("res-meta", "Request failed (CORS / network)");
    setText("res-body", msg);

    console.warn(
      "Fetch failed. If this is CORS, run: python .\\scripts\\dev-echo.py",
      err
    );
  }
}

export function saveCurrentToRepeater() {
  const method = byId("req-method").value.trim().toUpperCase() || "GET";
  const url = byId("req-url").value.trim();
  const body = byId("req-body").value;

  if (!url) {
    alert("URL required");
    return null;
  }

  const headers = window.__wbsHeaders?.get?.() || {};
  const item = {
    id: crypto.randomUUID(),
    ts: Date.now(),
    method,
    url,
    headers,
    body,
  };

  const all = loadSaved();
  all.unshift(item);
  saveSaved(all);

  return item.id;
}
