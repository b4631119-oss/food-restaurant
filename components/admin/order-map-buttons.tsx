"use client";

import { useState } from "react";
import { AdminToast } from "@/components/admin/toast";
import { useDemoSettings } from "@/hooks/use-demo-settings";
import { CAFE } from "@/lib/config";
import { money } from "@/lib/format";
import { googleMapsLink, yandexMapsLink, yandexSearchLink } from "@/lib/map-links";
import type { DemoOrder } from "@/lib/models";

type Props = { order: DemoOrder };
const button = "press inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold";

export function OrderMapButtons({ order }: Props) {
  const { settings } = useDemoSettings();
  const [toast, setToast] = useState("");
  const place = `${order.address}, ${CAFE.city}`;
  const point = order.location;
  const links = [point ? googleMapsLink(point.lat, point.lng) : "", order.mapLink ?? ""].filter(Boolean).join(" ");
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setToast("Скопировано"); } catch { setToast("Не удалось скопировать."); }
  }
  const courier = `Заказ №${order.number} · ${order.name} · ${order.phone} · ${order.address} · ${links || yandexSearchLink(place)} · к оплате: ${money(order.total + (order.deliveryFee ?? 0))} · оплата: ${settings.paymentMethods || "при получении"}`;
  return <div className="flex flex-wrap items-center gap-2">
    <a href={point ? googleMapsLink(point.lat, point.lng) : `https://www.google.com/maps?q=${encodeURIComponent(place)}`} target="_blank" rel="noopener noreferrer" className={button}>Google Карты</a>
    <a href={point ? yandexMapsLink(point.lat, point.lng) : yandexSearchLink(place)} target="_blank" rel="noopener noreferrer" className={button}>Яндекс Карты</a>
    {order.mapLink && <a href={order.mapLink} target="_blank" rel="noopener noreferrer" className={button}>Ссылка клиента</a>}
    <button type="button" onClick={() => void copy(order.address)} className={button}>Скопировать адрес</button>
    <button type="button" onClick={() => void copy(courier)} className={button}>Скопировать для курьера</button>
    {toast && <AdminToast message={toast} onDismiss={() => setToast("")} />}
  </div>;
}
