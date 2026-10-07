const ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
const TIMEOUT_MS = 6000;
const MIN_INTERVAL_MS = 2000;
const cache = new Map<string, string | null>();
let chain: Promise<void> = Promise.resolve();
let lastAt = 0;

type NominatimAddress = { road?: string; pedestrian?: string; house_number?: string; suburb?: string; neighbourhood?: string };

function formatAddress(address: NominatimAddress | undefined): string | null {
  const street = (address?.road ?? address?.pedestrian ?? "").trim();
  if (!street) return null;
  const parts = [street];
  const house = (address?.house_number ?? "").trim();
  if (house) parts.push(house);
  const district = (address?.suburb ?? address?.neighbourhood ?? "").trim();
  if (district) parts.push(district);
  return parts.join(", ");
}

function slot(): Promise<void> {
  const next = chain.then(async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastAt);
    if (wait > 0) await new Promise((resolve) => { window.setTimeout(resolve, wait); });
    lastAt = Date.now();
  });
  chain = next.catch(() => undefined);
  return next;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;
  await slot();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `${ENDPOINT}?format=jsonv2&addressdetails=1&zoom=18&accept-language=ru&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const data = (await response.json()) as { address?: NominatimAddress };
    const text = formatAddress(data.address);
    cache.set(key, text);
    return text;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}
