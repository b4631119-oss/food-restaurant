import { firestoreCode } from "@/lib/firestore-log";

// Заказ либо подтверждён Firestore, либо его нет: причина отказа нужна только для выбора
// понятной клиенту фразы, технический код в интерфейс не попадает.
export type OrderErrorKind =
  | "offline" | "timeout" | "quota" | "unavailable"
  | "denied" | "invalid" | "unknown" | "price-changed";

const MESSAGES: Record<OrderErrorKind, string> = {
  offline: "Нет подключения к интернету. Проверьте сеть и попробуйте ещё раз.",
  timeout: "Не удалось оформить заказ. Сервер не ответил вовремя. Нажмите «Повторить».",
  quota: "Не удалось оформить заказ. Сервер перегружен. Попробуйте ещё раз через минуту.",
  unavailable: "Не удалось оформить заказ. Сервер временно недоступен. Попробуйте ещё раз.",
  denied: "Заказ не прошёл проверку. Обновите меню и попробуйте ещё раз.",
  invalid: "Не удалось оформить заказ: данные не приняты. Проверьте форму и повторите.",
  unknown: "Не удалось оформить заказ. Попробуйте ещё раз.",
  "price-changed": "Цены или наличие блюд изменились. Меню обновлено — проверьте корзину и оформите заказ заново.",
};

export function orderErrorMessage(kind: OrderErrorKind): string {
  return MESSAGES[kind];
}

export class OrderError extends Error {
  readonly kind: OrderErrorKind;
  constructor(kind: OrderErrorKind, options?: { cause?: unknown }) {
    super(MESSAGES[kind], options);
    this.name = "OrderError";
    this.kind = kind;
  }
}

// Код Firestore → причина отказа. Клиент офлайн проверяем первым: тогда код ошибки неважен.
export function orderErrorKind(error: unknown): OrderErrorKind {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  const code = firestoreCode(error);
  if (code === "deadline-exceeded") return "timeout";
  if (code === "resource-exhausted") return "quota";
  if (code === "unavailable") return "unavailable";
  if (code === "permission-denied") return "denied";
  if (code === "invalid-argument" || code === "failed-precondition" || code === "already-exists" || code === "not-found") return "invalid";
  return "unknown";
}
