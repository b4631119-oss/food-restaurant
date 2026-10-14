// Незавершённая попытка оформления переживает перезагрузку страницы: ключ идемпотентности и
// подпись корзины хранятся в localStorage. Содержимое заказа НЕ хранится — восстановить оплату
// или дослать заказ позже отсюда нельзя, это только «тот же checkout → тот же clientOrderId».
//
// Зачем: если результат оформления неизвестен (таймаут, закрытие вкладки), повтор с тем же ключом
// либо вернёт уже созданный заказ, либо безопасно создаст его один раз. Новая попытка для того же
// оформления с другим ключом запрещена — иначе на один чек появлялось бы два заказа.
export const ATTEMPT_KEY = "sushi-bar-no1-order-attempt:v1";

export type PendingAttempt = { id: string; signature: string; at: number };

export function readPendingAttempt(): PendingAttempt | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ATTEMPT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingAttempt>;
    if (typeof parsed?.id !== "string" || !parsed.id || typeof parsed.signature !== "string") return null;
    return { id: parsed.id, signature: parsed.signature, at: Number(parsed.at) || 0 };
  } catch { return null; }
}

export function savePendingAttempt(id: string, signature: string): PendingAttempt {
  const attempt: PendingAttempt = { id, signature, at: Date.now() };
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt)); } catch { /* без storage ключ живёт только в памяти */ }
  }
  return attempt;
}

export function clearPendingAttempt(): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(ATTEMPT_KEY); } catch { /* без storage */ }
}
