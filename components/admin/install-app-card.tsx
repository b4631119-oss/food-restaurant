"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { IOS_HINT, promptInstall, useInstall } from "@/hooks/use-install-app";

export function AdminInstallCard() {
  const { canInstall } = useInstall();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const address = typeof window === "undefined" ? "/admin" : new URL("/admin", window.location.origin).href;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Буфер обмена недоступен — адрес видно на экране. */
    }
  };

  return (
    <section className="mt-5 max-w-2xl rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <h2 className="text-lg font-bold">Приложение для директора</h2>
      <p className="mt-1 text-sm text-muted">Админка устанавливается на телефон отдельно от сайта и открывается без адресной строки.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line p-3">
          <p className="text-sm font-semibold">Android / Chrome</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-muted">
            <li>Откройте адрес админки в Chrome.</li>
            <li>Нажмите «Установить админку» внизу страницы.</li>
            <li>Либо меню «⋮» → «Установить приложение».</li>
          </ol>
        </div>
        <div className="rounded-xl border border-line p-3">
          <p className="text-sm font-semibold">iPhone / Safari</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-muted">
            <li>Откройте адрес админки в Safari.</li>
            <li>{IOS_HINT}.</li>
            <li>Запустите «Админку» с домашнего экрана.</li>
          </ol>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-line bg-background px-3 py-3 text-xs">/admin</code>
        <button type="button" onClick={() => void copy()} className="flex min-h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold">
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Скопировано" : "Копировать адрес"}
        </button>
      </div>
      {canInstall && (
        <button type="button" onClick={() => void promptInstall()} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 font-bold text-background">
          <Download size={18} /> Установить админку
        </button>
      )}
      <p className="mt-4 rounded-xl border border-[#F87171]/40 bg-[#F87171]/10 p-3 text-sm font-semibold text-[#F87171]">
        Устанавливайте приложение только на личный телефон. Не передавайте доступ посторонним.
      </p>
    </section>
  );
}
