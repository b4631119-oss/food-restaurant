"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OrderCard } from "@/components/admin/order-card";
import { OrderDetails } from "@/components/admin/order-details";
import { OrdersBoard } from "@/components/admin/orders-board";
import { OrderForm } from "@/components/admin/order-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminToast } from "@/components/admin/toast";
import { useOrders } from "@/hooks/use-orders";
import { createOrder, deleteOrder, restoreOrder, updateOrder } from "@/lib/repo/orders-repo";
import { getProducts } from "@/lib/repo/products-repo";
import type { DemoOrder, OrderStatus } from "@/lib/models";

export default function OrdersPage() {
  const { orders, loading, error, flashingIds } = useOrders();
  const [editing, setEditing] = useState<DemoOrder | null | false>(false); const [deleting, setDeleting] = useState<string | null>(null); const [deleteCompleted, setDeleteCompleted] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null); const [selected, setSelected] = useState<DemoOrder | null>(null); const [removed, setRemoved] = useState<DemoOrder[]>([]); const [toast, setToast] = useState(""); const [products, setProducts] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
  useEffect(() => { void getProducts().then(setProducts).catch(() => undefined); }, []);
  useEffect(() => { if (editing === false) return; const key = (event: KeyboardEvent) => { if (event.key === "Escape") setEditing(false); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [editing]);
  useEffect(() => { const refresh = () => { const value = new URLSearchParams(window.location.search).get("status"); setStatusFilter(["new", "preparing", "delivering", "completed", "cancelled"].includes(value ?? "") ? value as OrderStatus : null); }; refresh(); window.addEventListener("popstate", refresh); return () => window.removeEventListener("popstate", refresh); }, []);
  async function save(order: DemoOrder) { try { if (editing) await updateOrder(order.id, order); else await createOrder({ ...order, createdAt: new Date().toISOString() }); setEditing(false); } catch { setToast("Не удалось сохранить заказ."); } }
  async function status(id: string, value: OrderStatus) { try { await updateOrder(id, { status: value }); } catch { setToast("Не удалось обновить статус заказа."); } }
  async function testOrder() { const sample = orders[0]; if (sample) try { await createOrder({ ...sample, createdAt: new Date().toISOString(), status: "new" }); } catch { setToast("Не удалось создать тестовый заказ."); } }
  async function removeOrders() { const targets = deleteCompleted ? orders.filter((order) => order.status === "completed") : orders.filter((order) => order.id === deleting); try { await Promise.all(targets.map((order) => deleteOrder(order.id))); setRemoved(targets); setToast(targets.length === 1 ? "Заказ удалён" : `Удалено заказов: ${targets.length}`); } catch { setToast("Не удалось удалить заказ."); } setDeleting(null); setDeleteCompleted(false); }
  async function undoDelete() { try { await Promise.all(removed.map(restoreOrder)); setToast(""); setRemoved([]); } catch { setToast("Не удалось восстановить заказы."); } }
  return <section><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Заказы</h1><p className="mt-1 text-sm text-muted">Всего: {orders.length}</p></div><div className="flex flex-wrap items-center gap-2">{statusFilter === "completed" && orders.some((order) => order.status === "completed") && <button onClick={() => setDeleteCompleted(true)} className="min-h-11 px-2 text-sm text-red-400">Удалить завершённые</button>}<button onClick={testOrder} className="min-h-11 px-2 text-sm font-semibold text-muted">Тестовый заказ</button><button onClick={() => setEditing(null)} className="min-h-11 rounded-lg bg-accent px-4 font-bold text-background">+ Новый заказ</button></div></header>
    {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}{loading ? <p className="mt-6 text-muted">Загрузка…</p> : statusFilter ? <section className="mt-5"><Link href="/admin/orders" className="mb-3 inline-flex min-h-11 items-center text-sm text-accent">← Все заказы</Link><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{orders.filter((order) => order.status === statusFilter).map((order) => <OrderCard key={order.id} order={order} flashing={flashingIds.includes(order.id)} onOpen={() => setSelected(order)} onStatus={(value) => status(order.id, value)} />)}</div>{!orders.some((order) => order.status === statusFilter) && <p className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">Нет заказов</p>}{selected && <OrderDetails order={orders.find((order) => order.id === selected.id) ?? selected} onClose={() => setSelected(null)} onStatus={(value) => status(selected.id, value)} onEdit={() => { setSelected(null); setEditing(selected); }} onCancel={() => status(selected.id, "cancelled")} onDelete={() => setDeleting(selected.id)} />}</section> : <OrdersBoard orders={orders} flashingIds={flashingIds} onStatus={status} onEdit={setEditing} onCancel={(order) => status(order.id, "cancelled")} onDelete={(order) => setDeleting(order.id)} />}
    {editing !== false && <div className="fixed inset-0 z-50 overflow-auto bg-background/95 p-4 sm:grid sm:place-items-center sm:bg-black/70"><div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-4 sm:p-6"><h2 className="mb-4 text-xl font-bold">{editing ? "Изменить заказ" : "Новый заказ"}</h2><OrderForm products={products} order={editing || undefined} onSave={save} onCancel={() => setEditing(false)} /></div></div>}
    <ConfirmDialog open={Boolean(deleting) || deleteCompleted} title={deleteCompleted ? "Удалить завершённые заказы?" : "Удалить заказ?"} message={deleteCompleted ? "Все завершённые заказы будут удалены." : "Заказ будет удалён."} onCancel={() => { setDeleting(null); setDeleteCompleted(false); }} onConfirm={removeOrders} />{toast && <AdminToast message={toast} actionLabel={removed.length ? "Отменить" : undefined} onAction={undoDelete} onDismiss={() => { setRemoved([]); setToast(""); }} />}
  </section>;
}
