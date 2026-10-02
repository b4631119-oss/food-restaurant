"use client";

import type { FormEventHandler } from "react";
import { CartFooter } from "@/components/cart/cart-footer";
import { CartForm } from "@/components/cart/cart-form";
import { CartLine } from "@/components/cart/cart-line";
import type { CartLine as CartLineType, Fulfillment } from "@/lib/types";

export type CartContentProps = {
  lines: CartLineType[];
  onAdd: (productId: string) => void;
  onChange: (productId: string, amount: number) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  total: number;
  fulfillment: Fulfillment;
  setFulfillment: React.Dispatch<React.SetStateAction<Fulfillment>>;
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  phone: string;
  setPhone: React.Dispatch<React.SetStateAction<string>>;
  address: string;
  setAddress: React.Dispatch<React.SetStateAction<string>>;
  formError: string;
};

export function CartContent(props: CartContentProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6"
        aria-label="Список блюд в корзине"
      >
        <div className="space-y-2">
          {props.lines.map((line) => (
            <CartLine
              key={line.product.id}
              line={line}
              onAdd={props.onAdd}
              onChange={props.onChange}
            />
          ))}
        </div>
      </div>
      <form
        onSubmit={props.onSubmit}
        className="shrink-0 space-y-2 border-t border-line bg-panel px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 sm:px-6"
      >
        <CartForm
          fulfillment={props.fulfillment}
          setFulfillment={props.setFulfillment}
          name={props.name}
          setName={props.setName}
          phone={props.phone}
          setPhone={props.setPhone}
          address={props.address}
          setAddress={props.setAddress}
          formError={props.formError}
        />
        <CartFooter total={props.total} />
      </form>
    </div>
  );
}
