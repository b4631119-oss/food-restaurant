import { money } from "@/lib/format";

export type Bar = { key: string; label: string; count: number; revenue: number };

export function ReportChart({ title, bars, note }: { title: string; bars: Bar[]; note?: string }) {
  const maximum = Math.max(1, ...bars.map((bar) => bar.revenue));
  const total = bars.reduce((sum, bar) => sum + bar.revenue, 0);
  const dense = bars.length > 12;
  return <section className="rounded-2xl border border-line bg-surface p-4">
    <header className="flex items-center justify-between gap-2"><h2 className="font-bold">{title}</h2><b className="text-sm text-accent">{money(total)}</b></header>
    {bars.length ? <div className="no-scrollbar mt-4 flex h-44 items-end gap-1 overflow-x-auto">{bars.map((bar) => <div key={bar.key} className="flex h-full min-w-4 flex-1 flex-col items-center justify-end gap-1" title={`${bar.label || bar.key}: ${bar.count} заказов · ${money(bar.revenue)}`}>
      <div className={`w-full rounded-t-md ${bar.revenue > 0 ? "bg-accent/70" : "bg-line"}`} style={{ height: bar.revenue > 0 ? `${Math.max(4, bar.revenue / maximum * 100)}%` : "2px" }} />
      <span className={`w-full truncate text-center text-[11px] text-muted ${dense ? "rotate-0" : ""}`}>{bar.label}</span>
    </div>)}</div> : <p className="mt-3 text-sm text-muted">За период заказов нет.</p>}
    {note && <p className="mt-2 text-xs text-muted">{note}</p>}
  </section>;
}
