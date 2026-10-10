import { money } from "@/lib/format";
import { changePercent, type Totals } from "@/lib/report-stats";

export type Card = { label: string; value: string | number; change: number | null };

export function ReportCards({ cards }: { cards: Card[] }) {
  return <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">{cards.map((card) => <article key={card.label} className="min-h-28 rounded-2xl border border-line bg-surface p-4"><p className="text-xs text-muted">{card.label}</p><p className="mt-2 text-xl font-bold text-accent">{card.value}</p><Comparison value={card.change} /></article>)}</div>;
}

// Красный показываем только при реальном падении, нулевую динамику — нейтральным серым.
function Comparison({ value }: { value: number | null }) {
  if (value === null) return <p className="mt-2 text-xs text-muted">нет данных за прошлый период</p>;
  const label = value > 0 ? `+${value}% к прошлому периоду` : value < 0 ? `${value}% к прошлому периоду` : "0% к прошлому периоду";
  return <p className={`mt-2 text-xs font-semibold ${value > 0 ? "text-emerald-400" : value < 0 ? "text-[#F87171]" : "text-muted"}`}>{label}</p>;
}

// comparable = false, когда прошлый период ещё не загружен или запрос не удался:
// тогда процент не считаем, чтобы не показать «-100%» из-за отсутствия данных.
export function cardsFor(current: Totals, previous: Totals, comparable = true): Card[] {
  const change = (value: number, past: number) => (comparable ? changePercent(value, past) : null);
  return [
    { label: "Заказов", value: current.count, change: change(current.count, previous.count) },
    { label: "Сумма заказов (без доставки)", value: money(current.revenue), change: change(current.revenue, previous.revenue) },
    { label: "Средний чек", value: money(current.average), change: change(current.average, previous.average) },
  ];
}
