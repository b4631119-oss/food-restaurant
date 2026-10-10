"use client";

import type { RefObject } from "react";
import { Search, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/types";

type ProductGridProps = {
  products: Product[];
  title: string;
  groups: { category: string; products: Product[] }[];
  isAll: boolean;
  onShowAll: () => void;
  query: string;
  onQuery: (query: string) => void;
  cart: Record<string, number>;
  onAdd: (productId: string) => void;
  onChange: (productId: string, amount: number) => void;
  listRef: RefObject<HTMLDivElement | null>;
};

export function ProductGrid({ products, title, groups, isAll, onShowAll, query, onQuery, cart, onAdd, onChange, listRef }: ProductGridProps) {
  const eagerIds = new Set(products.slice(0, 4).map((product) => product.id));
  const card = (product: Product) => <ProductCard key={product.id} product={product} quantity={cart[product.id] ?? 0} eager={eagerIds.has(product.id)} onAdd={() => onAdd(product.id)} onChange={(amount) => onChange(product.id, amount)} />;
  return (
    <div ref={listRef} className="scroll-mt-[120px] pt-1">
      <label className="flex h-11 min-h-11 items-center gap-3 rounded-xl border border-line bg-surface px-3.5 focus-within:border-accent">
        <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
        <input value={query} onChange={(event) => onQuery(event.target.value)} type="text" placeholder="Найти блюдо" aria-label="Поиск по меню" className="min-w-0 flex-1 bg-transparent text-base text-text outline-none placeholder:text-muted" />
        {query && <button type="button" onClick={() => onQuery("")} aria-label="Очистить поиск" className="grid size-11 shrink-0 place-items-center text-muted hover:text-text"><X className="size-4" aria-hidden="true" /></button>}
      </label>
      <div className="mb-3 mt-4 flex items-center justify-between">
        <h2 className="section-heading font-display text-xl font-medium">{query.trim() ? "Результаты поиска" : title}</h2>
        <span className="text-sm text-muted">{products.length} блюд</span>
      </div>
      {products.length > 0 ? isAll ? (
        <div className="space-y-6">{groups.map((group) => <section key={group.category}><h2 className="section-heading mb-3 font-display text-xl font-medium">{group.category}</h2><div className="menu-grid grid grid-cols-2 items-stretch gap-3">{group.products.map(card)}</div></section>)}</div>
      ) : (
        <div className="menu-grid grid grid-cols-2 items-stretch gap-3">{products.map(card)}</div>
      ) : (
        <div className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted"><p>Ничего не найдено. Попробуйте изменить запрос.</p><button type="button" onClick={onShowAll} className="press mt-4 min-h-11 rounded-sm bg-accent px-4 font-semibold text-background hover:bg-accent-hover">Показать всё</button></div>
      )}
    </div>
  );
}
