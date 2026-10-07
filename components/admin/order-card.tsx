"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { Bike, Phone, Store, Utensils } from "lucide-react";
import { money, plural } from "@/lib/format";
import { MainOrderAction, mainActionLabel, nextOrderStatus, StatusBadge } from "@/components/admin/order-actions";
import type { DemoOrder, OrderStatus } from "@/lib/models";

type Props = { order: DemoOrder; flashing?: boolean; onOpen: () => void; onStatus: (status: OrderStatus) => void };
function elapsed(created: string, now: number) { const minutes = Math.max(0, Math.floor((now - new Date(created).getTime()) / 60000)); return { minutes, text: minutes >= 60 ? `${Math.floor(minutes / 60)} ч` : `${minutes} мин` }; }
function ageColor(order: DemoOrder, minutes: number) {
  if (!["new", "preparing", "delivering"].includes(order.status)) return "text-muted";
  const amber = order.status === "delivering" ? 30 : 10; const red = order.status === "delivering" ? 90 : 30;
  return minutes > red ? "text-[#F87171]" : minutes >= amber ? "text-amber-400" : "text-muted";
}
function placeText(order: DemoOrder) {
  if (order.fulfillment === "delivery") return order.address || "Адрес не указан";
  return order.fulfillment === "dinein" ? `Стол №${order.tableNumber}` : "Самовывоз";
}
export function OrderCard({ order, flashing = false, onOpen, onStatus }: Props) {
  const [now, setNow] = useState(0);
  useEffect(() => { const start = window.setTimeout(() => setNow(Date.now()), 0); const timer = window.setInterval(() => setNow(Date.now()), 60000); return () => { window.clearTimeout(start); window.clearInterval(timer); }; }, []);
  const age = elapsed(order.createdAt, now);
  const action = mainActionLabel(order); const next = nextOrderStatus(order);
  const keyOpen = (event: KeyboardEvent<HTMLElement>) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(); } };
  const items = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const total = order.total + (order.fulfillment === "delivery" ? order.deliveryFee ?? 0 : 0);
  return <article role="button" tabIndex={0} onClick={onOpen} onKeyDown={keyOpen} className={`cursor-pointer rounded-xl border bg-surface p-3 outline-none focus-visible:ring-2 focus-visible:ring-accent ${order.status === "new" ? "border-2 border-accent shadow-[0_0_18px_rgba(212,175,55,0.12)]" : order.status === "completed" ? "border-line bg-background text-muted" : "border-line"} ${flashing ? "animate-[pulse_2s_ease-in-out_1]" : ""}`}>
    <div className="flex items-center gap-2"><b className="text-base">№{order.number}</b><span className={`ml-auto text-sm font-medium ${ageColor(order, age.minutes)}`}>{age.text}</span>{order.fulfillment === "delivery" ? <Bike size={18} className="text-muted" /> : order.fulfillment === "dinein" ? <Utensils size={18} className="text-muted" /> : <Store size={18} className="text-muted" />}<StatusBadge status={order.status} /></div>
    <div className="mt-2 flex items-center gap-2"><b className="min-w-0 flex-1 truncate">{order.name}</b>{order.phone && <a href={`tel:${order.phone.replace(/\s/g, "")}`} onClick={(event) => event.stopPropagation()} aria-label={`Позвонить: ${order.name}`} className="grid size-11 shrink-0 place-items-center rounded-lg border border-line text-accent"><Phone size={18} /></a>}</div>
    <p className="mt-1.5 truncate text-sm text-muted">{placeText(order)}</p>
    <p className="mt-1.5 truncate text-sm text-muted">{items} {plural(items, "блюдо", "блюда", "блюд")} · <b className="font-semibold text-accent">{money(total)}</b></p>
    <div className="mt-2.5 flex items-center gap-2" onClick={(event) => event.stopPropagation()}>{action && next && <div className="min-w-0 flex-1"><MainOrderAction order={order} onAdvance={() => onStatus(next)} /></div>}<span className="ml-auto shrink-0 text-sm font-semibold text-muted">Подробнее →</span></div>
  </article>;
}
