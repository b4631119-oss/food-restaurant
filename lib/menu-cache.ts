const cacheVersion = "v1";
const cacheTtlMs = 10 * 60 * 1000;

type CacheEntry<T> = { savedAt: number; value: T };

function cacheKey(name: string): string { return `sushi-menu:${cacheVersion}:${name}`; }
export function readCache<T>(name: string): T | null {
  try {
    const raw = window.localStorage.getItem(cacheKey(name)); if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T> | null;
    if (!entry || typeof entry.savedAt !== "number" || Date.now() - entry.savedAt > cacheTtlMs) return null;
    return entry.value ?? null;
  } catch { return null; }
}
export function writeCache<T>(name: string, value: T): void {
  try { window.localStorage.setItem(cacheKey(name), JSON.stringify({ savedAt: Date.now(), value } satisfies CacheEntry<T>)); } catch { /* localStorage недоступен — работаем без кэша */ }
}
