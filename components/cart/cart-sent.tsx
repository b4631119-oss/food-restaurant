"use client";

import { Check, MessageCircle } from "lucide-react";

type CartSentProps = { receiptUrl: string; onClearAndClose: () => void };

export function CartSent({ receiptUrl, onClearAndClose }: CartSentProps) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-accent/10 text-accent"><Check className="size-8" aria-hidden="true" /></span>
      <p className="mt-5 max-w-sm leading-relaxed text-muted">Заказ принят. Мы свяжемся с вами для подтверждения. Чтобы ускорить, отправьте готовое сообщение в WhatsApp.</p>
      <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="press mt-6 inline-flex min-h-12 items-center gap-2 rounded-sm bg-accent px-5 font-semibold text-background hover:bg-accent-hover">Открыть WhatsApp <MessageCircle className="size-4" aria-hidden="true" /></a>
      <button type="button" onClick={onClearAndClose} className="mt-4 py-2 text-sm font-semibold text-muted hover:text-text">Очистить корзину и закрыть</button>
    </div>
  );
}
