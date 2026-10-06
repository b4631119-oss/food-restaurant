"use client";

import { useEffect, useState } from "react";
import { Bike, MapPin, Phone, Store, Utensils, X } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { MainOrderAction, StatusBadge, nextOrderStatus } from "@/components/admin/order-actions";
import { OrderMapButtons } from "@/components/admin/order-map-buttons";
import { money } from "@/lib/format";
import type { DemoOrder, OrderStatus } from "@/lib/models";

type Props = { order: DemoOrder; onClose: () => void; onStatus: (status: OrderStatus) => void; onEdit: () => void; onCancel: () => void; onDelete: () => void };
export function OrderDetails({ order, onClose, onStatus, onEdit, onCancel, onDelete }: Props) {
  const [confirm, setConfirm] = useState<"cancel" | "delete" | null>(null);
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === "Escape" && !confirm) onClose(); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [confirm, onClose]);
  const next = nextOrderStatus(order);
  return <div className="fixed inset-0 z-[70] flex justify-end bg-black/60" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside role="dialog" aria-modal="true" aria-labelledby="order-detail-title" className="flex h-dvh w-full flex-col border-l border-line bg-surface shadow-2xl sm:max-w-[440px]">
      <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-line px-5"><div><h2 id="order-detail-title" className="text-xl font-bold">Заказ №{order.number}</h2><p className="mt-1 text-sm text-muted">{new Date(order.createdAt).toLocaleString("ru-RU")}</p></div><button onClick={onClose} aria-label="Закрыть" className="grid size-11 place-items-center rounded-lg border border-line"><X size={20} /></button></header>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={order.status} />{order.fulfillment === "dinein" && <span className="inline-flex min-h-7 items-center rounded-full border border-accent px-2.5 text-xs font-bold text-accent">Стол №{order.tableNumber}</span>}</div><section><h3 className="font-bold">{order.name}</h3>{order.phone && <a href={`tel:${order.phone.replace(/\s/g, "")}`} className="mt-2 inline-flex min-h-11 items-center gap-2 text-accent"><Phone size={18} />{order.phone}</a>}</section>
        <section className="space-y-2 text-sm"><p className="flex items-start gap-2">{order.fulfillment === "delivery" ? <Bike size={18} /> : order.fulfillment === "dinein" ? <Utensils size={18} /> : <Store size={18} />}{order.fulfillment === "delivery" ? "Доставка" : order.fulfillment === "dinein" ? `Заказ со стола №${order.tableNumber}` : "Самовывоз"}</p>{order.fulfillment === "delivery" && <p className="flex items-start gap-2 text-muted"><MapPin size={18} />{order.address || "Адрес не указан"}</p>}{order.fulfillment === "delivery" && <OrderMapButtons order={order} />}{order.comment && <p className="rounded-lg bg-background p-3 text-muted">{order.comment}</p>}</section>
        <section><h3 className="mb-2 font-bold">Блюда</h3><ul className="space-y-3">{order.items.map((item) => <li key={item.productId} className="flex justify-between gap-3 text-sm"><span>{item.productName} × {item.quantity}</span><span className="shrink-0 text-muted">{money(item.price * item.quantity)}</span></li>)}</ul></section>
        <div className="space-y-2 border-t border-line pt-3 text-sm"><div className="flex justify-between"><span className="text-muted">Блюда</span><span>{money(order.total)}</span></div><div className="flex justify-between text-lg font-bold"><span>Итого</span><span className="text-accent">{money(order.total)}</span></div></div>
      </div>
      <footer className="shrink-0 space-y-2 border-t border-line p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]">{next && <MainOrderAction order={order} onAdvance={() => onStatus(next)} />}<div className="grid grid-cols-2 gap-2"><button onClick={onEdit} className="min-h-11 rounded-lg border border-line font-semibold">Изменить</button>{!["completed", "cancelled"].includes(order.status) && <button onClick={() => setConfirm("cancel")} className="min-h-11 rounded-lg border border-line font-semibold">Отменить заказ</button>}</div><button onClick={() => setConfirm("delete")} className="min-h-11 w-full rounded-lg border border-red-500/40 text-sm font-semibold text-red-400">Удалить</button></footer>
    </aside>
    <ConfirmDialog open={confirm !== null} title={confirm === "delete" ? "Удалить заказ?" : "Отменить заказ?"} message={confirm === "delete" ? "Заказ будет удалён." : "Заказ получит статус «Отменён»."} onCancel={() => setConfirm(null)} onConfirm={() => { if (confirm === "delete") onDelete(); else onCancel(); setConfirm(null); onClose(); }} />
  </div>;
}
