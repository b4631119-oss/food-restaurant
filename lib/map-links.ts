export function googleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
export function yandexMapsLink(lat: number, lng: number): string {
  return `https://yandex.com/maps/?pt=${lng},${lat}&z=17&l=map`;
}
export function yandexSearchLink(text: string): string {
  return `https://yandex.com/maps/?text=${encodeURIComponent(text)}`;
}
export function isValidMapLink(value: string): boolean {
  const text = value.trim();
  if (!text.startsWith("https://") || text.length > 300) return false;
  try {
    const url = new URL(text);
    const host = url.hostname.replace(/^www\./, "");
    return host.startsWith("yandex.") || host.startsWith("2gis.")
      || (host === "google.com" && url.pathname.startsWith("/maps"))
      || host === "maps.app.goo.gl" || (host === "goo.gl" && url.pathname.startsWith("/maps"));
  } catch { return false; }
}
export function isValidLocation(value: unknown): value is { lat: number; lng: number } {
  if (!value || typeof value !== "object") return false;
  const { lat, lng } = value as { lat?: unknown; lng?: unknown };
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)
    && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
