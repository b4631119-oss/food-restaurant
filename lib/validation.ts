export function validateName(value: string): string {
  return value.trim().length < 2 ? "Введите имя" : "";
}

export function validatePhone(value: string): string {
  return value.trim().replace(/\D/g, "").length < 7 ? "Введите телефон полностью" : "";
}

export function validateAddress(value: string): string {
  return value.trim().length < 5 ? "Напишите адрес: улица и дом" : "";
}

// Номер WhatsApp: только цифры. Пусто — допустимо (используется основной номер).
export function normalizeWhatsapp(value: string): string {
  return value.replace(/\D/g, "");
}

export function validateWhatsapp(value: string): string {
  const digits = normalizeWhatsapp(value);
  if (!digits) return "";
  return digits.length < 9 || digits.length > 15 ? "Введите номер из 9–15 цифр или оставьте поле пустым" : "";
}
