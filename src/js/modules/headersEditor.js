function byId(id) {
  return document.getElementById(id);
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function")
      node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  });
  children.forEach((c) =>
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c)
  );
  return node;
}

function normalizeHeadersObj(h) {
  const out = {};
  for (const [k, v] of Object.entries(h || {})) {
    const key = String(k).trim();
    if (!key) continue;
    out[key] = String(v ?? "");
  }
  return out;
}

function parseRawHeaders(raw) {
  const out = {};
  const lines = String(raw ?? "").split(/\r?\n/);
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (!k) continue;
    out[k] = v;
  }
  return out;
}

function toRawHeaders(h) {
  return Object.entries(h || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export function initHeaderEditor({ defaults = {} } = {}) {
  const rowsWrap = byId("hdr-rows");
  const btnAdd = byId("hdr-add");
  const btnImport = byId("hdr-import");
  const btnExport = byId("hdr-export");
  const btnClear = byId("hdr-clear");

  const ioWrap = byId("hdr-io");
  const rawTa = byId("hdr-raw");
  const btnApply = byId("hdr-apply");
  const btnCopy = byId("hdr-copy");

  const state = {
    headers: normalizeHeadersObj(defaults),
  };

  function qaRows() {
    return Array.from(rowsWrap.querySelectorAll(".hdr-row"));
  }

  function makeRow(k = "", v = "") {
    const key = el("input", { placeholder: "Header", value: k });
    const val = el("input", { placeholder: "Value", value: v });
    const del = el("button", { class: "btn danger", type: "button" }, ["×"]);

    const row = el("div", { class: "hdr-row" }, [key, val, del]);

    function syncFromInputs() {
      const out = {};
      qaRows().forEach((r) => {
        const kk = r.querySelector("input:nth-child(1)").value.trim();
        const vv = r.querySelector("input:nth-child(2)").value;
        if (!kk) return;
        out[kk] = vv;
      });
      state.headers = out;
    }

    key.addEventListener("input", syncFromInputs);
    val.addEventListener("input", syncFromInputs);

    del.addEventListener("click", () => {
      row.remove();
      syncFromInputs();
    });

    return row;
  }

  function render() {
    rowsWrap.innerHTML = "";
    const entries = Object.entries(state.headers || {});
    if (entries.length === 0) {
      rowsWrap.appendChild(makeRow("", ""));
    } else {
      entries.forEach(([k, v]) => rowsWrap.appendChild(makeRow(k, v)));
    }
  }

  function showIo(on) {
    ioWrap.classList.toggle("is-hidden", !on);
  }

  btnAdd.addEventListener("click", () => {
    rowsWrap.appendChild(makeRow("", ""));
  });

  btnImport.addEventListener("click", () => {
    showIo(true);
    rawTa.value = toRawHeaders(state.headers);
    rawTa.focus();
  });

  btnExport.addEventListener("click", () => {
    showIo(true);
    rawTa.value = toRawHeaders(state.headers);
    rawTa.focus();
  });

  btnClear.addEventListener("click", () => {
    state.headers = {};
    render();
    showIo(false);
  });

  btnApply.addEventListener("click", () => {
    state.headers = parseRawHeaders(rawTa.value);
    render();
    showIo(false);
  });

  btnCopy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(rawTa.value);
    } catch {}
  });

  render();

  window.__wbsHeaders = {
    get: () => ({ ...state.headers }),
    set: (h) => {
      state.headers = normalizeHeadersObj(h);
      render();
    },
  };
}
