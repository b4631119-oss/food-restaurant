"use client";

import type { Dispatch, SetStateAction } from "react";
import { Bike, Store } from "lucide-react";
import type { Fulfillment } from "@/lib/types";

type CartFormProps = {
  fulfillment: Fulfillment;
  setFulfillment: Dispatch<SetStateAction<Fulfillment>>;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  phone: string;
  setPhone: Dispatch<SetStateAction<string>>;
  address: string;
  setAddress: Dispatch<SetStateAction<string>>;
  formError: string;
};

export function CartForm({
  fulfillment,
  setFulfillment,
  name,
  setName,
  phone,
  setPhone,
  address,
  setAddress,
  formError,
}: CartFormProps) {
  return (
    <>
      <fieldset>
        <legend className="mb-1.5 text-xs font-bold">
          Как получить заказ?
        </legend>
        <div className="flex rounded-xl border border-line bg-surface p-1">
          <button
            type="button"
            onClick={() => setFulfillment("delivery")}
            aria-pressed={fulfillment === "delivery"}
            className={`press flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${fulfillment === "delivery" ? "bg-accent text-background" : "text-muted hover:text-text"}`}
          >
            <Bike className="size-4" aria-hidden="true" />
            Доставка
          </button>
          <button
            type="button"
            onClick={() => setFulfillment("pickup")}
            aria-pressed={fulfillment === "pickup"}
            className={`press flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold ${fulfillment === "pickup" ? "bg-accent text-background" : "text-muted hover:text-text"}`}
          >
            <Store className="size-4" aria-hidden="true" />
            Самовывоз
          </button>
        </div>
      </fieldset>
      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
        <label className="block text-xs font-semibold">
          Ваше имя
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            placeholder="Как к вам обращаться?"
            className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-base font-normal outline-none placeholder:text-muted/70 focus:border-accent"
          />
        </label>
        <label className="block text-xs font-semibold">
          Телефон
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+996 ..."
            className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-base font-normal outline-none placeholder:text-muted/70 focus:border-accent"
          />
        </label>
      </div>
      {fulfillment === "delivery" && (
        <label className="block text-xs font-semibold">
          Адрес доставки
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            autoComplete="street-address"
            rows={1}
            placeholder="Улица, дом, квартира, ориентир"
            className="mt-1 h-10 w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-base font-normal outline-none placeholder:text-muted/70 focus:border-accent"
          />
        </label>
      )}
      {formError && (
        <p
          role="alert"
          className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2.5 text-sm text-text"
        >
          {formError}
        </p>
      )}
    </>
  );
}
