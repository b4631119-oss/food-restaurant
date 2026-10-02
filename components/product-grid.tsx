"use client";

import type { RefObject } from "react";
import { Search, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

type ProductGridProps = {
  products: Product[];
  title: string;
  query: string;
  onQuery: (query: string) => void;
  onAdd: (productId: string) => void;
  listRef: RefObject<HTMLDivElement | null>;
};

export function ProductGrid({ products, title, query, onQuery, onAdd, listRef }: ProductGridProps) {
  return (
    <div ref={listRef} className="scroll-mt-28 pt-1">
      <label className="flex min-h-11 items-center gap-3 rounded-xl border border-line bg-surface px-3.5 focus-within:border-accent">
        <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
        <input value={query} onChange={(event) => onQuery(event.target.value)} type="search" placeholder="Найти блюдо" aria-label="Поиск по меню" className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted" />
        {query && <button type="button" onClick={() => onQuery("")} aria-label="Очистить поиск" className="grid size-8 shrink-0 place-items-center text-muted hover:text-text"><X className="size-4" aria-hidden="true" /></button>}
      </label>
      <div className="mb-3 mt-4 flex items-center justify-between">
        <h2 className="section-heading font-display text-xl font-medium">{query.trim() ? "Результаты поиска" : title}</h2>
        <span className="text-xs text-muted">{products.length} блюд</span>
      </div>
      {products.length > 0 ? (
        <div className="menu-grid grid grid-cols-2 items-stretch gap-3">
          {products.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} />)}
        </div>
      ) : (
        <p className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">Ничего не найдено. Попробуйте изменить запрос.</p>
      )}
    </div>
  );
}
