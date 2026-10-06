"use client";

import { useEffect, useState } from "react";
import { CAFE } from "@/lib/config";
import { getSettings } from "@/lib/repo/settings-repo";
import { readCache, writeCache } from "@/lib/menu-cache";
import type { DemoSettings } from "@/lib/models";

export const defaultSettings: DemoSettings = { acceptingOrders: true, acceptingDinein: true, phone: CAFE.phone, whatsappNumber: CAFE.whatsappNumber, minimumOrder: CAFE.delivery.minimumOrder, deliveryTime: CAFE.delivery.time, openingHours: CAFE.openingHours, address: CAFE.address };
const cacheName = "settings";
let pending: Promise<DemoSettings | null> | null = null;
function loadSettings(): Promise<DemoSettings | null> {
  if (!pending) pending = getSettings().finally(() => { pending = null; });
  return pending;
}
export function useDemoSettings() {
  const [settings, setSettings] = useState<DemoSettings>(defaultSettings); const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    const cached = readCache<DemoSettings>(cacheName);
    if (cached) window.setTimeout(() => { if (!cancelled) { setSettings({ ...defaultSettings, ...cached }); setLoading(false); } }, 0);
    void loadSettings().then((value) => {
      if (cancelled) return;
      const next = value ? { ...defaultSettings, ...value } : defaultSettings;
      writeCache(cacheName, next); setSettings(next); setLoading(false);
    }).catch(() => { if (!cancelled) { setSettings(defaultSettings); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);
  return { settings, loading };
}
