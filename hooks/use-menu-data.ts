"use client";

import { useCallback, useEffect, useState } from "react";
import { getProducts } from "@/lib/repo/products-repo";
import { getCategories } from "@/lib/repo/categories-repo";
import { readCache, writeCache } from "@/lib/menu-cache";
import type { Product } from "@/lib/types";

type MenuCache = { products: Product[]; categories: string[] };
const cacheName = "menu";

export function useMenuData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const cached = readCache<MenuCache>(cacheName);
    if (cached) window.setTimeout(() => { if (!cancelled) { setProducts(cached.products); setCategories(cached.categories); setLoading(false); } }, 0);
    void Promise.all([getProducts(), getCategories()]).then(([items, names]) => {
      if (cancelled) return;
      writeCache(cacheName, { products: items, categories: names });
      setProducts(items); setCategories(names); setLoading(false); setError(null);
    }).catch(() => {
      if (cancelled) return;
      setLoading(false);
      if (!cached) setError("Меню не загрузилось");
    });
    return () => { cancelled = true; };
  }, [attempt]);
  const retry = useCallback(() => { setLoading(true); setError(null); setAttempt((value) => value + 1); }, []);
  return { products, categories, loading, error, retry };
}
