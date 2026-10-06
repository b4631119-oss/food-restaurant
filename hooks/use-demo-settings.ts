"use client";

import { useEffect, useState } from "react";
import { CAFE } from "@/lib/config";
import { watchSettings } from "@/lib/repo/settings-repo";
import type { DemoSettings } from "@/lib/models";

export const defaultSettings: DemoSettings = { acceptingOrders: true, acceptingDinein: true, phone: CAFE.phone, whatsappNumber: CAFE.whatsappNumber, minimumOrder: CAFE.delivery.minimumOrder, deliveryTime: CAFE.delivery.time, openingHours: CAFE.openingHours, address: CAFE.address };
export function useDemoSettings() {
  const [settings, setSettings] = useState<DemoSettings>(defaultSettings); const [loading, setLoading] = useState(true);
  useEffect(() => watchSettings((value) => { setSettings(value ? { ...defaultSettings, ...value } : defaultSettings); setLoading(false); }, () => { setSettings(defaultSettings); setLoading(false); }), []);
  return { settings, loading };
}
