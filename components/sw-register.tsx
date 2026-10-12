"use client";

import { useEffect } from "react";

// Регистрируем service worker только в production: в dev он кэшировал бы
// устаревшие чанки и мешал горячей перезагрузке.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    void navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.update().catch(() => {}))
      .catch(() => {});
  }, []);

  return null;
}
