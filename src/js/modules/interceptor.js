import {
  maybePrettyJson,
  maybeTrimHeaders,
  maybeLowercaseHeaderKeys,
} from "./extender.js";
import { loadSaved, saveSaved } from "./storage.js";

function byId(id) {
  return document.getElementById(id);
}

export async function sendFromForm(cfg) {
  const method = byId("req-method").value.trim().toUpperCase();
  const url = byId("req-url").value.trim();
  const body = byId("req-body").value;

  if (!url) {
    alert("URL required");
    return;
  }

  const hdrs = window.__wbsHeaders?.get?.() || {};
  const headers = maybeLowercaseHeaderKeys(hdrs, cfg);

  const init = { method, headers };
  const hasBody = !["GET", "HEAD"].includes(method);
  if (hasBody && body.trim().length) init.body = body;

  const t0 = performance.now();
  const res = await fetch(url, init);
  const t1 = performance.now();

  byId("res-meta").textContent = `${res.status} ${res.statusText} • ${(
    t1 - t0
  ).toFixed(0)}ms`;

  const headerLines = [];
  res.headers.forEach((v, k) => headerLines.push(`${k}: ${v}`));
  byId("res-headers").textContent =
    maybeTrimHeaders(headerLines.join("\n"), cfg) || "—";

  const raw = await res.text();
  byId("res-body").textContent = maybePrettyJson(raw, cfg) || "—";
}

export function saveCurrentToRepeater() {
  const method = byId("req-method").value.trim().toUpperCase();
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
