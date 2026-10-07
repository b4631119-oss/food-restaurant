"use client";

import { useEffect, useMemo, useRef } from "react";
import { getVolume, isNotifyEnabled, isSoundEnabled, playChime } from "@/lib/notify-sound";
import type { DemoOrder } from "@/lib/models";

const REMINDER_MS = 45000;
const MAX_REMINDERS = 6;
const FLASH_MS = 1000;
const FLASH_TITLE = "НОВЫЙ ЗАКАЗ!";
const PLACE: Record<DemoOrder["fulfillment"], string> = { delivery: "Доставка", pickup: "Самовывоз", dinein: "Стол" };

function playAlert() { if (isSoundEnabled()) playChime(getVolume()); }
function vibrate() { if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([150, 80, 150]); }
function showSystemNotice(order: DemoOrder) {
  if (!isNotifyEnabled() || !document.hidden) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const place = order.fulfillment === "dinein" ? `Стол №${order.tableNumber ?? ""}` : PLACE[order.fulfillment];
    const notice = new Notification(`Новый заказ №${order.number}`, { tag: order.id, body: place });
    notice.onclick = () => { window.focus(); notice.close(); };
  } catch { /* уведомления недоступны */ }
}

export function useNewOrderAlert(orders: DemoOrder[] | null) {
  const known = useRef<Set<string> | null>(null);
  const reminders = useRef(0);
  const fresh = useMemo(() => (orders ?? []).filter((order) => order.status === "new"), [orders]);
  useEffect(() => {
    if (!orders) return;
    if (known.current === null) { known.current = new Set(orders.map((order) => order.id)); return; }
    const added = orders.filter((order) => order.status === "new" && !known.current?.has(order.id));
    orders.forEach((order) => known.current?.add(order.id));
    if (!added.length) return;
    reminders.current = 0;
    playAlert();
    vibrate();
    added.forEach(showSystemNotice);
  }, [orders]);
  useEffect(() => {
    if (!fresh.length) { reminders.current = 0; return; }
    const timer = window.setInterval(() => {
      if (reminders.current >= MAX_REMINDERS || !isSoundEnabled()) return;
      reminders.current += 1;
      playChime(getVolume());
    }, REMINDER_MS);
    return () => window.clearInterval(timer);
  }, [fresh.length]);
  useEffect(() => {
    if (!fresh.length) return;
    const base = `(${fresh.length}) Заказы · Sushi Bar №1`;
    let restore: string | null = null;
    let flipped = false;
    const tick = () => {
      if (document.hidden) {
        if (restore === null) restore = document.title;
        flipped = !flipped;
        document.title = flipped ? FLASH_TITLE : base;
        return;
      }
      if (restore !== null) { document.title = restore; restore = null; }
    };
    const timer = window.setInterval(tick, FLASH_MS);
    return () => { window.clearInterval(timer); if (restore !== null) document.title = restore; };
  }, [fresh.length]);
}
