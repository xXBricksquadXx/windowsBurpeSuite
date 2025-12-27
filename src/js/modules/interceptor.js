import { upsert } from "./storage.js";
import { applyRequestHooks, applyResponseHooks } from "./extender.js";

function byId(id) { return document.getElementById(id); }

function parseHeaders(text) {
  const headers = {};
  const lines = String(text || "").split("\\n");
  for (const raw of lines) {
    const line = raw.replace(/\\r/g, "");
    if (!line.trim()) continue;
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (k) headers[k] = v;
  }
  return headers;
}

function serializeHeaders(obj) {
  return Object.entries(obj || {}).map(([k, v]) => `${k}: ${v}`).join("\\n");
}

function makeId() {
  return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getFormRequest() {
  const method = String(byId("req-method").value || "GET").toUpperCase();
  const url = String(byId("req-url").value || "").trim();
  const headersText = String(byId("req-headers").value || "");
  const body = String(byId("req-body").value || "");
  const headers = parseHeaders(headersText);

  return { method, url, headers, body };
}

export async function sendFromForm(cfg) {
  const metaEl = byId("res-meta");
  const resHeadersEl = byId("res-headers");
  const resBodyEl = byId("res-body");

  const baseReq = getFormRequest();
  const req = applyRequestHooks(baseReq, cfg);

  resHeadersEl.value = "";
  resBodyEl.value = "";
  metaEl.textContent = "Sending…";

  if (!req.url) {
    metaEl.textContent = "Missing URL.";
    return;
  }

  const init = {
    method: req.method,
    headers: req.headers,
  };

  const hasBody = !["GET", "HEAD"].includes(req.method);
  if (hasBody && req.body && req.body.length > 0) {
    init.body = req.body;
  }

  try {
    const response = await fetch(req.url, init);
    const headersObj = {};
    response.headers.forEach((v, k) => { headersObj[k] = v; });
    const bodyText = await response.text();

    let out = {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      headers: headersObj,
      bodyText,
    };

    out = await applyResponseHooks(out, cfg);

    metaEl.textContent = `${out.status} ${out.statusText || ""}`.trim();
    resHeadersEl.value = serializeHeaders(out.headers);
    resBodyEl.value = out.bodyText;
  } catch (err) {
    metaEl.textContent = "Request failed (likely CORS / network).";
    resBodyEl.value = String(err && err.message ? err.message : err);
  }
}

export function saveCurrentToRepeater() {
  const req = getFormRequest();
  if (!req.url) return null;

  const now = new Date().toISOString();
  const item = {
    id: makeId(),
    createdAt: now,
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
  };

  upsert(item);
  return item.id;
}
