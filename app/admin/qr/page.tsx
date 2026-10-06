"use client";

import { Printer } from "lucide-react";
import { QrCards } from "@/components/admin/qr-cards";

export default function QrPage() {
  return <section>
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">QR-коды для столов</h1><p className="mt-1 max-w-2xl text-sm text-muted">Распечатайте карточки и разложите по столам: гость сканирует QR-код и попадает на сайт с номером своего стола.</p></div>
      <button onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 font-bold text-background"><Printer size={18} />Печать</button>
    </header>
    <QrCards />
  </section>;
}
