"use client";

import { Phone, ShoppingBag } from "lucide-react";
import { CAFE } from "@/lib/config";

type HeroProps = { onOrder: () => void };

export function Hero({ onOrder }: HeroProps) {
  return (
    <section id="top" className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-4 overflow-hidden px-4 py-4 sm:px-8 lg:min-h-[320px] lg:grid-cols-[1fr_300px] lg:gap-6 lg:px-6 lg:py-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/menu/roll-philadelphia.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
      <div className="relative z-10 flex flex-col items-start gap-4">
        <h1 className="max-w-2xl font-display text-3xl font-medium leading-tight sm:text-4xl lg:text-5xl">Свежие суши и роллы в Оше</h1>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-accent"><span className="size-2 rounded-full bg-accent" />Открыто · 10:00-01:00</span>
      </div>
      <div className="relative z-10 hidden justify-self-center lg:flex">
        <div className="hero-logo-frame size-[240px] overflow-hidden rounded-full border-2 border-accent p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/favicon.jpg" alt="Sushi Bar №1" className="size-full rounded-full object-cover" />
        </div>
      </div>
      <div className="relative z-10 grid grid-cols-2 gap-2 sm:w-[min(100%,420px)]">
        <button type="button" onClick={onOrder} className="press accent-shadow inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-accent px-3 text-sm font-semibold text-background hover:bg-accent-hover">
          <ShoppingBag className="size-4" aria-hidden="true" />Заказать
        </button>
        <a href={`tel:${CAFE.phoneDigits}`} className="press inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-line bg-surface px-3 text-sm font-semibold hover:border-accent/50">
          <Phone className="size-4 text-accent" aria-hidden="true" />Позвонить
        </a>
      </div>
    </section>
  );
}
