export const TABLE_KEY = "sushi-bar-no1-table";
export const LAST_ORDER_KEY = "sushi-bar-no1-last-order";
export const ORDER_LIMIT = 30;
// Лимиты количества согласованы с firestore.rules: больше в заказ не попадёт.
export const MAX_QUANTITY = 20;
export const ORDER_COOLDOWN_MS = 60 * 1000;
export const TABLE_COUNT = 6;

const validTable = (value: number) => Number.isInteger(value) && value >= 1 && value <= TABLE_COUNT;

export function readTableFromSearch(search: string): number | null {
  const param = new URLSearchParams(search).get("table");
  if (param === null) return null;
  const parsed = Number(param);
  return validTable(parsed) ? parsed : null;
}
export function readTable(): number | null {
  try {
    const saved = Number(sessionStorage.getItem(TABLE_KEY) ?? 0);
    return validTable(saved) ? saved : null;
  } catch { return null; }
}
export function saveTable(table: number): void {
  try { sessionStorage.setItem(TABLE_KEY, String(table)); } catch { /* Работаем без storage. */ }
}
export function cooldownLeft(): number {
  try {
    const last = Number(localStorage.getItem(LAST_ORDER_KEY) ?? 0);
    return Math.max(0, ORDER_COOLDOWN_MS - (Date.now() - last));
  } catch { return 0; }
}
export function markOrderSent(): void {
  try { localStorage.setItem(LAST_ORDER_KEY, String(Date.now())); } catch { /* Работаем без storage. */ }
}
