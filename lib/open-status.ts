import { CAFE } from "@/lib/config";

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getOpenStatus(date = new Date()) {
  const [opensAt, closesAt] = CAFE.openingHours.split(/[–-]/).map((time) => time.trim());
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bishkek",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const current = hour * 60 + minute;
  const opening = toMinutes(opensAt);
  const closing = toMinutes(closesAt);
  const isOpen = opening > closing
    ? current >= opening || current < closing
    : current >= opening && current < closing;

  return {
    isOpen,
    text: isOpen ? `Открыто · до ${closesAt}` : `Закрыто · откроемся в ${opensAt}`,
  };
}
