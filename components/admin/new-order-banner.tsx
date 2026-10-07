"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { money } from "@/lib/format";
import type { DemoOrder } from "@/lib/models";

function place(order: DemoOrder) {
  return order.fulfillment === "delivery" ? "Доставка" : order.fulfillment === "pickup" ? "Самовывоз" : `Стол №${order.tableNumber ?? "-"}`;
}
export function NewOrderBanner({ orders }: { orders: DemoOrder[] }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const fresh = orders.filter((order) => order.status === "new" && !hidden.includes(order.id));
  if (!fresh.length) return null;
  const first = fresh[0];
  const text = fresh.length === 1 ? `Новый заказ №${first.number} · ${place(first)} · ${money(first.total + (first.deliveryFee ?? 0))}` : `Новых заказов: ${fresh.length}`;
  return <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-[45] px-3 pt-[calc(env(safe-area-inset-top,0px)+8px)] lg:left-64">
    <div className="pointer-events-auto mx-auto flex max-w-2xl items-center gap-1 rounded-xl border-2 border-accent bg-surface/95 p-1.5 pl-3 shadow-2xl backdrop-blur motion-safe:animate-[pulse_2.4s_ease-in-out_infinite]">
      <span className="min-w-0 flex-1 truncate text-sm font-bold">{text}</span>
      <Link href={fresh.length === 1 ? `/admin/orders?order=${first.id}` : "/admin/orders?status=new"} className="grid min-h-11 shrink-0 place-items-center rounded-lg bg-accent px-4 text-sm font-bold text-background">Открыть</Link>
      <button onClick={() => setHidden((ids) => [...ids, ...fresh.map((order) => order.id)])} aria-label="Скрыть уведомление о новом заказе" className="grid size-11 shrink-0 place-items-center text-muted"><X size={20} /></button>
    </div>
  </div>;
}
