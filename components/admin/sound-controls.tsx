"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import { PREFS_EVENT, getVolume, isNotifyEnabled, isSoundEnabled, isWakeEnabled, playChime, setNotifyEnabled, setSoundEnabled, setVolume, setWakeEnabled, unlockSound, type Volume } from "@/lib/notify-sound";

const VOLUMES: [Volume, string][] = [["low", "Тихо"], ["mid", "Средне"], ["high", "Громче"]];
let sentinel: WakeLockSentinel | null = null;

function wakeSupported() { return typeof navigator !== "undefined" && "wakeLock" in navigator; }
async function keepAwake(on: boolean) {
  if (!wakeSupported()) return;
  if (!on) {
    const current = sentinel;
    sentinel = null;
    if (current) { try { await current.release(); } catch { /* экран уже не удерживается */ } }
    return;
  }
  if (sentinel) return;
  try {
    sentinel = await navigator.wakeLock.request("screen");
    sentinel.addEventListener("release", () => { sentinel = null; });
  } catch { sentinel = null; }
}

type Permission = "unsupported" | NotificationPermission;
type Sound = ReturnType<typeof useSound>;

function useSound() {
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolumeState] = useState<Volume>("mid");
  const [notify, setNotify] = useState<Permission>("unsupported");
  const [notifyOn, setNotifyOn] = useState(false);
  const [wake, setWake] = useState(false);
  const [wakeReady, setWakeReady] = useState(false);
  const sync = useCallback(() => {
    setEnabled(isSoundEnabled());
    setVolumeState(getVolume());
    setNotifyOn(isNotifyEnabled());
    setWake(isWakeEnabled());
    setWakeReady(wakeSupported());
    setNotify(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);
  useEffect(() => {
    const start = window.setTimeout(sync, 0);
    const onVisible = () => { if (document.visibilityState === "visible" && isWakeEnabled()) void keepAwake(true); };
    onVisible();
    window.addEventListener(PREFS_EVENT, sync);
    window.addEventListener("resize", sync);
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(start);
      window.removeEventListener(PREFS_EVENT, sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sync]);
  const enable = () => { setSoundEnabled(true); setEnabled(true); void unlockSound().then(() => playChime(getVolume())); };
  const disable = () => { setSoundEnabled(false); setEnabled(false); };
  const chooseVolume = (value: Volume) => { setVolume(value); setVolumeState(value); playChime(value); };
  const test = () => { void unlockSound().then(() => playChime(getVolume())); };
  const requestNotify = () => { void (async () => {
    if (typeof Notification === "undefined") return;
    try {
      const result = await Notification.requestPermission();
      setNotify(result);
      if (result === "granted") { setNotifyEnabled(true); setNotifyOn(true); }
    } catch { /* отказано */ }
  })(); };
  const toggleNotify = (on: boolean) => { setNotifyEnabled(on); setNotifyOn(on); };
  const toggleWake = (on: boolean) => { setWakeEnabled(on); setWake(on); void keepAwake(on); };
  return { enabled, volume, notify, notifyOn, wake, wakeReady, enable, disable, chooseVolume, test, requestNotify, toggleNotify, toggleWake };
}

function Panel({ sound }: { sound: Sound }) {
  return <div className="space-y-2">
    <p className="text-sm font-bold">Уведомления о заказах</p>
    {!sound.enabled ? <>
      <p className="text-xs text-amber-300">Звук выключен. Включите, чтобы слышать новые заказы</p>
      <button onClick={sound.enable} className="min-h-11 w-full rounded-lg bg-accent text-sm font-bold text-background">Включить звук</button>
    </> : <>
      <div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-2 text-sm text-muted"><BellRing size={18} className="text-accent" />Звук включён</span><button onClick={sound.disable} className="min-h-11 px-2 text-sm text-muted">Выключить</button></div>
      <div className="flex gap-1">{VOLUMES.map(([key, label]) => <button key={key} onClick={() => sound.chooseVolume(key)} aria-pressed={sound.volume === key} className={`min-h-11 flex-1 rounded-lg text-sm font-semibold ${sound.volume === key ? "bg-accent text-background" : "border border-line text-muted"}`}>{label}</button>)}</div>
      <button onClick={sound.test} className="min-h-11 w-full rounded-lg border border-line text-sm font-semibold">Проверить звук</button>
    </>}
    {sound.notify !== "unsupported" && (sound.notify === "granted"
      ? <label className="flex min-h-11 items-center justify-between gap-2 text-sm"><span>Системные уведомления</span><input type="checkbox" checked={sound.notifyOn} onChange={(event) => sound.toggleNotify(event.target.checked)} aria-label="Системные уведомления" className="size-5 accent-amber-400" /></label>
      : <button onClick={sound.requestNotify} className="min-h-11 w-full rounded-lg border border-line text-sm font-semibold">Разрешить системные уведомления</button>)}
    {sound.wakeReady && <label className="flex min-h-11 items-center justify-between gap-2 text-sm"><span>Не гасить экран<span className="block text-xs font-normal text-muted">Для планшета на кухне</span></span><input type="checkbox" checked={sound.wake} onChange={(event) => sound.toggleWake(event.target.checked)} aria-label="Не гасить экран" className="size-5 accent-amber-400" /></label>}
  </div>;
}

export function SoundControls({ variant = "bar" }: { variant?: "bar" | "icon" }) {
  const sound = useSound();
  const [open, setOpen] = useState(false);
  const status = sound.enabled ? "Звук включён" : "Звук выключен";
  const hint = sound.enabled ? "Звук новых заказов включён" : "Звук выключен. Включите, чтобы слышать новые заказы";
  const bell = sound.enabled ? <Bell size={20} /> : <BellOff size={20} />;
  const dot = <i aria-hidden="true" className={`size-2 shrink-0 rounded-full ${sound.enabled ? "bg-emerald-400" : "bg-muted"}`} />;
  return <>
    {!sound.enabled && <div role="status" className="fixed inset-x-0 top-[calc(56px+env(safe-area-inset-top,0px))] z-[40] flex items-center gap-2 border-b border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-xs text-amber-200 backdrop-blur lg:hidden">
      <span className="min-w-0 flex-1">Звук выключен. Включите, чтобы слышать новые заказы</span>
      <button onClick={sound.enable} className="min-h-9 shrink-0 rounded-lg bg-amber-400 px-3 text-xs font-bold text-background">Включить</button>
    </div>}
    {variant === "bar"
      ? <button onClick={() => setOpen((value) => !value)} aria-expanded={open} title={hint} className={`press flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-background ${sound.enabled ? "text-accent" : "text-muted"}`}>{bell}{dot}<span>{status}</span></button>
      : <button onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={hint} title={hint} className={`press relative grid min-h-11 min-w-11 place-items-center rounded-lg ${sound.enabled ? "text-accent" : "text-muted"}`}>{bell}<i aria-hidden="true" className={`absolute right-2 top-2 size-2 rounded-full ${sound.enabled ? "bg-emerald-400" : "bg-muted"}`} /></button>}
    {open && <div className="fixed inset-x-3 bottom-[calc(80px+env(safe-area-inset-bottom,0px))] z-[60] rounded-2xl border border-line bg-surface p-4 shadow-2xl lg:inset-x-auto lg:bottom-24 lg:left-5 lg:w-64">
      <Panel sound={sound} />
      <button onClick={() => setOpen(false)} className="mt-3 min-h-11 w-full rounded-lg border border-line text-sm text-muted">Закрыть</button>
    </div>}
  </>;
}
