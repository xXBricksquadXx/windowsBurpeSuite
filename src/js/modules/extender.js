function byId(id) {
  return document.getElementById(id);
}

const state = {
  prettyJson: false,
  trimHeaders: true,
  lowercaseHeaderKeys: false,
};

export function bindExtenderControls() {
  const pretty = byId("ext-pretty-json");
  const trim = byId("ext-trim-headers");
  const lower = byId("ext-lowercase-keys");

  if (pretty)
    pretty.addEventListener("change", () => {
      state.prettyJson = !!pretty.checked;
    });
  if (trim)
    trim.addEventListener("change", () => {
      state.trimHeaders = !!trim.checked;
    });
  if (lower)
    lower.addEventListener("change", () => {
      state.lowercaseHeaderKeys = !!lower.checked;
    });

  if (pretty) state.prettyJson = !!pretty.checked;
  if (trim) state.trimHeaders = !!trim.checked;
  if (lower) state.lowercaseHeaderKeys = !!lower.checked;
}

export function getExtenderConfig() {
  return { ...state };
}

export function applyRequestHooks(req, cfg) {
  let headers = { ...(req.headers || {}) };

  if (cfg.trimHeaders) {
    const next = {};
    for (const [k, v] of Object.entries(headers)) {
      const nk = String(k).trim();
      const nv = String(v).trim();
      if (nk) next[nk] = nv;
    }
    headers = next;
  }

  if (cfg.lowercaseHeaderKeys) {
    const next = {};
    for (const [k, v] of Object.entries(headers)) {
      next[String(k).toLowerCase()] = v;
    }
    headers = next;
  }

  return { ...req, headers };
}

export async function applyResponseHooks(res, cfg) {
  if (!cfg.prettyJson) return res;

  const ct =
    (res.headers &&
      (res.headers["content-type"] || res.headers["Content-Type"])) ||
    "";

  const looksJson =
    ct.toLowerCase().includes("application/json") ||
    ct.toLowerCase().includes("+json");

  if (!looksJson) return res;

  try {
    const parsed = JSON.parse(res.bodyText);
    return { ...res, bodyText: JSON.stringify(parsed, null, 2) };
  } catch {
    return res;
  }
}
