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
