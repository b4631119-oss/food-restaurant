"use client";

import { Phone, ShoppingBag } from "lucide-react";
import { CAFE } from "@/lib/config";
import { money } from "@/lib/format";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

type MobileBarProps = {
  itemCount: number;
  total: number;
  pulse: boolean;
  onOpenCart: () => void;
  phone?: string;
  whatsappNumber?: string;
};

export function MobileBar({
  itemCount,
  total,
  pulse,
  onOpenCart,
  phone = CAFE.phone,
  whatsappNumber = CAFE.whatsappNumber,
}: MobileBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 safe-bottom border-t border-accent/25 bg-background/95 px-2 pt-2 backdrop-blur lg:hidden">
      <div
        className={`mx-auto grid w-full max-w-2xl gap-2 ${itemCount > 0 ? "grid-cols-[auto_auto_minmax(0,1fr)]" : "grid-cols-[auto_auto] justify-center"}`}
      >
        <a
          href={`tel:${phone.replace(/\D/g, "")}`}
          aria-label="Позвонить"
          className="press grid size-12 place-items-center rounded-xl border border-line bg-surface text-accent"
        >
          <Phone className="size-5" aria-hidden="true" />
        </a>
        <a
          href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Написать в WhatsApp"
          className="press grid size-12 place-items-center rounded-xl border border-line bg-surface text-accent"
        >
          <WhatsAppIcon />
        </a>
        {itemCount > 0 && (
          <button
            type="button"
            onClick={onOpenCart}
            className={`press accent-shadow flex min-h-12 min-w-0 items-center justify-between gap-2 rounded-xl bg-accent px-3 text-sm font-bold text-background hover:bg-accent-hover ${pulse ? "cart-pulse" : ""}`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <ShoppingBag className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Корзина · {itemCount}</span>
            </span>
            <span className="shrink-0">{money(total)}</span>
          </button>
        )}
      </div>
    </div>
  );
}
