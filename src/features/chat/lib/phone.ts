export function normalizePhone(value: string): string {
  if (!/^[+\d\s()-]+$/.test(value))
    throw new Error('Введите номер телефона в международном формате.');
  let phone = value.replace(/\D/g, '');
  if (phone.length === 11 && phone.startsWith('8')) phone = `7${phone.slice(1)}`;
  if (!/^(?:7\d{10}|375\d{9})$/.test(phone))
    throw new Error('Введите номер РФ (+7) или Беларуси (+375).');
  return phone;
}
