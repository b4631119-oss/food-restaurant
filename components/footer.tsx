"use client";

import { Instagram, Phone } from "lucide-react";
import { CAFE } from "@/lib/config";
import { useDemoSettings } from "@/hooks/use-demo-settings";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

const devLink = "https://portfolio-devroot.vercel.app";

export function Footer() {
  const { settings } = useDemoSettings();
  return (
    <footer className="w-full border-t border-accent/25 bg-[#08111F] pb-[calc(6rem_+_env(safe-area-inset-bottom,0px))] pt-10 text-sm text-muted lg:pb-8">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center gap-6 px-4 sm:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:px-6">
        <div className="flex items-center gap-3 lg:justify-self-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/favicon.jpg" alt="" className="size-10 rounded-full border border-accent/40 object-cover" />
          <div><p className="text-base font-semibold text-text">{CAFE.name}</p><p className="text-xs">Суши и роллы · {CAFE.city}</p></div>
        </div>
        <nav className="flex items-center gap-5 text-sm font-semibold lg:justify-self-center">
          <a href="#menu" className="press inline-flex min-h-11 items-center hover:text-accent">Меню</a>
          <a href="#contacts" className="press inline-flex min-h-11 items-center hover:text-accent">Доставка и контакты</a>
          <a href={`tel:${settings.phone.replace(/\D/g, "")}`} className="press inline-flex min-h-11 items-center gap-2 hover:text-accent"><Phone className="size-4" aria-hidden="true" />Позвонить</a>
        </nav>
        <div className="flex items-center gap-3 lg:justify-self-end">
          <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="press grid size-11 place-items-center rounded-full border border-line text-accent hover:border-accent/40"><WhatsAppIcon /></a>
          <a href={CAFE.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="press grid size-11 place-items-center rounded-full border border-line text-accent hover:border-accent/40"><Instagram className="size-5" aria-hidden="true" /></a>
        </div>
      </div>
      <div className="mx-auto mt-6 w-full max-w-[1200px] px-4 text-xs sm:px-8 lg:px-6">
        <div className="flex flex-col items-center gap-1 border-t border-line pt-4 lg:flex-row lg:justify-between">
          <span>© 2026 {CAFE.name}</span>
          <span>Сайт разработал <a href={devLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">Bilol</a></span>
        </div>
      </div>
    </footer>
  );
}
