import { money } from "@/lib/format";
import type { TableRow } from "@/lib/report-stats";

export function ReportTables({ rows }: { rows: TableRow[] }) {
  return <section className="rounded-2xl border border-line bg-surface p-4">
    <h2 className="font-bold">Столы</h2>
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{rows.map((row) => <article key={row.table} className={`rounded-xl border p-3 ${row.count ? "border-line" : "border-line/60 bg-background"}`}>
      <p className={`text-sm font-semibold ${row.count ? "text-text" : "text-muted"}`}>Стол №{row.table}</p>
      <p className={`mt-1 text-lg font-bold ${row.count ? "text-accent" : "text-muted"}`}>{row.count}</p>
      <p className="text-xs text-muted">{row.count ? money(row.revenue) : "без заказов"}</p>
    </article>)}</div>
  </section>;
}
