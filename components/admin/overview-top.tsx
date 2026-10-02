import type { TopDish } from "@/lib/demo-stats";

export function OverviewTop({ items }: { items: TopDish[] }) {
  const maximum = Math.max(1, ...items.map((item) => item.quantity));
  return <section className="rounded-2xl border border-line bg-surface p-4"><h2 className="font-bold">Популярное за 7 дней</h2>{items.length ? <ol className="mt-3 space-y-3">{items.map((item, index) => <li key={item.name} className="text-sm"><div className="flex min-h-11 items-center justify-between gap-2"><span className="min-w-0 truncate"><b className="mr-2 text-accent">{index + 1}.</b>{item.name}</span><b className="shrink-0 text-muted">{item.quantity} шт.</b></div><div className="h-2 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-accent" style={{ width: `${item.quantity / maximum * 100}%` }} /></div></li>)}</ol> : <p className="mt-3 text-sm text-muted">Пока нет заказов.</p>}</section>;
}
