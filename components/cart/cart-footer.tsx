import { Bell, MessageCircle } from "lucide-react";
import { useDemoSettings } from "@/hooks/use-demo-settings";
import { money } from "@/lib/format";
import type { Fulfillment } from "@/lib/types";

type CartFooterProps = { total: number; fulfillment: Fulfillment; pending: boolean; table: number | null };
export function CartFooter({ total, fulfillment, pending, table }: CartFooterProps) {
  const { settings, loading } = useDemoSettings();
  const dinein = table !== null;
  const minimum = settings.minimumOrder; const belowMinimum = !dinein && fulfillment === "delivery" && total < minimum;
  const closed = !settings.acceptingOrders || (dinein && !settings.acceptingDinein);
  return <>
    <div className="space-y-1 border-t border-line pt-2 text-sm"><div className="flex justify-between text-muted"><span>Блюда</span><span>{money(total)}</span></div><div className="flex justify-between text-muted"><span>{dinein ? `Стол №${table}` : fulfillment === "pickup" ? "Самовывоз" : "Доставка"}</span><span>{dinein ? "официант подойдёт" : fulfillment === "pickup" ? money(0) : "уточним при подтверждении"}</span></div><div className="flex justify-between font-semibold text-text"><span>Итого</span><span className="text-lg font-extrabold text-accent">{money(total)}</span></div></div>
    {!settings.acceptingOrders && <p className="text-center text-sm text-muted">Сейчас заказы не принимаются</p>}
    {dinein && settings.acceptingOrders && !settings.acceptingDinein && <p className="text-center text-sm text-muted">Заказы со столов временно не принимаются</p>}
    {belowMinimum && <p className="text-center text-sm text-muted">Минимальный заказ {money(minimum)}, добавьте ещё на {money(minimum - total)}</p>}
    <button type="submit" disabled={loading || belowMinimum || closed || pending} className="press flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 font-bold text-background hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50">{dinein ? <Bell className="size-5" aria-hidden="true" /> : <MessageCircle className="size-5" aria-hidden="true" />}{pending ? "Отправляем заказ…" : dinein ? "Отправить заказ официанту" : "Оформить в WhatsApp"}</button>
    {!dinein && <p className="text-center text-xs leading-tight text-muted">Сообщение откроется в WhatsApp. Заказ будет подтверждён после отправки сообщения.</p>}
  </>;
}
