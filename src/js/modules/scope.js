// src/js/modules/scope.js
const STORE_KEY = "wbs_scope_v1";

const defaults = {
  enabled: true,
  hosts: [],
  pathPrefixes: [],
};

let state = { ...defaults, ...loadScope() };

function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function normalizeHost(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";

  // If user pasted a full URL, extract host.
  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return new URL(raw).host.toLowerCase();
    }
  } catch {}

  // If they pasted "example.com/path", try to parse by adding scheme.
  try {
    if (raw.includes("/")) {
      return new URL(`https://${raw}`).host.toLowerCase();
    }
  } catch {}

  // Assume it's already host[:port]
  return raw.toLowerCase();
}

function normalizePathPrefix(input) {
  let raw = String(input || "").trim();
  if (!raw) return "";
  if (!raw.startsWith("/")) raw = `/${raw}`;
  // Drop trailing slash except for root "/"
  if (raw.length > 1 && raw.endsWith("/")) raw = raw.slice(0, -1);
  return raw;
}

function loadScope() {
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

function saveScope() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {}
}

function emitScopeChanged() {
  window.dispatchEvent(
    new CustomEvent("wbs:scope-changed", { detail: { scope: getScope() } })
  );
}

export function getScope() {
  return {
    enabled: !!state.enabled,
    hosts: uniq(state.hosts).map((h) => String(h).toLowerCase()),
    pathPrefixes: uniq(state.pathPrefixes).map((p) => String(p)),
  };
}

export function setScope(next) {
  const n = next && typeof next === "object" ? next : {};
  state = {
    enabled: n.enabled ?? state.enabled ?? true,
    hosts: uniq(
      (n.hosts ?? state.hosts ?? []).map((h) => String(h).trim())
    ).filter(Boolean),
    pathPrefixes: uniq(
      (n.pathPrefixes ?? state.pathPrefixes ?? []).map((p) => String(p).trim())
    ).filter(Boolean),
  };
  saveScope();
  emitScopeChanged();
  renderScopeUI();
}

export function isInScope(urlStr, scope = getScope()) {
  const s = scope || getScope();
  if (!s.enabled) return true;

  const hasHostRules = Array.isArray(s.hosts) && s.hosts.length > 0;
  const hasPathRules =
    Array.isArray(s.pathPrefixes) && s.pathPrefixes.length > 0;

  // No rules = everything is in scope
  if (!hasHostRules && !hasPathRules) return true;

  let host = "";
  let path = "";

  try {
    const u = new URL(String(urlStr));
    host = (u.host || "").toLowerCase();
    path = String(u.pathname || "/");
  } catch {
    // If URL can't be parsed, treat as out-of-scope when rules exist.
    return false;
  }

  if (hasHostRules) {
    const okHost = s.hosts.map((h) => String(h).toLowerCase()).includes(host);
    if (!okHost) return false;
  }

  if (hasPathRules) {
    const prefixes = s.pathPrefixes.map((p) => normalizePathPrefix(p));
    const okPath = prefixes.some((p) => p === "/" || path.startsWith(p));
    if (!okPath) return false;
  }

  return true;
}

/* =========================
   UI wiring
========================= */

function byId(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  const el = byId(id);
  if (el) el.textContent = text;
}

function renderList(container, items, { onRemove } = {}) {
  if (!container) return;
  container.innerHTML = "";

  if (!items || !items.length) {
    const empty = document.createElement("div");
    empty.className = "meta";
    empty.textContent = "None yet.";
    container.appendChild(empty);
    return;
  }

  items.forEach((value) => {
    const row = document.createElement("div");
    row.className = "list-item";

    const text = document.createElement("div");
    text.className = "list-item__text";

    const title = document.createElement("div");
    title.className = "list-item__title";
    title.textContent = value;

    const sub = document.createElement("div");
    sub.className = "list-item__sub";
    sub.textContent = "Click × to remove";

    text.appendChild(title);
    text.appendChild(sub);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn danger";
    btn.textContent = "×";
    btn.title = "Remove";
    btn.addEventListener("click", () => {
      if (onRemove) onRemove(value);
    });

    row.appendChild(text);
    row.appendChild(btn);
    container.appendChild(row);
  });
}

let uiBound = false;

export function initScopeUI() {
  if (uiBound) {
    renderScopeUI();
    return;
  }
  uiBound = true;

  const enabled = byId("scope-enabled");
  const hostInput = byId("scope-host-input");
  const hostAdd = byId("scope-host-add");
  const hostList = byId("scope-host-list");

  const pathInput = byId("scope-path-input");
  const pathAdd = byId("scope-path-add");
  const pathList = byId("scope-path-list");

  const clearBtn = byId("scope-clear");

  function syncEnabled() {
    if (enabled) enabled.checked = !!state.enabled;
  }

  if (enabled) {
    enabled.addEventListener("change", () => {
      state.enabled = enabled.checked;
      saveScope();
      emitScopeChanged();
      renderScopeUI();
    });
  }

  function addHostFromInput() {
    const h = normalizeHost(hostInput?.value);
    if (!h) return;
    state.hosts = uniq([...(state.hosts || []), h]);
    if (hostInput) hostInput.value = "";
    saveScope();
    emitScopeChanged();
    renderScopeUI();
  }

  function addPathFromInput() {
    const p = normalizePathPrefix(pathInput?.value);
    if (!p) return;
    state.pathPrefixes = uniq([...(state.pathPrefixes || []), p]);
    if (pathInput) pathInput.value = "";
    saveScope();
    emitScopeChanged();
    renderScopeUI();
  }

  if (hostAdd) hostAdd.addEventListener("click", addHostFromInput);
  if (hostInput) {
    hostInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addHostFromInput();
    });
  }

  if (pathAdd) pathAdd.addEventListener("click", addPathFromInput);
  if (pathInput) {
    pathInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addPathFromInput();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      state = { ...defaults };
      saveScope();
      emitScopeChanged();
      renderScopeUI();
    });
  }

  function removeHost(val) {
    state.hosts = (state.hosts || []).filter((h) => String(h) !== String(val));
    saveScope();
    emitScopeChanged();
    renderScopeUI();
  }

  function removePath(val) {
    state.pathPrefixes = (state.pathPrefixes || []).filter(
      (p) => String(p) !== String(val)
    );
    saveScope();
    emitScopeChanged();
    renderScopeUI();
  }

  // Expose render function closure to use correct container refs
  function render() {
    syncEnabled();
    renderList(hostList, getScope().hosts, { onRemove: removeHost });
    renderList(pathList, getScope().pathPrefixes, { onRemove: removePath });

    const s = getScope();
    setText(
      "scope-meta",
      `Enabled: ${s.enabled ? "yes" : "no"} • Hosts: ${
        s.hosts.length
      } • Paths: ${s.pathPrefixes.length}`
    );
  }

  // store for internal calls
  initScopeUI._render = render;

  render();
}

function renderScopeUI() {
  if (typeof initScopeUI._render === "function") initScopeUI._render();
}
