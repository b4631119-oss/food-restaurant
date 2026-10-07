"use client";

import type { KeyboardEvent } from "react";
import { Phone } from "lucide-react";
import { money, orderPlace, plural } from "@/lib/format";
import { bishkekParts } from "@/lib/report-period";
import type { DemoOrder } from "@/lib/models";

export function OrderCard({ order, onOpen }: { order: DemoOrder; onOpen: () => void }) {
  const { date, time } = bishkekParts(order.createdAt);
  const items = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const keyOpen = (event: KeyboardEvent<HTMLElement>) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(); } };
  return <article role="button" tabIndex={0} onClick={onOpen} onKeyDown={keyOpen} className="cursor-pointer rounded-xl border border-line bg-surface p-3 outline-none focus-visible:ring-2 focus-visible:ring-accent">
    <div className="flex items-center gap-2"><b className="text-base">№{order.number}</b><span className="ml-auto shrink-0 text-sm text-muted">{date} · {time}</span></div>
    <div className="mt-2 flex items-center gap-2"><b className="min-w-0 flex-1 truncate">{order.name || "Гость"}</b>{order.phone && <a href={`tel:${order.phone.replace(/\s/g, "")}`} onClick={(event) => event.stopPropagation()} aria-label={`Позвонить: ${order.name}`} className="grid size-11 shrink-0 place-items-center rounded-lg border border-line text-accent"><Phone size={18} /></a>}</div>
    <p className="mt-1.5 truncate text-sm text-muted">{orderPlace(order)} · {items} {plural(items, "блюдо", "блюда", "блюд")} · <b className="font-semibold text-accent">{money(order.total)}</b></p>
  </article>;
}
