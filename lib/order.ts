import { CAFE } from "@/lib/config";
import { money } from "@/lib/format";
import { googleMapsLink } from "@/lib/map-links";
import type { CartLine, Fulfillment } from "@/lib/types";

export type OrderInfo = {
  orderNumber: number;
  cartLines: CartLine[];
  total: number;
  fee: number | null;
  fulfillment: Fulfillment;
  name: string;
  phone: string;
  address: string;
  location?: { lat: number; lng: number } | null;
};

export function buildReceipt({ orderNumber, cartLines, total, fee, fulfillment, name, phone, address, location }: OrderInfo): string {
  return [
    `Заказ №${orderNumber} · ${CAFE.name}`,
    "------------------",
    ...cartLines.map(({ product, quantity }) => `${quantity} × ${product.name} — ${money(product.price * quantity)}`),
    "------------------",
    `Блюда: ${money(total)}`,
    ...(fulfillment === "delivery" ? [`Доставка: ${fee === null ? "уточним" : fee === 0 ? "бесплатно" : money(fee)}`] : []),
    `Итого к оплате: ${fee === null ? `${money(total)} + доставка` : money(total + fee)}`,
    `Имя: ${name.trim()}`,
    `Телефон: ${phone.trim()}`,
    `Получение: ${fulfillment === "delivery" ? "Доставка" : "Самовывоз"}`,
    ...(fulfillment === "delivery" ? [`Адрес: ${address.trim()}`] : []),
    ...(fulfillment === "delivery" && location ? [`Местоположение: ${googleMapsLink(location.lat, location.lng)}`] : []),
    "Оплата при получении. Пожалуйста, подтвердите заказ.",
  ].join("\n");
}

export function buildWhatsAppUrl(receipt: string): string {
  return `https://wa.me/${CAFE.whatsappNumber}?text=${encodeURIComponent(receipt)}`;
}
