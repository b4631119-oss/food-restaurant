import { money, plural } from "@/lib/format";
import type { TypeRow } from "@/lib/report-stats";

export function ReportTypes({ rows }: { rows: TypeRow[] }) {
  return <section className="rounded-2xl border border-line bg-surface p-4">
    <h2 className="font-bold">Доставка / Самовывоз / Зал</h2>
    <ul className="mt-3 space-y-3">{rows.map((row) => <li key={row.type} className="text-sm">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2"><b>{row.label}</b><span className="text-muted">{row.count} {plural(row.count, "заказ", "заказа", "заказов")} · {money(row.revenue)} · {Math.round(row.share * 100)}%</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-accent" style={{ width: `${row.share * 100}%` }} /></div>
    </li>)}</ul>
  </section>;
}
