"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrdersInRange } from "@/lib/repo/orders-repo";
import type { DemoOrder } from "@/lib/models";
import type { Period } from "@/lib/report-period";

// Кэш в памяти по ключу периода: переключение между отчётами не дёргает Firebase заново.
// Пять минут — свежесть отчёта; повторно заказы читаются только по кнопке «Обновить».
const REPORT_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { items: DemoOrder[]; at: number }>();
const cacheKey = (period: Period) => `${period.start.toISOString()}_${period.end.toISOString()}`;

function cachedOrders(key: string): DemoOrder[] | null {
  const entry = cache.get(key);
  return entry && Date.now() - entry.at < REPORT_TTL_MS ? entry.items : null;
}

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
    void Promise.resolve(cachedOrders(key) ?? getOrdersInRange(start, end)).then((items) => {
      if (cancelled) return;
      if (!cache.has(key)) cache.set(key, { items, at: Date.now() });
      setLoaded({ key, orders: items }); setError("");
    }).catch((cause: unknown) => {
      if (cancelled) return;
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить заказы.");
      setLoaded({ key, orders: [] });
    });
    return () => { cancelled = true; };
  }, [key, period, version]);
  // «Обновить» — единственный путь прочитать заказы повторно: кэш при этом сбрасывается.
  const refresh = useCallback(() => { cache.delete(key); setVersion((value) => value + 1); }, [key]);
  const ready = Boolean(loaded) && loaded?.key === key;
  return { orders: ready ? loaded?.orders ?? [] : null, loading: Boolean(period) && !ready, error, refresh };
}
