"use client";

import { ImageOff, Minus, Plus } from "lucide-react";
import { cloudImage } from "@/lib/cloudinary";
import { money, portionInfo } from "@/lib/format";
import type { Product } from "@/lib/types";

type ProductCardProps = {
  product: Product;
  quantity: number;
  eager?: boolean;
  onAdd: () => void;
  onChange: (amount: number) => void;
};

export function ProductCard({ product, quantity, eager = false, onAdd, onChange }: ProductCardProps) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="product-photo relative aspect-[4/3] w-full overflow-hidden bg-surface">
        {product.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={cloudImage(product.image, 600)} alt={product.name} width={600} height={450} loading={eager ? "eager" : "lazy"} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" onError={(event) => { event.currentTarget.closest(".product-photo")?.classList.add("hidden"); event.currentTarget.closest("article")?.classList.add("product-photo-failed"); }} />
        ) : (
          <div className="grid size-full place-items-center text-muted" aria-hidden="true"><ImageOff className="size-8" /></div>
        )}
        {quantity > 0 && <span className="absolute right-2 top-2 grid min-h-7 min-w-7 place-items-center rounded-full bg-accent px-2 text-xs font-bold text-background shadow-md">{quantity}</span>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 [overflow-wrap:anywhere]">{product.name}</h3>
        <p className="line-clamp-2 min-h-8 text-sm leading-5 text-muted [overflow-wrap:anywhere]">{product.description}</p>
        <p className="text-xs text-muted">{portionInfo(product)}</p>
        <div className="mt-auto flex min-w-0 flex-nowrap items-center justify-between gap-1 pt-1">
          <span className="min-w-0 truncate text-sm font-bold text-accent">{money(product.price)}</span>
          {quantity > 0 ? (
            <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-line bg-background/50 p-0.5">
              <button type="button" onClick={() => onChange(-1)} className="press grid size-11 shrink-0 place-items-center rounded-full text-muted hover:text-text" aria-label={`Убрать один: ${product.name}`}><Minus className="size-4" aria-hidden="true" /></button>
              <span className="min-w-5 text-center text-sm font-bold text-accent">{quantity}</span>
              <button type="button" onClick={onAdd} className="press grid size-11 shrink-0 place-items-center rounded-full bg-accent text-background hover:bg-accent-hover" aria-label={`Добавить один: ${product.name}`}><Plus className="size-5" aria-hidden="true" /></button>
            </div>
          ) : (
            <button type="button" onClick={onAdd} className="press grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-background shadow-sm hover:bg-accent-hover" aria-label={`Добавить ${product.name} в корзину`}><Plus className="size-5" aria-hidden="true" /></button>
          )}
        </div>
      </div>
    </article>
  );
}
