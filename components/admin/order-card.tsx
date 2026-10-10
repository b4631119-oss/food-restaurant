"use client";

import type { KeyboardEvent } from "react";
import { Bike, Phone, Store, Utensils } from "lucide-react";
import { money, plural } from "@/lib/format";
import { bishkekParts } from "@/lib/report-period";
import type { DemoOrder } from "@/lib/models";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  new: { label: "Новый", cls: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  preparing: { label: "Готовится", cls: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  delivering: { label: "В пути", cls: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  served: { label: "Подан", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  completed: { label: "Завершён", cls: "bg-green-500/20 text-green-300 border-green-500/30" },
  cancelled: { label: "Отменён", cls: "bg-red-500/20 text-red-300 border-red-500/30" },
};

export function OrderCard({ order, onOpen }: { order: DemoOrder; onOpen: () => void }) {
  const { date, time } = bishkekParts(order.createdAt);
  const items = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const keyOpen = (event: KeyboardEvent<HTMLElement>) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(); } };
  const statusInfo = STATUS_LABELS[order.status] ?? { label: order.status, cls: "bg-line text-muted border-line" };
  const TypeIcon = order.fulfillment === "delivery" ? Bike : order.fulfillment === "dinein" ? Utensils : Store;
  const placeLabel = order.fulfillment === "dinein" ? `Стол №${order.tableNumber ?? "?"}` : order.fulfillment === "delivery" ? "Доставка" : "Самовывоз";

  return <article role="button" tabIndex={0} onClick={onOpen} onKeyDown={keyOpen} className="press cursor-pointer rounded-2xl border border-line bg-surface p-3.5 outline-none focus-visible:ring-2 focus-visible:ring-accent">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <b className="text-base font-bold text-accent">№{order.number}</b>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusInfo.cls}`}>{statusInfo.label}</span>
      </div>
      <span className="shrink-0 text-xs text-muted">{date} · {time}</span>
    </div>
    <div className="mt-2 flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <b className="block truncate text-sm">{order.name || "Гость"}</b>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
          <TypeIcon size={14} className="shrink-0" />
          <span className="truncate">{placeLabel}</span>
          <span>·</span>
          <span>{items} {plural(items, "блюдо", "блюда", "блюд")}</span>
        </div>
      </div>
      {order.phone && <a href={`tel:${order.phone.replace(/\s/g, "")}`} onClick={(event) => event.stopPropagation()} aria-label={`Позвонить: ${order.name}`} className="press grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-background/50 text-accent hover:border-accent"><Phone size={18} /></a>}
    </div>
    <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-2 text-xs">
      <span className="truncate text-muted">{order.address || (order.fulfillment === "delivery" ? "Адрес не указан" : "")}</span>
      <b className="shrink-0 text-sm font-bold text-accent">{money(order.total + (order.deliveryFee ?? 0))}</b>
    </div>
  </article>;
}
