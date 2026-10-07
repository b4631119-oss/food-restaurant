export function validateName(value: string): string {
  return value.trim().length < 2 ? "Введите имя" : "";
}

export function validatePhone(value: string): string {
  return value.trim().replace(/\D/g, "").length < 7 ? "Введите телефон полностью" : "";
}

export function validateAddress(value: string): string {
  return value.trim().length < 8 ? "Введите адрес: улица и дом" : "";
}
