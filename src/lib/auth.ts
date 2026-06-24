import type { UserSession } from "@/lib/auth-types";

export type { UserSession };

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  const visible = digits.slice(-4);
  const prefix = digits.slice(0, 3);
  return `${prefix} *** ${visible}`;
}

export function formatWhatsAppPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("994")) {
    return `+${digits}`;
  }
  if (digits.startsWith("0")) {
    digits = `994${digits.slice(1)}`;
  } else if (!digits.startsWith("994")) {
    digits = `994${digits}`;
  }

  return `+${digits}`;
}

export function getInitials(firstName: string, lastName: string): string {
  const a = firstName.trim().charAt(0).toUpperCase();
  const b = lastName.trim().charAt(0).toUpperCase();
  return `${a}${b}` || "MV";
}

export function getDemoEmail(firstName: string, lastName: string): string {
  const base = `${firstName}${lastName}`.toLowerCase().replace(/\s+/g, "") || "user";
  return `${base}@gmail.com`;
}

export async function fetchSession(): Promise<UserSession | null> {
  const response = await fetch("/api/auth/session", {
    cache: "no-store",
    credentials: "include",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { user: UserSession | null };
  return data.user;
}

export async function logoutSession(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export const DEV_OTP_HINT_KEY = "mv_dev_otp_hint";

export function saveDevOtpHint(code: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DEV_OTP_HINT_KEY, code);
}

export function readDevOtpHint(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(DEV_OTP_HINT_KEY);
}

export function clearDevOtpHint(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DEV_OTP_HINT_KEY);
}
