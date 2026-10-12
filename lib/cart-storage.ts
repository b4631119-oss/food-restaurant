import type { Cart } from "@/lib/types";
import { MAX_QUANTITY } from "@/lib/table";

export const CART_KEY = "sushi-bar-no1-cart";

export function readCart(): Cart {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const next: Cart = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (id && Number.isInteger(value) && Number(value) > 0) {
        // Количество держим в тех же лимитах, что и правила Firestore.
        next[id] = Math.min(Number(value), MAX_QUANTITY);
      }
    }
    return next;
  } catch {
    return {};
  }
}
