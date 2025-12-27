import { loadSaved, saveSaved } from "./storage.js";
import { diffText, renderDiff } from "./diff.js";
import { maybePrettyJson, maybeLowercaseHeaderKeys } from "./extender.js";

function byId(id) {
  return document.getElementById(id);
}

let selectedId = null;

export function setSelectedId(id) {
  selectedId = id;
}

function formatTs(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function makeListItem(item, { onSelect }) {
  const wrap = document.createElement("div");
  wrap.className = "list-item";
  wrap.dataset.id = item.id;

  const text = document.createElement("div");
  text.className = "list-item__text";

  const title = document.createElement("div");
  title.className = "list-item__title";
  title.textContent = `${item.method} ${item.url}`;

  const sub = document.createElement("div");
  sub.className = "list-item__sub";
  sub.textContent = `${formatTs(item.ts)} • ${
    Object.keys(item.headers || {}).length
  } hdrs • ${item.body?.length || 0} bytes`;

  text.appendChild(title);
  text.appendChild(sub);

  const btn = document.createElement("button");
  btn.className = "btn secondary";
  btn.type = "button";
  btn.textContent = "Select";

  btn.addEventListener("click", () => {
    selectedId = item.id;
    if (onSelect) onSelect(item.id);
    byId("replay-title").textContent = `Selected: ${item.method} ${item.url}`;
  });

  wrap.appendChild(text);
  wrap.appendChild(btn);

  return wrap;
}

export function renderSavedList({ onSelect } = {}) {
  const list = byId("saved-list");
  list.innerHTML = "";

  const items = loadSaved();
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "meta";
    empty.textContent = "No saved requests yet. Use Proxy → Intercept → Save.";
    list.appendChild(empty);
    return;
  }

  items.forEach((it) => list.appendChild(makeListItem(it, { onSelect })));
}

export function clearAllSaved() {
  saveSaved([]);
  selectedId = null;

  byId("replay-title").textContent = "Select a saved request";
  byId("replay-out").textContent = "—";
  byId("replay-diff").textContent = "—";
}

async function fetchReplay(item, cfg) {
  const headers = maybeLowercaseHeaderKeys(item.headers || {}, cfg);

  const init = { method: item.method, headers };
  const hasBody = !["GET", "HEAD"].includes(item.method);
  if (hasBody && item.body?.trim()?.length) init.body = item.body;

  const t0 = performance.now();
  const res = await fetch(item.url, init);
  const t1 = performance.now();

  const body = await res.text();
  const pretty = maybePrettyJson(body, cfg);

  const meta = `${res.status} ${res.statusText} • ${(t1 - t0).toFixed(0)}ms`;
  return { meta, body: pretty };
}

export async function replaySelected(cfg) {
  const items = loadSaved();
  const item = items.find((x) => x.id === selectedId);

  if (!item) {
    alert("Select an item first");
    return;
  }

  const out = byId("replay-out");
  const diffEl = byId("replay-diff");

  byId("replay-title").textContent = `Replaying: ${item.method} ${item.url}`;

  const prev = out.textContent === "—" ? "" : out.textContent;

  const res = await fetchReplay(item, cfg);
  byId("replay-title").textContent = `Replay: ${res.meta}`;

  out.textContent = res.body || "—";

  const d = diffText(prev, res.body || "");
  diffEl.innerHTML = renderDiff(d);
}
