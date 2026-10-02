import { Bike, Instagram, MapPin, Phone } from "lucide-react";
import { CAFE } from "@/lib/config";
import { money } from "@/lib/format";
import type { DemoSettings } from "@/lib/demo-store";

export function InfoSection({ settings = { phone: CAFE.phone, whatsappNumber: CAFE.whatsappNumber, address: CAFE.address, deliveryTime: CAFE.delivery.time, minimumOrder: CAFE.delivery.minimumOrder } }: { settings?: Pick<DemoSettings, "phone" | "whatsappNumber" | "address" | "deliveryTime" | "minimumOrder"> }) {
  return (
    <section className="mt-8 grid gap-4 border-t border-line pt-6 md:grid-cols-2 lg:col-start-2" aria-label="Доставка и контакты">
      <div className="rounded-2xl bg-surface p-4">
        <h2 className="flex items-center gap-2 text-base font-semibold"><Bike className="size-5 text-accent" aria-hidden="true" />Доставка</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{settings.deliveryTime} · минимум {money(settings.minimumOrder)}. Стоимость доставки уточняйте при подтверждении заказа.</p>
        <p className="mt-2 text-sm text-muted">{settings.address}, {CAFE.city}</p>
      </div>
      <div className="rounded-2xl bg-surface p-4">
        <h2 className="flex items-center gap-2 text-base font-semibold"><Phone className="size-5 text-accent" aria-hidden="true" />Контакты</h2>
        <div className="mt-2 flex flex-col items-start gap-1 text-sm">
          <a href={`tel:${settings.phone.replace(/\\D/g, "")}`} className="press inline-flex min-h-11 items-center gap-2 font-semibold text-accent"><Phone className="size-4" aria-hidden="true" />{settings.phone}</a>
          <a href={CAFE.mapUrl} target="_blank" rel="noopener noreferrer" className="press inline-flex min-h-11 items-center gap-2 font-semibold text-accent"><MapPin className="size-4" aria-hidden="true" />Открыть карту</a>
          <a href={CAFE.instagramUrl} target="_blank" rel="noopener noreferrer" className="press inline-flex min-h-11 items-center gap-2 font-semibold text-accent"><Instagram className="size-4" aria-hidden="true" />Instagram</a>
        </div>
      </div>
    </section>
  );
}
