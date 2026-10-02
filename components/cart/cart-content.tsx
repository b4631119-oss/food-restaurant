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
    <form onSubmit={props.onSubmit} className="flex min-h-0 flex-1 flex-col bg-panel">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="space-y-2 px-4 py-3 sm:px-6" aria-label="Список блюд в корзине">
          {props.lines.map((line) => (
            <CartLine key={line.product.id} line={line} onAdd={props.onAdd} onChange={props.onChange} />
          ))}
        </div>
        <div className="space-y-2 border-t border-line px-4 pt-3 sm:px-6">
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
        </div>
      </div>
      <div className="shrink-0 space-y-2 border-t border-line bg-panel px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 sm:px-6">
        <CartFooter total={props.total} />
      </div>
    </form>
  );
}
