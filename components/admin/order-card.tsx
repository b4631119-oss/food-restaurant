"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { DemoOrder, OrderStatus } from "@/lib/demo-store";

const labels: Record<OrderStatus, string> = { new: "Новый", preparing: "Готовится", delivering: "В пути", completed: "Завершён", cancelled: "Отменён" };
type Props = { order: DemoOrder; onStatus: (status: OrderStatus) => void; onEdit: () => void; onDelete: () => void; onCancel: () => void };
function ago(value: string, now: number) { const minutes = Math.max(0, Math.floor((now - new Date(value).getTime()) / 60000)); return minutes < 1 ? "только что" : `${minutes} мин назад`; }
export function OrderCard({ order, onStatus, onEdit, onDelete, onCancel }: Props) {
  const [now, setNow] = useState(0);
  useEffect(() => { const timer = window.setTimeout(() => setNow(Date.now()), 0); const interval = window.setInterval(() => setNow(Date.now()), 60000); return () => { window.clearTimeout(timer); window.clearInterval(interval); }; }, []);
  const next: Partial<Record<OrderStatus, OrderStatus>> = { new: "preparing", preparing: order.fulfillment === "delivery" ? "delivering" : "completed", delivering: "completed" };
  const action = order.status === "new" ? "Принять" : order.status === "preparing" ? "Готово" : order.status === "delivering" ? "Завершить" : "";
  return <article className={`rounded-2xl border bg-surface p-4 ${order.status === "new" ? "border-2 border-accent" : "border-line"}`}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">Заказ №{order.number}</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${order.status === "new" ? "bg-accent/15 text-accent" : order.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : order.status === "cancelled" ? "bg-red-500/10 text-red-400" : "bg-background text-muted"}`}>{labels[order.status]}</span></div>
    <p className="mt-1 text-xs text-muted">{ago(order.createdAt, now)}</p><div className="mt-3 grid gap-1 text-sm"><b>{order.name}</b><a className="min-h-11 w-fit text-accent" href={`tel:${order.phone.replace(/\s/g, "")}`}>{order.phone}</a><span>{order.fulfillment === "delivery" ? "Доставка" : "Самовывоз"}{order.address && ` · ${order.address}`}</span></div>
    <ul className="mt-3 space-y-1 text-sm text-muted">{order.items.map((item) => <li key={item.productId}>{item.quantity} × {item.productName} · {item.price * item.quantity} сом</li>)}</ul><p className="mt-3 text-lg font-bold text-accent">Итого: {order.total} сом</p>
    <div className="mt-4 flex flex-wrap gap-2">{action && <button onClick={() => onStatus(next[order.status]!)} className="min-h-11 rounded-lg bg-accent px-4 font-bold text-background">{action}</button>}{!["completed", "cancelled"].includes(order.status) && <button onClick={onCancel} className="min-h-11 rounded-lg border border-line px-3">Отменить</button>}<button onClick={onEdit} className="grid min-h-11 grid-flow-col items-center gap-2 rounded-lg border border-line px-3"><Pencil size={16} />Изменить</button><button onClick={onDelete} aria-label="Удалить заказ" className="grid size-11 place-items-center rounded-lg border border-line text-red-400"><Trash2 size={17} /></button></div>
  </article>;
}
