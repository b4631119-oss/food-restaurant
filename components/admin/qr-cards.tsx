"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type QrCard = { table: number; url: string; image: string };
const PRINT_CSS = `
@media print {
  body * { visibility: hidden; }
  .qr-print, .qr-print * { visibility: visible; }
  div.qr-print { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 6mm; }
  .qr-print .qr-card { break-inside: avoid; border: 1px solid #444; border-radius: 4mm; padding: 5mm; text-align: center; }
  .qr-print .qr-card img { width: 42mm; height: 42mm; margin: 0 auto; }
}
@page { size: A4 portrait; margin: 10mm; }
`;
export function QrCards() {
  const [cards, setCards] = useState<QrCard[]>([]);
  useEffect(() => {
    let active = true;
    void Promise.all(Array.from({ length: 6 }, async (_, index) => {
      const table = index + 1;
      const url = `${window.location.origin}/?table=${table}`;
      return { table, url, image: await QRCode.toDataURL(url, { width: 320, margin: 1 }) };
    })).then((items) => { if (active) setCards(items); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  return <><style>{PRINT_CSS}</style>
    {cards.length === 0 && <p className="mt-5 text-sm text-muted">Генерация QR-кодов…</p>}
    <div className="qr-print mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map((card) => (
      <figure key={card.table} className="qr-card rounded-2xl border border-line bg-white p-5 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={card.image} alt={`QR-код для стола №${card.table}`} width={192} height={192} loading="lazy" decoding="async" className="mx-auto size-48" />
        <figcaption className="mt-3 text-2xl font-extrabold text-black">Стол №{card.table}</figcaption>
        <p className="mt-1 break-all text-xs text-muted">{card.url}</p>
      </figure>
    ))}</div>
  </>;
}
