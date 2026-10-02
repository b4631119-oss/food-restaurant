"use client";

import { Minus, Plus } from "lucide-react";
import { money, portionInfo } from "@/lib/format";
import type { Product } from "@/lib/types";

type ProductCardProps = {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onChange: (amount: number) => void;
};

export function ProductCard({ product, quantity, onAdd, onChange }: ProductCardProps) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="product-photo relative aspect-[4/3] w-full overflow-hidden bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={`${product.name} — ${product.description}`} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" onError={(event) => { event.currentTarget.closest(".product-photo")?.classList.add("hidden"); event.currentTarget.closest("article")?.classList.add("product-photo-failed"); }} />
        {quantity > 0 && <span className="absolute right-2 top-2 grid min-h-7 min-w-7 place-items-center rounded-full bg-accent px-2 text-xs font-bold text-background">{quantity}</span>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5">{product.name}</h3>
        <p className="line-clamp-2 min-h-8 text-xs leading-4 text-muted">{product.description}</p>
        <p className="text-xs text-muted">{portionInfo(product)}</p>
        <div className="mt-auto flex min-w-0 flex-nowrap items-center justify-between gap-1 pt-1">
          <span className="min-w-0 truncate text-sm font-semibold text-accent">{money(product.price)}</span>
          {quantity > 0 ? (
            <div className="flex shrink-0 items-center gap-0.5">
              <button type="button" onClick={() => onChange(-1)} className="press grid size-11 shrink-0 place-items-center rounded-full border border-line text-muted hover:border-accent/50 hover:text-text" aria-label={`Убрать один: ${product.name}`}><Minus className="size-4" aria-hidden="true" /></button>
              <span className="min-w-5 text-center text-sm font-bold">{quantity}</span>
              <button type="button" onClick={onAdd} className="press grid size-11 shrink-0 place-items-center rounded-full bg-accent text-background hover:bg-accent-hover" aria-label={`Добавить один: ${product.name}`}><Plus className="size-5" aria-hidden="true" /></button>
            </div>
          ) : (
            <button type="button" onClick={onAdd} className="press grid size-11 shrink-0 place-items-center rounded-sm bg-accent text-background hover:bg-accent-hover" aria-label={`Добавить ${product.name} в корзину`}><Plus className="size-5" aria-hidden="true" /></button>
          )}
        </div>
      </div>
    </article>
  );
}
