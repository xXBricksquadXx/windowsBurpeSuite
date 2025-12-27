function byId(id) {
  return document.getElementById(id);
}

const STORE_KEY = "wbs_headers_v1";

const els = {
  rows: null,
  add: null,
  imp: null,
  exp: null,
  clr: null,
  io: null,
  raw: null,
  apply: null,
  copy: null,
};

function normalizeLines(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function parseRawHeaders(text) {
  const headers = {};
  const lines = normalizeLines(text).split("\n");
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (k) headers[k] = v;
  }
  return headers;
}

function headersToText(obj) {
  return Object.entries(obj || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

function readRowsToHeaders() {
  const out = {};
  const rows = els.rows.querySelectorAll(".hdr-row");
  for (const row of rows) {
    const inputs = row.querySelectorAll("input");
    const k = inputs[0]?.value?.trim() ?? "";
    const v = inputs[1]?.value ?? "";
    if (!k) continue;
    out[k] = String(v).trim();
  }
  return out;
}

function persistCurrent() {
  try {
    const headers = readRowsToHeaders();
    localStorage.setItem(STORE_KEY, JSON.stringify(headers));
  } catch {}
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function addRow(key = "", value = "") {
  const row = document.createElement("div");
  row.className = "hdr-row";

  const keyInput = document.createElement("input");
  keyInput.className = "input";
  keyInput.type = "text";
  keyInput.spellcheck = false;
  keyInput.placeholder = "Header";
  keyInput.value = key;

  const valInput = document.createElement("input");
  valInput.className = "input";
  valInput.type = "text";
  valInput.spellcheck = false;
  valInput.placeholder = "Value";
  valInput.value = value;

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "btn danger";
  delBtn.title = "Remove header";
  delBtn.textContent = "×";
  delBtn.addEventListener("click", () => {
    row.remove();
    ensureAtLeastOneRow();
    persistCurrent();
  });

  const onChange = () => {
    // Keep raw in sync if IO panel is visible.
    if (els.raw && !els.io.classList.contains("is-hidden")) {
      els.raw.value = headersToText(readRowsToHeaders());
    }
    persistCurrent();
  };

  keyInput.addEventListener("input", onChange);
  valInput.addEventListener("input", onChange);

  row.appendChild(keyInput);
  row.appendChild(valInput);
  row.appendChild(delBtn);
  els.rows.appendChild(row);

  return row;
}

function clearRows() {
  els.rows.innerHTML = "";
}

function ensureAtLeastOneRow() {
  if (els.rows.querySelectorAll(".hdr-row").length === 0) addRow("", "");
}

function openIO() {
  els.io.classList.remove("is-hidden");
  // Fill textarea with current headers for convenience.
  els.raw.value = headersToText(readRowsToHeaders());
  els.raw.focus();
}

function closeIO() {
  els.io.classList.add("is-hidden");
}

function exportToRaw() {
  els.raw.value = headersToText(readRowsToHeaders());
  openIO();
  els.raw.select();
}

function importFromRaw() {
  const headers = parseRawHeaders(els.raw.value);
  setHeaders(headers);
  closeIO();
}

async function copyRaw() {
  const text = String(els.raw.value ?? "");
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // fallback: select text for manual copy
    els.raw.focus();
    els.raw.select();
  }
}

export function initHeaderEditor({ defaults = {} } = {}) {
  els.rows = byId("hdr-rows");
  els.add = byId("hdr-add");
  els.imp = byId("hdr-import");
  els.exp = byId("hdr-export");
  els.clr = byId("hdr-clear");
  els.io = byId("hdr-io");
  els.raw = byId("hdr-raw");
  els.apply = byId("hdr-apply");
  els.copy = byId("hdr-copy");

  if (!els.rows) return;

  els.add.addEventListener("click", () => {
    const row = addRow("", "");
    row.querySelector("input")?.focus();
    persistCurrent();
  });

  els.imp.addEventListener("click", () => openIO());
  els.exp.addEventListener("click", () => exportToRaw());

  els.clr.addEventListener("click", () => {
    clearRows();
    ensureAtLeastOneRow();
    persistCurrent();
    if (els.raw) els.raw.value = "";
  });

  els.apply.addEventListener("click", () => importFromRaw());
  els.copy.addEventListener("click", () => copyRaw());

  // Escape closes IO panel
  els.raw.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeIO();
  });

  // Seed defaults + persisted
  clearRows();
  const persisted = loadPersisted() || {};
  const seed = { ...defaults, ...persisted };

  if (seed && typeof seed === "object" && Object.keys(seed).length > 0) {
    for (const [k, v] of Object.entries(seed)) addRow(k, v);
  } else {
    addRow("Accept", "application/json");
  }
  ensureAtLeastOneRow();
  persistCurrent();

  // Shared global access for other modules.
  window.__wbsHeaders = {
    get: () => readRowsToHeaders(),
    set: (obj) => setHeaders(obj),
  };
}

export function setHeaders(obj) {
  clearRows();
  for (const [k, v] of Object.entries(obj || {})) addRow(k, v);
  ensureAtLeastOneRow();
  persistCurrent();
  if (els.raw) els.raw.value = headersToText(readRowsToHeaders());
}
