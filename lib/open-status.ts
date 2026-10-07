export type OpenStatus = { isOpen: boolean; text: string };

export function openingTime(openingHours: string): string {
  return /^\s*(\d{1,2}:\d{2})/.exec(openingHours)?.[1] ?? "";
}

export function getOpenStatus(now: Date, openingHours: string): OpenStatus {
  const match = /^\s*(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})\s*$/.exec(openingHours);
  if (!match) return { isOpen: false, text: "График уточняйте" };
  const start = Number(match[1]) * 60 + Number(match[2]);
  const end = Number(match[3]) * 60 + Number(match[4]);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const isOpen = start === end ? true : start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
  return { isOpen, text: isOpen ? "Открыто" : "Закрыто" };
}
