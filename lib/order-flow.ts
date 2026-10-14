import { changedPrices, changedPricesDirect } from "@/lib/order-prices";
import { OrderError, orderErrorKind } from "@/lib/order-error";
import { errorFirestore, warnFirestoreCode } from "@/lib/firestore-log";
import { createOrder, existingOrderNumber, type CreatedOrder, type NewOrder } from "@/lib/repo/orders-repo";

// Клиент ждёт подтверждения Firestore не дольше 8 секунд. Не дождались — заказа нет,
// WhatsApp не открывается, а повтор с тем же clientOrderId вернёт уже созданный заказ,
// если транзакция всё-таки успела завершиться.
export const ORDER_WRITE_TIMEOUT_MS = 8000;
// Сверка цен — быстрый шаг: на медленной сети она не должна съедать бюджет оформления.
// Не успела — запись всё равно пойдёт, и её проверит firestore.rules.
export const PRICE_CHECK_TIMEOUT_MS = 4000;

type CodedError = Error & { code?: string };

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const error: CodedError = new Error("deadline-exceeded");
      error.code = "deadline-exceeded";
      reject(error);
    }, ms);
    work.then((value) => { clearTimeout(timer); resolve(value); }, (error: unknown) => { clearTimeout(timer); reject(error); });
  });
}

// Уникальный ключ попытки оформления: он же id документа заказа (см. createOrder).
export function newClientOrderId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Заказ считается оформленным только после подтверждённой записи в Firestore: функция либо
// возвращает реальный номер заказа, либо бросает OrderError — тогда WhatsApp не открывается.
export async function submitOrder(input: NewOrder): Promise<CreatedOrder> {
  // Тот же clientOrderId уже мог сохраниться: двойной клик, повтор после таймаута или перезагрузки.
  // Тогда возвращаем первоначальный номер и НЕ создаём новую попытку — второй заказ невозможен.
  const known = await existingOrderNumber(input.clientOrderId).catch(() => null);
  if (known !== null) return { id: input.clientOrderId, number: known };
  // Цены сверяем до записи: заказ со старой ценой не должен уйти клиенту. Если проверить
  // не удалось (например, квота), запись всё равно произойдёт — её проверит firestore.rules.
  const stale = await withTimeout(changedPrices(input.items), PRICE_CHECK_TIMEOUT_MS).catch(() => []);
  if (stale.length) { warnFirestoreCode("orders", "price-changed"); throw new OrderError("price-changed"); }
  try {
    return await withTimeout(createOrder(input), ORDER_WRITE_TIMEOUT_MS);
  } catch (error) {
    const kind = orderErrorKind(error);
    errorFirestore("orders", error);
    // Запись могла состояться уже после клиентского таймаута или отказа — проверяем ещё раз
    // по ключу попытки: если заказ есть, это готовый номер, а не ошибка.
    const existing = await existingOrderNumber(input.clientOrderId).catch(() => null);
    if (existing !== null) return { id: input.clientOrderId, number: existing };
    if (kind === "denied" || kind === "invalid") {
      // Отказ правил также означает изменившуюся цену или снятое блюдо: показываем это клиенту.
      const direct = await changedPricesDirect(input.items).catch(() => []);
      if (direct.length) throw new OrderError("price-changed");
    }
    throw new OrderError(kind);
  }
}
