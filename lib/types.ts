import menuData from "@/data/menu.json";

export type Product = (typeof menuData.products)[number];
export type Fulfillment = "delivery" | "pickup";
export type Cart = Record<string, number>;
export type CartLine = { product: Product; quantity: number };
