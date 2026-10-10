"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { HistoryTable } from "@/components/admin/history-table";
import { OrderCard } from "@/components/admin/order-card";
import { OrderDetails } from "@/components/admin/order-details";
import { PeriodPicker } from "@/components/admin/period-picker";
import { downloadOrdersCsv } from "@/lib/orders-csv";
import { periodFromKey, periodToKey, type Period, type PeriodKey } from "@/lib/report-period";
import type { DemoOrder, OrderType } from "@/lib/models";

const PAGE = 50;
const TYPE_FILTERS: [OrderType | "all", string][] = [["all", "Все"], ["delivery", "Доставка"], ["pickup", "Самовывоз"], ["dinein", "Со стола"]];
type Props = { period: Period | null; onChoose: (key: PeriodKey, custom?: { from: string; to: string }) => void; orders: DemoOrder[]; loading: boolean; error: string; onRefresh: () => void };

export function OrdersHistory({ period, onChoose, orders, loading, error, onRefresh }: Props) {
  const [type, setType] = useState<OrderType | "all">("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<DemoOrder | null>(null);
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("ru");
    return orders.filter((order) => (type === "all" || order.fulfillment === type) && (!search || `${order.number} ${order.name} ${order.phone}`.toLocaleLowerCase("ru").includes(search)));
  }, [orders, type, query]);
  const visible = filtered.slice(0, limit);
  const amount = (key: OrderType | "all") => key === "all" ? orders.length : orders.filter((order) => order.fulfillment === key).length;
  const chip = (isActive: boolean) => `press min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold ${isActive ? "bg-accent text-background" : "border border-line text-muted"}`;
  return <section>
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">История заказов</h1><p className="mt-1 text-sm text-muted">{period ? `Период: ${period.label} · заказов: ${orders.length}` : "Загрузка периода…"}</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={onRefresh} className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold">Обновить</button><button type="button" onClick={() => { if (period) downloadOrdersCsv(filtered, periodFromKey(period), periodToKey(period)); }} disabled={!filtered.length} className="min-h-11 rounded-lg bg-accent px-4 font-bold text-background disabled:opacity-50">Скачать CSV</button></div></header>
    <PeriodPicker period={period} onChoose={onChoose} />
    <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1">{TYPE_FILTERS.map(([key, label]) => <button key={key} type="button" onClick={() => { setType(key); setLimit(PAGE); }} aria-pressed={type === key} className={chip(type === key)}>{label} {amount(key)}</button>)}</div>
    <label className="relative mt-3 block lg:max-w-sm"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" /><input value={query} onChange={(event) => { setQuery(event.target.value); setLimit(PAGE); }} placeholder="Поиск: номер, имя, телефон" aria-label="Поиск по номеру, имени или телефону" className="h-11 w-full rounded-lg border border-line bg-surface pl-10 pr-3 text-base outline-none focus:border-accent" /></label>
    {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
    {loading ? <p className="mt-6 text-muted">Загрузка заказов…</p> : filtered.length ? <>
      <HistoryTable orders={visible} onOpen={setSelected} />
      <div className="mt-4 grid gap-2 lg:hidden">{visible.map((order) => <OrderCard key={order.id} order={order} onOpen={() => setSelected(order)} />)}</div>
      {filtered.length > visible.length && <button type="button" onClick={() => setLimit((value) => value + PAGE)} className="mt-4 min-h-12 w-full rounded-lg border border-line font-semibold">Показать ещё ({filtered.length - visible.length})</button>}
      <p className="mt-2 text-xs text-muted">Показано {visible.length} из {filtered.length}</p>
    </> : <p className="mt-8 rounded-xl border border-line bg-surface p-6 text-center text-muted">За период заказов нет</p>}
    {selected && <OrderDetails order={orders.find((order) => order.id === selected.id) ?? selected} onClose={() => setSelected(null)} />}
  </section>;
}
