"use client";

import { useState } from "react";
import { OrderDetails } from "@/components/admin/order-details";
import { PeriodPicker } from "@/components/admin/period-picker";
import { ReportChart, type Bar } from "@/components/admin/overview-chart";
import { ReportCards, cardsFor } from "@/components/admin/overview-stats";
import { ReportRecent } from "@/components/admin/overview-recent";
import { ReportTop } from "@/components/admin/overview-top";
import { ReportTables } from "@/components/admin/report-tables";
import { ReportTypes } from "@/components/admin/report-types";
import { useReportOrders } from "@/hooks/use-report-orders";
import { useReportPeriod } from "@/hooks/use-report-period";
import { byDay, byHour, byTable, byType, orderTotals, topDishes } from "@/lib/report-stats";
import type { DemoOrder } from "@/lib/models";

export function AdminOverview() {
  const { period, previous, chooseKey } = useReportPeriod();
  // Пока период не закончился, динамика считается по такому же отрезку прошлого периода.
  const sameSlice = Boolean(period && previous && previous.end.getTime() < period.end.getTime());
  const current = useReportOrders(period);
  const past = useReportOrders(previous);
  const [selected, setSelected] = useState<DemoOrder | null>(null);
  const orders = current.orders ?? [];
  const days = period ? byDay(orders, period) : [];
  const singleDay = days.length === 1;
  const dayBars: Bar[] = days.map((day) => ({ key: day.key, label: day.label.slice(0, 5), count: day.count, revenue: day.revenue }));
  const hourBars: Bar[] = singleDay ? byHour(orders).map((row) => ({ key: String(row.hour), label: row.hour % 3 === 0 ? `${String(row.hour).padStart(2, "0")}:00` : "", count: row.count, revenue: row.revenue })) : [];
  const refresh = () => { current.refresh(); past.refresh(); };
  return <section className="min-w-0">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Обзор</h1><p className="mt-1 text-sm text-muted">{period ? `Период: ${period.label} · день считается с 06:00 до 06:00` : "Загрузка периода…"}</p></div>
      <button type="button" onClick={refresh} disabled={!period} className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold disabled:opacity-50">Обновить</button>
    </header>
    <PeriodPicker period={period} onChoose={chooseKey} />
    <p className="mt-3 text-xs text-muted">Считаются заказы, оформленные на сайте. Подтверждение приходит в WhatsApp.{sameSlice ? " Динамика в карточках — за тот же отрезок прошлого периода." : ""}</p>
    {current.error && <p role="alert" className="mt-3 text-sm text-red-400">{current.error}</p>}
    {current.loading ? <OverviewSkeleton /> : <>
      <ReportCards cards={cardsFor(orderTotals(orders), orderTotals(past.orders ?? []), past.orders !== null && !past.error && !current.error)} />
      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2"><ReportTypes rows={byType(orders)} /><ReportTables rows={byTable(orders)} /></div>
      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
        {singleDay ? <ReportChart title="Заказы по часам" bars={hourBars} /> : <ReportChart title="Заказы по дням" bars={dayBars} />}
        <ReportTop items={topDishes(orders)} />
      </div>
      <div className="mt-4"><ReportRecent orders={orders} onOpen={setSelected} /></div>
    </>}
    {selected && <OrderDetails order={orders.find((order) => order.id === selected.id) ?? selected} onClose={() => setSelected(null)} />}
  </section>;
}

function OverviewSkeleton() {
  return <div className="mt-4 space-y-4"><div className="grid gap-3 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-surface" />)}</div><div className="grid gap-4 lg:grid-cols-2"><div className="h-56 animate-pulse rounded-2xl bg-surface" /><div className="h-56 animate-pulse rounded-2xl bg-surface" /></div></div>;
}
