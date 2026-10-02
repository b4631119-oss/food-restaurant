"use client";

import { useEffect, useRef, type FormEventHandler, type Dispatch, type SetStateAction } from "react";
import { X } from "lucide-react";
import { CartContent, type CartContentProps } from "@/components/cart/cart-content";
import { CartEmpty } from "@/components/cart/cart-empty";
import { CartSent } from "@/components/cart/cart-sent";
import type { CartLine, Fulfillment } from "@/lib/types";

type CartPanelProps = {
  lines: CartLine[]; orderSent: boolean; onClose: () => void; onGoMenu: () => void; onReturn: () => void;
  onAdd: (productId: string) => void; onChange: (productId: string, amount: number) => void;
  onSubmit: FormEventHandler<HTMLFormElement>; total: number; fulfillment: Fulfillment;
  setFulfillment: Dispatch<SetStateAction<Fulfillment>>; name: string; setName: Dispatch<SetStateAction<string>>;
  phone: string; setPhone: Dispatch<SetStateAction<string>>; address: string;
  setAddress: Dispatch<SetStateAction<string>>; formError: string;
};

export function CartPanel(props: CartPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const { onClose } = props;
  const contentProps: CartContentProps = {
    lines: props.lines, onAdd: props.onAdd, onChange: props.onChange, onSubmit: props.onSubmit,
    total: props.total, fulfillment: props.fulfillment, setFulfillment: props.setFulfillment,
    name: props.name, setName: props.setName, phone: props.phone, setPhone: props.setPhone,
    address: props.address, setAddress: props.setAddress, formError: props.formError,
  };
  const { lines, orderSent, onReturn, onGoMenu } = props;
  useEffect(() => {
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-[2px] sm:items-center sm:p-5 lg:items-stretch lg:justify-end lg:p-0" onClick={props.onClose}>
      <section ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="cart-title" className="sheet-enter flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-line bg-panel shadow-2xl outline-none sm:rounded-3xl lg:max-h-none lg:h-full lg:w-[420px] lg:max-w-[420px] lg:rounded-none lg:border-y-0 lg:border-r-0" onClick={(event) => event.stopPropagation()}>
        <header className="flex shrink-0 items-center justify-between border-b border-line bg-panel px-5 py-4 sm:px-6">
          <div><p className="text-xs font-semibold text-accent">Sushi Bar №1</p><h2 id="cart-title" className="section-heading mt-1 text-xl font-extrabold">{props.orderSent ? "Спасибо за заказ!" : "Ваша корзина"}</h2></div>
          <button type="button" onClick={props.onClose} className="press grid size-11 place-items-center border border-line bg-surface hover:border-accent/40" aria-label="Закрыть корзину"><X className="size-5" aria-hidden="true" /></button>
        </header>
        {orderSent ? <CartSent onReturn={onReturn} /> : lines.length === 0 ? <CartEmpty onGoMenu={onGoMenu} /> : <CartContent {...contentProps} />}
      </section>
    </div>
  );
}
