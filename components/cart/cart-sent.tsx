"use client";

import { Check } from "lucide-react";
import { useDemoSettings } from "@/hooks/use-demo-settings";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import type { Fulfillment } from "@/lib/types";

type CartSentProps = { receiptUrl: string; orderNumber: number; table: number | null; fulfillment: Fulfillment; onClearAndClose: () => void; onOrderMore: () => void };

export function CartSent({ receiptUrl, orderNumber, table, fulfillment, onClearAndClose, onOrderMore }: CartSentProps) {
  const { settings } = useDemoSettings();
  if (table !== null) return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-accent/10 text-accent"><Check className="size-8" aria-hidden="true" /></span>
      <p className="mt-5 max-w-sm text-lg font-bold leading-relaxed">Заказ №{orderNumber} принят, стол {table}. Официант скоро подойдёт.</p>
      <button type="button" onClick={onOrderMore} className="press mt-6 inline-flex min-h-12 items-center rounded-xl bg-accent px-6 font-bold text-background hover:bg-accent-hover">Заказать ещё</button>
    </div>
  );
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-accent/10 text-accent"><Check className="size-8" aria-hidden="true" /></span>
      <p className="mt-5 text-2xl font-extrabold">Заказ №{orderNumber} принят</p>
      <p className="mt-2 max-w-sm leading-relaxed text-muted">Мы позвоним вам для подтверждения</p>
      <p className="mt-4 text-sm font-semibold text-text">Время: {fulfillment === "delivery" ? settings.deliveryTime : "примерно 20–30 минут"}</p>
      {settings.paymentMethods.trim() && <p className="mt-1 text-sm text-muted">Оплата: {settings.paymentMethods}</p>}
      <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="press mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent px-6 font-bold text-background hover:bg-accent-hover">Открыть WhatsApp <WhatsAppIcon /></a>
      <button type="button" onClick={onOrderMore} className="press mt-3 inline-flex min-h-11 items-center rounded-xl border border-line px-6 font-semibold">Заказать ещё</button>
      <button type="button" onClick={onClearAndClose} className="mt-2 py-2 text-sm font-semibold text-muted hover:text-text">Закрыть</button>
    </div>
  );
}
