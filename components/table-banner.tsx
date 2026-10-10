"use client";

type TableBannerProps = { table: number; onOrder: () => void };

export function TableBanner({ table, onOrder }: TableBannerProps) {
  return <div className="border-b border-accent/40 bg-accent/10"><div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-4 py-2.5 sm:px-8 lg:px-6">
    <p className="text-sm font-semibold">Вы за столом №{table}</p>
    <button type="button" onClick={onOrder} className="press min-h-11 rounded-sm bg-accent px-4 text-sm font-semibold text-background hover:bg-accent-hover">Заказать</button>
  </div></div>;
}
