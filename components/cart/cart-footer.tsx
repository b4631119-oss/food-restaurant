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
    <div className="space-y-1 border-t border-line pt-2 text-sm"><div className="flex justify-between text-muted"><span>Блюда</span><span>{money(total)}</span></div>{dinein && <div className="flex justify-between text-muted"><span>{`Стол №${table}`}</span><span>официант подойдёт</span></div>}{delivery && <div className="flex justify-between text-muted"><span>Доставка</span><span>{fee === null ? "уточним при подтверждении" : fee === 0 ? "бесплатно" : money(fee)}</span></div>}<div className="flex justify-between font-semibold text-text"><span>Итого к оплате</span><span className="text-lg font-extrabold text-accent">{delivery && fee === null ? `${money(total)} + доставка` : money(total + (fee ?? 0))}</span></div></div>
    {toFree > 0 && <p className="text-center text-xs text-muted">Добавьте ещё на {money(toFree)}, и доставка бесплатная</p>}
    {!settings.acceptingOrders && <p className="text-center text-sm text-muted">Сейчас заказы не принимаются</p>}
    {dinein && settings.acceptingOrders && !settings.acceptingDinein && <p className="text-center text-sm text-muted">Заказы со столов временно не принимаются</p>}
    {belowMinimum && <p className="text-center text-sm text-muted">Минимальный заказ {money(minimum)}, добавьте ещё на {money(minimum - total)}</p>}
    {getOpenStatus(new Date(), settings.openingHours).text === "Закрыто" && <p className="text-center text-sm text-muted">Сейчас закрыто. Заказ обработаем{openAt ? ` с ${openAt}` : " после открытия"}.</p>}
    {warning && <p role="alert" className="text-center text-sm text-[#F87171]">{warning}</p>}
    <button type="submit" disabled={loading || belowMinimum || closed || pending} className="press flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 font-bold text-background hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50">{dinein ? <Bell className="size-5" aria-hidden="true" /> : <WhatsAppIcon />}{pending ? "Отправляем заказ…" : dinein ? "Отправить заказ официанту" : "Оформить заказ"}</button>
    {!dinein && <p className="text-center text-xs leading-tight text-muted">Мы получим заказ и свяжемся с вами. WhatsApp откроется для подтверждения.</p>}
  </>;
}
