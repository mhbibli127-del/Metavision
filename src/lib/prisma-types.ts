/** Prisma enum replacements (SQLite has no native enums) */
export type Currency = "AZN" | "USD" | "EUR";
export type OrderStatus = "PENDING" | "PREPARING" | "READY" | "SERVED" | "CANCELLED" | "COMPLETED";
export type ReservationStatus = "CONFIRMED" | "PENDING" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
export type TableZone = "INDOOR" | "OUTDOOR" | "TERRACE" | "VIP";
export type TableStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

export function asCurrency(value?: unknown, fallback: Currency = "AZN"): Currency {
  if (value === "USD" || value === "EUR" || value === "AZN") return value;
  if (typeof value === "string" && (value === "USD" || value === "EUR" || value === "AZN")) return value;
  return fallback;
}
