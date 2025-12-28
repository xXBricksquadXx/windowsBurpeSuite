// src/js/modules/sitemap.js
import { loadSaved } from "./storage.js";
import { getScope, isInScope } from "./scope.js";

function byId(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  const el = byId(id);
  if (el) el.textContent = text;
}

function safeParseUrl(urlStr) {
  try {
    return new URL(String(urlStr));
  } catch {
    return null;
  }
}

function ensureMapChild(parent, key) {
  if (!parent.children) parent.children = new Map();
  if (!parent.children.has(key)) {
    parent.children.set(key, {
      name: key,
      count: 0,
      lastTs: 0,
      children: new Map(),
    });
  }
  return parent.children.get(key);
}

function buildTree(items) {
  const hosts = new Map();

  for (const it of items || []) {
    const u = safeParseUrl(it.url);
    if (!u) continue;

    const host = String(u.host || "").toLowerCase();
    const path = String(u.pathname || "/");

    if (!hosts.has(host)) {
      hosts.set(host, {
        name: host,
        count: 0,
        lastTs: 0,
        children: new Map(),
      });
    }

    const hostNode = hosts.get(host);
    hostNode.count += 1;
    hostNode.lastTs = Math.max(hostNode.lastTs || 0, it.ts || 0);

    const segs = path
      .split("/")
      .filter((s) => s.length > 0)
      .slice(0, 50);

    let cursor = hostNode;
    if (segs.length === 0) {
      // root hit
      const rootKey = "/";
      const node = ensureMapChild(hostNode, rootKey);
      node.count += 1;
      node.lastTs = Math.max(node.lastTs || 0, it.ts || 0);
      continue;
    }

    for (const seg of segs) {
      cursor = ensureMapChild(cursor, seg);
      cursor.count += 1;
      cursor.lastTs = Math.max(cursor.lastTs || 0, it.ts || 0);
    }
  }

  return hosts;
}

function fmtTs(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function flattenNodes(node, depth = 0) {
  const out = [];
  const kids = Array.from(node.children?.values?.() || []);
  kids.sort((a, b) => a.name.localeCompare(b.name));

  for (const child of kids) {
    out.push({ node: child, depth });
    out.push(...flattenNodes(child, depth + 1));
  }

  return out;
}

function renderTree(container, hostsMap) {
  if (!container) return;
  container.innerHTML = "";

  const hosts = Array.from(hostsMap.entries());
  hosts.sort((a, b) => a[0].localeCompare(b[0]));

  if (!hosts.length) {
    const empty = document.createElement("div");
    empty.className = "meta";
    empty.textContent =
      "No traffic captured yet. Save requests in Proxy → Intercept.";
    container.appendChild(empty);
    return;
  }

  for (const [, hostNode] of hosts) {
    const hostHeader = document.createElement("div");
    hostHeader.className = "meta";
    hostHeader.textContent = `${hostNode.name} • ${
      hostNode.count
    } hits • last: ${fmtTs(hostNode.lastTs)}`;
    container.appendChild(hostHeader);

    const rows = flattenNodes(hostNode, 0);
    if (!rows.length) {
      const none = document.createElement("div");
      none.className = "meta";
      none.textContent = "No paths yet.";
      container.appendChild(none);
      continue;
    }

    rows.forEach(({ node, depth }) => {
      const row = document.createElement("div");
      row.className = "list-item";
      row.style.paddingLeft = `${10 + depth * 18}px`;

      const text = document.createElement("div");
      text.className = "list-item__text";

      const title = document.createElement("div");
      title.className = "list-item__title";
      title.textContent = node.name;

      const sub = document.createElement("div");
      sub.className = "list-item__sub";
      sub.textContent = `${node.count} hits • last: ${fmtTs(node.lastTs)}`;

      text.appendChild(title);
      text.appendChild(sub);

      row.appendChild(text);
      container.appendChild(row);
    });
  }
}

let uiBound = false;

export function initSitemapUI() {
  if (uiBound) {
    renderSitemap();
    return;
  }
  uiBound = true;

  const inScopeOnly = byId("sitemap-in-scope-only");
  const btnRefresh = byId("btn-sitemap-refresh");

  if (btnRefresh) btnRefresh.addEventListener("click", () => renderSitemap());
  if (inScopeOnly)
    inScopeOnly.addEventListener("change", () => renderSitemap());

  window.addEventListener("wbs:history-changed", () => renderSitemap());
  window.addEventListener("wbs:scope-changed", () => renderSitemap());

  renderSitemap();
}

export function renderSitemap() {
  const items = loadSaved();
  const scope = getScope();

  const inScopeOnly = !!byId("sitemap-in-scope-only")?.checked;

  const filtered = inScopeOnly
    ? items.filter((it) => isInScope(it.url, scope))
    : items;

  const hostsMap = buildTree(filtered);

  const hostCount = hostsMap.size;
  const reqCount = filtered.length;

  setText(
    "sitemap-meta",
    `Requests: ${reqCount} • Hosts: ${hostCount} • Filter: ${
      inScopeOnly ? "in-scope only" : "all"
    }`
  );

  renderTree(byId("sitemap-tree"), hostsMap);
}
