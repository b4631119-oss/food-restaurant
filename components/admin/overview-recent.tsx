"use client";

import { money, orderPlace, plural } from "@/lib/format";
import { bishkekParts } from "@/lib/report-period";
import type { DemoOrder } from "@/lib/models";

export function ReportRecent({ orders, onOpen }: { orders: DemoOrder[]; onOpen: (order: DemoOrder) => void }) {
  const recent = orders.slice(0, 10);
  return <section className="rounded-2xl border border-line bg-surface p-4">
    <header className="flex items-center justify-between gap-2"><h2 className="font-bold">Последние заказы</h2>{orders.length > 0 && <span className="text-sm text-muted">показано {recent.length} из {orders.length}</span>}</header>
    {recent.length ? <ul className="mt-2 divide-y divide-line">{recent.map((order) => {
      const { date, time } = bishkekParts(order.createdAt);
      const items = order.items.reduce((sum, item) => sum + item.quantity, 0);
      return <li key={order.id}><button type="button" onClick={() => onOpen(order)} className="flex min-h-14 w-full items-center gap-3 py-2 text-left text-sm hover:bg-background">
        <span className="w-14 shrink-0 font-bold">№{order.number}</span>
        <span className="min-w-0 flex-1"><b className="block truncate">{order.name || "Гость"}</b><span className="text-xs text-muted">{date} {time} · {orderPlace(order)} · {items} {plural(items, "блюдо", "блюда", "блюд")}</span></span>
        <b className="shrink-0 text-accent">{money(order.total)}</b>
      </button></li>;
    })}</ul> : <p className="mt-3 text-sm text-muted">За период заказов нет.</p>}
  </section>;
}
