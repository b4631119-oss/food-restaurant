"use client";

import { useCallback, useEffect, useState } from "react";
import { DEMO_DATA_EVENT, getOrders, setOrders as persistOrders, type DemoOrder } from "@/lib/demo-store";

export function useOrders() {
  const [orders, setOrders] = useState<DemoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(() => {
    try { setOrders(getOrders()); setError(""); }
    catch { setError("Не удалось прочитать заказы из localStorage."); }
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
    persistOrders(next); setOrders(next); setError("");
  }, []);
  return { orders, setOrders: save, loading, error, refresh };
}
