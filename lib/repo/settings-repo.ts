import { doc, getDoc, onSnapshot, setDoc, type Unsubscribe } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DemoSettings } from "@/lib/demo-store";

const settingsRef = doc(db, "settings", "cafe");
export async function getSettings(): Promise<DemoSettings | null> {
  const snapshot = await getDoc(settingsRef);
  return snapshot.exists() ? snapshot.data() as DemoSettings : null;
}
export function watchSettings(onChange: (settings: DemoSettings | null) => void, onError?: (error: Error) => void): Unsubscribe {
  return onSnapshot(settingsRef, (snapshot) => onChange(snapshot.exists() ? snapshot.data() as DemoSettings : null), (error) => onError?.(error));
}
export async function saveSettings(settings: DemoSettings): Promise<void> { await setDoc(settingsRef, settings); }
