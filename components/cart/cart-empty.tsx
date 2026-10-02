"use client";

import { ShoppingBag } from "lucide-react";

type CartEmptyProps = { onGoMenu: () => void };

export function CartEmpty({ onGoMenu }: CartEmptyProps) {
  return (
    <div className="px-6 py-10 text-center">
      <ShoppingBag className="mx-auto size-9 text-accent" aria-hidden="true" />
      <p className="mt-4 font-bold">Корзина пока пуста</p>
      <p className="mt-1 text-sm text-muted">
        Добавьте блюда из меню — они появятся здесь.
      </p>
      <button
        type="button"
        onClick={onGoMenu}
        className="press mt-5 rounded-xl bg-accent px-5 py-3 font-bold text-background hover:bg-accent-hover"
      >
        К меню
      </button>
    </div>
  );
}
