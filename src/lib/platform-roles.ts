import { isAdminPhone } from "@/lib/admin";

export type PlatformRole = "super_admin" | "restaurant_owner" | "restaurant_staff";

export function resolvePlatformRole(user: { phone: string; role?: string }): PlatformRole {
  const role = String(user.role ?? "").toUpperCase();
  if (isAdminPhone(user.phone) || role === "SUPER_ADMIN") return "super_admin";
  if (["STAFF", "WAITER", "CHEF", "MANAGER", "ACCOUNTANT"].includes(role)) return "restaurant_staff";
  return "restaurant_owner";
}

export function isSuperAdmin(role: PlatformRole): boolean {
  return role === "super_admin";
}
