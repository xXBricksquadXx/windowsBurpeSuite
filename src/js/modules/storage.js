const KEY = "wbs_saved_v1";
const LEGACY_KEY = "wbs.savedRequests.v1";

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeLegacy(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((x) => x && typeof x === "object")
    .map((x) => {
      const ts = Date.parse(x.createdAt || "") || Date.now();
      return {
        id: x.id || crypto.randomUUID(),
        ts,
        method: String(x.method || "GET").toUpperCase(),
        url: String(x.url || ""),
        headers: x.headers || {},
        body: x.body || "",
      };
    })
    .filter((x) => x.url);
}

function emitSavedChanged(items) {
  try {
    window.dispatchEvent(
      new CustomEvent("wbs:saved-changed", {
        detail: { count: Array.isArray(items) ? items.length : 0 },
      })
    );
  } catch {}
}

export function loadSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = safeJsonParse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    // Legacy migration (one-time)
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (!legacyRaw) return [];

    const legacyParsed = safeJsonParse(legacyRaw);
    const normalized = normalizeLegacy(legacyParsed);
    if (normalized.length) {
      saveSaved(normalized);
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {}
      return normalized;
    }

    return [];
  } catch {
    return [];
  }
}

export function saveSaved(items) {
  const arr = Array.isArray(items) ? items : [];
  localStorage.setItem(KEY, JSON.stringify(arr));
  emitSavedChanged(arr);
}

export function updateSavedById(id, patch) {
  try {
    const all = loadSaved();
    const idx = all.findIndex((x) => x && x.id === id);
    if (idx < 0) return false;

    const prev = all[idx] || {};
    all[idx] = { ...prev, ...patch, id: prev.id };

    saveSaved(all);
    return true;
  } catch {
    return false;
  }
}
