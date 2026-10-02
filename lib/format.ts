import { CAFE } from "@/lib/config";
import type { Product } from "@/lib/types";

export function money(amount: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ${CAFE.currency}`;
}

export function portionInfo(product: Product): string {
  return typeof product.weight === "string" ? product.weight : "";
}
