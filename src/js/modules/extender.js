function byId(id) {
  return document.getElementById(id);
}

const state = {
  prettyJson: false,
  trimHeaders: true,
  lowercaseKeys: false,
};

export function bindExtenderControls() {
  const pretty = byId("ext-pretty-json");
  const trim = byId("ext-trim-headers");
  const lower = byId("ext-lowercase-keys");

  function sync() {
    if (pretty) pretty.checked = state.prettyJson;
    if (trim) trim.checked = state.trimHeaders;
    if (lower) lower.checked = state.lowercaseKeys;
  }

  if (pretty) {
    pretty.addEventListener("change", () => {
      state.prettyJson = pretty.checked;
    });
  }

  if (trim) {
    trim.addEventListener("change", () => {
      state.trimHeaders = trim.checked;
    });
  }

  if (lower) {
    lower.addEventListener("change", () => {
      state.lowercaseKeys = lower.checked;
    });
  }

  sync();
}

export function getExtenderConfig() {
  return { ...state };
}

export function maybePrettyJson(text, cfg) {
  if (!cfg.prettyJson) return text;
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
