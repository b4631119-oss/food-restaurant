// Хранение данных клиента в браузере: ключ, лимиты полей и срок жизни.
// Модуль намеренно без React, чтобы логику срока хранения можно было проверить без браузера.
export const CUSTOMER_KEY = "sushi-bar-no1-customer";
// Лимиты согласованы с firestore.rules, чтобы заказ не отклонялся на сервере.
export const NAME_MAX = 80;
export const ADDRESS_MAX = 200;
// Персональные данные не должны жить в браузере дольше 30 дней.
export const SAVED_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type SavedCustomer = { name?: string; phone?: string; address?: string; street?: string; savedAt?: number };

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

// Читает данные, только если срок хранения не истёк. Просроченные и записи
// без отметки времени удаляются: срок хранения неизвестен — значит нельзя доверять.
export function readSavedCustomer(now: number = Date.now(), store: StorageLike | null = defaultStorage()): SavedCustomer | null {
  if (!store) return null;
  let parsed: SavedCustomer | null = null;
  try {
    parsed = JSON.parse(store.getItem(CUSTOMER_KEY) ?? "null") as SavedCustomer | null;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const savedAt = Number(parsed.savedAt ?? 0);
  if (!savedAt || now - savedAt > SAVED_TTL_MS) {
    try {
      store.removeItem(CUSTOMER_KEY);
    } catch { /* Работаем без storage. */ }
    return null;
  }
  return parsed;
}

export function saveCustomer(data: { name: string; phone: string; address: string }, store: StorageLike | null = defaultStorage()): void {
  if (!store) return;
  try {
    store.setItem(CUSTOMER_KEY, JSON.stringify({
      name: data.name.slice(0, NAME_MAX),
      phone: data.phone,
      address: data.address.slice(0, ADDRESS_MAX),
      savedAt: Date.now(),
    }));
  } catch { /* Работаем без storage. */ }
}

export function forgetCustomer(store: StorageLike | null = defaultStorage()): void {
  try {
    store?.removeItem(CUSTOMER_KEY);
  } catch { /* Работаем без storage. */ }
}
