"use client";

import { useRef, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { csvTemplate, parseMenuFile, type ImportPreview } from "@/lib/menu-import";
import { importProducts } from "@/lib/repo/products-repo";

type Props = { onClose: (message?: string) => void };
type Parsed = ImportPreview & { fileName: string };

export function ImportDialog({ onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [mode, setMode] = useState<"add" | "replace">("add");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmReplace, setConfirmReplace] = useState(false);
  async function pick(file?: File) {
    if (!file) return;
    try {
      const result = parseMenuFile(await file.text(), file.name);
      setParsed({ ...result, fileName: file.name });
      setError(result.items.length ? "" : "В файле нет блюд, которые можно импортировать.");
    } catch { setParsed(null); setError("Не удалось прочитать файл. Нужен JSON или CSV в кодировке UTF-8."); }
  }
  async function run() {
    if (!parsed || !parsed.items.length || busy) return;
    setBusy(true);
    try {
      await importProducts(parsed.items, mode);
      onClose(mode === "replace" ? `Меню заменено: импортировано блюд ${parsed.items.length}.` : `Импортировано блюд: ${parsed.items.length}.`);
    } catch { setError("Не удалось импортировать блюда. Попробуйте ещё раз."); setBusy(false); }
  }
  function downloadTemplate() {
    const blob = new Blob(["\uFEFF", csvTemplate()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = "menu-template.csv"; link.click(); URL.revokeObjectURL(url);
  }
  return <div className="space-y-4">
    <p className="text-sm text-muted">Формат: JSON (массив блюд) или CSV с колонками name, description, weight, price, category, image, popular. Разделитель — запятая или точка с запятой, кодировка UTF-8.</p>
    <input ref={fileRef} type="file" accept=".json,.csv,text/csv,application/json" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => fileRef.current?.click()} className="min-h-11 rounded-lg border border-line px-3 text-sm">Выбрать файл</button><button type="button" onClick={downloadTemplate} className="min-h-11 rounded-lg border border-line px-3 text-sm">Скачать шаблон CSV</button></div>
    {parsed && <div className="rounded-xl border border-line p-3 text-sm"><p>Файл: {parsed.fileName}</p><p>Найдено блюд: {parsed.items.length}</p><p>С ошибками: {parsed.errors}</p></div>}
    <div className="flex flex-col gap-2 text-sm">
      <label className="flex min-h-11 items-center gap-2"><input type="radio" checked={mode === "add"} onChange={() => setMode("add")} />Добавить к текущему меню</label>
      <label className="flex min-h-11 items-center gap-2"><input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} />Заменить всё меню</label>
    </div>
    {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    <div className="flex gap-3"><button type="button" onClick={() => onClose()} className="min-h-12 flex-1 rounded-lg border border-line">Отмена</button><button type="button" onClick={() => { if (mode === "replace") setConfirmReplace(true); else void run(); }} disabled={busy || !parsed?.items.length} className="min-h-12 flex-1 rounded-lg bg-accent font-bold text-background disabled:opacity-50">{busy ? "Импортируем…" : "Импортировать"}</button></div>
    <ConfirmDialog open={confirmReplace} title="Заменить всё меню?" confirmLabel="Заменить" message={`Текущие блюда и категории будут удалены. В меню останется ${parsed?.items.length ?? 0} импортированных блюд.`} onCancel={() => setConfirmReplace(false)} onConfirm={() => { setConfirmReplace(false); void run(); }} />
  </div>;
}
