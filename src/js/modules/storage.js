const KEY = "wbs.savedRequests.v1";

export function loadSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAll(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function clearAll() {
  localStorage.removeItem(KEY);
}

export function upsert(item) {
  const items = loadSaved();
  const idx = items.findIndex(x => x.id === item.id);
  if (idx >= 0) items[idx] = item; else items.unshift(item);
  saveAll(items);
  return items;
}
