"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getProducts } from "@/lib/repo/products-repo";
import { getCategories } from "@/lib/repo/categories-repo";
import { getMenuDoc, menuDocToStorefront, type MenuDoc } from "@/lib/repo/menu-repo";
import { readRecord, readStaleRecord, writeRecord } from "@/lib/menu-cache";
import { warnFirestore } from "@/lib/firestore-log";
import type { Product } from "@/lib/types";

type MenuData = { products: Product[]; categories: string[] };
const cacheName = "menu";
const FOCUS_CHECK_MS = 30_000;

// Запасной снимок с самого сайта: нужен, когда Firestore недоступен, а кэша на устройстве нет.
async function loadFallbackFile(): Promise<MenuData | null> {
  try {
    const response = await fetch("/menu-fallback.json", { cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json()) as unknown;
    if (Array.isArray(payload)) {
      const products = payload as Product[];
      return products.length ? { products, categories: [...new Set(products.map((product) => product.category))] } : null;
    }
    if (payload && typeof payload === "object") {
      const data = payload as Partial<MenuDoc>;
      if (!Array.isArray(data.products) || !data.products.length) return null;
      return menuDocToStorefront({ updatedAt: String(data.updatedAt ?? ""), categories: Array.isArray(data.categories) ? data.categories : [], products: data.products });
    }
    return null;
  } catch { return null; }
}

// Одновременные монтирования (React StrictMode, возврат на страницу) переиспользуют один запрос.
let pending: Promise<MenuData> | null = null;
// Сначала одно чтение документа menu/public. Если документа ещё нет (меню не опубликовано)
// или правила его не пускают, работает прежний путь через коллекции — витрина ничего не теряет,
// поэтому порядок «опубликовать правила → нажать кнопку» на работу сайта не влияет.
async function loadMenuFromFirestore(): Promise<MenuData> {
  try {
    const data = await getMenuDoc();
    if (data) return menuDocToStorefront(data);
  } catch (cause) { warnFirestore("menu:doc", cause); }
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return { products, categories };
}

function loadMenu(): Promise<MenuData> {
  if (!pending) pending = loadMenuFromFirestore().finally(() => { pending = null; });
  return pending;
}

export function useMenuData() {
  const [data, setData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const checkedAt = useRef(0);

  useEffect(() => {
    let cancelled = false;
    // Свежий кэш (не старше 15 минут) — сеть не трогаем: это главный способ сэкономить чтения.
    const fresh = readRecord<MenuData>(cacheName);
    if (fresh) {
      window.setTimeout(() => { if (!cancelled) { setData(fresh.value); setLoading(false); setError(null); } }, 0);
      return () => { cancelled = true; };
    }
    const stale = readStaleRecord<MenuData>(cacheName);
    // Устаревший кэш показываем сразу, а обновляем в фоне.
    if (stale) window.setTimeout(() => { if (!cancelled) { setData(stale.value); setLoading(false); } }, 0);
    void (async () => {
      try {
        const menu = await loadMenu();
        if (cancelled) return;
        writeRecord(cacheName, menu, 0);
        setData(menu); setLoading(false); setError(null);
      } catch (cause) {
        if (cancelled) return;
        warnFirestore("menu", cause);
        setLoading(false);
        // Кэш любого возраста лучше пустого экрана; без кэша показываем файл-снимок с сайта.
        if (stale) { setError(null); return; }
        const fallback = await loadFallbackFile();
        if (cancelled) return;
        if (fallback) { setData(fallback); setError(null); } else setError("Меню не загрузилось");
      }
    })();
    return () => { cancelled = true; };
  }, [attempt]);

  // Возврат к вкладке: если кэш уже устарел, тихо обновляем меню в фоне.
  useEffect(() => {
    checkedAt.current = Date.now(); // первый возможный опрос — через FOCUS_CHECK_MS после открытия
    const check = () => {
      if (document.visibilityState !== "visible" || Date.now() - checkedAt.current < FOCUS_CHECK_MS) return;
      checkedAt.current = Date.now();
      if (readRecord<MenuData>(cacheName)) return; // кэш свежий — обновлять нечего
      void loadMenu().then((menu) => { writeRecord(cacheName, menu, 0); setData(menu); setError(null); })
        .catch((cause: unknown) => warnFirestore("menu:refresh", cause));
    };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => { document.removeEventListener("visibilitychange", check); window.removeEventListener("focus", check); };
  }, []);

  const retry = useCallback(() => { setLoading(true); setError(null); setAttempt((value) => value + 1); }, []);
  return { products: data?.products ?? [], categories: data?.categories ?? [], loading, error, retry };
}
