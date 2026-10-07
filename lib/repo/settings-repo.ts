import { doc, getDoc, onSnapshot, setDoc, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { normalizeWhatsapp } from "@/lib/validation";
import type { DemoSettings } from "@/lib/models";

const settingsRef = doc(db, "settings", "cafe");
function decode(data: Record<string, unknown>): DemoSettings { const settings = data as DemoSettings;  return { ...settings, whatsappDineIn: normalizeWhatsapp(String(settings.whatsappDineIn ?? "")), minimumOrder: Number(settings.minimumOrder) || 0, freeDeliveryFrom: Number(settings.freeDeliveryFrom) || 0, mapUrl: String(settings.mapUrl ?? "").trim(), deliveryCost: String(settings.deliveryCost ?? "").trim(), paymentMethods: String(settings.paymentMethods ?? "").trim() }; }
export async function getSettings(): Promise<DemoSettings | null> {
  const snapshot = await getDoc(settingsRef);
  return snapshot.exists() ? decode(snapshot.data()) : null;
}
export function watchSettings(onChange: (settings: DemoSettings | null) => void, onError?: (error: Error) => void): Unsubscribe {
  return onSnapshot(settingsRef, (snapshot) => onChange(snapshot.exists() ? decode(snapshot.data()) : null), (error) => onError?.(error));
}
export async function saveSettings(settings: DemoSettings): Promise<void> { await setDoc(settingsRef, settings); }
