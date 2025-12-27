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
  localStorage.setItem(KEY, JSON.stringify(items || []));
}

export function getSavedById(id) {
  if (!id) return null;
  const items = loadSaved();
  return items.find((x) => x.id === id) || null;
}

export function updateSavedById(id, patch) {
  if (!id) return false;

  const items = loadSaved();
  const idx = items.findIndex((x) => x.id === id);
  if (idx < 0) return false;

  items[idx] = { ...items[idx], ...patch, id };
  saveSaved(items);
  return true;
}
