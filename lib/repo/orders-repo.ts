import { collection, deleteDoc, doc, onSnapshot, runTransaction, setDoc, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DemoOrder, OrderStatus } from "@/lib/models";

const orders = collection(db, "orders");
export function watchOrders(onChange: (items: DemoOrder[]) => void, onError?: (error: Error) => void): Unsubscribe {
  return onSnapshot(orders, (snapshot) => onChange(snapshot.docs.map((item) => decodeOrder(item.id, item.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))), (error) => onError?.(error));
}
export type NewOrder = Omit<DemoOrder, "id" | "number" | "createdAt"> & { createdAt?: string };
export async function createOrder(input: NewOrder): Promise<DemoOrder> {
  const counter = doc(db, "counters", "orders"); const reference = doc(orders);
  const createdAt = input.createdAt ?? new Date().toISOString();
  const order = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(counter); const number = snapshot.exists() ? Number(snapshot.data().value) + 1 : 1001;
    const details = { ...input } as Record<string, unknown>;
    const fulfillment = details.fulfillment; delete details.fulfillment; delete details.id; delete details.number;
    const data = { ...details, type: fulfillment, number, createdAt, status: "new" as const };
    transaction.set(reference, data); transaction.set(counter, { value: number, orderId: reference.id });
    const fulfillmentValue = input.fulfillment;
    return { ...input, id: reference.id, number, createdAt, fulfillment: fulfillmentValue, status: "new" as const };
  });
  return order;
}
export async function updateOrder(id: string, changes: Partial<DemoOrder>): Promise<void> {
  const data = { ...changes } as Record<string, unknown>;
  const fulfillment = data.fulfillment; Reflect.deleteProperty(data, "fulfillment"); Reflect.deleteProperty(data, "id"); Reflect.deleteProperty(data, "number");
  await setDoc(doc(db, "orders", id), { ...data, ...(fulfillment ? { type: fulfillment } : {}) }, { merge: true });
}
export async function setOrderStatus(id: string, status: OrderStatus): Promise<void> { await updateOrder(id, { status }); }
export async function deleteOrder(id: string): Promise<void> { await deleteDoc(doc(db, "orders", id)); }
export async function restoreOrder(order: DemoOrder): Promise<void> {
  const data = { ...order } as Record<string, unknown>;
  const id = String(data.id); const number = data.number; const fulfillment = data.fulfillment;
  Reflect.deleteProperty(data, "id"); Reflect.deleteProperty(data, "fulfillment");
  await setDoc(doc(db, "orders", id), { ...data, number, type: fulfillment });
}
function decodeOrder(id: string, data: Record<string, unknown>): DemoOrder {
  return { ...data, id, fulfillment: (data.type ?? data.fulfillment ?? "delivery") as DemoOrder["fulfillment"] } as DemoOrder;
}
