// src/js/modules/scope.js
function byId(id) {
  return document.getElementById(id);
}

const STORE_KEY = "wbs_scope_v1";

const defaults = {
  enabled: true,
  hosts: [],
  prefixes: [],
};

let state = { ...defaults, ...loadState() };

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {}

  // Let other modules re-render (history badges, sitemap filter).
  window.dispatchEvent(new CustomEvent("wbs:scope-changed"));
}

function normalizeHost(input) {
  const s = String(input || "").trim();
  if (!s) return "";

  // URL input
  if (s.includes("://")) {
    try {
      return new URL(s).host.toLowerCase();
    } catch {
      return "";
    }
  }

  // raw host[:port]
  return s.replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase();
}

function normalizePrefix(input) {
  const s = String(input || "").trim();
  if (!s) return "";
  if (s === "/") return "/";
  return s.startsWith("/") ? s : `/${s}`;
}

export function getScope() {
  return {
    enabled: !!state.enabled,
    hosts: Array.from(state.hosts || []),
    prefixes: Array.from(state.prefixes || []),
  };
}

export function isUrlInScope(urlStr) {
  const cfg = getScope();

  // if scope is disabled, treat everything as in-scope
  if (!cfg.enabled) return true;

  // no rules => in-scope
  const hasHostRules = (cfg.hosts || []).length > 0;
  const hasPrefixRules = (cfg.prefixes || []).length > 0;
  if (!hasHostRules && !hasPrefixRules) return true;

  let u;
  try {
    u = new URL(String(urlStr || ""));
  } catch {
    return false;
  }

  const host = String(u.host || "").toLowerCase();
  const path = `${u.pathname || "/"}${u.search || ""}`;

  if (
    hasHostRules &&
    !(cfg.hosts || []).some((h) => String(h).toLowerCase() === host)
  ) {
    return false;
  }

  if (hasPrefixRules) {
    const prefixes = (cfg.prefixes || []).map((p) => String(p || ""));
    const ok = prefixes.some((p) => {
      if (!p) return false;
      if (p === "/") return true;
      return path.startsWith(p);
    });
    if (!ok) return false;
  }

  return true;
}

function renderList(container, items, { onRemove, emptyText }) {
  container.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "meta";
    empty.textContent = emptyText || "—";
    container.appendChild(empty);
    return;
  }

  items.forEach((val) => {
    const row = document.createElement("div");
    row.className = "list-item";

    const text = document.createElement("div");
    text.className = "list-item__text";

    const title = document.createElement("div");
    title.className = "list-item__title";
    title.textContent = val;

    const sub = document.createElement("div");
    sub.className = "list-item__sub";
    sub.textContent = "Click × to remove";

    text.appendChild(title);
    text.appendChild(sub);

    const right = document.createElement("div");
    right.className = "list-item__right";

    const del = document.createElement("button");
    del.className = "btn danger sm";
    del.type = "button";
    del.textContent = "×";
    del.title = "Remove";
    del.addEventListener("click", () => onRemove(val));

    right.appendChild(del);

    row.appendChild(text);
    row.appendChild(right);

    container.appendChild(row);
  });
}

function syncMeta() {
  const meta = byId("scope-meta");
  if (!meta) return;

  const cfg = getScope();
  meta.textContent = `Scope: ${cfg.enabled ? "ENABLED" : "DISABLED"} • ${
    cfg.hosts.length
  } host(s) • ${cfg.prefixes.length} prefix(es)`;
}

function syncUI() {
  const enabled = byId("scope-enabled");
  if (enabled) enabled.checked = !!state.enabled;

  const hostList = byId("scope-host-list");
  const pathList = byId("scope-path-list");

  if (hostList) {
    renderList(hostList, state.hosts || [], {
      emptyText: "No hosts set (matches all hosts).",
      onRemove: (h) => {
        state.hosts = (state.hosts || []).filter((x) => x !== h);
        saveState();
        syncUI();
      },
    });
  }

  if (pathList) {
    renderList(pathList, state.prefixes || [], {
      emptyText: "No prefixes set (matches all paths).",
      onRemove: (p) => {
        state.prefixes = (state.prefixes || []).filter((x) => x !== p);
        saveState();
        syncUI();
      },
    });
  }

  syncMeta();
}

export function bindScopeControls() {
  const enabled = byId("scope-enabled");
  const hostInput = byId("scope-host-input");
  const hostAdd = byId("scope-host-add");

  const pathInput = byId("scope-path-input");
  const pathAdd = byId("scope-path-add");

  const clearBtn = byId("scope-clear");

  if (enabled) {
    enabled.addEventListener("change", () => {
      state.enabled = !!enabled.checked;
      saveState();
      syncMeta();
    });
  }

  if (hostAdd && hostInput) {
    const addHost = () => {
      const h = normalizeHost(hostInput.value);
      if (!h) return;
      state.hosts = Array.from(new Set([...(state.hosts || []), h]));
      hostInput.value = "";
      saveState();
      syncUI();
    };

    hostAdd.addEventListener("click", addHost);
    hostInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addHost();
    });
  }

  if (pathAdd && pathInput) {
    const addPrefix = () => {
      const p = normalizePrefix(pathInput.value);
      if (!p) return;
      state.prefixes = Array.from(new Set([...(state.prefixes || []), p]));
      pathInput.value = "";
      saveState();
      syncUI();
    };

    pathAdd.addEventListener("click", addPrefix);
    pathInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addPrefix();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      state = { ...defaults };
      saveState();
      syncUI();
    });
  }

  syncUI();
}
