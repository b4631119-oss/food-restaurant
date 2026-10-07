"use client";

export type Volume = "low" | "mid" | "high";

export const PREFS_EVENT = "sushi-bar-no1-sound-prefs";
const ENABLED_KEY = "soundEnabled";
const VOLUME_KEY = "volume";
const NOTIFY_KEY = "notifyEnabled";
const WAKE_KEY = "wakeLockEnabled";
const GAIN: Record<Volume, number> = { low: 0.06, mid: 0.12, high: 0.22 };
const TONES = [660, 880];

let context: AudioContext | null = null;

function read(key: string): string | null {
  try { return typeof window === "undefined" ? null : window.localStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch { /* хранилище недоступно */ }
  window.dispatchEvent(new Event(PREFS_EVENT));
}

export function isSoundEnabled() { return read(ENABLED_KEY) === "1"; }
export function setSoundEnabled(on: boolean) { write(ENABLED_KEY, on ? "1" : "0"); }
export function getVolume(): Volume { const value = read(VOLUME_KEY); return value === "low" || value === "high" ? value : "mid"; }
export function setVolume(volume: Volume) { write(VOLUME_KEY, volume); }
export function isNotifyEnabled() { return read(NOTIFY_KEY) === "1"; }
export function setNotifyEnabled(on: boolean) { write(NOTIFY_KEY, on ? "1" : "0"); }
export function isWakeEnabled() { return read(WAKE_KEY) === "1"; }
export function setWakeEnabled(on: boolean) { write(WAKE_KEY, on ? "1" : "0"); }

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  return context;
}

export async function unlockSound(): Promise<void> {
  const audio = audioContext();
  if (!audio) return;
  try { if (audio.state !== "running") await audio.resume(); } catch { /* браузер не разрешил звук */ }
}

export function playChime(volume: Volume = getVolume()): void {
  const audio = audioContext();
  if (!audio) return;
  const gain = GAIN[volume];
  void unlockSound();
  const start = audio.currentTime + 0.03;
  TONES.forEach((frequency, index) => {
    const from = start + index * 0.35;
    const osc = audio.createOscillator();
    const env = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    env.gain.setValueAtTime(0.0001, from);
    env.gain.exponentialRampToValueAtTime(gain, from + 0.07);
    env.gain.setValueAtTime(gain, from + 0.16);
    env.gain.exponentialRampToValueAtTime(0.0001, from + 0.25);
    osc.connect(env);
    env.connect(audio.destination);
    osc.start(from);
    osc.stop(from + 0.26);
  });
}
