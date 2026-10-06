"use client";

import { Bike, Loader2, MapPin, Store } from "lucide-react";
import { formatPhone } from "@/lib/format";
import type { GeoPoint, GeoStatus } from "@/hooks/use-customer";
import type { Fulfillment } from "@/lib/types";

type Field = "name" | "phone" | "address" | "mapLink";
type Errors = Record<Field, string>;
type Props = {
  fulfillment: Fulfillment; setFulfillment: (value: Fulfillment) => void;
  name: string; setName: (value: string) => void;
  phone: string; setPhone: (value: string) => void;
  address: string; setAddress: (value: string) => void;
  comment: string; setComment: (value: string) => void;
  trap: string; setTrap: (value: string) => void;
  table: number | null;
  errors: Errors; onBlur: (field: Field) => void;
  location: GeoPoint | null; geoStatus: GeoStatus; geoError: string;
  onLocate: () => void; onClearLocation: () => void;
  mapLink: string; setMapLink: (value: string) => void;
};

export function CartForm({ fulfillment, setFulfillment, name, setName, phone, setPhone, address, setAddress, comment, setComment, trap, setTrap, table, errors, onBlur, location, geoStatus, geoError, onLocate, onClearLocation, mapLink, setMapLink }: Props) {
  const fieldClass = "mt-1 h-[52px] w-full rounded-lg border border-line bg-surface px-3 text-base font-normal outline-none placeholder:text-muted focus:border-accent";
  const geoAvailable = typeof navigator !== "undefined" && Boolean(navigator.geolocation);
  if (table !== null) return <>
    <label className="block text-sm font-semibold">Ваше имя <span className="font-normal text-muted">(необязательно)</span><input name="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => onBlur("name")} autoComplete="name" placeholder="Как к вам обращаться?" aria-invalid={Boolean(errors.name)} className={fieldClass} />{errors.name && <span className="mt-1 block text-sm text-accent">{errors.name}</span>}</label>
    <label className="block text-sm font-semibold">Комментарий к заказу <span className="font-normal text-muted">(необязательно)</span><textarea name="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Пожелания к блюдам или подаче" className="mt-1 min-h-[52px] w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-base font-normal outline-none placeholder:text-muted focus:border-accent" /></label>
    <input name="website" type="text" value={trap} onChange={(e) => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />
  </>;
  return <>
    <fieldset><legend className="mb-1.5 text-sm font-bold">Как получить заказ?</legend><div className="flex h-12 rounded-xl border border-line bg-surface p-1">
      <button type="button" onClick={() => setFulfillment("delivery")} aria-pressed={fulfillment === "delivery"} className={`press flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${fulfillment === "delivery" ? "bg-accent text-background" : "text-muted hover:text-text"}`}><Bike className="size-4" aria-hidden="true" />Доставка</button>
      <button type="button" onClick={() => setFulfillment("pickup")} aria-pressed={fulfillment === "pickup"} className={`press flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${fulfillment === "pickup" ? "bg-accent text-background" : "text-muted hover:text-text"}`}><Store className="size-4" aria-hidden="true" />Самовывоз</button>
    </div></fieldset>
    <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
      <label className="block text-sm font-semibold">Ваше имя<input name="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => onBlur("name")} autoComplete="name" placeholder="Как к вам обращаться?" aria-invalid={Boolean(errors.name)} className={fieldClass} />{errors.name && <span className="mt-1 block text-sm text-accent">{errors.name}</span>}</label>
      <label className="block text-sm font-semibold">Телефон<input name="phone" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} onBlur={() => onBlur("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="+996 XXX XXX XXX" aria-invalid={Boolean(errors.phone)} className={fieldClass} />{errors.phone && <span className="mt-1 block text-sm text-accent">{errors.phone}</span>}</label>
    </div>
    {fulfillment === "delivery" && <>
      <label className="block text-sm font-semibold">Адрес доставки<textarea name="address" value={address} onChange={(e) => setAddress(e.target.value)} onBlur={() => onBlur("address")} autoComplete="street-address" rows={2} placeholder="Улица, дом, ориентир" aria-invalid={Boolean(errors.address)} className="mt-1 min-h-[52px] w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-base font-normal outline-none placeholder:text-muted focus:border-accent" />{errors.address && <span className="mt-1 block text-sm text-accent">{errors.address}</span>}<span className="mt-1 block text-xs font-normal text-muted">Улица, дом, подъезд, этаж, квартира, ориентир</span></label>
      <div className="space-y-2">
        {geoAvailable && <button type="button" onClick={onLocate} disabled={geoStatus === "loading"} className="press inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold disabled:opacity-50">{geoStatus === "loading" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <MapPin className="size-4" aria-hidden="true" />}{geoStatus === "loading" ? "Определяем..." : "Отправить моё местоположение"}</button>}
        {geoStatus === "done" && location && <p className="flex flex-wrap items-center gap-2 text-sm text-emerald-400">Местоположение добавлено<button type="button" onClick={onClearLocation} className="press min-h-11 rounded-lg border border-line px-3 text-sm font-semibold text-muted">Убрать</button></p>}
        {geoStatus === "error" && <p role="alert" className="text-sm text-accent">{geoError}</p>}
        <p className="text-xs text-muted">Используем только для доставки этого заказа</p>
      </div>
      <label className="block text-sm font-semibold">Ссылка на точку в картах (Яндекс, 2GIS, Google) <span className="font-normal text-muted">(необязательно)</span><input name="mapLink" value={mapLink} onChange={(e) => setMapLink(e.target.value)} onBlur={() => onBlur("mapLink")} placeholder="https://yandex.ru/maps/..." aria-invalid={Boolean(errors.mapLink)} className={fieldClass} />{errors.mapLink && <span className="mt-1 block text-sm text-accent">{errors.mapLink}</span>}<span className="mt-1 block text-xs font-normal text-muted">Откройте точку в приложении карт, нажмите «Поделиться» и вставьте ссылку</span></label>
    </>}
  </>;
}
