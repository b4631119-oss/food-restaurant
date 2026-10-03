"use client";

import { useEffect, useState } from "react";
import menuData from "@/data/menu.json";
import { watchProducts } from "@/lib/repo/products-repo";
import { watchCategories } from "@/lib/repo/categories-repo";
import type { Product } from "@/lib/types";

export function useMenuData() {
  const [products, setProducts] = useState<Product[]>(menuData.products as Product[]);
  const [categories, setCategories] = useState<string[]>(menuData.categories as string[]);
  const [loadingProducts, setLoadingProducts] = useState(true); const [loadingCategories, setLoadingCategories] = useState(true);
  useEffect(() => {
    const stopProducts = watchProducts((items) => { setProducts(items as Product[]); setLoadingProducts(false); }, () => { setProducts(menuData.products as Product[]); setLoadingProducts(false); });
    const stopCategories = watchCategories((items) => { setCategories(items.length ? items : menuData.categories as string[]); setLoadingCategories(false); }, () => { setCategories(menuData.categories as string[]); setLoadingCategories(false); });
    return () => { stopProducts(); stopCategories(); };
  }, []);
  return { products, categories, loading: loadingProducts || loadingCategories };
}
