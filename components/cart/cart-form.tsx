"use client";

import { useState } from "react";
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
  comment: string; setComment: (value: string) => void;
  trap: string; setTrap: (value: string) => void;
  table: number | null;
  errors: Errors; onBlur: (field: Field) => void;
};

export function CartForm({ fulfillment, setFulfillment, name, setName, phone, setPhone, address, setAddress, comment, setComment, trap, setTrap, table, errors, onBlur }: Props) {
  const [commentOpen, setCommentOpen] = useState(false);
  const fieldClass = "mt-1 h-[52px] w-full rounded-lg border border-line bg-surface px-3 text-base font-normal outline-none placeholder:text-muted focus:border-accent";
  const areaClass = "mt-1 min-h-[52px] w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-base font-normal outline-none placeholder:text-muted focus:border-accent";
  const errClass = "mt-1 block text-sm text-[#F87171]";
  const toggleClass = "press inline-flex min-h-11 items-center text-sm font-semibold text-accent";
  if (table !== null) return <>
    <label className="block text-sm font-semibold">Ваше имя <span className="font-normal text-muted">(необязательно)</span><input name="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => onBlur("name")} autoComplete="name" placeholder="Как к вам обращаться?" aria-invalid={Boolean(errors.name)} className={fieldClass} />{errors.name && <span className={errClass}>{errors.name}</span>}</label>
    <label className="block text-sm font-semibold">Комментарий к заказу <span className="font-normal text-muted">(необязательно)</span><textarea name="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Пожелания к блюдам или подаче" className="mt-1 min-h-[52px] w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-base font-normal outline-none placeholder:text-muted focus:border-accent" /></label>
    <input name="website" type="text" value={trap} onChange={(e) => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />
  </>;
  return <>
    <fieldset><legend className="mb-1.5 text-sm font-bold">Как получить заказ?</legend><div className="flex h-12 rounded-xl border border-line bg-surface p-1">
      <button type="button" onClick={() => setFulfillment("delivery")} aria-pressed={fulfillment === "delivery"} className={`press flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${fulfillment === "delivery" ? "bg-accent text-background" : "text-muted hover:text-text"}`}><Bike className="size-4" aria-hidden="true" />Доставка</button>
      <button type="button" onClick={() => setFulfillment("pickup")} aria-pressed={fulfillment === "pickup"} className={`press flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${fulfillment === "pickup" ? "bg-accent text-background" : "text-muted hover:text-text"}`}><Store className="size-4" aria-hidden="true" />Самовывоз</button>
    </div></fieldset>
    <label className="block text-sm font-semibold">Имя<input name="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => onBlur("name")} autoComplete="name" placeholder="Как к вам обращаться?" aria-invalid={Boolean(errors.name)} className={fieldClass} />{errors.name && <span className={errClass}>{errors.name}</span>}</label>
    <label className="block text-sm font-semibold">Телефон<input name="phone" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} onBlur={() => onBlur("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="+996 XXX XXX XXX" aria-invalid={Boolean(errors.phone)} className={fieldClass} />{errors.phone && <span className={errClass}>{errors.phone}</span>}</label>
    {fulfillment === "delivery" && <label className="block text-sm font-semibold">Адрес<textarea name="address" value={address} maxLength={200} onChange={(e) => setAddress(e.target.value)} onBlur={() => onBlur("address")} autoComplete="street-address" rows={2} placeholder="Улица и дом, например: Холматова 10" aria-invalid={Boolean(errors.address)} className={areaClass} />{errors.address && <span className={errClass}>{errors.address}</span>}</label>}
    <div className="space-y-2">
      <button type="button" onClick={() => setCommentOpen((open) => !open)} aria-expanded={commentOpen} className={toggleClass}>{commentOpen ? "Убрать комментарий" : "Добавить комментарий"}</button>
      {commentOpen && <label className="block text-sm font-semibold">Комментарий к заказу <span className="font-normal text-muted">(необязательно)</span><textarea name="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Пожелания к блюдам или подаче" className={areaClass} /></label>}
    </div>
  </>;
}
