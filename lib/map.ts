import { CAFE } from "@/lib/config";

type Place = { address: string; mapUrl?: string };

function query(address: string): string { return `${address}, ${CAFE.city}`; }
export function mapLink({ address, mapUrl }: Place): string {
  const custom = (mapUrl ?? "").trim();
  return custom || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query(address))}`;
}
export function mapEmbed(address: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query(address))}&output=embed`;
}
