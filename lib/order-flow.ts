import { createOrder, type NewOrder } from "@/lib/repo/orders-repo";
import { flushOrderQueue, queueOrder } from "@/lib/order-queue";
import { warnFirestore } from "@/lib/firestore-log";
import type { DemoOrder } from "@/lib/models";

// Заказ важнее базы: клиент всё равно отправляет его в WhatsApp, поэтому запись в Firestore
// ограничена таймаутом, а сбой (квота, сеть, правила) не показывается как ошибка оформления.
export const ORDER_WRITE_TIMEOUT_MS = 8000;

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

export type OrderSubmitResult = { order: DemoOrder | null; queued: boolean };

// Успели записать — есть номер и чек с номером. Не успели — чек без номера, заказ в очереди,
// а WhatsApp открывается всё равно: без базы клиент не остаётся.
export async function submitOrder(input: NewOrder, create = createOrder): Promise<OrderSubmitResult> {
  try {
    const order = await withTimeout(create(input), ORDER_WRITE_TIMEOUT_MS);
    return { order, queued: false };
  } catch (error) {
    warnFirestore("orders", error);
    queueOrder(input);
    return { order: null, queued: true };
  }
}

// Фоновая дозапись отложенных заказов при открытии сайта: ошибки пишутся в консоль без данных клиента.
export function retryQueuedOrders(): void { flushOrderQueue(createOrder); }
