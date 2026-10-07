"use client";

import { Minus, Plus } from "lucide-react";
import { cloudImage } from "@/lib/cloudinary";
import { money } from "@/lib/format";
import type { CartLine as CartLineType } from "@/lib/types";

type CartLineProps = {
  line: CartLineType;
  onAdd: (productId: string) => void;
  onChange: (productId: string, amount: number) => void;
};

export function CartLine({ line, onAdd, onChange }: CartLineProps) {
  const { product, quantity } = line;
  return (
    <div className="flex items-center gap-1 rounded-2xl border border-line bg-surface p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cloudImage(product.image, 160)}
        alt=""
        width={64}
        height={64}
        loading="lazy"
        className="size-16 shrink-0 rounded-xl object-cover"
        onError={(event) => {
          event.currentTarget.classList.add("hidden");
          event.currentTarget.nextElementSibling?.classList.replace(
            "hidden",
            "flex",
          );
        }}
      />
      <div
        className="photo-placeholder hidden size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl"
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/favicon.jpg"
          alt=""
          className="size-full object-cover opacity-25"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 min-w-0 text-sm font-bold">{product.name}</p>
          <span className="shrink-0 whitespace-nowrap text-right text-sm font-bold text-accent">{money(product.price * quantity)}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted">{money(product.price)} за шт.</p>
          <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => onChange(product.id, -1)}
          className="press grid size-10 shrink-0 place-items-center rounded-full border border-line text-muted hover:border-accent/50 hover:text-text"
          aria-label={`Убрать один: ${product.name}`}
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <span className="min-w-5 text-center text-sm font-bold">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => onAdd(product.id)}
          className="press grid size-10 shrink-0 place-items-center rounded-full bg-accent text-background hover:bg-accent-hover"
          aria-label={`Добавить один: ${product.name}`}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
          </div>
        </div>
      </div>
    </div>
  );
}
