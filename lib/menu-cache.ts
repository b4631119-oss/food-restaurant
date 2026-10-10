const cacheVersion = "v2";
const cacheTtlMs = 10 * 60 * 1000;

// Рядом с данными витрины лежит версия с сервера: пока она совпадает,
// коллекции Firestore не читаются, а данные берутся из localStorage.
export type CacheRecord<T> = { savedAt: number; version: number; value: T };

function cacheKey(name: string): string { return `sushi-menu:${cacheVersion}:${name}`; }
export function readRecord<T>(name: string): CacheRecord<T> | null {
  try {
    const raw = window.localStorage.getItem(cacheKey(name)); if (!raw) return null;
    const entry = JSON.parse(raw) as CacheRecord<T> | null;
    if (!entry || typeof entry.savedAt !== "number" || Date.now() - entry.savedAt > cacheTtlMs) return null;
    if (!entry.value) return null;
    return { savedAt: entry.savedAt, version: Number(entry.version) || 0, value: entry.value };
  } catch { return null; }
}
export function writeRecord<T>(name: string, value: T, version: number): void {
  try { window.localStorage.setItem(cacheKey(name), JSON.stringify({ savedAt: Date.now(), version, value } satisfies CacheRecord<T>)); } catch { /* localStorage недоступен — работаем без кэша */ }
}
