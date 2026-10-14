// Код ошибки Firestore без персональных данных клиента: resource-exhausted, permission-denied,
// unavailable, deadline-exceeded и т.д. В журнал попадают только код и имя операции.
export function firestoreCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && code) return code;
  }
  return "unknown";
}

// Пример строки: "orders: resource-exhausted". Ни имени, ни телефона, ни адреса.
export function warnFirestore(operation: string, error: unknown): void {
  console.warn(`${operation}: ${firestoreCode(error)}`);
}

// Сбой записи заказа — ошибка, а не предупреждение: её видно в журнале как console.error.
// В строке только имя операции и код, содержимое заказа и данные клиента не пишутся.
export function errorFirestore(operation: string, error: unknown): void {
  console.error(`${operation}: ${firestoreCode(error)}`);
}

// Событие без объекта ошибки: например, отказ заказа из-за изменившихся цен.
export function warnFirestoreCode(operation: string, code: string): void {
  console.warn(`${operation}: ${code}`);
}
