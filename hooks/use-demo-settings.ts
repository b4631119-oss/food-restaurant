"use client";

import { useEffect, useRef, useState } from "react";
import { CAFE } from "@/lib/config";
import { getSettingsSnapshot, readSyncVersion, type SettingsSnapshot } from "@/lib/repo/settings-repo";
import { readRecord, writeRecord } from "@/lib/menu-cache";
import type { DemoSettings } from "@/lib/models";

export const defaultSettings: DemoSettings = { acceptingOrders: true, acceptingDinein: true, phone: CAFE.phone, whatsappNumber: CAFE.whatsappNumber, whatsappDineIn: "", minimumOrder: CAFE.delivery.minimumOrder, freeDeliveryFrom: 0, deliveryTime: CAFE.delivery.time, deliveryCost: "", paymentMethods: "", openingHours: CAFE.openingHours, address: CAFE.address, mapUrl: CAFE.mapUrl };
const cacheName = "settings";
const FOCUS_CHECK_MS = 30_000;

// Один запрос документа на всю страницу: и настройки, и версия витрины.
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
  const applied = useRef<number | null>(null);
  const checkedAt = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const cached = readRecord<DemoSettings>(cacheName);
    if (cached) window.setTimeout(() => { if (!cancelled) { setSettings(withDefaults(cached.value)); setLoading(false); } }, 0);
    void (async () => {
      // Совпала версия — документ настроек повторно не читаем.
      const version = await readSyncVersion();
      if (cancelled) return;
      if (cached && version !== null && version === cached.version) {
        applied.current = version; setSettings(withDefaults(cached.value)); setLoading(false);
        return;
      }
      try {
        const snapshot = await loadSnapshot();
        if (cancelled) return;
        const next = withDefaults(snapshot.settings);
        writeRecord(cacheName, next, snapshot.version);
        applied.current = snapshot.version;
        setSettings(next); setLoading(false);
      } catch { if (!cancelled) { setSettings(defaultSettings); setLoading(false); } }
    })();
    return () => { cancelled = true; };
  }, [attempt]);

  // Возврат к вкладке: одна проверка версии не чаще раза в 30 секунд.
  useEffect(() => {
    checkedAt.current = Date.now(); // первый возможный опрос — через FOCUS_CHECK_MS после открытия
    const check = () => {
      if (document.visibilityState !== "visible" || Date.now() - checkedAt.current < FOCUS_CHECK_MS) return;
      checkedAt.current = Date.now();
      void readSyncVersion(true).then((version) => {
        if (version !== null && version !== applied.current) setAttempt((value) => value + 1);
      });
    };
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => { document.removeEventListener("visibilitychange", check); window.removeEventListener("focus", check); };
  }, []);

  return { settings, loading };
}
