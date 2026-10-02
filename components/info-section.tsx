import { Bike, Instagram, MapPin, Phone } from "lucide-react";
import { CAFE } from "@/lib/config";
import { money } from "@/lib/format";

export function InfoSection() {
  return (
    <section className="mt-8 grid gap-4 border-t border-line pt-6 md:grid-cols-2 lg:col-start-2" aria-label="Доставка и контакты">
      <div className="rounded-2xl bg-surface p-4">
        <h2 className="flex items-center gap-2 text-base font-semibold"><Bike className="size-5 text-accent" aria-hidden="true" />Доставка</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{CAFE.delivery.time} · минимум {money(CAFE.delivery.minimumOrder)}. Стоимость доставки уточняйте при подтверждении заказа.</p>
        <p className="mt-2 text-sm text-muted">{CAFE.address}, {CAFE.city}</p>
      </div>
      <div className="rounded-2xl bg-surface p-4">
        <h2 className="flex items-center gap-2 text-base font-semibold"><Phone className="size-5 text-accent" aria-hidden="true" />Контакты</h2>
        <div className="mt-2 flex flex-col items-start gap-1 text-sm">
          <a href={`tel:${CAFE.phoneDigits}`} className="press inline-flex min-h-11 items-center gap-2 font-semibold text-accent"><Phone className="size-4" aria-hidden="true" />{CAFE.phone}</a>
          <a href={CAFE.mapUrl} target="_blank" rel="noopener noreferrer" className="press inline-flex min-h-11 items-center gap-2 font-semibold text-accent"><MapPin className="size-4" aria-hidden="true" />Открыть карту</a>
          <a href={CAFE.instagramUrl} target="_blank" rel="noopener noreferrer" className="press inline-flex min-h-11 items-center gap-2 font-semibold text-accent"><Instagram className="size-4" aria-hidden="true" />Instagram</a>
        </div>
      </div>
    </section>
  );
}
