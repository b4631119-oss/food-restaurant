const cacheVersion = "v3";
const cacheTtlMs = 15 * 60 * 1000;

// Рядом с данными витрины лежит версия с сервера: пока она совпадает,
// коллекции Firestore не читаются, а данные берутся из localStorage.
// Свежим считается кэш не старше 15 минут — пока он свежий, сеть не трогаем вовсе.
export type CacheRecord<T> = { savedAt: number; version: number; value: T };

function cacheKey(name: string): string { return `sushi-menu:${cacheVersion}:${name}`; }

function parseRecord<T>(name: string): CacheRecord<T> | null {
  try {
    const raw = window.localStorage.getItem(cacheKey(name)); if (!raw) return null;
    const entry = JSON.parse(raw) as CacheRecord<T> | null;
    if (!entry || typeof entry.savedAt !== "number" || !entry.value) return null;
    return { savedAt: entry.savedAt, version: Number(entry.version) || 0, value: entry.value };
  } catch { return null; }
}

// Свежий кэш (не старше 15 минут): витрина показывает его без обращения к Firestore.
export function readRecord<T>(name: string): CacheRecord<T> | null {
  const entry = parseRecord<T>(name);
  return entry && Date.now() - entry.savedAt <= cacheTtlMs ? entry : null;
}

// Кэш любого возраста: нужен, когда Firestore ответил ошибкой или исчерпана квота чтений, —
// устаревшее меню лучше пустого экрана.
export function readStaleRecord<T>(name: string): CacheRecord<T> | null {
  return parseRecord<T>(name);
}

export function writeRecord<T>(name: string, value: T, version: number): void {
  try { window.localStorage.setItem(cacheKey(name), JSON.stringify({ savedAt: Date.now(), version, value } satisfies CacheRecord<T>)); } catch { /* localStorage недоступен — работаем без кэша */ }
}
