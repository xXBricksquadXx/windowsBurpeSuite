import { loadSaved } from "./storage.js";
import { getScope, isUrlInScope } from "./scope.js";

function byId(id) {
  return document.getElementById(id);
}

let inited = false;

function fmtTs(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return String(ts);
  }
}

function buildModel(items, { inScopeOnly }) {
  const scope = getScope();
  const filtered = (items || []).filter((it) => {
    if (!inScopeOnly) return true;
    return isUrlInScope(it.url, scope);
  });

  const hosts = new Map(); // host -> { hits, last, paths: Map(seg -> {hits,last}) }

  for (const it of filtered) {
    let u;
    try {
      u = new URL(String(it.url || ""));
    } catch {
      continue;
    }

    const host = String(u.host || "").toLowerCase();
    const ts = it.ts || Date.now();

    let node = hosts.get(host);
    if (!node) {
      node = { host, hits: 0, last: ts, paths: new Map() };
      hosts.set(host, node);
    }

    node.hits += 1;
    node.last = Math.max(node.last, ts);

    const pathname = String(u.pathname || "/");
    const seg = pathname.split("/").filter(Boolean)[0] || "/";

    const p = node.paths.get(seg) || { seg, hits: 0, last: ts };
    p.hits += 1;
    p.last = Math.max(p.last, ts);
    node.paths.set(seg, p);
  }

  const hostList = Array.from(hosts.values()).sort((a, b) => b.last - a.last);
  for (const h of hostList) {
    h.pathList = Array.from(h.paths.values()).sort((a, b) => b.hits - a.hits);
  }

  return {
    totalRequests: (items || []).length,
    shownRequests: filtered.length,
    hostCount: hostList.length,
    hostList,
  };
}

function render() {
  const list = byId("sm-list");
  const meta = byId("sm-meta");
  const chk = byId("sm-inscope");

  if (!list || !meta || !chk) return;

  const inScopeOnly = !!chk.checked;
  const items = loadSaved();
  const model = buildModel(items, { inScopeOnly });

  const filterLabel = inScopeOnly ? "in-scope only" : "all";
  meta.textContent = `Requests: ${model.shownRequests} • Hosts: ${model.hostCount} • Filter: ${filterLabel}`;

  list.innerHTML = "";

  if (model.shownRequests === 0) {
    const empty = document.createElement("div");
    empty.className = "meta";
    empty.textContent =
      model.totalRequests === 0
        ? "No traffic captured yet. Save requests in Proxy → Intercept."
        : "No requests matched the current filter/scope.";
    list.appendChild(empty);
    return;
  }

  for (const h of model.hostList) {
    const hostRow = document.createElement("div");
    hostRow.className = "list-item";

    const hostText = document.createElement("div");
    hostText.className = "list-item__text";

    const hostTitle = document.createElement("div");
    hostTitle.className = "list-item__title";
    hostTitle.textContent = h.host;

    const hostSub = document.createElement("div");
    hostSub.className = "list-item__sub";
    hostSub.textContent = `${h.hits} hits • last: ${fmtTs(h.last)}`;

    hostText.appendChild(hostTitle);
    hostText.appendChild(hostSub);
    hostRow.appendChild(hostText);
    list.appendChild(hostRow);

    for (const p of h.pathList) {
      const pathRow = document.createElement("div");
      pathRow.className = "list-item";
      pathRow.style.marginLeft = "18px";

      const pathText = document.createElement("div");
      pathText.className = "list-item__text";

      const pathTitle = document.createElement("div");
      pathTitle.className = "list-item__title";
      pathTitle.textContent = p.seg === "/" ? "/" : p.seg;

      const pathSub = document.createElement("div");
      pathSub.className = "list-item__sub";
      pathSub.textContent = `${p.hits} hits • last: ${fmtTs(p.last)}`;

      pathText.appendChild(pathTitle);
      pathText.appendChild(pathSub);

      pathRow.appendChild(pathText);
      list.appendChild(pathRow);
    }
  }
}

function renderUI() {
  const root = byId("target-sitemap");
  if (!root) return;

  root.innerHTML = `
    <div class="grid">
      <section class="card">
        <div class="card__title">Site map</div>
        <div class="card__hint">Build a host/path tree from captured traffic (Proxy history).</div>

        <div class="row">
          <label class="check">
            <input type="checkbox" id="sm-inscope" checked />
            <span>In-scope only</span>
          </label>
        </div>

        <div class="row">
          <button id="sm-refresh" class="btn secondary" type="button">Refresh</button>
        </div>

        <div class="row">
          <div id="sm-meta" class="meta">—</div>
        </div>

        <div class="row">
          <div id="sm-list" class="list"></div>
        </div>
      </section>

      <section class="card">
        <div class="card__title">How scope affects the map</div>
        <div class="card__hint">
          Define scope in <b>Target → Scope</b>. When “In-scope only” is enabled, the site map filters to URLs that match your scope rules.
          <br/><br/>
          Matching rules:
          <ul>
            <li>If scope filtering is disabled, everything is considered in-scope.</li>
            <li>If hosts are set, host must match.</li>
            <li>If path prefixes are set, path must start with one of them.</li>
          </ul>
        </div>
      </section>
    </div>
  `;

  const refreshBtn = byId("sm-refresh");
  const chk = byId("sm-inscope");

  if (refreshBtn) refreshBtn.addEventListener("click", render);
  if (chk) chk.addEventListener("change", render);

  render();
}

export function initSitemapUI() {
  if (inited) return;
  inited = true;

  renderUI();

  // Auto-refresh when saved history changes (same tab)
  window.addEventListener("wbs:saved-changed", () => render());

  // Auto-refresh when scope changes (same tab)
  window.addEventListener("wbs:scope-changed", () => render());

  // If changes happen in another tab, "storage" fires
  window.addEventListener("storage", (e) => {
    if (e.key === "wbs_saved_v1" || e.key === "wbs_scope_v1") render();
  });
}
