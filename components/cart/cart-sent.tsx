"use client";

import { Check } from "lucide-react";
import { useDemoSettings } from "@/hooks/use-demo-settings";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import type { Fulfillment } from "@/lib/types";

type CartSentProps = { receiptUrl: string; orderNumber: number; table: number | null; fulfillment: Fulfillment; onClearAndClose: () => void; onOrderMore: () => void };

export function CartSent({ receiptUrl, orderNumber, table, fulfillment, onClearAndClose, onOrderMore }: CartSentProps) {
  const { settings } = useDemoSettings();
  const dinein = table !== null;
  const seconds = `Время: ${fulfillment === "delivery" ? settings.deliveryTime : "примерно 20–30 минут"}`;
  const detail = dinein ? "Официант скоро подойдёт" : ["Мы позвоним вам для подтверждения", seconds, settings.paymentMethods.trim() ? `Оплата: ${settings.paymentMethods}` : ""].filter(Boolean).join(" · ");
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-accent/10 text-accent"><Check className="size-8" aria-hidden="true" /></span>
      <p className="mt-5 text-2xl font-extrabold">{`Заказ №${orderNumber} оформлен`}</p>
      <p role="alert" className="mt-3 max-w-sm text-base font-bold text-[#F87171]">Нажмите «Отправить» в WhatsApp, иначе заказ не дойдёт до кафе</p>
      <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="press mt-5 inline-flex min-h-14 w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-accent px-6 text-lg font-bold text-background hover:bg-accent-hover">{dinein ? "Отправить официанту в WhatsApp" : "Открыть WhatsApp"} <WhatsAppIcon /></a>
      <button type="button" onClick={onOrderMore} className="press mt-3 inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-xl border border-line px-6 font-semibold">Заказать ещё</button>
      <p className="mt-4 text-sm text-muted">{detail}</p>
      <button type="button" onClick={onClearAndClose} className="mt-1 py-2 text-sm font-semibold text-muted hover:text-text">Закрыть</button>
    </div>
  );
}
