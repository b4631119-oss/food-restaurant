import menuData from "@/data/menu.json";
import type { Cart, Product } from "@/lib/types";

export const CART_KEY = "sushi-bar-no1-cart";

const products = menuData.products as Product[];

export function readCart(): Cart {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const next: Cart = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (products.some((product) => product.id === id && product.inStock) && Number.isInteger(value) && Number(value) > 0) {
        next[id] = Number(value);
      }
    }
    return next;
  } catch {
    return {};
  }
}
