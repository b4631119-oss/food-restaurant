import { CAFE } from "@/lib/config";
import { money } from "@/lib/format";
import { googleMapsLink, yandexMapsLink, yandexSearchLink } from "@/lib/map-links";
import type { CartLine, Fulfillment } from "@/lib/types";

export type OrderInfo = {
  cartLines: CartLine[];
  total: number;
  fulfillment: Fulfillment;
  name: string;
  phone: string;
  address: string;
  location?: { lat: number; lng: number } | null;
  mapLink?: string;
};

function mapLines(address: string, location?: { lat: number; lng: number } | null, mapLink?: string): string[] {
  const link = mapLink?.trim();
  if (location) return [`Точка на карте: ${googleMapsLink(location.lat, location.lng)}`, `Яндекс Карты: ${yandexMapsLink(location.lat, location.lng)}`, ...(link ? [`Ссылка клиента: ${link}`] : [])];
  return link ? [`Ссылка клиента: ${link}`] : [`Карта: ${yandexSearchLink(`${address.trim()}, ${CAFE.city}`)}`];
}

export function buildReceipt({ cartLines, total, fulfillment, name, phone, address, location, mapLink }: OrderInfo): string {
  return [
    `🍣 Заказ — ${CAFE.name}`,
    "──────────────────",
    ...cartLines.map(({ product, quantity }) => `${quantity} × ${product.name} — ${money(product.price * quantity)}`),
    "──────────────────",
    `Итого: ${money(total)}`,
    `Имя: ${name.trim()}`,
    `Телефон: ${phone.trim()}`,
    `Получение: ${fulfillment === "delivery" ? "Доставка" : "Самовывоз"}`,
    ...(fulfillment === "delivery" ? [`Адрес: ${address.trim()}`, ...mapLines(address, location, mapLink)] : []),
    "Оплата при получении. Пожалуйста, подтвердите заказ.",
  ].join("\n");
}

export function buildWhatsAppUrl(receipt: string): string {
  return `https://wa.me/${CAFE.whatsappNumber}?text=${encodeURIComponent(receipt)}`;
}
