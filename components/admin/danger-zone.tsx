"use client";

import { useState } from "react";
import { deleteOrder, getAllOrderIds } from "@/lib/repo/orders-repo";

const CONFIRM_WORD = "УДАЛИТЬ";
const BATCH = 400;
const CONCURRENCY = 50;

export function DangerZone() {
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const confirmed = word.trim() === CONFIRM_WORD;

  async function removeAll() {
    if (!confirmed || busy) return;
    setBusy(true); setError(""); setMessage(""); setProgress(null);
    try {
      const ids = await getAllOrderIds();
      setProgress({ done: 0, total: ids.length });
      let done = 0;
      // Пакетами по 400 заказов: счётчик показывает прогресс, а внутри пакета удаляем
      // небольшими группами, чтобы не заваливать Firebase сотнями запросов сразу.
      for (let index = 0; index < ids.length; index += BATCH) {
        const pack = ids.slice(index, index + BATCH);
        for (let start = 0; start < pack.length; start += CONCURRENCY) {
          await Promise.all(pack.slice(start, start + CONCURRENCY).map((id) => deleteOrder(id)));
        }
        done += pack.length;
        setProgress({ done, total: ids.length });
      }
      setMessage(ids.length ? `Удалено заказов: ${ids.length}` : "Заказов нет — очищать нечего.");
    } catch { setError("Не удалось удалить все заказы. Попробуйте ещё раз."); }
    finally { setBusy(false); setProgress(null); setWord(""); }
  }

  return <section className="mt-5 max-w-2xl rounded-2xl border border-red-500/40 bg-surface p-4 sm:p-6">
    <h2 className="text-lg font-bold text-red-400">Опасная зона</h2>
    <p className="mt-2 text-sm text-muted">Удалить все заказы. Нужно, чтобы очистить тестовые заказы перед запуском. Отчёты обнулятся.</p>
    <label className="mt-4 block text-sm font-semibold">Введите слово {CONFIRM_WORD} для подтверждения<input value={word} onChange={(event) => setWord(event.target.value)} placeholder={CONFIRM_WORD} autoComplete="off" className="mt-1 h-[52px] w-full rounded-lg border border-line bg-background px-3 text-base outline-none focus:border-accent" /></label>
    <button type="button" onClick={() => void removeAll()} disabled={busy || !confirmed} className="mt-3 min-h-12 w-full rounded-lg bg-red-600 px-4 font-bold text-white disabled:opacity-50">{busy ? "Удаляем заказы…" : "Удалить все заказы"}</button>
    {progress && <p role="status" className="mt-2 text-sm text-muted">Удалено {progress.done} из {progress.total}</p>}
    {message && <p role="status" className="mt-2 text-sm text-accent">{message}</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}
  </section>;
}
