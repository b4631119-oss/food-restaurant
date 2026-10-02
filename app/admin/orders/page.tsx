"use client";

import { useMemo, useState } from "react";
import { useOrders } from "@/hooks/use-orders";
import { OrderCard } from "@/components/admin/order-card";
import { OrderForm } from "@/components/admin/order-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import type { DemoOrder, OrderStatus } from "@/lib/demo-store";

const filters = ["Все", "Новые", "В работе", "Завершённые"] as const;
export default function OrdersPage() {
  const { orders, setOrders, loading, error } = useOrders();
  const [filter, setFilter] = useState<(typeof filters)[number]>("Все"); const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<DemoOrder | null | false>(false); const [deleting, setDeleting] = useState<string | null>(null);
  const matches = useMemo(() => orders.filter((order) => {
    const statusMatch = filter === "Все" || (filter === "Новые" && order.status === "new") || (filter === "В работе" && ["preparing", "delivering"].includes(order.status)) || (filter === "Завершённые" && ["completed", "cancelled"].includes(order.status));
    const text = `${order.number} ${order.name} ${order.phone}`.toLocaleLowerCase("ru");
    return statusMatch && text.includes(query.toLocaleLowerCase("ru"));
  }).sort((a, b) => Number(b.status === "new") - Number(a.status === "new") || b.createdAt.localeCompare(a.createdAt)), [orders, filter, query]);
  function save(order: DemoOrder) { const exists = orders.some((item) => item.id === order.id); setOrders(exists ? orders.map((item) => item.id === order.id ? order : item) : [{ ...order, number: Math.max(1000, ...orders.map((item) => item.number)) + 1 }, ...orders]); setEditing(false); }
  function status(id: string, value: OrderStatus) { setOrders(orders.map((order) => order.id === id ? { ...order, status: value } : order)); }
  function testOrder() { const sample = orders[0]; if (sample) setOrders([{ ...sample, id: crypto.randomUUID(), number: Math.max(...orders.map((o) => o.number)) + 1, createdAt: new Date().toISOString(), status: "new" }, ...orders]); }
  return <section><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Заказы</h1><p className="mt-1 text-sm text-muted">Всего: {orders.length}</p></div><div className="flex gap-2"><button onClick={testOrder} className="min-h-11 rounded-lg border border-line px-3 text-sm">Тестовый заказ</button><button onClick={() => setEditing(null)} className="min-h-11 rounded-lg bg-accent px-4 font-bold text-background">+ Новый заказ</button></div></div>
    <div className="mt-4 flex gap-2 overflow-x-auto">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`min-h-11 shrink-0 rounded-lg px-4 text-sm ${filter === item ? "bg-accent text-background" : "border border-line text-muted"}`}>{item}</button>)}</div>
    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по номеру, имени, телефону" className="mt-3 h-[52px] w-full rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent" />
    {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}{loading ? <p className="mt-6 text-muted">Загрузка…</p> : matches.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{matches.map((order) => <OrderCard key={order.id} order={order} onStatus={(value) => status(order.id, value)} onEdit={() => setEditing(order)} onDelete={() => setDeleting(order.id)} onCancel={() => status(order.id, "cancelled")} />)}</div> : <p className="mt-8 rounded-xl border border-line bg-surface p-6 text-center text-muted">Заказов нет</p>}
    {editing !== false && <div className="fixed inset-0 z-50 overflow-auto bg-background/95 p-4 sm:grid sm:place-items-center sm:bg-black/70"><div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-4 sm:p-6"><h2 className="mb-4 text-xl font-bold">{editing ? "Изменить заказ" : "Новый заказ"}</h2><OrderForm order={editing || undefined} onSave={save} onCancel={() => setEditing(false)} /></div></div>}
    <ConfirmDialog open={Boolean(deleting)} title="Удалить заказ?" message="Заказ будет удалён из демо-данных." onCancel={() => setDeleting(null)} onConfirm={() => { setOrders(orders.filter((order) => order.id !== deleting)); setDeleting(null); }} />
  </section>;
}
