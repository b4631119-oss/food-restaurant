import { collection, deleteDoc, doc, onSnapshot, runTransaction, setDoc, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DemoOrder, OrderStatus } from "@/lib/demo-store";

const orders = collection(db, "orders");
export function watchOrders(onChange: (items: DemoOrder[]) => void, onError?: (error: Error) => void): Unsubscribe {
  return onSnapshot(orders, (snapshot) => onChange(snapshot.docs.map((item) => decodeOrder(item.id, item.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))), (error) => onError?.(error));
}
export async function createOrder(input: Omit<DemoOrder, "id" | "number">): Promise<DemoOrder> {
  const counter = doc(db, "counters", "orders"); const reference = doc(orders);
  const order = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(counter); const number = snapshot.exists() ? Number(snapshot.data().value) + 1 : 1001;
    const { fulfillment, ...details } = input;
    const data = { ...details, type: fulfillment, number, createdAt: new Date().toISOString(), status: "new" as const };
    transaction.set(reference, data); transaction.set(counter, { value: number, orderId: reference.id });
    return { ...input, id: reference.id, number, createdAt: data.createdAt, status: "new" as const };
  });
  return order;
}
export async function updateOrder(id: string, changes: Partial<DemoOrder>): Promise<void> {
  const data = { ...changes } as Record<string, unknown>;
  const fulfillment = data.fulfillment; delete data.fulfillment; delete data.id; delete data.number;
  await setDoc(doc(db, "orders", id), { ...data, ...(fulfillment ? { type: fulfillment } : {}) }, { merge: true });
}
export async function setOrderStatus(id: string, status: OrderStatus): Promise<void> { await updateOrder(id, { status }); }
export async function deleteOrder(id: string): Promise<void> { await deleteDoc(doc(db, "orders", id)); }
function decodeOrder(id: string, data: Record<string, unknown>): DemoOrder {
  return { ...data, id, fulfillment: (data.type ?? data.fulfillment ?? "delivery") as DemoOrder["fulfillment"] } as DemoOrder;
}
