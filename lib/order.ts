import { CAFE } from "@/lib/config";
import { money } from "@/lib/format";
import type { CartLine, Fulfillment } from "@/lib/types";

// Чек собирается только для заказа, который Firestore уже подтвердил: без номера чека не бывает.
export type OrderInfo = {
  orderNumber: number;
  cartLines: CartLine[];
  total: number;
  fee: number | null;
  fulfillment: Fulfillment;
  name: string;
  phone: string;
  address: string;
};
export type TableOrderInfo = {
  orderNumber: number;
  table: number;
  cartLines: CartLine[];
  total: number;
  comment?: string;
  name?: string;
};
export function buildReceipt({ orderNumber, cartLines, total, fee, fulfillment, name, phone, address }: OrderInfo): string {
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
    "Оплата при получении. Пожалуйста, подтвердите заказ.",
  ].join("\n");
}

// Чек для заказа со стола: номер, стол, блюда, итог, комментарий и имя, если указаны.
export function buildTableReceipt({ orderNumber, table, cartLines, total, comment, name }: TableOrderInfo): string {
  const trimmedComment = (comment ?? "").trim();
  const trimmedName = (name ?? "").trim();
  return [
    `Заказ №${orderNumber} · Стол №${table}`,
    "------------------",
    ...cartLines.map(({ product, quantity }) => `${quantity} × ${product.name} — ${money(product.price * quantity)}`),
    "------------------",
    `Итого: ${money(total)}`,
    ...(trimmedComment ? [`Комментарий: ${trimmedComment}`] : []),
    ...(trimmedName ? [`Имя: ${trimmedName}`] : []),
  ].join("\n");
}

export function whatsappUrl(number: string, receipt: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(receipt)}`;
}

// Пробуем открыть WhatsApp в новой вкладке. Если браузер заблокировал окно, возвращаем false —
// тогда заказ отправляют кнопкой на экране после оформления, а со страницы сайта не уходим.
export function openWhatsApp(url: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const tab = window.open("about:blank", "_blank");
    if (!tab) return false;
    tab.opener = null;
    tab.location.href = url;
    return true;
  } catch { return false; }
}
