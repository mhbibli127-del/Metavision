/** Normalize to 994XXXXXXXXX for comparison */
export function normalizePhoneDigits(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("994")) {
    return digits;
  }
  if (digits.startsWith("0")) {
    return `994${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `994${digits}`;
  }

  return digits.startsWith("994") ? digits : `994${digits}`;
}

const DEFAULT_ADMIN_PHONES = ["994506975358", "994506958234"];

export function getAdminPhones(): string[] {
  const env = process.env.ADMIN_PHONES;
  if (!env?.trim()) {
    return DEFAULT_ADMIN_PHONES;
  }

  return env
    .split(",")
    .map((phone) => normalizePhoneDigits(phone.trim()))
    .filter(Boolean);
}

export function isAdminPhone(phone: string): boolean {
  const normalized = normalizePhoneDigits(phone);
  return getAdminPhones().includes(normalized);
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "Metavision2026!";
}

export function verifyAdminPassword(password: string): boolean {
  return password === getAdminPassword();
}
