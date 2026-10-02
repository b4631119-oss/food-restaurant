"use client";

import { useEffect, useState } from "react";
import { OrdersBoard } from "@/components/admin/orders-board";
import { OrderForm } from "@/components/admin/order-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminToast } from "@/components/admin/toast";
import { useOrders } from "@/hooks/use-orders";
import type { DemoOrder, OrderStatus } from "@/lib/demo-store";

export default function OrdersPage() {
  const { orders, setOrders, loading, error, flashingIds } = useOrders();
  const [editing, setEditing] = useState<DemoOrder | null | false>(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteCompleted, setDeleteCompleted] = useState(false);
  const [removed, setRemoved] = useState<DemoOrder[]>([]);
  const [toast, setToast] = useState("");
  useEffect(() => { if (editing === false) return; const key = (event: KeyboardEvent) => { if (event.key === "Escape") setEditing(false); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [editing]);
  function save(order: DemoOrder) { const exists = orders.some((item) => item.id === order.id); setOrders(exists ? orders.map((item) => item.id === order.id ? order : item) : [{ ...order, number: Math.max(1000, ...orders.map((item) => item.number)) + 1 }, ...orders]); setEditing(false); }
  function status(id: string, value: OrderStatus) { setOrders(orders.map((order) => order.id === id ? { ...order, status: value } : order)); }
  function testOrder() { const sample = orders[0]; if (sample) setOrders([{ ...sample, id: crypto.randomUUID(), number: Math.max(...orders.map((item) => item.number)) + 1, createdAt: new Date().toISOString(), status: "new" }, ...orders]); }
  function removeOrders() { const targets = deleteCompleted ? orders.filter((order) => order.status === "completed") : orders.filter((order) => order.id === deleting); if (!targets.length) return; setOrders(orders.filter((order) => !targets.some((item) => item.id === order.id))); setRemoved(targets); setToast(targets.length === 1 ? "Заказ удалён" : `Удалено заказов: ${targets.length}`); setDeleting(null); setDeleteCompleted(false); }
  return <section><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Заказы</h1><p className="mt-1 text-sm text-muted">Всего: {orders.length}</p></div><div className="flex flex-wrap gap-2"><button onClick={testOrder} className="min-h-11 rounded-lg border border-line px-3 text-sm">Тестовый заказ</button>{orders.some((order) => order.status === "completed") && <button onClick={() => setDeleteCompleted(true)} className="min-h-11 rounded-lg border border-line px-3 text-sm text-red-400">Удалить все завершённые</button>}<button onClick={() => setEditing(null)} className="min-h-11 rounded-lg bg-accent px-4 font-bold text-background">+ Новый заказ</button></div></header>
    {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}{loading ? <p className="mt-6 text-muted">Загрузка…</p> : <OrdersBoard orders={orders} flashingIds={flashingIds} onStatus={status} onEdit={setEditing} onCancel={(order) => status(order.id, "cancelled")} onDelete={(order) => setDeleting(order.id)} />}
    {editing !== false && <div className="fixed inset-0 z-50 overflow-auto bg-background/95 p-4 sm:grid sm:place-items-center sm:bg-black/70"><div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-4 sm:p-6"><h2 className="mb-4 text-xl font-bold">{editing ? "Изменить заказ" : "Новый заказ"}</h2><OrderForm order={editing || undefined} onSave={save} onCancel={() => setEditing(false)} /></div></div>}
    <ConfirmDialog open={Boolean(deleting) || deleteCompleted} title={deleteCompleted ? "Удалить завершённые заказы?" : "Удалить заказ?"} message={deleteCompleted ? "Все завершённые заказы будут удалены." : "Заказ будет удалён из демо-данных."} onCancel={() => { setDeleting(null); setDeleteCompleted(false); }} onConfirm={removeOrders} />
    {toast && <AdminToast message={toast} actionLabel="Отменить" onAction={() => { setOrders([...removed, ...orders]); setRemoved([]); setToast(""); }} onDismiss={() => { setRemoved([]); setToast(""); }} />}
  </section>;
}
