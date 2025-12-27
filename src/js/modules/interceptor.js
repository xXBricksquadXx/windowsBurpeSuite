import {
  maybePrettyJson,
  maybeTrimHeaders,
  maybeLowercaseHeaderKeys,
} from "./extender.js";
import { loadSaved, saveSaved, updateSavedById } from "./storage.js";

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

let editId = null;

function setEditMeta() {
  const meta = byId("edit-meta");
  const btn = byId("btn-overwrite");

  if (meta) {
    meta.textContent = editId
      ? `Editing history item (${editId}) — overwrite enabled`
      : "Draft (not linked to history)";
  }
  if (btn) btn.disabled = !editId;
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

  const defaultHeaders = { Accept: "application/json" };
  window.__wbsHeaders?.set?.(defaultHeaders);

  hideHeaderIO();

  editId = null;
  setEditMeta();
}

export function loadRequestToForm(item, { mode = "view" } = {}) {
  if (!item) return;

  const method = byId("req-method");
  const url = byId("req-url");
  const body = byId("req-body");

  if (method) method.value = String(item.method || "GET").toUpperCase();
  if (url) url.value = String(item.url || "");
  if (body) body.value = String(item.body || "");

  window.__wbsHeaders?.set?.(item.headers || {});
  hideHeaderIO();

  editId = mode === "edit" ? item.id : null;
  setEditMeta();
}

export function getEditId() {
  return editId;
}

export function buildRequestPreview(cfg) {
  const method = byId("req-method")?.value?.trim().toUpperCase() || "GET";
  const urlStr = byId("req-url")?.value?.trim() || "";
  const body = byId("req-body")?.value ?? "";

  const hdrs = window.__wbsHeaders?.get?.() || {};
  const headers = maybeLowercaseHeaderKeys(hdrs, cfg);

  let host = "";
  let path = urlStr;

  try {
    const u = new URL(urlStr);
    host = u.host;
    path = `${u.pathname}${u.search}`;
  } catch {
    // leave as-is
  }

  const lines = [];
  lines.push(`${method} ${path || "/"} HTTP/1.1`);
  if (host) lines.push(`Host: ${host}`);

  for (const [k, v] of Object.entries(headers || {})) {
    if (String(k).toLowerCase() === "host") continue;
    lines.push(`${k}: ${v}`);
  }

  lines.push("");
  if (!["GET", "HEAD"].includes(method) && String(body || "").length) {
    lines.push(String(body));
  }

  return lines.join("\n");
}

export function updateRequestPreview(cfg) {
  const pre = byId("req-preview");
  if (!pre) return;
  const text = buildRequestPreview(cfg);
  pre.textContent = text || "—";
}

export async function overwriteFromForm() {
  if (!editId) {
    alert("No history item in edit mode. Click a history row to edit.");
    return null;
  }

  const method = byId("req-method").value.trim().toUpperCase() || "GET";
  const url = byId("req-url").value.trim();
  const body = byId("req-body").value;

  if (!url) {
    alert("URL required");
    return null;
  }

  const headers = window.__wbsHeaders?.get?.() || {};

  const ok = updateSavedById(editId, {
    ts: Date.now(),
    method,
    url,
    headers,
    body,
  });

  if (!ok) {
    alert("Selected history item no longer exists.");
    editId = null;
    setEditMeta();
    return null;
  }

  const overwrittenId = editId;
  editId = null;
  setEditMeta();

  return overwrittenId;
}

function bindInterceptorUtilitiesOnce() {
  const btnReset = byId("btn-reset-request");
  const btnClearRes = byId("btn-clear-response");

  if (btnReset) {
    btnReset.addEventListener("click", () => resetRequestForm());
  }
  if (btnClearRes) {
    btnClearRes.addEventListener("click", () => clearResponsePanel());
  }

  setEditMeta();
}

bindInterceptorUtilitiesOnce();

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

  editId = null;
  setEditMeta();

  return item.id;
}
