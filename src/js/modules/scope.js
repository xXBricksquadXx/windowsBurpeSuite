function byId(id) {
  return document.getElementById(id);
}

const KEY = "wbs_scope_v1";

const defaults = {
  enabled: true,
  hosts: [], // ["example.com", "example.com:443", "127.0.0.1:8787"]
  paths: [], // ["/api", "/admin", "/v1"]
};

let state = { ...defaults, ...load() };
let inited = false;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}

  try {
    window.dispatchEvent(
      new CustomEvent("wbs:scope-changed", { detail: state })
    );
  } catch {}
}

function normalizeHost(input) {
  const s = String(input || "").trim();
  if (!s) return "";

  // If it's a URL, use URL.host (hostname:port)
  try {
    if (s.includes("://")) {
      const u = new URL(s);
      return String(u.host || "").toLowerCase();
    }
  } catch {}

  // If it looks like a URL without scheme
  try {
    if (s.includes("/") || s.includes("?")) {
      const u = new URL("http://" + s.replace(/^\/+/, ""));
      return String(u.host || "").toLowerCase();
    }
  } catch {}

  return s.toLowerCase();
}

function normalizePathPrefix(input) {
  let s = String(input || "").trim();
  if (!s) return "";
  if (!s.startsWith("/")) s = "/" + s;
  // trim trailing slash except "/"
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  return s;
}

function hostRuleMatches(reqHost, reqHostname, reqPort, rule) {
  const r = String(rule || "").toLowerCase();
  if (!r) return false;

  // If rule includes port, match full host:port
  if (r.includes(":")) return r === reqHost;

  // Otherwise match hostname regardless of port
  return r === reqHostname;
}

export function getScope() {
  return {
    ...state,
    hosts: [...(state.hosts || [])],
    paths: [...(state.paths || [])],
  };
}

export function isUrlInScope(urlStr, scopeState = getScope()) {
  const scope = scopeState || getScope();
  if (!scope.enabled) return true;

  let u;
  try {
    u = new URL(String(urlStr || ""));
  } catch {
    // if it isn't parseable, treat as out-of-scope when enabled
    return false;
  }

  const reqHost = String(u.host || "").toLowerCase(); // hostname:port (if present)
  const reqHostname = String(u.hostname || "").toLowerCase();
  const reqPort = String(u.port || "");

  const hosts = Array.isArray(scope.hosts) ? scope.hosts : [];
  const paths = Array.isArray(scope.paths) ? scope.paths : [];

  // Host filter
  if (hosts.length > 0) {
    const okHost = hosts.some((h) =>
      hostRuleMatches(reqHost, reqHostname, reqPort, h)
    );
    if (!okHost) return false;
  }

  // Path filter
  if (paths.length > 0) {
    const p = String(u.pathname || "/");
    const okPath = paths.some((pref) => p.startsWith(String(pref)));
    if (!okPath) return false;
  }

  return true;
}

function setMeta() {
  const meta = byId("scope-meta");
  if (!meta) return;

  const enabled = state.enabled ? "yes" : "no";
  const hosts = (state.hosts || []).length;
  const paths = (state.paths || []).length;
  meta.textContent = `Enabled: ${enabled} • Hosts: ${hosts} • Paths: ${paths}`;
}

