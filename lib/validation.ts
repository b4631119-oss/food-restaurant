export function validateName(value: string): string {
  return value.trim().length < 2 ? "Введите имя" : "";
}

export function validatePhone(value: string): string {
  return value.trim().replace(/\D/g, "").length < 7 ? "Введите телефон полностью" : "";
}

export function validateAddress(value: string, hasLocation = false): string {
  if (hasLocation) return "";
  return value.trim().length < 5 ? "Напишите адрес или нажмите значок местоположения" : "";
}
