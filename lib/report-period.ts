// Отчётный период админки. День считается с 06:00 до 06:00 по Asia/Bishkek.
// Бишкек — UTC+6 без перехода на летнее время, поэтому расчёт идёт сдвигом на 6 часов,
// и он одинаков на сервере и в браузере любой зоны.
const OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "sushi-bar-no1-report-period";

export type PeriodKey = "today" | "yesterday" | "week" | "month" | "custom";
export type Period = { key: PeriodKey; start: Date; end: Date; label: string; from?: string; to?: string };
export type PeriodDay = { key: string; label: string; start: Date };
export type StoredPeriod = { key: PeriodKey; from: string; to: string };

const KEYS: PeriodKey[] = ["today", "yesterday", "week", "month", "custom"];
const pad = (value: number) => String(value).padStart(2, "0");
const shifted = (date: Date) => new Date(date.getTime() + OFFSET_MS);

// Начало отчётного дня (06:00 по Бишкеку), которому принадлежит момент времени.
export function reportDayStart(date: Date): Date {
  const local = shifted(date);
  const six = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), 6, 0, 0, 0);
  const base = local.getTime() >= six ? six : six - DAY_MS;
  return new Date(base - OFFSET_MS);
}

// Отчётная дата (YYYY-MM-DD): до 06:00 по Бишкеку это ещё предыдущий день.
export function reportDayKey(date: Date): string {
  const local = shifted(new Date(reportDayStart(date)));
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`;
}

// Начало отчётного дня по ключу YYYY-MM-DD (00:00 UTC = 06:00 по Бишкеку).
export function reportDateStart(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

export function formatDay(moment: Date): string {
  const local = shifted(moment);
  return `${pad(local.getUTCDate())}.${pad(local.getUTCMonth() + 1)}.${local.getUTCFullYear()}`;
}

export function bishkekParts(iso: string): { date: string; time: string } {
  const local = shifted(new Date(iso));
  return { date: `${pad(local.getUTCDate())}.${pad(local.getUTCMonth() + 1)}.${local.getUTCFullYear()}`, time: `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}` };
}

export function hourOf(iso: string): number {
  return shifted(new Date(iso)).getUTCHours();
}

export function periodDays(period: Period): PeriodDay[] {
  const days: PeriodDay[] = [];
  for (let time = period.start.getTime(); time < period.end.getTime(); time += DAY_MS) {
    const start = new Date(time);
    days.push({ key: reportDayKey(start), label: formatDay(start), start });
  }
  return days;
}

// Конец периода — это уже 06:00 следующего отчётного дня, поэтому последний день
// периода считается как end - 24 часа.
function rangeLabel(start: Date, end: Date): string {
  const from = formatDay(start);
  const last = formatDay(new Date(end.getTime() - DAY_MS));
  return from === last ? from : `${from} – ${last}`;
}

export function buildPeriod(key: PeriodKey, now: Date, custom?: { from: string; to: string }): Period {
  if (key === "custom") {
    const fromKey = custom?.from || reportDayKey(now);
    const toKey = custom?.to || fromKey;
    const [first, last] = fromKey <= toKey ? [fromKey, toKey] : [toKey, fromKey];
    const start = reportDateStart(first);
    const end = new Date(reportDateStart(last).getTime() + DAY_MS);
    return { key, start, end, label: rangeLabel(start, end), from: first, to: last };
  }
  const today = reportDayStart(now);
  const startDays = { today: 0, yesterday: -1, week: -6, month: -29 }[key];
  const start = new Date(today.getTime() + startDays * DAY_MS);
  const end = key === "yesterday" ? today : new Date(today.getTime() + DAY_MS);
  return { key, start, end, label: rangeLabel(start, end) };
}

// Предыдущий период такой же длины — для сравнения показателей.
export function previousPeriod(period: Period): Period {
  const length = period.end.getTime() - period.start.getTime();
  const start = new Date(period.start.getTime() - length);
  return { key: period.key, start, end: period.start, label: rangeLabel(start, period.start) };
}

export function periodFromKey(period: Period): string { return reportDayKey(period.start); }
export function periodToKey(period: Period): string { return reportDayKey(new Date(period.end.getTime() - DAY_MS)); }

export function readStoredPeriod(): Period | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<StoredPeriod>;
    if (!value.key || !KEYS.includes(value.key)) return null;
    return buildPeriod(value.key, new Date(), { from: String(value.from ?? ""), to: String(value.to ?? "") });
  } catch { return null; }
}

export function storePeriod(period: Period): void {
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ key: period.key, from: period.from ?? "", to: period.to ?? "" })); } catch { /* Работаем без памяти сессии. */ }
}
