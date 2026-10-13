"use client";

import { Instagram, Phone } from "lucide-react";
import { CAFE } from "@/lib/config";
import { useDemoSettings } from "@/hooks/use-demo-settings";
import { WhatsAppIcon } from "@/components/whatsapp-icon";

const devLink = "https://portfolio-devroot.vercel.app";

// Ссылки не переносятся внутри себя: на узких экранах переносится вся ссылка целиком.
const navLink = "press inline-flex min-h-11 items-center whitespace-nowrap rounded-md px-1 text-sm font-semibold hover:text-accent";
// Кнопки соцсетей одинакового размера, область нажатия не меньше 44×44.
const socialLink = "press grid size-11 shrink-0 place-items-center rounded-full border border-line text-accent hover:border-accent/60 hover:bg-accent/10";

export function Footer() {
  const { settings } = useDemoSettings();
  // Год в копирайте всегда текущий, вручную в разметке не хранится.
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-accent/25 bg-[#08111F] pb-[calc(6rem_+_env(safe-area-inset-bottom,0px))] pt-10 text-sm text-muted lg:pb-10">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-8 lg:px-6">
        <div className="flex flex-col items-center gap-7 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6">
          <div className="flex items-center gap-3 lg:justify-self-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/favicon.jpg" alt="" width={40} height={40} loading="lazy" decoding="async" className="size-10 shrink-0 rounded-full border border-accent/40 object-cover" />
            <div className="min-w-0">
              <p className="text-base font-semibold leading-tight text-text">{CAFE.name}</p>
              <p className="mt-0.5 text-xs">Суши и роллы · {CAFE.city}</p>
            </div>
          </div>
          <nav aria-label="Навигация по сайту" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm font-semibold lg:justify-self-center">
            <a href="#menu" className={navLink}>Меню</a>
            <a href="#contacts" className={navLink}>Доставка и контакты</a>
            <a href={`tel:${settings.phone.replace(/\D/g, "")}`} className={`${navLink} gap-2`}><Phone className="size-4 shrink-0 text-accent" aria-hidden="true" />Позвонить</a>
          </nav>
          <div className="flex items-center gap-3 lg:justify-self-end">
            <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" aria-label="Написать в WhatsApp" className={socialLink}><WhatsAppIcon /></a>
            <a href={CAFE.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`Instagram — ${CAFE.name}`} className={socialLink}><Instagram className="size-5" aria-hidden="true" /></a>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-2 border-t border-line pt-5 text-xs lg:mt-10 lg:flex-row lg:justify-between">
          <span className="whitespace-nowrap">© {year} {CAFE.name}</span>
          <span className="text-center lg:text-right">Сайт разработал <a href={devLink} target="_blank" rel="noopener noreferrer" className="press font-semibold text-accent underline-offset-2 hover:underline">BILOLIDIN</a></span>
        </div>
      </div>
    </footer>
  );
}
