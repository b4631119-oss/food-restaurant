"use client";

import { Bike, Clock, Instagram, MapPin, Phone } from "lucide-react";
import { CAFE } from "@/lib/config";
import { useDemoSettings } from "@/hooks/use-demo-settings";
import { money } from "@/lib/format";
import { mapLink } from "@/lib/map";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

export function Footer() {
  const { settings } = useDemoSettings();
  return (
    <footer className="mx-auto mb-[env(safe-area-inset-bottom,0px)] w-full max-w-[1200px] px-4 pb-24 pt-8 text-sm text-muted sm:px-8 lg:mb-0 lg:px-6 lg:pb-8">
      <div className="grid gap-6 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-2 text-base font-semibold text-text">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/favicon.jpg" alt="" className="size-10 rounded-full border border-accent/40 object-cover" />
            {CAFE.name}
          </p>
          <p className="mt-2 text-xs">{CAFE.city}</p>
        </div>
        <div>
          <p className="flex items-center gap-2 font-semibold text-text"><MapPin className="size-4 text-accent" aria-hidden="true" />Адрес</p>
          <p className="mt-2">{settings.address}, {CAFE.city}</p>
          <a href={mapLink({ address: settings.address, mapUrl: settings.mapUrl })} target="_blank" rel="noopener noreferrer" className="press mt-1 inline-flex min-h-11 items-center gap-2 font-semibold text-accent">Как проехать</a>
        </div>
        <div>
          <p className="flex items-center gap-2 font-semibold text-text"><Phone className="size-4 text-accent" aria-hidden="true" />Контакты</p>
          <a href={`tel:${settings.phone.replace(/\D/g, "")}`} className="press mt-1 inline-flex min-h-11 items-center gap-2 font-semibold text-accent">{settings.phone}</a>
          <div className="mt-1 flex gap-2">
            <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="press grid size-11 place-items-center rounded-lg border border-line text-accent"><WhatsAppIcon /></a>
            <a href={CAFE.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="press grid size-11 place-items-center rounded-lg border border-line text-accent"><Instagram className="size-5" aria-hidden="true" /></a>
          </div>
        </div>
        <div>
          <p className="flex items-center gap-2 font-semibold text-text"><Clock className="size-4 text-accent" aria-hidden="true" />График работы</p>
          <p className="mt-2">{settings.openingHours}</p>
          <p className="mt-3 flex items-center gap-2 font-semibold text-text"><Bike className="size-4 text-accent" aria-hidden="true" />Доставка</p>
          <p className="mt-1">{settings.deliveryTime} · минимум {money(settings.minimumOrder)}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-1 border-t border-line pt-4 text-xs">
        <span>© 2026 {CAFE.name}</span>
        <span>Сайт разработал <a href="https://portfolio-devroot.vercel.app" target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">bilolidin</a></span>
      </div>
    </footer>
  );
}
