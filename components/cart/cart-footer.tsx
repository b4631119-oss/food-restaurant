import { MessageCircle } from "lucide-react";
import { money } from "@/lib/format";

type CartFooterProps = { total: number };

export function CartFooter({ total }: CartFooterProps) {
  return (
    <>
      <div className="flex items-center justify-between border-t border-line pt-2">
        <span className="text-sm font-semibold text-muted">Итого</span>
        <span className="text-lg font-extrabold text-accent">
          {money(total)}
        </span>
      </div>
      <button
        type="submit"
        className="press flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 font-bold text-background hover:bg-accent-hover"
      >
        <MessageCircle className="size-5" aria-hidden="true" />
        Оформить в WhatsApp
      </button>
      <p className="text-center text-[10px] leading-tight text-muted">
        Сообщение откроется в WhatsApp. Заказ будет подтверждён после отправки
        сообщения.
      </p>
    </>
  );
}
