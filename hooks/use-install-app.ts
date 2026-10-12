"use client";

import { useSyncExternalStore } from "react";

const DISMISS_KEY = "sushi-bar-no1-admin-install-dismissed";
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000; // плашка не чаще одного раза в 30 дней

export const IOS_HINT = "Нажмите «Поделиться» и выберите «На экран Домой».";

type InstallPrompt = Event & { prompt: () => Promise<void> };
export type InstallSnapshot = { canInstall: boolean; standalone: boolean; ios: boolean; dismissed: boolean };

let deferredPrompt: InstallPrompt | null = null;
const watchers = new Set<() => void>();
// Значения среды (установлено ли приложение, iOS, отказ от плашки) — внешний источник,
// поэтому держим их в снимке и читаем через useSyncExternalStore: без setState в эффектах.
let snapshot: InstallSnapshot = { canInstall: false, standalone: true, ios: false, dismissed: true };
const SERVER_SNAPSHOT: InstallSnapshot = { canInstall: false, standalone: true, ios: false, dismissed: true };

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

// iOS не поддерживает beforeinstallprompt — там показываем инструкцию вручную.
function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return true;
  return /macintosh/i.test(navigator.userAgent) && typeof document !== "undefined" && "ontouchend" in document;
}

function dismissedRecently(): boolean {
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
    return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

function publish(): void {
  snapshot = { canInstall: deferredPrompt !== null, standalone: isStandalone(), ios: isIos(), dismissed: dismissedRecently() };
  watchers.forEach((notify) => notify());
}

function subscribe(notify: () => void): () => void {
  watchers.add(notify);
  return () => {
    watchers.delete(notify);
  };
}

if (typeof window !== "undefined") {
  // beforeinstallprompt приходит один раз: храним событие в модуле, чтобы кнопка в панели,
  // плашка и блок в настройках видели одно и то же предложение установки.
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as InstallPrompt;
    publish();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    publish();
  });
  window.matchMedia("(display-mode: standalone)").addEventListener?.("change", publish);
  publish();
}

export function useInstall(): InstallSnapshot {
  return useSyncExternalStore(subscribe, () => snapshot, () => SERVER_SNAPSHOT);
}

export function dismissInstall(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* Работаем без storage. */
  }
  publish();
}

export async function promptInstall(): Promise<void> {
  const prompt = deferredPrompt;
  if (!prompt) return;
  await prompt.prompt();
  deferredPrompt = null;
  publish();
}
