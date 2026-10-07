"use client";

import { useState } from "react";
import { periodFromKey, periodToKey, type Period, type PeriodKey } from "@/lib/report-period";

const CHIPS: [PeriodKey, string][] = [["today", "Сегодня"], ["yesterday", "Вчера"], ["week", "7 дней"], ["month", "30 дней"]];
type Props = { period: Period | null; onChoose: (key: PeriodKey, custom?: { from: string; to: string }) => void };

export function PeriodPicker({ period, onChoose }: Props) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const active = period?.key ?? "";
  const fromValue = from || (period ? periodFromKey(period) : "");
  const toValue = to || (period ? periodToKey(period) : "");
  const apply = (nextFrom: string, nextTo: string) => {
    if (!nextFrom || !nextTo) return;
    onChoose("custom", nextFrom <= nextTo ? { from: nextFrom, to: nextTo } : { from: nextTo, to: nextFrom });
  };
  const chip = (isActive: boolean) => `press min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold ${isActive ? "bg-accent text-background" : "border border-line text-muted"}`;
  const dateField = "mt-1 h-11 w-full rounded-lg border border-line bg-background px-3 text-base outline-none focus:border-accent";
  return (
    <div className="mt-4">
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {CHIPS.map(([key, label]) => <button key={key} type="button" onClick={() => { setOpen(false); onChoose(key); }} aria-pressed={active === key} className={chip(active === key)}>{label}</button>)}
        <button type="button" onClick={() => setOpen((value) => !value)} aria-pressed={active === "custom"} aria-expanded={open} className={chip(active === "custom")}>Свой период</button>
      </div>
      {open && <div className="mt-2 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-3">
        <label className="min-w-40 text-sm">Начало<input type="date" value={fromValue} onChange={(event) => { setFrom(event.target.value); apply(event.target.value, toValue); }} className={dateField} /></label>
        <label className="min-w-40 text-sm">Конец<input type="date" value={toValue} onChange={(event) => { setTo(event.target.value); apply(fromValue, event.target.value); }} className={dateField} /></label>
        {period && <span className="pb-3 text-sm text-muted">{period.label}</span>}
      </div>}
    </div>
  );
}
