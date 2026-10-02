import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { money } from "@/lib/format";
import type { DemoOrder } from "@/lib/demo-store";

export function OverviewAlerts({ orders, now, onAccept }: { orders: DemoOrder[]; now: Date; onAccept: (id: string) => void }) {
  const fresh = orders.filter((order) => order.status === "new").sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  return <section className="mt-5 rounded-2xl border border-accent/60 bg-surface p-4"><h2 className="font-bold">Требуют внимания</h2>{fresh.length ? <><ul className="mt-2 divide-y divide-line">{fresh.map((order) => <li key={order.id} className="flex min-h-14 items-center gap-2 py-1 text-sm"><span className="min-w-0 flex-1 truncate"><b>№{order.number}</b> · {order.name} · {minutes(order.createdAt, now)} · {money(order.total)}</span><button onClick={() => onAccept(order.id)} className="min-h-11 shrink-0 rounded-lg bg-accent px-3 font-bold text-background">Принять</button></li>)}</ul><Link href="/admin/orders?status=new" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent">Все новые заказы →</Link></> : <p className="mt-3 flex min-h-11 items-center gap-2 text-sm text-emerald-400"><CheckCircle2 size={20} />Новых заказов нет</p>}</section>;
}
function minutes(createdAt: string, now: Date) { return `${Math.max(0, Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60000))} мин`; }
