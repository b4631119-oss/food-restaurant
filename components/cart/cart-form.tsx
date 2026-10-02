"use client";

import { Bike, Store } from "lucide-react";
import { formatPhone } from "@/lib/format";
import type { Fulfillment } from "@/lib/types";

type Field = "name" | "phone" | "address";
type Errors = Record<Field, string>;
type Props = {
  fulfillment: Fulfillment; setFulfillment: (value: Fulfillment) => void;
  name: string; setName: (value: string) => void;
  phone: string; setPhone: (value: string) => void;
  address: string; setAddress: (value: string) => void;
  errors: Errors; onBlur: (field: Field) => void;
};

export function CartForm({ fulfillment, setFulfillment, name, setName, phone, setPhone, address, setAddress, errors, onBlur }: Props) {
  const fieldClass = "mt-1 h-[52px] w-full rounded-lg border border-line bg-surface px-3 text-base font-normal outline-none placeholder:text-muted focus:border-accent";
  return <>
    <fieldset><legend className="mb-1.5 text-sm font-bold">Как получить заказ?</legend><div className="flex h-12 rounded-xl border border-line bg-surface p-1">
      <button type="button" onClick={() => setFulfillment("delivery")} aria-pressed={fulfillment === "delivery"} className={`press flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${fulfillment === "delivery" ? "bg-accent text-background" : "text-muted hover:text-text"}`}><Bike className="size-4" aria-hidden="true" />Доставка</button>
      <button type="button" onClick={() => setFulfillment("pickup")} aria-pressed={fulfillment === "pickup"} className={`press flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${fulfillment === "pickup" ? "bg-accent text-background" : "text-muted hover:text-text"}`}><Store className="size-4" aria-hidden="true" />Самовывоз</button>
    </div></fieldset>
    <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
      <label className="block text-sm font-semibold">Ваше имя<input name="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => onBlur("name")} autoComplete="name" placeholder="Как к вам обращаться?" aria-invalid={Boolean(errors.name)} className={fieldClass} />{errors.name && <span className="mt-1 block text-sm text-accent">{errors.name}</span>}</label>
      <label className="block text-sm font-semibold">Телефон<input name="phone" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} onBlur={() => onBlur("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="+996 XXX XXX XXX" aria-invalid={Boolean(errors.phone)} className={fieldClass} />{errors.phone && <span className="mt-1 block text-sm text-accent">{errors.phone}</span>}</label>
    </div>
    {fulfillment === "delivery" && <label className="block text-sm font-semibold">Адрес доставки<textarea name="address" value={address} onChange={(e) => setAddress(e.target.value)} onBlur={() => onBlur("address")} autoComplete="street-address" rows={2} placeholder="Улица, дом, квартира, ориентир" aria-invalid={Boolean(errors.address)} className="mt-1 min-h-[52px] w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-base font-normal outline-none placeholder:text-muted focus:border-accent" />{errors.address && <span className="mt-1 block text-sm text-accent">{errors.address}</span>}</label>}
  </>;
}
