"use client";

import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { CAFE } from "@/lib/config";
import { mapEmbed, mapLink } from "@/lib/map";

type MapBlockProps = { address: string; openingHours: string; mapUrl?: string };

export function MapBlock({ address, openingHours, mapUrl }: MapBlockProps) {
  const [showMap, setShowMap] = useState(false);
  const place = `${address}, ${CAFE.city}`;
  return <div className="rounded-2xl bg-surface p-4 md:col-span-2">
    <h2 className="flex items-center gap-2 text-base font-semibold"><MapPin className="size-5 text-accent" aria-hidden="true" />Как нас найти</h2>
    <p className="mt-3 text-sm leading-6 text-muted">{place} · {openingHours}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <a href={mapLink({ address, mapUrl })} target="_blank" rel="noopener noreferrer" className="press inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold"><Navigation className="size-4" aria-hidden="true" />Открыть на карте</a>
      <button type="button" onClick={() => setShowMap((value) => !value)} className="press inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-background">{showMap ? "Скрыть карту" : "Показать карту"}</button>
    </div>
    {showMap && <iframe src={mapEmbed(address)} title={`Карта: ${place}`} loading="lazy" className="mt-3 h-[240px] w-full rounded-xl border border-line" />}
  </div>;
}
