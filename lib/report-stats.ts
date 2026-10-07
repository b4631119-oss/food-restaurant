import { TABLE_COUNT } from "@/lib/table";
import { hourOf, periodDays, reportDayKey, type Period } from "@/lib/report-period";
import type { DemoOrder, OrderType } from "@/lib/models";

export type Totals = { count: number; revenue: number; average: number };
export type TypeRow = { type: OrderType; label: string; count: number; revenue: number; share: number };
export type DayRow = { key: string; label: string; count: number; revenue: number };
export type HourRow = { hour: number; count: number; revenue: number };
export type DishRow = { name: string; quantity: number; revenue: number };
export type TableRow = { table: number; count: number; revenue: number };

const TYPE_LABEL: Record<OrderType, string> = { delivery: "Доставка", pickup: "Самовывоз", dinein: "Зал" };
const TYPES: OrderType[] = ["delivery", "pickup", "dinein"];

// Отменённые заказы в отчёты не попадают.
function live(orders: DemoOrder[]): DemoOrder[] {
  return orders.filter((order) => order.status !== "cancelled");
}

export function orderTotals(orders: DemoOrder[]): Totals {
  const items = live(orders);
  const revenue = items.reduce((sum, order) => sum + order.total, 0);
  return { count: items.length, revenue, average: items.length ? Math.round(revenue / items.length) : 0 };
}

// Изменение в процентах к прошлому периоду; null — сравнивать не с чем.
export function changePercent(current: number, previous: number): number | null {
  return previous > 0 ? Math.round((current - previous) / previous * 100) : null;
}

export function byType(orders: DemoOrder[]): TypeRow[] {
  const items = live(orders);
  return TYPES.map((type) => {
    const rows = items.filter((order) => order.fulfillment === type);
    return { type, label: TYPE_LABEL[type], count: rows.length, revenue: rows.reduce((sum, order) => sum + order.total, 0), share: items.length ? rows.length / items.length : 0 };
  });
}

export function byDay(orders: DemoOrder[], period: Period): DayRow[] {
  const index = new Map<string, DayRow>();
  periodDays(period).forEach((day) => index.set(day.key, { key: day.key, label: day.label, count: 0, revenue: 0 }));
  live(orders).forEach((order) => {
    const row = index.get(reportDayKey(new Date(order.createdAt)));
    if (!row) return;
    row.count += 1; row.revenue += order.total;
  });
  return [...index.values()];
}

export function byHour(orders: DemoOrder[]): HourRow[] {
  const rows = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0, revenue: 0 }));
  live(orders).forEach((order) => {
    const row = rows[hourOf(order.createdAt)];
    if (!row) return;
    row.count += 1; row.revenue += order.total;
  });
  return rows;
}

export function topDishes(orders: DemoOrder[], limit = 10): DishRow[] {
  const index = new Map<string, DishRow>();
  live(orders).forEach((order) => order.items.forEach((item) => {
    const quantity = Number(item.quantity) || 0;
    const row = index.get(item.productName) ?? { name: item.productName, quantity: 0, revenue: 0 };
    row.quantity += quantity;
    row.revenue += (Number(item.price) || 0) * quantity;
    index.set(item.productName, row);
  }));
  return [...index.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue).slice(0, limit);
}

export function byTable(orders: DemoOrder[]): TableRow[] {
  const rows = Array.from({ length: TABLE_COUNT }, (_, index) => ({ table: index + 1, count: 0, revenue: 0 }));
  live(orders).filter((order) => order.fulfillment === "dinein").forEach((order) => {
    const row = rows[(Number(order.tableNumber) || 0) - 1];
    if (!row) return;
    row.count += 1; row.revenue += order.total;
  });
  return rows;
}
