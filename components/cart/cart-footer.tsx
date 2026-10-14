import { Bell } from "lucide-react";
import { useDemoSettings } from "@/hooks/use-demo-settings";
import { deliveryFee } from "@/lib/delivery";
import { money } from "@/lib/format";
import { getOpenStatus, openingTime } from "@/lib/open-status";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import type { Fulfillment } from "@/lib/types";

type CartFooterProps = { total: number; fulfillment: Fulfillment; pending: boolean; table: number | null; warning?: string };
export function CartFooter({ total, fulfillment, pending, table, warning }: CartFooterProps) {
  const { settings, loading } = useDemoSettings();
  const dinein = table !== null;
  const delivery = !dinein && fulfillment === "delivery";
  const minimum = settings.minimumOrder; const belowMinimum = delivery && total < minimum;
  const closed = !settings.acceptingOrders || (dinein && !settings.acceptingDinein);
  const fee = deliveryFee(total, fulfillment, settings);
  const freeFrom = Number(settings.freeDeliveryFrom) || 0;
  const toFree = delivery && freeFrom > 0 && total < freeFrom ? freeFrom - total : 0;
  const openAt = openingTime(settings.openingHours);
  return <>
    <div className="space-y-1.5 border-t border-line pt-3 text-sm">
      <div className="flex justify-between text-muted"><span>Блюда ({total > 0 ? "в корзине" : "0"})</span><span className="font-medium text-text">{money(total)}</span></div>
      {dinein && <div className="flex justify-between text-muted"><span>{`Стол №${table}`}</span><span className="text-accent">официант подойдёт</span></div>}
      {delivery && <div className="flex justify-between text-muted"><span>Доставка по городу</span><span className="font-medium text-text">{fee === null ? "уточним при подтверждении" : fee === 0 ? "бесплатно" : money(fee)}</span></div>}
      <div className="flex items-baseline justify-between border-t border-line/50 pt-2 font-bold text-text"><span>Итого к оплате</span><span className="text-xl font-extrabold text-accent">{delivery && fee === null ? `${money(total)} + доставка` : money(total + (fee ?? 0))}</span></div>
    </div>
    {toFree > 0 && <div className="rounded-lg bg-accent/10 px-2.5 py-1 text-center text-xs text-accent">Добавьте ещё на {money(toFree)} для бесплатной доставки!</div>}
    {!settings.acceptingOrders && <p className="text-center text-sm font-medium text-red-400">Сейчас заказы не принимаются</p>}
    {dinein && settings.acceptingOrders && !settings.acceptingDinein && <p className="text-center text-sm font-medium text-red-400">Заказы со столов временно не принимаются</p>}
    {belowMinimum && <div className="rounded-lg bg-amber-500/15 p-2 text-center text-xs font-semibold text-amber-300">Минимальный заказ для доставки — {money(minimum)}. Добавьте ещё на {money(minimum - total)}</div>}
    {getOpenStatus(new Date(), settings.openingHours).text === "Закрыто" && <p className="text-center text-xs text-muted">Сейчас ресторан закрыт. Заказ обработаем{openAt ? ` с ${openAt}` : " сразу после открытия"}.</p>}
    {warning && <p role="alert" className="text-center text-sm text-[#F87171]">{warning}</p>}
    <button type="submit" disabled={loading || belowMinimum || closed || pending} className="press flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 font-bold text-background shadow-lg hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50">{dinein ? <Bell className="size-5" aria-hidden="true" /> : <WhatsAppIcon />}{pending ? "Отправляем заказ…" : warning ? "Повторить" : "Оформить заказ"}</button>
    <p className="text-center text-xs leading-tight text-muted">{dinein ? "Сначала заказ сохраняется, затем откроется WhatsApp — отправьте его официанту." : "Заказ сохраняется в кассе, WhatsApp откроется для быстрого подтверждения."}</p>
  </>;
}
