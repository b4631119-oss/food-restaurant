"use client";

import { useEffect, useState, type FormEvent } from "react";
import { defaultSettings } from "@/hooks/use-demo-settings";
import { watchSettings, saveSettings } from "@/lib/repo/settings-repo";
import type { DemoSettings } from "@/lib/models";

export default function SettingsPage() {
  const [settings, setValues] = useState<DemoSettings>(defaultSettings);
  const [saved, setSaved] = useState(false); const [error, setError] = useState("");
  useEffect(() => watchSettings((value) => setValues(value ? { ...defaultSettings, ...value } : defaultSettings), () => { setValues(defaultSettings); setError("Не удалось загрузить настройки."); }), []);
  async function save(event: FormEvent) { event.preventDefault(); try { await saveSettings(settings); setSaved(true); setError(""); window.setTimeout(() => setSaved(false), 2500); } catch { setError("Не удалось сохранить настройки в Firebase."); } }
  function update<K extends keyof DemoSettings>(key: K, value: DemoSettings[K]) { setValues((current) => ({ ...current, [key]: value })); }
  const field = "mt-1 h-[52px] w-full rounded-lg border border-line bg-background px-3 text-base outline-none focus:border-accent";
  return <section><h1 className="text-2xl font-bold">Настройки</h1><form onSubmit={save} className="mt-5 max-w-2xl space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-6">
    <label className="flex min-h-12 items-center justify-between gap-3 font-semibold">Принимаем заказы<input type="checkbox" checked={settings.acceptingOrders} onChange={(event) => update("acceptingOrders", event.target.checked)} className="size-6 accent-accent" /></label>
    <label className="flex min-h-12 items-center justify-between gap-3 font-semibold">Принимать заказы со столов<input type="checkbox" checked={settings.acceptingDinein} onChange={(event) => update("acceptingDinein", event.target.checked)} className="size-6 accent-accent" /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Телефон<input value={settings.phone} onChange={(event) => update("phone", event.target.value)} className={field} /></label><label className="text-sm">WhatsApp (номер)<input value={settings.whatsappNumber} onChange={(event) => update("whatsappNumber", event.target.value)} className={field} /></label></div>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Минимальный заказ<input type="number" min="0" value={settings.minimumOrder} onChange={(event) => update("minimumOrder", Number(event.target.value))} className={field} /></label><label className="text-sm">Время доставки<input value={settings.deliveryTime} onChange={(event) => update("deliveryTime", event.target.value)} className={field} /></label></div>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Стоимость доставки<input value={settings.deliveryCost} onChange={(event) => update("deliveryCost", event.target.value)} placeholder="Например: 150 сом" className={field} /></label><label className="text-sm">Способы оплаты<input value={settings.paymentMethods} onChange={(event) => update("paymentMethods", event.target.value)} placeholder="Наличные, перевод, MBank" className={field} /></label></div>
    <label className="block text-sm">График работы<input value={settings.openingHours} onChange={(event) => update("openingHours", event.target.value)} placeholder="10:00–01:00" className={field} /></label><label className="block text-sm">Адрес кафе<input value={settings.address} onChange={(event) => update("address", event.target.value)} className={field} /></label><label className="block text-sm">Ссылка на карту (2GIS или Google Maps)<input value={settings.mapUrl} onChange={(event) => update("mapUrl", event.target.value)} placeholder="Если пусто — ссылка построится по адресу" className={field} /></label>
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}{saved && <p role="status" className="text-sm text-accent">Настройки сохранены</p>}<button className="min-h-12 w-full rounded-lg bg-accent font-bold text-background">Сохранить настройки</button>
  </form></section>;
}
