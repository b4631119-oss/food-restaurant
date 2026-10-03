import { MessageCircle } from "lucide-react";
import { useDemoSettings } from "@/hooks/use-demo-settings";
import { money } from "@/lib/format";
import type { Fulfillment } from "@/lib/types";

type CartFooterProps = { total: number; fulfillment: Fulfillment };
export function CartFooter({ total, fulfillment }: CartFooterProps) {
  const { settings, loading } = useDemoSettings();
  const minimum = settings.minimumOrder; const belowMinimum = fulfillment === "delivery" && total < minimum;
  return <>
    <div className="space-y-1 border-t border-line pt-2 text-sm"><div className="flex justify-between text-muted"><span>Блюда</span><span>{money(total)}</span></div><div className="flex justify-between text-muted"><span>{fulfillment === "pickup" ? "Самовывоз" : "Доставка"}</span><span>{fulfillment === "pickup" ? money(0) : "уточним при подтверждении"}</span></div><div className="flex justify-between font-semibold text-text"><span>Итого</span><span className="text-lg font-extrabold text-accent">{money(total)}</span></div></div>
    {!settings.acceptingOrders && <p className="text-center text-sm text-muted">Сейчас заказы не принимаются</p>}
    {belowMinimum && <p className="text-center text-sm text-muted">Минимальный заказ {money(minimum)}, добавьте ещё на {money(minimum - total)}</p>}
    <button type="submit" disabled={loading || belowMinimum || !settings.acceptingOrders} className="press flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 font-bold text-background hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"><MessageCircle className="size-5" aria-hidden="true" />Оформить в WhatsApp</button>
    <p className="text-center text-xs leading-tight text-muted">Сообщение откроется в WhatsApp. Заказ будет подтверждён после отправки сообщения.</p>
  </>;
}
