function byId(id) {
  return document.getElementById(id);
}

const STORE_KEY = "wbs_ext_v1";

const defaults = {
  prettyJson: false,
  trimHeaders: true,
  lowercaseKeys: false,
};

const state = { ...defaults, ...loadState() };

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
}

function emitChanged() {
  window.dispatchEvent(new CustomEvent("wbs:extender-changed"));
}

export function bindExtenderControls() {
  const pretty = byId("ext-pretty-json");
  const trim = byId("ext-trim-headers");
  const lower = byId("ext-lowercase-keys");

  function sync() {
    if (pretty) pretty.checked = !!state.prettyJson;
    if (trim) trim.checked = !!state.trimHeaders;
    if (lower) lower.checked = !!state.lowercaseKeys;
  }

  if (pretty) {
    pretty.addEventListener("change", () => {
      state.prettyJson = pretty.checked;
      saveState();
      emitChanged();
    });
  }

  if (trim) {
    trim.addEventListener("change", () => {
      state.trimHeaders = trim.checked;
      saveState();
      emitChanged();
    });
  }

  if (lower) {
    lower.addEventListener("change", () => {
      state.lowercaseKeys = lower.checked;
      saveState();
      emitChanged();
    });
  }

  sync();
}

export function getExtenderConfig() {
  return { ...state };
}

function looksLikeJson(text) {
  const t = String(text ?? "").trim();
  return t.startsWith("{") || t.startsWith("[");
}

export function maybePrettyJson(text, cfg, contentType = "") {
  if (!cfg.prettyJson) return text;

  const ct = String(contentType || "").toLowerCase();
  const isJson =
    ct.includes("application/json") ||
    ct.includes("+json") ||
    looksLikeJson(text);

  if (!isJson) return text;

  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return text;
  }
}

export function maybeTrimHeaders(headerText, cfg) {
  if (!cfg.trimHeaders) return headerText;
  const lines = (headerText ?? "").split("\n");
  return lines
    .filter(Boolean)
    .filter((l) => !/^date:/i.test(l))
    .filter((l) => !/^server:/i.test(l))
    .join("\n");
}

export function maybeLowercaseHeaderKeys(headers, cfg) {
  if (!cfg.lowercaseKeys) return headers;
  const out = {};
  for (const [k, v] of Object.entries(headers || {})) {
    out[String(k).toLowerCase()] = v;
  }
  return out;
}
