import { CAFE } from "@/lib/config";
import { money } from "@/lib/format";
import type { CartLine, Fulfillment } from "@/lib/types";

export type OrderInfo = {
  cartLines: CartLine[];
  total: number;
  fulfillment: Fulfillment;
  name: string;
  phone: string;
  address: string;
};

export function buildReceipt({ cartLines, total, fulfillment, name, phone, address }: OrderInfo): string {
  return [
    `🍣 Заказ — ${CAFE.name}`,
    "──────────────────",
    ...cartLines.map(({ product, quantity }) => `${quantity} × ${product.name} — ${money(product.price * quantity)}`),
    "──────────────────",
    `Итого: ${money(total)}`,
    `Имя: ${name.trim()}`,
    `Телефон: ${phone.trim()}`,
    `Получение: ${fulfillment === "delivery" ? "Доставка" : "Самовывоз"}`,
    ...(fulfillment === "delivery" ? [`Адрес: ${address.trim()}`] : []),
    "Оплата при получении. Пожалуйста, подтвердите заказ.",
  ].join("\n");
}

export function buildWhatsAppUrl(receipt: string): string {
  return `https://wa.me/${CAFE.whatsappNumber}?text=${encodeURIComponent(receipt)}`;
}
