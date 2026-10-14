import { warnFirestore } from "@/lib/firestore-log";
import type { NewOrder } from "@/lib/repo/orders-repo";

// Заказ, который не удалось записать в Firestore, ждёт в очереди на устройстве клиента до 7 дней:
// в WhatsApp он уже отправлен, а база догонит при следующем открытии сайта.
const QUEUE_KEY = "sushi-bar-no1-order-queue:v1";
const MAX_QUEUED = 5;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type QueuedOrder = { id: string; savedAt: number; input: NewOrder };

function readQueue(): QueuedOrder[] {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as QueuedOrder[];
    if (!Array.isArray(list)) return [];
    return list.filter((entry) => Boolean(entry) && typeof entry.savedAt === "number" && Boolean(entry.input) && Date.now() - entry.savedAt <= MAX_AGE_MS);
  } catch { return []; }
}

function writeQueue(list: QueuedOrder[]): void {
  try { window.localStorage.setItem(QUEUE_KEY, JSON.stringify(list)); } catch { /* localStorage недоступен — очередь не ведём */ }
}

// Больше пяти заказов на устройстве не держим: новая запись вытесняет самую старую.
export function queueOrder(input: NewOrder): void {
  const list = readQueue().slice(-(MAX_QUEUED - 1));
  list.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, savedAt: Date.now(), input });
  writeQueue(list.slice(-MAX_QUEUED));
}

function removeQueued(id: string): void { writeQueue(readQueue().filter((entry) => entry.id !== id)); }

let flushing = false;
// Один раз за визит пробуем дозаписать очередь. После первой же неудачи останавливаемся:
// добивать исчерпанную квоту Firestore повторами бессмысленно. Кулдаун заказа здесь не применяется.
export function flushOrderQueue(create: (input: NewOrder) => Promise<unknown>): void {
  if (flushing || typeof window === "undefined") return;
  const list = readQueue();
  if (!list.length) return;
  flushing = true;
  void (async () => {
    for (const entry of list) {
      try { await create(entry.input); removeQueued(entry.id); }
      catch (error) { warnFirestore("orders:queue", error); break; }
    }
  })();
}
