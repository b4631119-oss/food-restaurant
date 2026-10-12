"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrdersInRange } from "@/lib/repo/orders-repo";
import type { DemoOrder } from "@/lib/models";
import type { Period } from "@/lib/report-period";

// Кэш в памяти по ключу периода: переключение между отчётами не дёргает Firebase заново.
const cache = new Map<string, DemoOrder[]>();
const cacheKey = (period: Period) => `${period.start.toISOString()}_${period.end.toISOString()}`;

// Очистка кэша отчётов: вызывается при выходе из админки, чтобы данные заказов
// не оставались в памяти вкладки для следующего пользователя.
export function clearReportCache(): void {
  cache.clear();
}

export type ReportOrders = { orders: DemoOrder[] | null; loading: boolean; error: string; refresh: () => void };

export function useReportOrders(period: Period | null): ReportOrders {
  const [loaded, setLoaded] = useState<{ key: string; orders: DemoOrder[] } | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const key = period ? cacheKey(period) : "";
  useEffect(() => {
    if (!period) return undefined;
    let cancelled = false;
    const start = period.start.toISOString();
    const end = period.end.toISOString();
    void Promise.resolve(cache.get(key) ?? getOrdersInRange(start, end)).then((items) => {
      if (cancelled) return;
      if (!cache.has(key)) cache.set(key, items);
      setLoaded({ key, orders: items }); setError("");
    }).catch((cause: unknown) => {
      if (cancelled) return;
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить заказы.");
      setLoaded({ key, orders: [] });
    });
    return () => { cancelled = true; };
  }, [key, period, version]);
  const refresh = useCallback(() => { cache.delete(key); setVersion((value) => value + 1); }, [key]);
  const ready = Boolean(loaded) && loaded?.key === key;
  return { orders: ready ? loaded?.orders ?? [] : null, loading: Boolean(period) && !ready, error, refresh };
}
