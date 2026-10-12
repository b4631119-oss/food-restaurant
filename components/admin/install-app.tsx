"use client";

import { Download, Share, Smartphone } from "lucide-react";
import { IOS_HINT, dismissInstall, promptInstall, useInstall } from "@/hooks/use-install-app";

// Кнопка для боковой панели и настроек: в установленном приложении не показывается.
export function InstallAppButton() {
  const { canInstall, standalone, ios } = useInstall();
  if (standalone) return null;
  if (canInstall) {
    return (
      <button type="button" onClick={() => void promptInstall()} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-muted hover:bg-background">
        <Download size={18} /> Установить админку
      </button>
    );
  }
  if (!ios) return null;
  return (
    <p className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs text-muted">
      <Share size={16} /> {IOS_HINT}
    </p>
  );
}

// Плашка-напоминание: не чаще одного раза в 30 дней и только внутри авторизованной админки.
export function InstallAppBanner() {
  const { canInstall, standalone, ios, dismissed } = useInstall();
  if (standalone || dismissed || !(canInstall || ios)) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 flex items-start gap-3 rounded-2xl border border-accent/30 bg-surface p-3 shadow-lg lg:left-3 lg:right-auto lg:w-80">
      <Smartphone size={20} className="mt-1 shrink-0 text-accent" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Админка как приложение</p>
        <p className="mt-1 text-xs text-muted">{canInstall ? "Установите на телефон — панель откроется в один тап." : IOS_HINT}</p>
        <div className="mt-2 flex gap-2">
          {canInstall && (
            <button type="button" onClick={() => void promptInstall()} className="min-h-11 flex-1 rounded-lg bg-accent px-3 text-sm font-bold text-background">
              Установить
            </button>
          )}
          <button type="button" onClick={dismissInstall} className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold text-muted">
            Позже
          </button>
        </div>
      </div>
    </div>
  );
}
