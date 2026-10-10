"use client";

import { useCallback, useEffect, useState } from "react";
import { buildPeriod, previousPeriod, readStoredPeriod, storePeriod, type Period, type PeriodKey } from "@/lib/report-period";

type ReportPeriod = { period: Period; previous: Period };

// Выбор периода запоминается на время сессии. Пока не смонтировались, период неизвестен:
// так на сервере и в браузере не расходятся даты. Предыдущий период считается здесь же, потому
// что его границы зависят от текущего времени, а рендер компонентов должен оставаться чистым.
export function useReportPeriod() {
  const [state, setState] = useState<ReportPeriod | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const now = new Date();
      const period = readStoredPeriod() ?? buildPeriod("today", now);
      setState({ period, previous: previousPeriod(period, now) });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const chooseKey = useCallback((key: PeriodKey, custom?: { from: string; to: string }) => {
    const now = new Date();
    const next = buildPeriod(key, now, custom);
    storePeriod(next);
    setState({ period: next, previous: previousPeriod(next, now) });
  }, []);
  return { period: state?.period ?? null, previous: state?.previous ?? null, chooseKey };
}
