import Link from "next/link";
import { money } from "@/lib/format";
import { STATUS_LABEL } from "@/components/admin/order-actions";
import type { DemoOrder } from "@/lib/models";

const colors = { new: "bg-accent text-background", preparing: "bg-blue-800 text-white", delivering: "bg-violet-800 text-white", completed: "bg-emerald-800 text-white", cancelled: "bg-slate-600 text-white" };
export function OverviewRecent({ orders, now }: { orders: DemoOrder[]; now: Date }) {
  const recent = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  return <section className="rounded-2xl border border-line bg-surface p-4"><header className="flex items-center justify-between"><h2 className="font-bold">Последние заказы</h2><Link href="/admin/orders" className="grid min-h-11 place-items-center text-sm font-semibold text-accent">Все заказы →</Link></header>{recent.length ? <ul className="divide-y divide-line">{recent.map((order) => <li key={order.id}><Link href="/admin/orders" className="flex min-h-16 items-center justify-between gap-2 py-2 text-sm hover:bg-background"><span className="min-w-0"><b className="block truncate">№{order.number} · {order.name}</b><time className="text-xs text-muted">{relative(order.createdAt, now)}</time></span><span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${colors[order.status]}`}>{STATUS_LABEL[order.status]}</span><b className="shrink-0 text-accent">{money(order.total)}</b></Link></li>)}</ul> : <p className="py-4 text-sm text-muted">Пока заказов нет.</p>}</section>;
}
function relative(createdAt: string, now: Date) { const minutes = Math.max(0, Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60000)); return minutes < 60 ? `${minutes} мин назад` : `${Math.floor(minutes / 60)} ч назад`; }