function renderLists() {
  const hostList = byId("scope-host-list");
  const pathList = byId("scope-path-list");

  if (hostList) {
    hostList.innerHTML = "";
    (state.hosts || []).forEach((h) => {
      const row = document.createElement("div");
      row.className = "list-item";

      const text = document.createElement("div");
      text.className = "list-item__text";

      const title = document.createElement("div");
      title.className = "list-item__title";
      title.textContent = h;

      const sub = document.createElement("div");
      sub.className = "list-item__sub";
      sub.textContent = "Click × to remove";

      text.appendChild(title);
      text.appendChild(sub);

      const btn = document.createElement("button");
      btn.className = "btn danger";
      btn.type = "button";
      btn.textContent = "×";
      btn.addEventListener("click", () => {
        state.hosts = (state.hosts || []).filter((x) => x !== h);
        save();
        setMeta();
        renderLists();
      });

      row.appendChild(text);
      row.appendChild(btn);
      hostList.appendChild(row);
    });
  }

  if (pathList) {
    pathList.innerHTML = "";
    (state.paths || []).forEach((p) => {
      const row = document.createElement("div");
      row.className = "list-item";

      const text = document.createElement("div");
      text.className = "list-item__text";

      const title = document.createElement("div");
      title.className = "list-item__title";
      title.textContent = p;

      const sub = document.createElement("div");
      sub.className = "list-item__sub";
      sub.textContent = "Click × to remove";

      text.appendChild(title);
      text.appendChild(sub);

      const btn = document.createElement("button");
      btn.className = "btn danger";
      btn.type = "button";
      btn.textContent = "×";
      btn.addEventListener("click", () => {
        state.paths = (state.paths || []).filter((x) => x !== p);
        save();
        setMeta();
        renderLists();
      });

      row.appendChild(text);
      row.appendChild(btn);
      pathList.appendChild(row);
    });
  }
}

function renderUI() {
  const root = byId("target-scope");
  if (!root) return;

  root.innerHTML = `
    <div class="grid">
      <section class="card">
        <div class="card__title">Scope</div>
        <div class="card__hint">Define in-scope hosts and path prefixes. Stored locally in your browser.</div>

        <div class="row">
          <label class="check">
            <input type="checkbox" id="scope-enabled" />
            <span>Enable scope filtering</span>
          </label>
        </div>

        <div class="row">
          <div id="scope-meta" class="meta">—</div>
        </div>

        <div class="row">
          <label class="label">Add host</label>
          <input id="scope-host-input" placeholder="example.com:443 or https://example.com/api" />
          <button id="scope-host-add" class="btn" type="button">Add host</button>
        </div>

        <div class="row">
          <label class="label">Hosts</label>
          <div id="scope-host-list" class="list"></div>
        </div>
      </section>

      <section class="card">
        <div class="card__title">Path prefixes</div>
        <div class="card__hint">Examples: /api, /admin, /v1</div>

        <div class="row">
          <label class="label">Add path prefix</label>
          <input id="scope-path-input" placeholder="/api" />
          <button id="scope-path-add" class="btn" type="button">Add prefix</button>
        </div>

        <div class="row">
          <label class="label">Prefixes</label>
          <div id="scope-path-list" class="list"></div>
        </div>

        <div class="row">
          <button id="scope-clear" class="btn danger" type="button">Clear scope</button>
        </div>
      </section>
    </div>
  `;

  // Bind
  const enabled = byId("scope-enabled");
  const hostIn = byId("scope-host-input");
  const hostAdd = byId("scope-host-add");
  const pathIn = byId("scope-path-input");
  const pathAdd = byId("scope-path-add");
  const clearBtn = byId("scope-clear");

  if (enabled) {
    enabled.checked = !!state.enabled;
    enabled.addEventListener("change", () => {
      state.enabled = !!enabled.checked;
      save();
      setMeta();
    });
  }

  if (hostAdd && hostIn) {
    const addHost = () => {
      const h = normalizeHost(hostIn.value);
      if (!h) return;
      const list = Array.isArray(state.hosts) ? state.hosts : [];
      if (!list.includes(h)) list.unshift(h);
      state.hosts = list;
      hostIn.value = "";
      save();
      setMeta();
      renderLists();
    };

    hostAdd.addEventListener("click", addHost);
    hostIn.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addHost();
    });
  }

  if (pathAdd && pathIn) {
    const addPath = () => {
      const p = normalizePathPrefix(pathIn.value);
      if (!p) return;
      const list = Array.isArray(state.paths) ? state.paths : [];
      if (!list.includes(p)) list.unshift(p);
      state.paths = list;
      pathIn.value = "";
      save();
      setMeta();
      renderLists();
    };

    pathAdd.addEventListener("click", addPath);
    pathIn.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addPath();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      state.hosts = [];
      state.paths = [];
      save();
      setMeta();
      renderLists();
    });
  }

  setMeta();
  renderLists();
}

export function initScopeUI() {
  if (inited) return;
  inited = true;

  renderUI();

  // If scope changes in another tab, update
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    state = { ...defaults, ...load() };
    renderUI();
  });
}
