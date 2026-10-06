import { collection, doc, getDocs, onSnapshot, query, runTransaction, where, writeBatch, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isValidLocation, isValidMapLink } from "@/lib/map-links";
import type { DemoOrder, OrderItem, OrderStatus } from "@/lib/models";

const orders = collection(db, "orders");
const orderItems = collection(db, "orderItems");
const counter = doc(db, "counters", "orders");
const itemKey = (orderId: string, productId: string) => `${orderId}_${productId}`;
function encodeItem(item: OrderItem, orderId: string) {
  return { orderId, productId: item.productId, productName: item.productName, price: item.price, quantity: item.quantity };
}
export function watchOrders(onChange: (items: DemoOrder[]) => void, onError?: (error: Error) => void): Unsubscribe {
  let rows: { id: string; data: Record<string, unknown> }[] = [];
  let lines: { orderId: string; item: OrderItem }[] = [];
  let seenOrders = false; let seenItems = false;
  const emit = () => {
    if (!seenOrders || !seenItems) return;
    const grouped = new Map<string, OrderItem[]>();
    for (const line of lines) grouped.set(line.orderId, [...(grouped.get(line.orderId) ?? []), line.item]);
    onChange(rows.map((row) => decodeOrder(row.id, row.data, grouped.get(row.id) ?? [])).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  };
  const stopOrders = onSnapshot(orders, (snapshot) => { seenOrders = true; rows = snapshot.docs.map((item) => ({ id: item.id, data: item.data() })); emit(); }, (error) => onError?.(error));
  const stopItems = onSnapshot(orderItems, (snapshot) => { seenItems = true; lines = snapshot.docs.map((item) => ({ orderId: String(item.data().orderId ?? ""), item: item.data() as OrderItem })); emit(); }, (error) => onError?.(error));
  return () => { stopOrders(); stopItems(); };
}
export type NewOrder = Omit<DemoOrder, "id" | "number" | "createdAt"> & { createdAt?: string };
export async function createOrder(input: NewOrder): Promise<DemoOrder> {
  const reference = doc(orders);
  const createdAt = input.createdAt ?? new Date().toISOString();
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(counter);
    const number = snapshot.exists() ? Number(snapshot.data().value) + 1 : 1001;
    const items = input.items.map(({ productId, productName, price, quantity }) => ({ productId, productName, price, quantity }));
    const common = { type: input.fulfillment, status: "new" as const, number, createdAt, ...(input.source ? { source: input.source } : {}) };
    // Геометка и ссылка клиента — только валидные, и только для доставки.
    const location = input.fulfillment === "delivery" && isValidLocation(input.location) ? { lat: input.location.lat, lng: input.location.lng } : undefined;
    const mapLink = input.fulfillment === "delivery" && typeof input.mapLink === "string" && isValidMapLink(input.mapLink) ? input.mapLink.trim() : undefined;
    // Заказ со стола: без телефона и адреса, вместо них — номер стола.
    transaction.set(reference, input.fulfillment === "dinein"
      ? { ...common, tableNumber: input.tableNumber ?? 0, ...(input.name.trim() ? { name: input.name.trim() } : {}), ...(input.comment.trim() ? { comment: input.comment.trim() } : {}) }
      : { ...common, name: input.name, phone: input.phone, address: input.address, comment: input.comment, ...(location ? { location } : {}), ...(mapLink ? { mapLink } : {}) });
    items.forEach((item) => transaction.set(doc(orderItems, itemKey(reference.id, item.productId)), encodeItem(item, reference.id)));
    transaction.set(counter, { value: number, orderId: reference.id });
    return { ...input, id: reference.id, number, createdAt, status: "new" as const };
  });
}
export async function updateOrder(id: string, changes: Partial<DemoOrder>): Promise<void> {
  const data = { ...changes } as Record<string, unknown>;
  const items = data.items as OrderItem[] | undefined;
  const fulfillment = data.fulfillment;
  ["items", "total", "id", "number", "fulfillment"].forEach((key) => Reflect.deleteProperty(data, key));
  const batch = writeBatch(db);
  if (items) {
    const existing = await getDocs(query(orderItems, where("orderId", "==", id)));
    const keep = new Set(items.map((item) => item.productId));
    existing.docs.forEach((item) => { if (!keep.has(String(item.data().productId))) batch.delete(item.ref); });
    items.forEach((item) => batch.set(doc(orderItems, itemKey(id, item.productId)), encodeItem(item, id)));
  }
  batch.set(doc(db, "orders", id), { ...data, ...(fulfillment ? { type: fulfillment } : {}) }, { merge: true });
  await batch.commit();
}
export async function setOrderStatus(id: string, status: OrderStatus): Promise<void> { await updateOrder(id, { status }); }
export async function deleteOrder(id: string): Promise<void> {
  const batch = writeBatch(db);
  const existing = await getDocs(query(orderItems, where("orderId", "==", id)));
  existing.docs.forEach((item) => batch.delete(item.ref));
  batch.delete(doc(db, "orders", id));
  await batch.commit();
}
export async function restoreOrder(order: DemoOrder): Promise<void> {
  const data = { ...order } as Record<string, unknown>;
  const id = String(data.id);
  const items = (data.items as OrderItem[] | undefined) ?? [];
  const fulfillment = data.fulfillment;
  ["items", "total", "id", "fulfillment"].forEach((key) => Reflect.deleteProperty(data, key));
  const batch = writeBatch(db);
  batch.set(doc(db, "orders", id), { ...data, type: fulfillment });
  items.forEach((item) => batch.set(doc(orderItems, itemKey(id, item.productId)), encodeItem(item, id)));
  await batch.commit();
}
function decodeOrder(id: string, data: Record<string, unknown>, itemDocs: OrderItem[]): DemoOrder {
  const legacy = Array.isArray(data.items) ? (data.items as OrderItem[]) : [];
  const items = itemDocs.length ? itemDocs : legacy;
  const total = items.length ? items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0) : Number(data.total ?? 0);
  return {
    ...data, id, items, total,
    fulfillment: (data.type ?? data.fulfillment ?? "delivery") as DemoOrder["fulfillment"],
    name: String(data.name ?? "Гость"), phone: String(data.phone ?? ""), address: String(data.address ?? ""), comment: String(data.comment ?? ""),
    tableNumber: typeof data.tableNumber === "number" ? data.tableNumber : undefined,
    location: isValidLocation(data.location) ? { lat: data.location.lat, lng: data.location.lng } : undefined,
    mapLink: typeof data.mapLink === "string" ? data.mapLink : undefined,
  } as DemoOrder;
}
