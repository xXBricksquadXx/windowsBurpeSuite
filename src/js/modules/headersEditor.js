function byId(id) {
  return document.getElementById(id);
}

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

function escapeForClipboard(s) {
  return String(s ?? "");
}

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
    const k = row.querySelector(".hdr-key")?.value?.trim() ?? "";
    const v = row.querySelector(".hdr-val")?.value ?? "";
    if (!k) continue;
    out[k] = String(v).trim();
  }
  return out;
}

function addRow(key = "", value = "") {
  const row = document.createElement("div");
  row.className = "hdr-row";

  const keyInput = document.createElement("input");
  keyInput.className = "hdr-key";
  keyInput.type = "text";
  keyInput.spellcheck = false;
  keyInput.placeholder = "Header";
  keyInput.value = key;

  const valInput = document.createElement("input");
  valInput.className = "hdr-val";
  valInput.type = "text";
  valInput.spellcheck = false;
  valInput.placeholder = "Value";
  valInput.value = value;

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "hdr-del danger";
  delBtn.title = "Remove header";
  delBtn.textContent = "×";
  delBtn.addEventListener("click", () => {
    row.remove();
    ensureAtLeastOneRow();
  });

  row.appendChild(keyInput);
  row.appendChild(valInput);
  row.appendChild(delBtn);
  els.rows.appendChild(row);
}

function clearRows() {
  els.rows.innerHTML = "";
}

function ensureAtLeastOneRow() {
  if (els.rows.querySelectorAll(".hdr-row").length === 0) addRow("", "");
}

function openIO() {
  els.io.open = true;
  els.raw.focus();
}

function exportToRaw() {
  const headers = readRowsToHeaders();
  els.raw.value = headersToText(headers);
  openIO();
  els.raw.select();
}

function importFromRaw() {
  const headers = parseRawHeaders(els.raw.value);
  setHeaders(headers);
}

async function copyRaw() {
  const text = escapeForClipboard(els.raw.value);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // fallback: select text for manual copy
    els.raw.focus();
    els.raw.select();
  }
}

export function initHeaderEditor({ defaults } = {}) {
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

  els.add.addEventListener("click", () => addRow("", ""));
  els.imp.addEventListener("click", () => openIO());
  els.exp.addEventListener("click", () => exportToRaw());
  els.clr.addEventListener("click", () => {
    clearRows();
    ensureAtLeastOneRow();
  });

  els.apply.addEventListener("click", () => importFromRaw());
  els.copy.addEventListener("click", () => copyRaw());

  // Seed defaults
  clearRows();
  if (
    defaults &&
    typeof defaults === "object" &&
    Object.keys(defaults).length > 0
  ) {
    for (const [k, v] of Object.entries(defaults)) addRow(k, v);
  } else {
    addRow("Accept", "application/json");
  }
  ensureAtLeastOneRow();
}

export function getHeaders() {
  return readRowsToHeaders();
}

export function setHeaders(obj) {
  clearRows();
  for (const [k, v] of Object.entries(obj || {})) addRow(k, v);
  ensureAtLeastOneRow();
  // keep raw in sync (helpful if IO panel is open)
  if (els.raw) els.raw.value = headersToText(getHeaders());
}
