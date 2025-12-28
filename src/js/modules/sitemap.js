// src/js/modules/sitemap.js
import { loadSaved } from "./storage.js";
import { isUrlInScope } from "./scope.js";
import { navigateTo } from "../ui.js";
import { focusUrlField } from "./interceptor.js";

function byId(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  const el = byId(id);
  if (el) el.textContent = text;
}

function safeParseUrl(urlStr) {
  try {
    return new URL(String(urlStr || ""));
  } catch {
    return null;
  }
}

function setInterceptUrlAndGo(url) {
  const input = byId("req-url");
  if (input) {
    input.value = url;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
  navigateTo("proxy", "intercept");
  focusUrlField({ select: true });
}

async function copyText(text) {
  const t = String(text || "");
  if (!t) return;
  try {
    await navigator.clipboard.writeText(t);
  } catch {
    // fallback: no-op (user can select from intercept input)
  }
}

function buildSitemap(items) {
  // host -> pathKey -> { url, count, lastTs }
  const map = new Map();

  for (const it of items || []) {
    const u = safeParseUrl(it.url);
    if (!u) continue;

    const host = u.host;
    const pathKey = `${u.pathname || "/"}${u.search || ""}`;

    if (!map.has(host)) map.set(host, new Map());
    const paths = map.get(host);

    const prev = paths.get(pathKey) || { url: it.url, count: 0, lastTs: 0 };
    paths.set(pathKey, {
      url: it.url,
      count: prev.count + 1,
      lastTs: Math.max(prev.lastTs || 0, it.ts || 0),
    });
  }

  return map;
}

function renderHostBlock(host, pathsMap, { inScopeOnly } = {}) {
  const hostRow = document.createElement("div");
  hostRow.className = "list-item is-clickable";

  const text = document.createElement("div");
  text.className = "list-item__text";

  const title = document.createElement("div");
  title.className = "list-item__title";
  title.textContent = host;

  const sub = document.createElement("div");
  sub.className = "list-item__sub";
  sub.textContent = `${pathsMap.size} path(s)`;

  text.appendChild(title);
  text.appendChild(sub);

  const right = document.createElement("div");
  right.className = "list-item__right";

  const toggle = document.createElement("button");
  toggle.className = "btn secondary sm";
  toggle.type = "button";
  toggle.textContent = "▾";
  toggle.title = "Collapse/expand";

  right.appendChild(toggle);

  hostRow.appendChild(text);
  hostRow.appendChild(right);

  const children = document.createElement("div");
  children.className = "sitemap-children";

  // sort by last seen desc
  const entries = Array.from(pathsMap.entries()).sort((a, b) => {
    const ta = a[1]?.lastTs || 0;
    const tb = b[1]?.lastTs || 0;
    return tb - ta;
  });

  let rendered = 0;

  for (const [pathKey, info] of entries) {
    const url = info.url;
    if (inScopeOnly && !isUrlInScope(url)) continue;

    rendered++;

    const row = document.createElement("div");
    row.className = "list-item is-clickable";
    row.dataset.url = url;

    const t = document.createElement("div");
    t.className = "list-item__text";

    const p = document.createElement("div");
    p.className = "list-item__title sitemap-path";
    p.textContent = pathKey || "/";

    const s = document.createElement("div");
    s.className = "list-item__sub";
    s.textContent = `${info.count} hit(s) • click to load in Intercept`;

    t.appendChild(p);
    t.appendChild(s);

    const r = document.createElement("div");
    r.className = "list-item__right";

    const copyBtn = document.createElement("button");
    copyBtn.className = "btn secondary sm";
    copyBtn.type = "button";
    copyBtn.textContent = "Copy";
    copyBtn.title = "Copy URL";
    copyBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await copyText(url);
    });

    r.appendChild(copyBtn);

    row.appendChild(t);
    row.appendChild(r);

    row.addEventListener("click", () => setInterceptUrlAndGo(url));

    children.appendChild(row);
  }

  // collapse behavior
  let isOpen = true;

  function syncToggle() {
    children.classList.toggle("is-hidden", !isOpen);
    toggle.textContent = isOpen ? "▾" : "▸";
  }

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    isOpen = !isOpen;
    syncToggle();
  });

  hostRow.addEventListener("click", () => {
    isOpen = !isOpen;
    syncToggle();
  });

  syncToggle();

  return { hostRow, children, renderedPaths: rendered };
}

export function renderSitemap() {
  const treeEl = byId("sitemap-tree");
  if (!treeEl) return;

  const inScopeOnly = !!byId("sitemap-in-scope-only")?.checked;

  const items = loadSaved();
  const map = buildSitemap(items);

  treeEl.innerHTML = "";

  if (!items.length) {
    setText(
      "sitemap-meta",
      "No history yet. Save requests in Proxy → Intercept."
    );
    const empty = document.createElement("div");
    empty.className = "meta";
    empty.textContent = "No saved requests yet.";
    treeEl.appendChild(empty);
    return;
  }

  const hosts = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));

  let hostCount = 0;
  let pathCount = 0;

  for (const host of hosts) {
    const pathsMap = map.get(host);
    const block = renderHostBlock(host, pathsMap, { inScopeOnly });

    // if in-scope-only hides everything for this host, skip it
    if (inScopeOnly && block.renderedPaths === 0) continue;

    hostCount++;
    pathCount += block.renderedPaths;

    treeEl.appendChild(block.hostRow);
    treeEl.appendChild(block.children);
  }

  setText(
    "sitemap-meta",
    `Hosts: ${hostCount} • Paths: ${pathCount} • From: ${items.length} saved request(s)`
  );
}

export function bindSitemapControls() {
  const refresh = byId("btn-sitemap-refresh");
  const inScope = byId("sitemap-in-scope-only");

  if (refresh) refresh.addEventListener("click", renderSitemap);
  if (inScope) inScope.addEventListener("change", renderSitemap);

  // re-render when scope changes (badges + filtering)
  window.addEventListener("wbs:scope-changed", () => renderSitemap());

  // optional: if your storage layer emits this, it will auto-refresh the map
  window.addEventListener("wbs:saved-changed", () => renderSitemap());

  renderSitemap();
}
