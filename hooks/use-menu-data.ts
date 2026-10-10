"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getProducts } from "@/lib/repo/products-repo";
import { getCategories } from "@/lib/repo/categories-repo";
import { readSyncVersion } from "@/lib/repo/settings-repo";
import { readRecord, writeRecord } from "@/lib/menu-cache";
import type { Product } from "@/lib/types";

type MenuData = { products: Product[]; categories: string[] };
const cacheName = "menu";
const FOCUS_CHECK_MS = 30_000;

// Одновременные монтирования (React StrictMode, возврат на страницу) переиспользуют один запрос.
let pending: Promise<MenuData> | null = null;
function loadMenu(): Promise<MenuData> {
  if (!pending) pending = Promise.all([getProducts(), getCategories()])
    .then(([products, categories]) => ({ products, categories }))
    .finally(() => { pending = null; });
  return pending;
}

export function useMenuData() {
  const [data, setData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const applied = useRef<number | null>(null);
  const checkedAt = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const cached = readRecord<MenuData>(cacheName);
    if (cached) window.setTimeout(() => { if (!cancelled) { setData(cached.value); setLoading(false); } }, 0);
    void (async () => {
      // Быстрая проверка: читаем только документ версии. Совпала с кэшем — коллекции не трогаем.
      const version = await readSyncVersion();
      if (cancelled) return;
      if (cached && version !== null && version === cached.version) {
        applied.current = version; setData(cached.value); setLoading(false); setError(null);
        return;
      }
      try {
        const fresh = await loadMenu();
        if (cancelled) return;
        writeRecord(cacheName, fresh, version ?? 0);
        applied.current = version ?? 0;
        setData(fresh); setLoading(false); setError(null);
      } catch {
        if (cancelled) return;
        setLoading(false);
        if (!cached) setError("Меню не загрузилось");
      }
    })();
    return () => { cancelled = true; };
  }, [attempt]);

  // Возврат к вкладке: проверка версии не чаще раза в 30 секунд, при изменении — фоновое обновление.
  useEffect(() => {
    checkedAt.current = Date.now(); // первый возможный опрос — через FOCUS_CHECK_MS после открытия
    const check = () => {
      if (document.visibilityState !== "visible" || Date.now() - checkedAt.current < FOCUS_CHECK_MS) return;
      checkedAt.current = Date.now();
      void readSyncVersion(true).then((version) => {
        if (version !== null && version !== applied.current) setAttempt((value) => value + 1);
      });
    };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => { document.removeEventListener("visibilitychange", check); window.removeEventListener("focus", check); };
  }, []);

  const retry = useCallback(() => { setLoading(true); setError(null); setAttempt((value) => value + 1); }, []);
  return { products: data?.products ?? [], categories: data?.categories ?? [], loading, error, retry };
}
