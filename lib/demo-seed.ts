import menuData from "@/data/menu.json";
import { getOrders, setOrders, type DemoOrder, type OrderStatus } from "@/lib/demo-store";

const SEED_KEY = "demo-seed-v1";
const samples = [
  ["Айжан", "Курманжан датка 12", "new", 0], ["Нурбек", "Масалиева 45", "new", 0],
  ["Алина", "Ленина 8", "preparing", 0], ["Эрлан", "Исанова 21", "preparing", 0],
  ["Мээрим", "Раззакова 17", "delivering", 0], ["Бакыт", "Ошская 31", "completed", 0],
  ["Айпери", "Монуева 9", "completed", 1], ["Руслан", "Алишера Навои 6", "completed", 1],
  ["Данияр", "Ленина 42", "cancelled", 1],
] as const;
const products = menuData.products.filter((product) => product.inStock);

export function seedDemoData(): void {
  try {
    if (localStorage.getItem(SEED_KEY)) return;
    const now = new Date();
    const orders: DemoOrder[] = samples.map(([name, address, status, yesterday], index) => {
      const created = new Date(now);
      created.setDate(created.getDate() - yesterday);
      created.setHours(10 + (index * 2) % 12, (index * 11) % 60, 0, 0);
      const product = products[index % products.length];
      const quantity = index % 2 + 1;
      return {
        id: `demo-${index + 1}`, number: 1001 + index, createdAt: created.toISOString(), name,
        phone: `+996 700 12${String(index).padStart(2, "0")} 34`, fulfillment: "delivery",
        address, comment: index % 2 ? "Позвонить при доставке" : "", status: status as OrderStatus,
        items: [{ productId: product.id, productName: product.name, price: product.price, quantity }], total: product.price * quantity,
      };
    });
    if (!getOrders().length) setOrders(orders);
    localStorage.setItem(SEED_KEY, "1");
  } catch { /* Admin pages remain usable if browser storage is unavailable. */ }
}
