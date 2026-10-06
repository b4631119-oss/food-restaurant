"use client";

import { useEffect, useState } from "react";
import { Bike, Instagram, MapPin, Phone } from "lucide-react";
import { CAFE } from "@/lib/config";
import { money } from "@/lib/format";
import { mapLink } from "@/lib/map";
import { getOpenStatus, type OpenStatus } from "@/lib/open-status";
import { MapBlock } from "@/components/map-block";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import type { DemoSettings } from "@/lib/models";

type Info = Pick<DemoSettings, "phone" | "whatsappNumber" | "address" | "deliveryTime" | "minimumOrder" | "deliveryCost" | "paymentMethods" | "openingHours" | "mapUrl">;
const defaults: Info = { phone: CAFE.phone, whatsappNumber: CAFE.whatsappNumber, address: CAFE.address, deliveryTime: CAFE.delivery.time, minimumOrder: CAFE.delivery.minimumOrder, deliveryCost: "", paymentMethods: "", openingHours: CAFE.openingHours, mapUrl: CAFE.mapUrl };

export function InfoSection({ settings = defaults }: { settings?: Info }) {
  const [status, setStatus] = useState<OpenStatus | null>(null);
  useEffect(() => { const timer = window.setTimeout(() => setStatus(getOpenStatus(new Date(), settings.openingHours)), 0); return () => window.clearTimeout(timer); }, [settings.openingHours]);
  return (
    <section id="contacts" aria-label="Доставка и контакты" className="mx-auto w-full max-w-[1200px] scroll-mt-16 px-4 py-8 sm:px-8 lg:px-6">
      <div className="grid items-stretch gap-4 md:grid-cols-2">
        <article className="flex flex-col rounded-2xl bg-surface p-4">
          <h2 className="flex items-center gap-2 text-base font-semibold"><Bike className="size-5 text-accent" aria-hidden="true" />Доставка</h2>
          <div className="mt-3 space-y-1 text-sm leading-6 text-muted">
            <p>Время доставки: {settings.deliveryTime}</p>
            <p>Минимальный заказ: {money(settings.minimumOrder)}</p>
            {settings.deliveryCost.trim() && <p>Стоимость доставки: {settings.deliveryCost}</p>}
            {settings.paymentMethods.trim() && <p>Способы оплаты: {settings.paymentMethods}</p>}
          </div>
          <div className="mt-auto pt-4">
            <a href={mapLink({ address: settings.address, mapUrl: settings.mapUrl })} target="_blank" rel="noopener noreferrer" className="press inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold"><MapPin className="size-4" aria-hidden="true" />Как проехать</a>
          </div>
        </article>
        <article className="flex flex-col rounded-2xl bg-surface p-4">
          <h2 className="flex items-center gap-2 text-base font-semibold"><Phone className="size-5 text-accent" aria-hidden="true" />Контакты</h2>
          <div className="mt-3 space-y-2 text-sm leading-6 text-muted">
            <p>{settings.address}, {CAFE.city}</p>
            <p className="flex flex-wrap items-center gap-2">График: {settings.openingHours}{status && <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs font-semibold text-text"><span className={`size-2 rounded-full ${status.isOpen ? "bg-emerald-400" : "bg-red-400"}`} aria-hidden="true" />{status.text}</span>}</p>
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
            <a href={`tel:${settings.phone.replace(/\D/g, "")}`} className="press inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-background"><Phone className="size-4" aria-hidden="true" />Позвонить</a>
            <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="press inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold"><WhatsAppIcon />WhatsApp</a>
            <a href={CAFE.instagramUrl} target="_blank" rel="noopener noreferrer" className="press inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold"><Instagram className="size-4" aria-hidden="true" />Instagram</a>
          </div>
        </article>
      </div>
      <MapBlock address={settings.address} openingHours={settings.openingHours} mapUrl={settings.mapUrl} />
    </section>
  );
}
