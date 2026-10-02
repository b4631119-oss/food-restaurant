"use client";

import { useEffect, useState } from "react";
import { CAFE } from "@/lib/config";
import { DEMO_DATA_EVENT, getSettings, type DemoSettings } from "@/lib/demo-store";

const defaults: DemoSettings = {
  acceptingOrders: true, phone: CAFE.phone, whatsappNumber: CAFE.whatsappNumber,
  minimumOrder: CAFE.delivery.minimumOrder, deliveryTime: CAFE.delivery.time,
  openingHours: CAFE.openingHours, address: CAFE.address,
};

export function useDemoSettings() {
  const [settings, setSettings] = useState<DemoSettings>(defaults);
  useEffect(() => {
    const refresh = () => setSettings(getSettings());
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener(DEMO_DATA_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(DEMO_DATA_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return settings;
}
