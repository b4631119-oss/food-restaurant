import type { Product } from "@/lib/models";

export type { Product };
export type Fulfillment = "delivery" | "pickup";
export type Cart = Record<string, number>;
export type CartLine = { product: Product; quantity: number };
