const KEY = "tramplin:favorites:opportunities";

export function loadFavoriteIds(): Set<number> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map((x) => Number(x)).filter((x) => Number.isFinite(x)));
  } catch {
    return new Set();
  }
}

export function saveFavoriteIds(ids: Set<number>) {
  localStorage.setItem(KEY, JSON.stringify(Array.from(ids)));
}

export function toggleFavorite(id: number): Set<number> {
  const ids = loadFavoriteIds();
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  saveFavoriteIds(ids);
  return ids;
}

