export function validateName(value: string): string {
  return value.trim().length < 2 ? "Введите имя" : "";
}

export function validatePhone(value: string): string {
  return value.trim().replace(/\D/g, "").length < 7 ? "Введите телефон полностью" : "";
}

export function validateAddress(value: string, hasLocation = false): string {
  const text = value.trim();
  if (text.length < 5) return "Введите улицу и дом";
  if (!hasLocation && !/\d/.test(text)) return "Укажите номер дома или нажмите значок местоположения";
  return "";
}
