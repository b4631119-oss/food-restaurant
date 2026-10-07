import { money } from "@/lib/format";

export type Stat = { label: string; value: string | number; change?: number | null; note?: string };
export type OrdersByType = { delivery: number; pickup: number; dinein: number };
export function OverviewStats({ stats }: { stats: Stat[] }) {
  return <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map((stat) => <article key={stat.label} className="min-h-28 rounded-2xl border border-line bg-surface p-4"><p className="text-xs text-muted">{stat.label}</p><p className="mt-2 text-xl font-bold text-accent">{stat.value}</p>{stat.note && <p className="text-xs text-muted">{stat.note}</p>}<Comparison value={stat.change} /></article>)}</div>;
}
function Comparison({ value }: { value?: number | null }) {
  if (value == null) return null;
  const label = value > 0 ? `+${value}% к вчера` : value < 0 ? `${value}% к вчера` : "как вчера";
  return <p className={`mt-2 text-xs font-semibold ${value > 0 ? "text-emerald-400" : value < 0 ? "text-[#F87171]" : "text-muted"}`}>{label}</p>;
}
export function statCards(data: { count: number; revenue: number; average: number; waiting: number; orderChange: number | null; revenueChange: number | null; averageChange: number | null; types: OrdersByType }): Stat[] {
  return [{ label: "Заказов сегодня", value: data.count, change: data.orderChange, note: `по типам: доставка ${data.types.delivery} · самовывоз ${data.types.pickup} · со стола ${data.types.dinein}` }, { label: "Заказано сегодня", value: money(data.revenue), change: data.revenueChange, note: "без отмен и доставки" }, { label: "Средний чек", value: money(data.average), change: data.averageChange, note: "без доставки" }, { label: "Ждут ответа", value: data.waiting }];
}
