"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { updateOrder, watchOrders } from "@/lib/repo/orders-repo";
import type { DemoOrder } from "@/lib/models";

export function useOrders() {
  const [orders, setOrders] = useState<DemoOrder[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [flashingIds, setFlashingIds] = useState<string[]>([]);
  const known = useRef<Set<string> | null>(null);
  useEffect(() => watchOrders((next) => {
    if (known.current) { const added = next.filter((order) => !known.current?.has(order.id)).map((order) => order.id); if (added.length) { setFlashingIds(added); window.setTimeout(() => setFlashingIds([]), 2000); } }
    known.current = new Set(next.map((order) => order.id)); setOrders(next); setError(""); setLoading(false);
  }, (cause) => { setError(cause.message || "Не удалось загрузить заказы из Firebase."); setLoading(false); }), []);
  const patchOrders = useCallback((next: DemoOrder[]) => {
    const previous = new Map(orders.map((order) => [order.id, order]));
    next.forEach((order) => { const old = previous.get(order.id); if (!old || old.status !== order.status) void updateOrder(order.id, { status: order.status }).catch(() => setError("Не удалось сохранить заказ в Firebase.")); });
    setOrders(next);
  }, [orders]);
  return { orders, setOrders: patchOrders, loading, error, flashingIds };
}
