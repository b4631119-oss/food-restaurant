"use client";

import Link from "next/link";
import { useOrders } from "@/hooks/use-orders";
import { ordersForDay, revenueByDay, compareWithYesterday, topDishes } from "@/lib/demo-stats";
import { OverviewAlerts } from "@/components/admin/overview-alerts";
import { OverviewStats, statCards } from "@/components/admin/overview-stats";
import { OverviewChart } from "@/components/admin/overview-chart";
import { OverviewTop } from "@/components/admin/overview-top";
import { OverviewRecent } from "@/components/admin/overview-recent";
import type { OrderStatus } from "@/lib/demo-store";

const states: { key: OrderStatus; label: string }[] = [{ key: "new", label: "Новые" }, { key: "preparing", label: "Готовится" }, { key: "delivering", label: "В пути" }, { key: "completed", label: "Готово" }];
export function AdminOverview() {
  const { orders, setOrders, loading, error } = useOrders();
  const now = new Date(); const today = ordersForDay(orders, now); const revenue = today.reduce((sum, order) => sum + order.total, 0);
  const stats = statCards({ count: today.length, revenue, average: today.length ? Math.round(revenue / today.length) : 0, waiting: orders.filter((order) => order.status === "new").length, orderChange: compareWithYesterday(orders, now, "orders").change, revenueChange: compareWithYesterday(orders, now).change, averageChange: compareWithYesterday(orders, now, "average").change });
  const accept = (id: string) => setOrders(orders.map((order) => order.id === id ? { ...order, status: "preparing" } : order));
  if (loading) return <p className="text-sm text-muted">Загрузка обзора…</p>;
  return <section><header><h1 className="text-2xl font-bold">Обзор</h1><p className="mt-1 text-sm text-muted">{now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></header>
    {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}
    <OverviewAlerts orders={orders} now={now} onAccept={accept} />
    <nav aria-label="Статусы заказов" className="mt-3 flex flex-wrap gap-2">{states.map(({ key, label }) => <Link key={key} href={`/admin/orders?status=${key}`} className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-3 text-sm font-semibold">{label} {orders.filter((order) => order.status === key).length}</Link>)}</nav>
    <OverviewStats stats={stats} />
    <div className="mt-4 grid gap-4 lg:grid-cols-2"><OverviewChart days={revenueByDay(orders, now)} /><OverviewTop items={topDishes(orders, now)} /></div>
    <div className="mt-4"><OverviewRecent orders={orders} now={now} /></div>
  </section>;
}
