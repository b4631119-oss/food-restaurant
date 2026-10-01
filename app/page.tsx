import { MapPin, MessageCircle, Phone, Utensils } from "lucide-react";
import { CAFE } from "@/lib/config";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
      <header className="rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-brand text-white shadow-md">
          <Utensils className="size-7" aria-hidden="true" />
        </div>
        <p className="text-sm font-bold text-brand">Суши и роллы · {CAFE.city}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {CAFE.name}
        </h1>
        <p className="mt-3 text-inkmuted">Меню и заказ с доставкой или самовывозом</p>

        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 text-sm">
          <p className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
            <span>{CAFE.address}, {CAFE.city}</span>
          </p>
          <p className="flex items-start gap-2.5">
            <span className="mt-0.5 size-4 shrink-0 text-center text-brand" aria-hidden="true">◷</span>
            <span>{CAFE.openingHours.label}</span>
          </p>
          <a className="flex items-center gap-2.5 hover:text-brand" href={`tel:${CAFE.phoneDigits}`}>
            <Phone className="size-4 shrink-0 text-brand" aria-hidden="true" />
            <span>{CAFE.phone}</span>
          </a>
        </div>
      </header>

      <section className="mt-5 flex flex-1 flex-col rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8" aria-labelledby="menu-title">
        <h2 id="menu-title" className="text-xl font-extrabold">Меню</h2>
        <div className="my-auto py-12 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brandsoft text-brand">
            <Utensils className="size-6" aria-hidden="true" />
          </div>
          <p className="mt-4 font-bold">Скоро здесь появятся блюда</p>
          <p className="mt-1 text-sm text-inkmuted">Пока позвоните нам или напишите в WhatsApp.</p>
        </div>
        <a
          href={`https://wa.me/${CAFE.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="press flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-bold text-white shadow-md hover:bg-brandstrong"
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          Написать в WhatsApp
        </a>
      </section>

      <footer className="pt-6 text-center text-xs text-inkmuted">
        {CAFE.name} · {CAFE.city} · Оплата в сомах
      </footer>
    </main>
  );
}
