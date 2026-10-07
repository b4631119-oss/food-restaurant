"use client";

import { useEffect, useState } from "react";
import { OrderCard } from "@/components/admin/order-card";
import { OrderDetails } from "@/components/admin/order-details";
import { OrdersBoard } from "@/components/admin/orders-board";
import { OrderForm } from "@/components/admin/order-form";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminToast } from "@/components/admin/toast";
import { useOrders } from "@/hooks/use-orders";
import { useDemoSettings } from "@/hooks/use-demo-settings";
import { createOrder, deleteOrder, restoreOrder, updateOrder } from "@/lib/repo/orders-repo";
import { getProducts } from "@/lib/repo/products-repo";
import type { DemoOrder, OrderStatus, OrderType } from "@/lib/models";

const TYPE_FILTERS = [["all", "Все"], ["delivery", "Доставка"], ["pickup", "Самовывоз"], ["dinein", "Со стола"]] as const;
const STATUS_FILTERS = [["new", "Новые"], ["preparing", "Готовится"], ["delivering", "В пути"], ["served", "Подано"], ["completed", "Готово"], ["cancelled", "Отменённые"]] as const;
export default function OrdersPage() {
  const { orders, loading, error, flashingIds } = useOrders();
  const { settings } = useDemoSettings();
  const showDinein = settings.acceptingDinein || orders.some((order) => order.fulfillment === "dinein");
  const typeOptions = TYPE_FILTERS.filter(([key]) => showDinein || key !== "dinein");
  const statusOptions = STATUS_FILTERS.filter(([key]) => showDinein || key !== "served");
  function clearStatusFilter() { setStatusFilter(null); window.history.replaceState(null, "", "/admin/orders"); }
  const [editing, setEditing] = useState<DemoOrder | null | false>(false); const [deleting, setDeleting] = useState<string | null>(null); const [deleteCompleted, setDeleteCompleted] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null); const [typeFilter, setTypeFilter] = useState<"all" | OrderType>("all"); const [focusId, setFocusId] = useState("");
  const [selected, setSelected] = useState<DemoOrder | null>(null); const [removed, setRemoved] = useState<DemoOrder[]>([]); const [toast, setToast] = useState(""); const [products, setProducts] = useState<Awaited<ReturnType<typeof getProducts>>>([]);
  const shown = typeFilter === "all" ? orders : orders.filter((order) => order.fulfillment === typeFilter);
  useEffect(() => { void getProducts().then(setProducts).catch(() => undefined); }, []);
  useEffect(() => { if (editing === false) return; const key = (event: KeyboardEvent) => { if (event.key === "Escape") setEditing(false); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [editing]);
  useEffect(() => { const refresh = () => { const params = new URLSearchParams(window.location.search); const value = params.get("status"); setStatusFilter(["new", "preparing", "delivering", "served", "completed", "cancelled"].includes(value ?? "") ? value as OrderStatus : null); setFocusId(params.get("order") ?? ""); }; refresh(); window.addEventListener("popstate", refresh); return () => window.removeEventListener("popstate", refresh); }, []);
  useEffect(() => { if (!focusId) return; const found = orders.find((order) => order.id === focusId); if (!found) return; const timer = window.setTimeout(() => { setSelected(found); setFocusId(""); }, 0); return () => window.clearTimeout(timer); }, [focusId, orders]);
  async function save(order: DemoOrder) { try { if (editing) await updateOrder(order.id, order); else await createOrder({ ...order, createdAt: new Date().toISOString() }); setEditing(false); } catch { setToast("Не удалось сохранить заказ."); } }
  async function status(id: string, value: OrderStatus) { try { await updateOrder(id, { status: value }); } catch { setToast("Не удалось обновить статус заказа."); } }
  async function removeOrders() { const targets = deleteCompleted ? orders.filter((order) => order.status === "completed") : orders.filter((order) => order.id === deleting); try { await Promise.all(targets.map((order) => deleteOrder(order.id))); setRemoved(targets); setToast(targets.length === 1 ? "Заказ удалён" : `Удалено заказов: ${targets.length}`); } catch { setToast("Не удалось удалить заказ."); } setDeleting(null); setDeleteCompleted(false); }
  async function undoDelete() { try { await Promise.all(removed.map(restoreOrder)); setToast(""); setRemoved([]); } catch { setToast("Не удалось восстановить заказы."); } }
  return <section><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Заказы</h1><p className="mt-1 text-sm text-muted">Всего: {shown.length}</p></div><div className="flex flex-wrap items-center gap-2">{statusFilter === "completed" && orders.some((order) => order.status === "completed") && <button onClick={() => setDeleteCompleted(true)} className="min-h-11 px-2 text-sm text-red-400">Удалить завершённые</button>}<button onClick={() => setEditing(null)} className="min-h-11 rounded-lg bg-accent px-4 font-bold text-background">+ Новый заказ</button></div></header>
    <div className="mt-4 flex h-12 rounded-xl border border-line bg-surface p-1">{typeOptions.map(([key, label]) => <button key={key} onClick={() => setTypeFilter(key)} aria-pressed={typeFilter === key} className={`press flex min-h-10 flex-1 items-center justify-center rounded-lg px-2 text-sm font-semibold ${typeFilter === key ? "bg-accent text-background" : "text-muted hover:text-text"}`}>{label}</button>)}</div>
    <nav aria-label="Статус заказа" className="no-scrollbar -mx-1 mt-2 flex gap-2 overflow-x-auto px-1">{statusOptions.map(([key, label]) => { const amount = shown.filter((order) => order.status === key).length; return <button key={key} onClick={() => setStatusFilter(statusFilter === key ? null : key)} aria-pressed={statusFilter === key} className={`press flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold ${statusFilter === key ? "bg-accent text-background" : "border border-line text-muted"}`}>{label}<span>{amount}</span></button>; })}</nav>
    {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}{loading ? <p className="mt-6 text-muted">Загрузка…</p> : statusFilter ? <section className="mt-5"><button type="button" onClick={clearStatusFilter} className="press mb-3 inline-flex min-h-11 items-center text-sm text-accent">← Все заказы</button><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{shown.filter((order) => order.status === statusFilter).map((order) => <OrderCard key={order.id} order={order} flashing={flashingIds.includes(order.id)} onOpen={() => setSelected(order)} onStatus={(value) => status(order.id, value)} />)}</div>{!shown.some((order) => order.status === statusFilter) && <p className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">Нет заказов</p>}</section> : <OrdersBoard orders={shown} flashingIds={flashingIds} onStatus={status} onEdit={setEditing} onCancel={(order) => status(order.id, "cancelled")} onDelete={(order) => setDeleting(order.id)} />}
    {selected && <OrderDetails order={shown.find((order) => order.id === selected.id) ?? selected} onClose={() => setSelected(null)} onStatus={(value) => status(selected.id, value)} onEdit={() => { setSelected(null); setEditing(selected); }} onCancel={() => status(selected.id, "cancelled")} onDelete={() => setDeleting(selected.id)} />}
    {editing !== false && <div className="fixed inset-0 z-50 overflow-auto bg-background/95 p-4 sm:grid sm:place-items-center sm:bg-black/70"><div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-4 sm:p-6"><h2 className="mb-4 text-xl font-bold">{editing ? "Изменить заказ" : "Новый заказ"}</h2><OrderForm products={products} order={editing || undefined} onSave={save} onCancel={() => setEditing(false)} /></div></div>}
    <ConfirmDialog open={Boolean(deleting) || deleteCompleted} title={deleteCompleted ? "Удалить завершённые заказы?" : "Удалить заказ?"} message={deleteCompleted ? "Все завершённые заказы будут удалены." : "Заказ будет удалён."} onCancel={() => { setDeleting(null); setDeleteCompleted(false); }} onConfirm={removeOrders} />{toast && <AdminToast message={toast} actionLabel={removed.length ? "Отменить" : undefined} onAction={undoDelete} onDismiss={() => { setRemoved([]); setToast(""); }} />}
  </section>;
}
