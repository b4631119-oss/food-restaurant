"use client";

import { useCallback, useEffect, useState } from "react";
import { buildPeriod, readStoredPeriod, storePeriod, type Period, type PeriodKey } from "@/lib/report-period";

// Выбор периода запоминается на время сессии. Пока не смонтировались, период неизвестен:
// так на сервере и в браузере не расходятся даты.
export function useReportPeriod() {
  const [period, setPeriod] = useState<Period | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setPeriod(readStoredPeriod() ?? buildPeriod("today", new Date())), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const chooseKey = useCallback((key: PeriodKey, custom?: { from: string; to: string }) => {
    const next = buildPeriod(key, new Date(), custom);
    storePeriod(next);
    setPeriod(next);
  }, []);
  return { period, chooseKey };
}
