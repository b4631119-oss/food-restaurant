import menuData from "@/data/menu.json";
import { getOrders, setOrders, type DemoOrder, type OrderStatus } from "@/lib/demo-store";

const SEED_KEY = "demo-seed-v1";
const names = ["Айжан", "Нурбек", "Алина", "Эрлан", "Мээрим", "Бакыт", "Айпери", "Руслан", "Данияр", "Элмира", "Азамат", "Жылдыз"];
const streets = ["Ленина", "Курманджан датка", "Масалиева", "Раззакова", "Монуева"];
const products = menuData.products.filter((product) => product.inStock);

export function seedDemoData(): void {
  try {
    if (localStorage.getItem(SEED_KEY)) return;
    const now = new Date(); const orders: DemoOrder[] = []; let serial = 0;
    const add = (date: Date, status: OrderStatus, ageMinutes = 0) => {
      const index = serial++; const created = new Date(date);
      if (ageMinutes) created.setTime(now.getTime() - ageMinutes * 60000);
      const todayCompleted = status === "completed" && created.toDateString() === now.toDateString();
      const todayIndexes = [12, 14, 16];
      const items = [0, 1 + index % 3].map((offset, itemIndex) => {
        const productIndex = todayCompleted ? todayIndexes[index % todayIndexes.length] + itemIndex : (index * 2 + offset) % products.length;
        const product = products[productIndex % products.length];
        return { productId: product.id, productName: product.name, price: product.price, quantity: 1 + (index + offset) % 2 };
      });
      orders.push({ id: `demo-${index + 1}`, number: 1010 + index, createdAt: created.toISOString(), name: names[index % names.length], phone: `+996 700 12${String(index).padStart(2, "0")} 34`, fulfillment: index % 4 === 0 ? "pickup" : "delivery", address: `${streets[index % streets.length]} ${8 + index * 3}, Ош`, comment: index % 2 ? "Позвонить при доставке" : "", status, source: "demo", items, total: items.reduce((sum, item) => sum + item.price * item.quantity, 0) });
    };
    const counts = [6, 3, 4, 5, 7, 4];
    counts.forEach((count, dayOffset) => { const date = new Date(now); date.setDate(now.getDate() - dayOffset - 1); date.setHours(11, 0, 0, 0); for (let i = 0; i < count; i++) { const created = new Date(date); created.setHours(10 + i * 2, (i * 11) % 60); add(created, "completed"); } });
    for (let i = 0; i < 3; i++) { const date = new Date(now); date.setHours(10 + i, 15, 0, 0); add(date, "completed"); }
    add(now, "delivering", 45); add(now, "preparing", 20); add(now, "new", 1); add(now, "new", 8); add(now, "cancelled", 35);
    if (!getOrders().length) setOrders(orders);
    localStorage.setItem(SEED_KEY, "1");
  } catch { /* Admin pages remain usable if browser storage is unavailable. */ }
}
