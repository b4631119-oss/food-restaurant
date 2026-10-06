"use client";

import type { FormEventHandler } from "react";
import { CartFooter } from "@/components/cart/cart-footer";
import { CartForm } from "@/components/cart/cart-form";
import { CartLine } from "@/components/cart/cart-line";
import type { GeoPoint, GeoStatus } from "@/hooks/use-customer";
import type { CartLine as CartLineType, Fulfillment } from "@/lib/types";

export type CartContentProps = {
  lines: CartLineType[];
  onAdd: (productId: string) => void;
  onChange: (productId: string, amount: number) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  total: number;
  fulfillment: Fulfillment;
  setFulfillment: (value: Fulfillment) => void;
  name: string;
  setName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  mapLink: string;
  setMapLink: (value: string) => void;
  location: GeoPoint | null;
  geoStatus: GeoStatus;
  geoError: string;
  onLocate: () => void;
  onClearLocation: () => void;
  comment: string;
  setComment: (value: string) => void;
  trap: string;
  setTrap: (value: string) => void;
  table: number | null;
  errors: { name: string; phone: string; address: string; mapLink: string };
  onBlur: (field: "name" | "phone" | "address" | "mapLink") => void;
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
            errors={props.errors}
            onBlur={props.onBlur}
            fulfillment={props.fulfillment}
            setFulfillment={props.setFulfillment}
            name={props.name}
            setName={props.setName}
            phone={props.phone}
            setPhone={props.setPhone}
            address={props.address}
            setAddress={props.setAddress}
            mapLink={props.mapLink}
            setMapLink={props.setMapLink}
            location={props.location}
            geoStatus={props.geoStatus}
            geoError={props.geoError}
            onLocate={props.onLocate}
            onClearLocation={props.onClearLocation}
            comment={props.comment}
            setComment={props.setComment}
            trap={props.trap}
            setTrap={props.setTrap}
            table={props.table}
          />
        </div>
      </div>
      <div className="shrink-0 space-y-2 border-t border-line bg-panel px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 sm:px-6">
        <CartFooter total={props.total} fulfillment={props.fulfillment} pending={props.pending} table={props.table} />
      </div>
    </form>
  );
}
