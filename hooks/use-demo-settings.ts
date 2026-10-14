"use client";

import { useEffect, useRef, useState } from "react";
import { CAFE } from "@/lib/config";
import { getSettingsSnapshot, type SettingsSnapshot } from "@/lib/repo/settings-repo";
import { readRecord, readStaleRecord, writeRecord } from "@/lib/menu-cache";
import { warnFirestore } from "@/lib/firestore-log";
import type { DemoSettings } from "@/lib/models";

export const defaultSettings: DemoSettings = { acceptingOrders: true, acceptingDinein: true, phone: CAFE.phone, whatsappNumber: CAFE.whatsappNumber, whatsappDineIn: "", minimumOrder: CAFE.delivery.minimumOrder, freeDeliveryFrom: 0, deliveryTime: CAFE.delivery.time, deliveryCost: "", paymentMethods: "", openingHours: CAFE.openingHours, address: CAFE.address, mapUrl: CAFE.mapUrl };
const cacheName = "settings";
const FOCUS_CHECK_MS = 30_000;

// Документ settings/cafe читается ОДИН раз за визит: общий запрос на все компоненты,
// которые его используют (шапка корзины, футер корзины, экран подтверждения).
let pending: Promise<SettingsSnapshot> | null = null;
function loadSnapshot(): Promise<SettingsSnapshot> {
  if (!pending) pending = getSettingsSnapshot().finally(() => { pending = null; });
  return pending;
}
function withDefaults(value: DemoSettings | null): DemoSettings { return value ? { ...defaultSettings, ...value } : defaultSettings; }

export function useDemoSettings() {
  const [settings, setSettings] = useState<DemoSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const checkedAt = useRef(0);

  useEffect(() => {
    let cancelled = false;
    // Свежий кэш (не старше 15 минут) — настройки берём из памяти, сеть не трогаем.
    const fresh = readRecord<DemoSettings>(cacheName);
    if (fresh) {
      window.setTimeout(() => { if (!cancelled) { setSettings(withDefaults(fresh.value)); setLoading(false); } }, 0);
      return () => { cancelled = true; };
    }
    const stale = readStaleRecord<DemoSettings>(cacheName);
    if (stale) window.setTimeout(() => { if (!cancelled) { setSettings(withDefaults(stale.value)); setLoading(false); } }, 0);
    void (async () => {
      try {
        const snapshot = await loadSnapshot();
        if (cancelled) return;
        const next = withDefaults(snapshot.settings);
        writeRecord(cacheName, next, snapshot.version);
        setSettings(next); setLoading(false);
      } catch (cause) {
        if (cancelled) return;
        warnFirestore("settings", cause);
        // Исчерпанная квота — не повод терять телефон и график работы: кэш любого возраста годится.
        setSettings(stale ? withDefaults(stale.value) : defaultSettings);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [attempt]);

  // Возврат к вкладке: если кэш уже устарел, читаем настройки заново (не чаще раза в 30 секунд).
  useEffect(() => {
    checkedAt.current = Date.now(); // первый возможный опрос — через FOCUS_CHECK_MS после открытия
    const check = () => {
      if (document.visibilityState !== "visible" || Date.now() - checkedAt.current < FOCUS_CHECK_MS) return;
      checkedAt.current = Date.now();
      if (readRecord<DemoSettings>(cacheName)) return; // кэш свежий — не читаем
      setAttempt((value) => value + 1);
    };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => { document.removeEventListener("visibilitychange", check); window.removeEventListener("focus", check); };
  }, []);

  return { settings, loading };
}
