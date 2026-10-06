"use client";

import { useRef, type FormEventHandler } from "react";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { X } from "lucide-react";
import { CartContent, type CartContentProps } from "@/components/cart/cart-content";
import { CartEmpty } from "@/components/cart/cart-empty";
import { CartSent } from "@/components/cart/cart-sent";
import type { CartLine, Fulfillment } from "@/lib/types";

type CartPanelProps = {
  lines: CartLine[]; orderSent: boolean; pending: boolean; receiptUrl: string; warning?: string; onClose: () => void; onGoMenu: () => void; onClearAndClose: () => void; onOrderMore: () => void;
  onAdd: (productId: string) => void; onChange: (productId: string, amount: number) => void;
  onSubmit: FormEventHandler<HTMLFormElement>; total: number; fulfillment: Fulfillment;
  setFulfillment: (value: Fulfillment) => void; name: string;  setName: (value: string) => void;
  phone: string;  setPhone: (value: string) => void; address: string;
  setAddress: (value: string) => void; comment: string; setComment: (value: string) => void;
  trap: string; setTrap: (value: string) => void;
  table: number | null; orderNumber: number;
  errors: { name: string; phone: string; address: string }; onBlur: (field: "name" | "phone" | "address") => void;
};

export function CartPanel(props: CartPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  useScrollLock(true);
  const { onClose } = props;
  useFocusTrap(panelRef, onClose);
  const contentProps: CartContentProps = {
    lines: props.lines, onAdd: props.onAdd, onChange: props.onChange, onSubmit: props.onSubmit, pending: props.pending,
    total: props.total, fulfillment: props.fulfillment, setFulfillment: props.setFulfillment,
    name: props.name, setName: props.setName, phone: props.phone, setPhone: props.setPhone,
    address: props.address, setAddress: props.setAddress, comment: props.comment, setComment: props.setComment,
    trap: props.trap, setTrap: props.setTrap, table: props.table,
    errors: props.errors, onBlur: props.onBlur,
  };
  const { lines, orderSent, receiptUrl, warning, onGoMenu, onClearAndClose } = props;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-transparent sm:items-center sm:bg-black/70 sm:backdrop-blur-[2px] sm:p-5 lg:items-stretch lg:justify-end lg:p-0" onClick={props.onClose}>
      <section ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="cart-title" className="sheet-enter fixed inset-0 flex h-dvh w-full flex-col overflow-hidden rounded-none border-0 bg-panel shadow-2xl outline-none sm:relative sm:inset-auto sm:h-auto sm:max-h-[90dvh] sm:w-full sm:max-w-xl sm:rounded-3xl sm:border sm:border-line lg:h-full lg:max-h-none lg:w-[420px] lg:max-w-[420px] lg:rounded-none lg:border-y-0 lg:border-r-0" onClick={(event) => event.stopPropagation()}>
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-panel px-5 sm:px-6">
          <div><p className="text-xs font-semibold text-accent">Sushi Bar №1</p><h2 id="cart-title" className="section-heading mt-1 text-xl font-extrabold">{props.orderSent ? "Спасибо за заказ!" : "Ваша корзина"}</h2></div>
          <button type="button" onClick={props.onClose} className="press grid size-11 place-items-center border border-line bg-surface hover:border-accent/40" aria-label="Закрыть корзину"><X className="size-5" aria-hidden="true" /></button>
        </header>
        {orderSent ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{warning && <p role="alert" className="mx-4 mt-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-200">{warning}</p>}<CartSent receiptUrl={receiptUrl} orderNumber={props.orderNumber} table={props.table} onClearAndClose={onClearAndClose} onOrderMore={props.onOrderMore} /></div>
        ) : lines.length === 0 ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain"><CartEmpty onGoMenu={onGoMenu} /></div>
        ) : (
          <>{warning && <p role="alert" className="mx-4 mt-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-200">{warning}</p>}<CartContent {...contentProps} /></>
        )}
      </section>
    </div>
  );
}
