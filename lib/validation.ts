export function validateName(value: string): string {
  return value.trim().length < 2 ? "Укажите имя (минимум 2 символа)." : "";
}

export function validatePhone(value: string): string {
  return value.trim().replace(/\D/g, "").length < 7 ? "Укажите корректный номер телефона." : "";
}

export function validateAddress(value: string): string {
  return value.trim().length < 8 ? "Укажите адрес доставки подробнее (минимум 8 символов)." : "";
}
