import { CAFE } from "@/lib/config";
import type { Product } from "@/lib/types";

export function money(amount: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ${CAFE.currency}`;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^996/, "").slice(0, 9);
  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean);
  return digits ? `+996 ${groups.join(" ")}` : "";
}

export function portionInfo(product: Product): string {
  return typeof product.weight === "string" ? product.weight : "";
}
