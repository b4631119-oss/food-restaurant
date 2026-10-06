"use client";

import { useEffect, useState } from "react";
import { watchProducts } from "@/lib/repo/products-repo";
import { watchCategories } from "@/lib/repo/categories-repo";
import type { Product } from "@/lib/types";

const loadTimeoutMs = 10_000;

export function useMenuData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true); const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const productsTimer = window.setTimeout(() => { setLoadingProducts(false); setError("Не удалось загрузить меню."); }, loadTimeoutMs);
    const categoriesTimer = window.setTimeout(() => setLoadingCategories(false), loadTimeoutMs);
    const stopProducts = watchProducts((items) => { window.clearTimeout(productsTimer); setProducts(items as Product[]); setLoadingProducts(false); setError(null); }, () => { window.clearTimeout(productsTimer); setLoadingProducts(false); setError("Не удалось загрузить меню."); });
    const stopCategories = watchCategories((items) => { window.clearTimeout(categoriesTimer); setCategories(items); setLoadingCategories(false); }, () => { window.clearTimeout(categoriesTimer); setLoadingCategories(false); });
    return () => { stopProducts(); stopCategories(); window.clearTimeout(productsTimer); window.clearTimeout(categoriesTimer); };
  }, []);
  return { products, categories, loading: loadingProducts || loadingCategories, error };
}
