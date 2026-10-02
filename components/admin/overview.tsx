"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useOrders } from "@/hooks/use-orders";
import { money } from "@/lib/format";
import type { DemoOrder } from "@/lib/demo-store";

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const isToday = (value: string, now: Date) => dayKey(new Date(value)) === dayKey(now);
function revenue(order: DemoOrder) { return order.status === "completed" ? order.total : 0; }
export function AdminOverview() {
  const { orders, loading, error } = useOrders();
  const now = new Date();
  const today = orders.filter((order) => isToday(order.createdAt, now));
  const completedToday = today.filter((order) => order.status === "completed");
  const totalRevenue = completedToday.reduce((sum, order) => sum + order.total, 0);
  const popular = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach((order) => order.items.forEach((item) => counts.set(item.productName, (counts.get(item.productName) ?? 0) + item.quantity)));
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders]);
  const chart = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now); date.setDate(now.getDate() - 6 + index);
    const amount = orders.filter((order) => dayKey(new Date(order.createdAt)) === dayKey(date)).reduce((sum, order) => sum + revenue(order), 0);
    return { date, amount };
  });
  const maximum = Math.max(1, ...chart.map((item) => item.amount));
  const recent = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const stats = [["Заказов сегодня", today.length], ["Выручка сегодня", money(totalRevenue)], ["Средний чек", money(completedToday.length ? Math.round(totalRevenue / completedToday.length) : 0)], ["Новых заказов", orders.filter((order) => order.status === "new").length]];
  if (loading) return <p className="text-sm text-muted">Загрузка обзора…</p>;
  return <section><div className="flex items-end justify-between gap-3"><div><h1 className="text-2xl font-bold">Обзор</h1><p className="mt-1 text-sm text-muted">Сегодня · {now.toLocaleDateString("ru-RU")}</p></div><span className="text-xs text-muted">Демо-данные</span></div>
    {error && <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-line bg-surface p-4"><p className="text-xs text-muted">{label}</p><p className="mt-2 text-lg font-bold text-accent">{value}</p></article>)}</div>
    <div className="mt-5 grid gap-4 lg:grid-cols-2"><section className="rounded-2xl border border-line bg-surface p-4"><h2 className="font-bold">Выручка за 7 дней</h2><div className="mt-4 flex h-40 items-end gap-2">{chart.map((day) => <div key={dayKey(day.date)} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] text-muted">{day.amount ? money(day.amount) : "0"}</span><div className="w-full rounded-t-md bg-accent" style={{ height: `${Math.max(4, day.amount / maximum * 100)}%` }} /><span className="text-[10px] text-muted">{day.date.toLocaleDateString("ru-RU", { weekday: "short" })}</span></div>)}</div></section>
      <section className="rounded-2xl border border-line bg-surface p-4"><h2 className="font-bold">Популярные блюда</h2>{popular.length ? <ol className="mt-3 space-y-2">{popular.map(([name, quantity], index) => <li key={name} className="flex min-h-11 items-center justify-between gap-3 text-sm"><span><b className="mr-2 text-accent">{index + 1}.</b>{name}</span><span className="text-muted">{quantity} шт.</span></li>)}</ol> : <p className="mt-3 text-sm text-muted">Пока нет заказов.</p>}</section></div>
    <section className="mt-5 rounded-2xl border border-line bg-surface p-4"><div className="flex items-center justify-between"><h2 className="font-bold">Последние заказы</h2><Link href="/admin/orders" className="grid min-h-11 place-items-center text-sm font-semibold text-accent">Все заказы →</Link></div>{recent.length ? <ul className="divide-y divide-line">{recent.map((order) => <li key={order.id} className="flex min-h-12 items-center justify-between gap-3 py-2 text-sm"><span>№{order.number} · {order.name}</span><span className="shrink-0 text-accent">{money(order.total)}</span></li>)}</ul> : <p className="py-4 text-sm text-muted">Пока заказов нет.</p>}</section>
  </section>;
}
