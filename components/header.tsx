"use client";

import { ShoppingBag } from "lucide-react";
import { CAFE } from "@/lib/config";

type HeaderProps = { itemCount: number; onOpenCart: () => void };

export function Header({ itemCount, onOpenCart }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 border-b border-line bg-background/95 px-4 py-3 backdrop-blur sm:px-8 lg:px-6">
      <a href="#top" className="flex min-w-0 items-center gap-3" aria-label={`${CAFE.name} — главная`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/favicon.jpg" alt="" width={36} height={36} decoding="async" className="size-9 shrink-0 rounded-full border border-accent/50 object-cover" />
        <span className="truncate font-bold leading-tight">Sushi Bar №1</span>
      </a>
      <button type="button" onClick={onOpenCart} aria-label={`Открыть корзину, ${itemCount} товаров`} className="press inline-flex min-h-11 shrink-0 items-center gap-2 px-2 text-sm font-semibold">
        <ShoppingBag className="size-4 text-accent" aria-hidden="true" />
        <span>Корзина</span>{itemCount > 0 && <span className="grid min-w-6 place-items-center text-xs font-semibold text-accent">{itemCount}</span>}
      </button>
    </header>
  );
}
