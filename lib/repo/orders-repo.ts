import { collection, doc, getDocs, limit, orderBy, query, runTransaction, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { isValidLocation, isValidMapLink } from "@/lib/map-links";
import type { DemoOrder, OrderItem, OrderStatus } from "@/lib/models";

const orders = collection(db, "orders");
const orderItems = collection(db, "orderItems");
const counter = doc(db, "counters", "orders");
const MAX_PERIOD_ORDERS = 2000;
const IDS_PER_ITEM_QUERY = 30;
const itemKey = (orderId: string, productId: string) => `${orderId}_${productId}`;
function isValidDeliveryFee(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 5000;
}
function encodeItem(item: OrderItem, orderId: string) {
  return { orderId, productId: item.productId, productName: item.productName, price: item.price, quantity: item.quantity };
}
// Одиночный запрос заказов за период (без подписки onSnapshot): не больше 2000 штук,
// отменённые заказы в отчёты не попадают, позиции подтягиваются пачками по 30 заказов.
export async function getOrdersInRange(startIso: string, endIso: string): Promise<DemoOrder[]> {
  const snapshot = await getDocs(query(orders, where("createdAt", ">=", startIso), where("createdAt", "<", endIso), orderBy("createdAt", "desc"), limit(MAX_PERIOD_ORDERS)));
  const rows = snapshot.docs.filter((entry) => entry.data().status !== "cancelled").map((entry) => ({ id: entry.id, data: entry.data() }));
  const grouped = new Map<string, OrderItem[]>();
  for (let index = 0; index < rows.length; index += IDS_PER_ITEM_QUERY) {
    const ids = rows.slice(index, index + IDS_PER_ITEM_QUERY).map((row) => row.id);
    const items = await getDocs(query(orderItems, where("orderId", "in", ids)));
    items.docs.forEach((entry) => {
      const line = entry.data() as OrderItem & { orderId?: string };
      const key = String(line.orderId ?? "");
      grouped.set(key, [...(grouped.get(key) ?? []), line]);
    });
  }
  return rows.map((row) => decodeOrder(row.id, row.data, grouped.get(row.id) ?? []));
}
// Все заказы — только для полной очистки тестовых данных в настройках.
export async function getAllOrderIds(): Promise<string[]> {
  const snapshot = await getDocs(orders);
  return snapshot.docs.map((entry) => entry.id);
}
export type NewOrder = Omit<DemoOrder, "id" | "number" | "createdAt"> & { createdAt?: string };
export async function createOrder(input: NewOrder): Promise<DemoOrder> {
  const reference = doc(orders);
  const createdAt = input.createdAt ?? new Date().toISOString();
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(counter);
    const number = snapshot.exists() ? Number(snapshot.data().value) + 1 : 1001;
    const items = input.items.map(({ productId, productName, price, quantity }) => ({ productId, productName, price, quantity }));
    // itemsCount пишем ровно по числу позиций: правила проверяют его как целое 1..30.
    const common = { type: input.fulfillment, status: "new" as const, number, createdAt, itemsCount: items.length, ...(input.source ? { source: input.source } : {}) };
    // Геометка и ссылка клиента — только валидные, и только для доставки.
    const location = input.fulfillment === "delivery" && isValidLocation(input.location) ? { lat: input.location.lat, lng: input.location.lng } : undefined;
    const mapLink = input.fulfillment === "delivery" && typeof input.mapLink === "string" && isValidMapLink(input.mapLink) ? input.mapLink.trim() : undefined;
    // Заказ со стола: без телефона и адреса, вместо них — номер стола.
    transaction.set(reference, input.fulfillment === "dinein"
      ? { ...common, tableNumber: input.tableNumber ?? 0, ...(input.name.trim() ? { name: input.name.trim() } : {}), ...(input.comment.trim() ? { comment: input.comment.trim() } : {}) }
      : { ...common, name: input.name, phone: input.phone, address: input.address, comment: input.comment, ...(input.fulfillment === "delivery" && isValidDeliveryFee(input.deliveryFee) ? { deliveryFee: input.deliveryFee } : {}), ...(location ? { location } : {}), ...(mapLink ? { mapLink } : {}) });
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
    deliveryFee: isValidDeliveryFee(data.deliveryFee) ? data.deliveryFee : undefined,
    location: isValidLocation(data.location) ? { lat: data.location.lat, lng: data.location.lng } : undefined,
    // Ссылку перепроверяем при чтении: в базе могли оказаться данные, записанные до валидации.
    mapLink: typeof data.mapLink === "string" && isValidMapLink(data.mapLink) ? data.mapLink : undefined,
  } as DemoOrder;
}
