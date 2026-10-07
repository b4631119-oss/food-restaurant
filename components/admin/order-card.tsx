"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { Bike, Phone, Store, Utensils } from "lucide-react";
import { money, plural } from "@/lib/format";
import { MainOrderAction, mainActionLabel, nextOrderStatus, StatusBadge } from "@/components/admin/order-actions";
import { OrderMapButtons } from "@/components/admin/order-map-buttons";
import type { DemoOrder, OrderStatus } from "@/lib/models";

type Props = { order: DemoOrder; flashing?: boolean; onOpen: () => void; onStatus: (status: OrderStatus) => void };
function elapsed(created: string, now: number) { const minutes = Math.max(0, Math.floor((now - new Date(created).getTime()) / 60000)); return { minutes, text: minutes >= 60 ? `${Math.floor(minutes / 60)} ч` : `${minutes} мин` }; }
export function OrderCard({ order, flashing = false, onOpen, onStatus }: Props) {
  const [now, setNow] = useState(0);
  useEffect(() => { const start = window.setTimeout(() => setNow(Date.now()), 0); const timer = window.setInterval(() => setNow(Date.now()), 60000); return () => { window.clearTimeout(start); window.clearInterval(timer); }; }, []);
  const age = elapsed(order.createdAt, now); const urgent = ["new", "preparing"].includes(order.status);
  const color = urgent && age.minutes > 30 ? "text-[#F87171]" : urgent && age.minutes >= 10 ? "text-amber-400" : "text-muted";
  const action = mainActionLabel(order); const next = nextOrderStatus(order);
  const keyOpen = (event: KeyboardEvent<HTMLElement>) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(); } };
  const items = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return <article role="button" tabIndex={0} onClick={onOpen} onKeyDown={keyOpen} className={`cursor-pointer rounded-xl border bg-surface p-3.5 outline-none focus-visible:ring-2 focus-visible:ring-accent ${order.status === "new" ? "border-2 border-accent shadow-[0_0_18px_rgba(212,175,55,0.12)]" : order.status === "completed" ? "border-line bg-background text-muted" : "border-line"} ${flashing ? "animate-[pulse_2s_ease-in-out_1]" : ""}`}>
    <div className="flex items-center gap-2"><b className="text-base">№{order.number}</b><span className={`ml-auto text-sm font-medium ${color}`}>{age.text}</span>{order.fulfillment === "delivery" ? <Bike size={18} className="text-muted" /> : order.fulfillment === "dinein" ? <Utensils size={18} className="text-muted" /> : <Store size={18} className="text-muted" />}{order.fulfillment === "dinein" && <span className="inline-flex min-h-7 items-center rounded-full border border-accent px-2.5 text-xs font-bold text-accent">Стол №{order.tableNumber}</span>}<StatusBadge status={order.status} /></div>
    <div className="mt-2 flex items-center gap-2"><b className="min-w-0 flex-1 truncate">{order.name}</b>{order.phone && <a href={`tel:${order.phone.replace(/\s/g, "")}`} onClick={(event) => event.stopPropagation()} aria-label={`Позвонить: ${order.name}`} className="grid size-11 shrink-0 place-items-center rounded-lg border border-line text-accent"><Phone size={18} /></a>}</div>
    <p className="truncate text-sm text-muted">{order.fulfillment === "delivery" ? order.address || "Адрес не указан" : order.fulfillment === "dinein" ? "Заказ со стола" : "Самовывоз"}</p>
    {order.fulfillment === "delivery" && <div className="mt-2" onClick={(event) => event.stopPropagation()}><OrderMapButtons order={order} /></div>}
    <div className="mt-2 flex items-end justify-between gap-2"><p className="line-clamp-2 text-sm text-muted">{items} {plural(items, "блюдо", "блюда", "блюд")} · {order.items.map((item) => `${item.productName} ×${item.quantity}`).join(", ")}</p><b className="shrink-0 text-right text-sm text-accent">{order.fulfillment === "delivery" && order.deliveryFee !== undefined ? `Блюда ${money(order.total)} + доставка ${money(order.deliveryFee)} = ${money(order.total + order.deliveryFee)}` : money(order.total)}</b></div>
    {action && next && <div className="mt-3" onClick={(event) => event.stopPropagation()}><MainOrderAction order={order} onAdvance={() => onStatus(next)} /></div>}
    <div className="mt-1 flex justify-end"><span className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-muted">Подробнее →</span></div>
  </article>;
}
