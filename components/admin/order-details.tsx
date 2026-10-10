"use client";

import { useEffect, useState } from "react";
import { Bike, Check, Loader2, MapPin, Phone, Store, Utensils, X } from "lucide-react";
import { OrderMapButtons } from "@/components/admin/order-map-buttons";
import { useModalBackHandler } from "@/hooks/use-scroll-lock";
import { money, orderPlace, plural } from "@/lib/format";
import { bishkekParts } from "@/lib/report-period";
import { setOrderStatus } from "@/lib/repo/orders-repo";
import type { DemoOrder, OrderStatus } from "@/lib/models";

const STATUSES: [OrderStatus, string][] = [
  ["new", "Новый"], ["preparing", "Готовится"], ["delivering", "В пути"],
  ["served", "Подан"], ["completed", "Завершён"], ["cancelled", "Отменён"]
];

export function OrderDetails({ order, onClose }: { order: DemoOrder; onClose: () => void }) {
  useModalBackHandler(true, onClose);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [onClose]);
  const { date, time } = bishkekParts(order.createdAt);
  const items = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const PaidIcon = order.fulfillment === "delivery" ? Bike : order.fulfillment === "dinein" ? Utensils : Store;

  async function handleStatusChange(newStatus: OrderStatus) {
    if (newStatus === currentStatus || statusLoading) return;
    setStatusLoading(true);
    try {
      await setOrderStatus(order.id, newStatus);
      setCurrentStatus(newStatus);
    } catch {
      // ignore or alert
    } finally {
      setStatusLoading(false);
    }
  }

  return <div className="fixed inset-0 z-[70] flex justify-end bg-black/60" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside role="dialog" aria-modal="true" aria-labelledby="order-detail-title" className="flex h-dvh w-full flex-col border-l border-line bg-surface shadow-2xl sm:max-w-[440px]">
      <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-line px-5"><div><h2 id="order-detail-title" className="text-xl font-bold">Заказ №{order.number}</h2><p className="mt-1 text-sm text-muted">{date} · {time}</p></div><button onClick={onClose} aria-label="Закрыть" className="press grid size-11 place-items-center rounded-lg border border-line"><X size={20} /></button></header>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 pb-8">
        <section className="rounded-xl border border-line bg-background/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Статус заказа:</span>
            {statusLoading && <Loader2 size={16} className="animate-spin text-accent" />}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {STATUSES.map(([st, label]) => (
              <button key={st} type="button" disabled={statusLoading} onClick={() => handleStatusChange(st)} className={`press min-h-9 rounded-lg px-2.5 text-xs font-semibold ${currentStatus === st ? "bg-accent text-background font-bold shadow-sm" : "border border-line text-muted hover:text-text"}`}>
                {currentStatus === st && <Check size={12} className="mr-1 inline" />}{label}
              </button>
            ))}
          </div>
        </section>
        <section><h3 className="font-bold">{order.name || "Гость"}</h3>{order.phone ? <a href={`tel:${order.phone.replace(/\s/g, "")}`} className="press mt-2 inline-flex min-h-11 items-center gap-2 text-accent"><Phone size={18} />{order.phone}</a> : <p className="mt-2 text-sm text-muted">Телефон не указан</p>}</section>
        <section className="space-y-2 text-sm"><p className="flex items-start gap-2"><PaidIcon size={18} />{orderPlace(order)}</p>{order.fulfillment === "delivery" && <p className="flex items-start gap-2 text-muted"><MapPin size={18} />{order.address || "Адрес не указан"}</p>}{order.fulfillment === "delivery" && <OrderMapButtons order={order} />}{order.comment && <p className="rounded-lg bg-background p-3 text-muted">{order.comment}</p>}</section>
        <section><h3 className="mb-2 font-bold">Блюда <span className="font-normal text-muted">{items} {plural(items, "блюдо", "блюда", "блюд")}</span></h3><ul className="space-y-3">{order.items.map((item) => <li key={item.productId} className="flex justify-between gap-3 text-sm"><span>{item.productName} × {item.quantity}</span><span className="shrink-0 text-muted">{money(item.price * item.quantity)}</span></li>)}</ul></section>
        <div className="space-y-2 border-t border-line pt-3 text-sm"><div className="flex justify-between"><span className="text-muted">Блюда</span><span>{money(order.total)}</span></div>{order.fulfillment === "delivery" && order.deliveryFee !== undefined && <div className="flex justify-between"><span className="text-muted">Доставка</span><span>{order.deliveryFee === 0 ? "бесплатно" : money(order.deliveryFee)}</span></div>}<div className="flex justify-between text-lg font-bold"><span>Итого к оплате</span><span className="text-accent">{money(order.total + (order.deliveryFee ?? 0))}</span></div></div>
      </div>
      <footer className="shrink-0 border-t border-line p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)]"><button onClick={onClose} className="press min-h-12 w-full rounded-lg border border-line font-semibold">Закрыть</button></footer>
    </aside>
  </div>;
}
