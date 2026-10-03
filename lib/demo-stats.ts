import type { DemoOrder } from "@/lib/models";

export type RevenueDay = { date: Date; amount: number };
export type TopDish = { name: string; quantity: number };
const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
export function ordersForDay(orders: DemoOrder[], date: Date): DemoOrder[] {
  return orders.filter((order) => order.status !== "cancelled" && dayKey(new Date(order.createdAt)) === dayKey(date));
}
export function revenueForDay(orders: DemoOrder[], date: Date): number {
  return ordersForDay(orders, date).reduce((sum, order) => sum + order.total, 0);
}
export function compareWithYesterday(orders: DemoOrder[], date: Date, kind: "orders" | "revenue" | "average" = "revenue") {
  const yesterday = new Date(date); yesterday.setDate(yesterday.getDate() - 1);
  const todayOrders = ordersForDay(orders, date); const yesterdayOrders = ordersForDay(orders, yesterday);
  const value = (items: DemoOrder[]) => {
    const revenue = items.reduce((sum, order) => sum + order.total, 0);
    return kind === "orders" ? items.length : kind === "average" ? (items.length ? Math.round(revenue / items.length) : 0) : revenue;
  };
  const current = value(todayOrders); const previous = value(yesterdayOrders);
  return { current, previous, change: previous ? Math.round((current - previous) / previous * 100) : null };
}
export function topDishes(orders: DemoOrder[], date: Date, limit = 5): TopDish[] {
  const start = new Date(date); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
  const counts = new Map<string, number>();
  orders.filter((order) => order.status !== "cancelled" && new Date(order.createdAt) >= start && dayKey(new Date(order.createdAt)) <= dayKey(date))
    .forEach((order) => order.items.forEach((item) => counts.set(item.productName, (counts.get(item.productName) ?? 0) + item.quantity)));
  return [...counts].map(([name, quantity]) => ({ name, quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, limit);
}
export function revenueByDay(orders: DemoOrder[], date: Date): RevenueDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(date); day.setDate(date.getDate() - 6 + index);
    return { date: day, amount: revenueForDay(orders, day) };
  });
}
