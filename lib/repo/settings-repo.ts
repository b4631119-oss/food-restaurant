import { doc, getDoc, increment, onSnapshot, setDoc, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeWhatsapp } from "@/lib/validation";
import type { DemoSettings } from "@/lib/models";

const settingsRef = doc(db, "settings", "cafe");
const VERSION_TTL_MS = 30_000;
// Поле version — метка изменений витрины: её увеличивает любое сохранение в админке,
// а витрина читает один документ и сравнивает версию со своей копией в localStorage.
let versionCache: { value: number; at: number } | null = null;
let versionPending: Promise<number | null> | null = null;

export type SettingsSnapshot = { settings: DemoSettings | null; version: number };

function versionOf(data: Record<string, unknown>): number {
  const raw = Number(data.version);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
}

function decode(data: Record<string, unknown>): DemoSettings {
  const clean = { ...data };
  delete clean.version; // служебное поле версии в форме настроек не нужно
  const settings = clean as DemoSettings;
  return { ...settings, whatsappDineIn: normalizeWhatsapp(String(settings.whatsappDineIn ?? "")), minimumOrder: Number(settings.minimumOrder) || 0, freeDeliveryFrom: Number(settings.freeDeliveryFrom) || 0, mapUrl: String(settings.mapUrl ?? "").trim(), deliveryCost: String(settings.deliveryCost ?? "").trim(), paymentMethods: String(settings.paymentMethods ?? "").trim() };
}

// Настройки и версия берутся одним чтением документа.
export async function getSettingsSnapshot(): Promise<SettingsSnapshot> {
  const snapshot = await getDoc(settingsRef);
  if (!snapshot.exists()) return { settings: null, version: 0 };
  return { settings: decode(snapshot.data()), version: versionOf(snapshot.data()) };
}

// Серверная версия витрины. Результат держится в памяти минуту-полминуты, чтобы витрина
// не читала документ чаще нужного. null — прочитать не удалось (офлайн или нет прав):
// тогда вызывающая сторона просто обновляет данные как раньше.
export function readSyncVersion(force = false): Promise<number | null> {
  if (!force && versionCache && Date.now() - versionCache.at < VERSION_TTL_MS) return Promise.resolve(versionCache.value);
  if (!versionPending) versionPending = getDoc(settingsRef)
    .then((snapshot) => {
      const value = snapshot.exists() ? versionOf(snapshot.data()) : 0;
      versionCache = { value, at: Date.now() };
      return value;
    })
    .catch(() => null)
    .finally(() => { versionPending = null; });
  return versionPending;
}

// Сдвигает версию после сохранения в админке. Атомарный increment без чтения документа,
// поэтому метка не откатывается и не теряется при параллельных сохранениях.
export async function bumpSyncVersion(): Promise<void> {
  await setDoc(settingsRef, { version: increment(1) }, { merge: true });
  versionCache = null;
}

export function watchSettings(onChange: (settings: DemoSettings | null) => void, onError?: (error: Error) => void): Unsubscribe {
  return onSnapshot(settingsRef, (snapshot) => onChange(snapshot.exists() ? decode(snapshot.data()) : null), (error) => onError?.(error));
}

// Сохранение настроек само увеличивает версию тем же запросом — витрина увидит изменение.
export async function saveSettings(settings: DemoSettings): Promise<void> {
  await setDoc(settingsRef, { ...settings, version: increment(1) });
  versionCache = null;
}
