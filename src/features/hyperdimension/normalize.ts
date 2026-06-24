import type { MetavisionBusinessData, NormalizedFeatures } from "./types";

export function normalizeFeatures(data: MetavisionBusinessData): NormalizedFeatures {
  const orders = data.orders ?? [];
  const reservations = data.reservations ?? [];
  const inventory = data.inventory ?? [];
  const customers = data.customers ?? [];
  const menu = data.menu ?? [];

  return {
    orderAmounts: orders.map((o) => Math.max(0, Number(o.amount) || 0)),
    orderStatuses: orders.map((o) => String(o.status ?? "")),
    reservationGuests: reservations
      .filter((r) => r.status !== "Cancelled")
      .map((r) => Math.max(0, Number(r.guests) || 0)),
    inventoryLevels: inventory.map((i) => {
      const qty = Number(i.quantity) || 0;
      const min = Math.max(1, Number(i.minQuantity) || 1);
      return qty / min;
    }),
    inventoryRiskFlags: inventory.map((i) => {
      const qty = Number(i.quantity) || 0;
      const min = Number(i.minQuantity) || 0;
      if (i.status === "out_of_stock" || qty <= 0) return 1;
      if (i.status === "low_stock" || qty <= min) return 0.6;
      return 0;
    }),
    customerVisits: customers.map((c) => Math.max(0, Number(c.visits) || 0)),
    customerSpend: customers.map((c) => Math.max(0, Number(c.totalSpent) || 0)),
    menuPrices: menu.map((m) => Math.max(0, Number(m.price) || 0)).filter((p) => p > 0),
  };
}
