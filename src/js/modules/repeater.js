import { loadSaved, clearAll as clearAllStorage } from "./storage.js";
import { applyRequestHooks, applyResponseHooks } from "./extender.js";

function byId(id) { return document.getElementById(id); }

let selectedId = null;

function serializeHeaders(obj) {
  return Object.entries(obj || {}).map(([k, v]) => `${k}: ${v}`).join("\\n");
}

function el(tag, cls) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

export function setSelectedId(id) {
  selectedId = id;
  const title = byId("replay-title");
  const btn = byId("btn-replay");
  const items = loadSaved();
  const item = items.find(x => x.id === selectedId);
  if (!item) {
    title.textContent = "Select a request…";
    btn.disabled = true;
    return;
  }
  title.textContent = `${item.method} ${item.url}`;
  btn.disabled = false;
}

export function renderSavedList({ onSelect }) {
  const host = byId("saved-list");
  host.innerHTML = "";

  const items = loadSaved();
  if (items.length === 0) {
    const empty = el("div", "meta");
    empty.textContent = "No saved requests yet.";
    host.appendChild(empty);
    setSelectedId(null);
    return;
  }

  for (const item of items) {
    const row = el("div", "list-item");
    const text = el("div", "list-item__text");
    const title = el("div", "list-item__title");
    const sub = el("div", "list-item__sub");
    title.textContent = `${item.method} ${item.url}`;
    sub.textContent = `Saved: ${item.createdAt}`;
    text.appendChild(title);
    text.appendChild(sub);

    const btn = el("button");
    btn.textContent = "Select";
    btn.addEventListener("click", () => {
      if (typeof onSelect === "function") onSelect(item.id);
      setSelectedId(item.id);
    });

    row.appendChild(text);
    row.appendChild(btn);
    host.appendChild(row);
  }

  // If nothing selected yet, select first.
  if (!selectedId && items[0]) {
    setSelectedId(items[0].id);
  }
}

export function clearAllSaved() {
  clearAllStorage();
  selectedId = null;
  byId("replay-out").value = "";
  setSelectedId(null);
}

export async function replaySelected(cfg) {
  const outEl = byId("replay-out");
  outEl.value = "Replaying…";

  const items = loadSaved();
  const item = items.find(x => x.id === selectedId);
  if (!item) {
    outEl.value = "No request selected.";
    return;
  }

  const baseReq = { method: item.method, url: item.url, headers: item.headers || {}, body: item.body || "" };
  const req = applyRequestHooks(baseReq, cfg);

  const init = { method: req.method, headers: req.headers };
  const hasBody = !["GET", "HEAD"].includes(req.method);
  if (hasBody && req.body && req.body.length > 0) init.body = req.body;

  try {
    const response = await fetch(req.url, init);
    const headersObj = {};
    response.headers.forEach((v, k) => { headersObj[k] = v; });
    const bodyText = await response.text();

    let res = {
      status: response.status,
      statusText: response.statusText,
      headers: headersObj,
      bodyText,
    };

    res = await applyResponseHooks(res, cfg);

    const headerBlock = serializeHeaders(res.headers);
    outEl.value = [`${res.status} ${res.statusText}`.trim(), "", headerBlock, "", res.bodyText].join("\\n");
  } catch (err) {
    outEl.value = `Replay failed (likely CORS / network).\\n\\n${String(err && err.message ? err.message : err)}`;
  }
}
