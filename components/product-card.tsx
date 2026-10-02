"use client";

import { Plus } from "lucide-react";
import { money, portionInfo } from "@/lib/format";
import type { Product } from "@/lib/types";

type ProductCardProps = { product: Product; onAdd: (productId: string) => void };

export function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="product-photo relative aspect-[4/3] w-full overflow-hidden bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={`${product.name} — ${product.description}`} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" onError={(event) => { event.currentTarget.closest(".product-photo")?.classList.add("hidden"); event.currentTarget.closest("article")?.classList.add("product-photo-failed"); }} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5">{product.name}</h3>
        <p className="line-clamp-2 min-h-8 text-xs leading-4 text-muted">{product.description}</p>
        <p className="text-xs text-muted">{portionInfo(product)}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-sm font-semibold text-accent">{money(product.price)}</span>
          <button type="button" onClick={() => onAdd(product.id)} className="press grid size-11 shrink-0 place-items-center rounded-sm bg-accent text-background hover:bg-accent-hover" aria-label={`Добавить ${product.name} в корзину`}><Plus className="size-5" aria-hidden="true" /></button>
        </div>
      </div>
    </article>
  );
}
