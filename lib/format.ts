import { CAFE } from "@/lib/config";
import type { Product } from "@/lib/types";

export function money(amount: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(amount)} ${CAFE.currency}`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const lastTwo = Math.abs(n) % 100; const last = lastTwo % 10;
  return lastTwo >= 11 && lastTwo <= 14 ? many : last === 1 ? one : last >= 2 && last <= 4 ? few : many;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^996/, "").slice(0, 9);
  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean);
  return digits ? `+996 ${groups.join(" ")}` : "";
}

export function portionInfo(product: Product): string {
  return typeof product.weight === "string" ? product.weight : "";
}
