import { money } from "@/lib/format";
import type { RevenueDay } from "@/lib/demo-stats";

export function OverviewChart({ days }: { days: RevenueDay[] }) {
  const maximum = Math.max(1, ...days.map((day) => day.amount));
  const total = days.reduce((sum, day) => sum + day.amount, 0);
  return <section className="rounded-2xl border border-line bg-surface p-4"><header className="flex items-center justify-between gap-2"><h2 className="font-bold">Выручка за 7 дней</h2><b className="text-sm text-accent">{money(total)}</b></header><div className="mt-4 flex h-44 items-end gap-2">{days.map((day, index) => { const today = index === days.length - 1; const label = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"][day.date.getDay()]; return <div key={day.date.toISOString()} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"><span className="h-4 text-center text-[12px] text-muted">{day.amount > 0 ? money(day.amount) : ""}</span><div className={`w-full rounded-t-md ${today ? "bg-accent" : "bg-blue-900"}`} style={{ height: day.amount ? `${Math.max(5, day.amount / maximum * 100)}%` : "2px" }} /><span className="text-[12px] text-muted">{today ? day.date.toLocaleDateString("ru-RU", { day: "numeric", month: "numeric" }) : label}</span></div>; })}</div></section>;
}
