"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_DATA_EVENT, getOrders, setOrders as persistOrders, type DemoOrder } from "@/lib/demo-store";

export function useOrders() {
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flashingIds, setFlashingIds] = useState<string[]>([]);
  const knownIds = useRef<Set<string> | null>(null);
  const refresh = useCallback(() => {
    try {
      const next = getOrders();
      if (knownIds.current) {
        const added = next.filter((order) => !knownIds.current?.has(order.id)).map((order) => order.id);
        if (added.length) { setFlashingIds(added); window.setTimeout(() => setFlashingIds([]), 2000); }
      }
      knownIds.current = new Set(next.map((order) => order.id));
      setOrders(next); setError("");
    } catch { setError("Не удалось прочитать заказы из localStorage."); }
    setLoading(false);
  }, []);
  useEffect(() => {
    const initial = window.setTimeout(refresh, 0);
    const interval = window.setInterval(refresh, 3000);
    window.addEventListener("storage", refresh);
    window.addEventListener(DEMO_DATA_EVENT, refresh);
    return () => {
      window.clearTimeout(initial); window.clearInterval(interval);
      window.removeEventListener("storage", refresh); window.removeEventListener(DEMO_DATA_EVENT, refresh);
    };
  }, [refresh]);
  const save = useCallback((next: DemoOrder[]) => {
    try { persistOrders(next); setOrders(next); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось сохранить заказы."); }
  }, []);
  return { orders, setOrders: save, loading, error, refresh, flashingIds };
}
