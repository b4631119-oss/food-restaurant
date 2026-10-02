import menuData from "@/data/menu.json";
import { CAFE } from "@/lib/config";

export const DEMO_AUTH_KEY = "sushi-bar-no1-admin-auth";
export const DEMO_DATA_EVENT = "sushi-bar-no1-demo-data";
const KEYS = { orders: "demo-orders", products: "demo-products", categories: "demo-categories", settings: "demo-settings", deleted: "demo-deleted-products" };
export type OrderStatus = "new" | "preparing" | "delivering" | "completed" | "cancelled";
export type DemoOrder = { id: string; number: number; createdAt: string; name: string; phone: string; fulfillment: "delivery" | "pickup"; address: string; comment: string; items: { productId: string; productName: string; price: number; quantity: number }[]; total: number; status: OrderStatus; source?: "website" | "demo" };
export type DemoProduct = (typeof menuData.products)[number] & { id: string; name: string; description: string; price: number; category: string; image: string; inStock: boolean; popular?: boolean; weight?: string };
export type DemoSettings = { acceptingOrders: boolean; phone: string; whatsappNumber: string; minimumOrder: number; deliveryTime: string; openingHours: string; address: string };
const DEFAULT_SETTINGS: DemoSettings = { acceptingOrders: true, phone: CAFE.phone, whatsappNumber: CAFE.whatsappNumber, minimumOrder: CAFE.delivery.minimumOrder, deliveryTime: CAFE.delivery.time, openingHours: CAFE.openingHours, address: CAFE.address };

function read<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value) as T; }
  catch { return fallback; }
}
function write<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new Event(DEMO_DATA_EVENT)); }
  catch (error) { if (error instanceof DOMException && error.name === "QuotaExceededError") throw new Error("В хранилище браузера закончилось место. Удалите часть демо-данных."); throw new Error("Не удалось сохранить данные в этом браузере."); }
}
export function getOrders(): DemoOrder[] { return read(KEYS.orders, []); }
export function setOrders(value: DemoOrder[]): void { write(KEYS.orders, value); }
function storedProducts(): DemoProduct[] { return read(KEYS.products, menuData.products as DemoProduct[]); }
export function getProducts(): DemoProduct[] {
  const deleted = new Set(read<string[]>(KEYS.deleted, []));
  return storedProducts().filter((product) => !deleted.has(product.id));
}
export function setProducts(value: DemoProduct[]): void { write(KEYS.products, value); }
export function removeProduct(product: DemoProduct): void {
  const baseIds = new Set(menuData.products.map((item) => item.id));
  if (baseIds.has(product.id)) write(KEYS.deleted, [...new Set([...read<string[]>(KEYS.deleted, []), product.id])]);
  else write(KEYS.products, storedProducts().filter((item) => item.id !== product.id));
}
export function restoreProduct(product: DemoProduct): void {
  const baseIds = new Set(menuData.products.map((item) => item.id));
  if (baseIds.has(product.id)) write(KEYS.deleted, read<string[]>(KEYS.deleted, []).filter((id) => id !== product.id));
  else write(KEYS.products, [...storedProducts().filter((item) => item.id !== product.id), product]);
}
export function getCategories(): string[] { return read(KEYS.categories, menuData.categories); }
export function setCategories(value: string[]): void { write(KEYS.categories, value); }
export function getSettings(): DemoSettings { return { ...DEFAULT_SETTINGS, ...read<Partial<DemoSettings>>(KEYS.settings, {}) }; }
export function setSettings(value: DemoSettings): void { write(KEYS.settings, value); }
export function resetDemoData(): void { Object.values(KEYS).forEach((key) => localStorage.removeItem(key)); window.dispatchEvent(new Event(DEMO_DATA_EVENT)); }
