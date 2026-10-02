"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DEMO_DATA_EVENT, getSettings, resetDemoData, setSettings, type DemoSettings } from "@/lib/demo-store";

export default function SettingsPage() {
  const [settings, setValues] = useState<DemoSettings>(() => getSettings());
  const [saved, setSaved] = useState(false); const [error, setError] = useState(""); const [confirm, setConfirm] = useState(false);
  useEffect(() => { const refresh = () => setValues(getSettings()); const timer = window.setTimeout(refresh, 0); window.addEventListener(DEMO_DATA_EVENT, refresh); return () => { window.clearTimeout(timer); window.removeEventListener(DEMO_DATA_EVENT, refresh); }; }, []);
  function save(event: FormEvent) {
    event.preventDefault();
    try { setSettings(settings); setSaved(true); setError(""); window.setTimeout(() => setSaved(false), 2500); }
    catch (e) { setError(e instanceof Error ? e.message : "Не удалось сохранить настройки."); }
  }
  function update<K extends keyof DemoSettings>(key: K, value: DemoSettings[K]) { setValues((current) => ({ ...current, [key]: value })); }
  const field = "mt-1 h-[52px] w-full rounded-lg border border-line bg-background px-3 text-base outline-none focus:border-accent";
  return <section><h1 className="text-2xl font-bold">Настройки</h1><form onSubmit={save} className="mt-5 max-w-2xl space-y-4 rounded-2xl border border-line bg-surface p-4 sm:p-6">
    <label className="flex min-h-12 items-center justify-between gap-3 font-semibold">Принимаем заказы<input type="checkbox" checked={settings.acceptingOrders} onChange={(e) => update("acceptingOrders", e.target.checked)} className="size-6 accent-accent" /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Телефон<input value={settings.phone} onChange={(e) => update("phone", e.target.value)} className={field} /></label><label className="text-sm">WhatsApp (номер)<input value={settings.whatsappNumber} onChange={(e) => update("whatsappNumber", e.target.value)} className={field} /></label></div>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Минимальный заказ<input type="number" min="0" value={settings.minimumOrder} onChange={(e) => update("minimumOrder", Number(e.target.value))} className={field} /></label><label className="text-sm">Время доставки<input value={settings.deliveryTime} onChange={(e) => update("deliveryTime", e.target.value)} className={field} /></label></div>
    <label className="block text-sm">График работы<input value={settings.openingHours} onChange={(e) => update("openingHours", e.target.value)} placeholder="10:00–01:00" className={field} /></label>
    <label className="block text-sm">Адрес кафе<input value={settings.address} onChange={(e) => update("address", e.target.value)} className={field} /></label>
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}{saved && <p role="status" className="text-sm text-accent">Настройки сохранены</p>}
    <button className="min-h-12 w-full rounded-lg bg-accent font-bold text-background">Сохранить настройки</button>
    <button type="button" onClick={() => setConfirm(true)} className="min-h-12 w-full rounded-lg border border-red-500/40 text-red-400">Сбросить все демо-данные</button>
  </form><ConfirmDialog open={confirm} title="Сбросить демо-данные?" message="Будут удалены демо-заказы, меню и настройки. Начальные заказы будут созданы снова." confirmLabel="Сбросить данные" onCancel={() => setConfirm(false)} onConfirm={() => { resetDemoData(); setConfirm(false); setValues(getSettings()); }} /></section>;
}
