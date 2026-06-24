/** Normalize phone to 994XXXXXXXXX for DB lookups */
export function normalizePhoneDigits(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("994")) return digits;
  if (digits.startsWith("0")) return `994${digits.slice(1)}`;
  if (digits.length === 9) return `994${digits}`;

  return digits.startsWith("994") ? digits : `994${digits}`;
}

export function formatPhoneDisplay(phone: string): string {
  const d = normalizePhoneDigits(phone);
  if (d.length === 12) {
    return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  }
  return phone;
}
