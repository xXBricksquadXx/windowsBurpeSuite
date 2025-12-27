const KEY = "wbs_saved_v1";

export function loadSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveSaved(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}
