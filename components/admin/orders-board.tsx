"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { OrderCard } from "@/components/admin/order-card";
import { OrderDetails } from "@/components/admin/order-details";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import type { DemoOrder, OrderStatus } from "@/lib/models";

type Props = { orders: DemoOrder[]; flashingIds: string[]; onStatus: (id: string, status: OrderStatus) => void; onEdit: (order: DemoOrder) => void; onCancel: (order: DemoOrder) => void; onDelete: (order: DemoOrder) => void };
type Lane = { key: "new" | "preparing" | "delivering" | "served" | "completed" | "cancelled"; label: string; chip: string };
const ALL_LANES: Lane[] = [{ key: "new", label: "Новые", chip: "Новые" }, { key: "preparing", label: "Готовится", chip: "Готовится" }, { key: "delivering", label: "В пути", chip: "В пути" }, { key: "served", label: "Подано", chip: "Подано" }, { key: "completed", label: "Завершённые", chip: "Готово" }, { key: "cancelled", label: "Отменённые", chip: "Отменённые" }];
const OLDEST_FIRST: Lane["key"][] = ["new", "preparing"];
const CLOSED_LANES: Lane["key"][] = ["completed", "cancelled"];
export function OrdersBoard({ orders, flashingIds, onStatus, onEdit, onCancel, onDelete }: Props) {
  const [selected, setSelected] = useState<DemoOrder | null>(null); const [mobileLane, setMobileLane] = useState<Lane["key"]>("new"); const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<DemoOrder | null>(null);
  const count = (key: Lane["key"]) => orders.filter((order) => order.status === key).length;
  const filtered = useMemo(() => orders.filter((order) => `${order.number} ${order.name} ${order.phone}`.toLocaleLowerCase("ru").includes(query.toLocaleLowerCase("ru"))).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [orders, query]);
  useEffect(() => { const amount = orders.filter((order) => order.status === "new").length; document.title = `${amount ? `(${amount}) ` : ""}Заказы · Sushi Bar №1`; return () => { document.title = "Админка | Sushi Bar №1"; }; }, [orders]);
  const lane = (key: Lane["key"]) => filtered.filter((order) => order.status === key).sort((a, b) => OLDEST_FIRST.includes(key) ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt));
  const desktop = ALL_LANES.filter((item) => !CLOSED_LANES.includes(item.key) || count(item.key) > 0);
  const openEdit = (order: DemoOrder) => { setSelected(null); onEdit(order); };
  const remove = (order: DemoOrder) => { setSelected(order); setPendingDelete(order); };
  const renderCard = (order: DemoOrder) => <OrderCard key={order.id} order={order} flashing={flashingIds.includes(order.id)} onOpen={() => setSelected(order)} onStatus={(value) => onStatus(order.id, value)} />;
  return <div className="mt-5"><div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 lg:hidden">{ALL_LANES.map((item) => <button key={item.key} onClick={() => setMobileLane(item.key)} className={`press min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold ${mobileLane === item.key ? "bg-accent text-background" : "border border-line text-muted"}`}>{item.chip} {count(item.key)}</button>)}</div>
    <label className="relative mt-3 block lg:max-w-xs"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по заказам" className="h-11 w-full rounded-lg border border-line bg-surface pl-10 pr-3 text-sm outline-none focus:border-accent" /></label>
    <div className="mt-4 hidden gap-3 lg:grid" style={{ gridTemplateColumns: `repeat(${desktop.length}, minmax(0, 1fr))` }}>{desktop.map((item) => { const items = lane(item.key).slice(0, item.key === "completed" ? 10 : undefined); return <section key={item.key} className="min-h-0"><h2 className={`mb-2 flex items-center justify-between px-1 font-bold ${item.key === "new" ? "text-accent" : "text-text"}`}><span>{item.label}</span><span className="text-sm text-muted">{count(item.key)}</span></h2><div className="max-h-[calc(100dvh-220px)] min-h-64 space-y-2 overflow-y-auto pr-1">{items.length ? items.map((order) => renderCard(order)) : <p className="px-2 py-6 text-center text-sm text-muted">Нет заказов</p>}</div></section>; })}</div>
    <div className="mt-4 grid gap-2 lg:hidden">{lane(mobileLane).map((order) => renderCard(order))}{!lane(mobileLane).length && <p className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">Нет заказов</p>}</div>
    {selected && <OrderDetails order={orders.find((order) => order.id === selected.id) ?? selected} onClose={() => setSelected(null)} onStatus={(value) => onStatus(selected.id, value)} onEdit={() => openEdit(selected)} onCancel={() => onCancel(selected)} onDelete={() => remove(selected)} />}
    <ConfirmDialog open={Boolean(pendingDelete)} title="Удалить заказ?" message={`Удалить заказ №${pendingDelete?.number ?? ""}?`} onCancel={() => setPendingDelete(null)} onConfirm={() => { if (pendingDelete) onDelete(pendingDelete); setPendingDelete(null); setSelected(null); }} />
  </div>;
}
