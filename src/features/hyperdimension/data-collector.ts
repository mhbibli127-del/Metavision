import type { MetavisionBusinessData } from "./types";
import { fetchBusinessDataForAnalysis } from "@/lib/db/dashboard";

const empty: MetavisionBusinessData = {
  orders: [],
  reservations: [],
  inventory: [],
  customers: [],
  menu: [],
  revenue: { total: 0, todayDelta: 0 },
};

/** Load live business data from PostgreSQL for the authenticated user */
export async function collectDashboardData(
  overrides?: Partial<MetavisionBusinessData>,
): Promise<MetavisionBusinessData> {
  if (overrides) {
    return { ...empty, ...overrides };
  }

  try {
    const data = await fetchBusinessDataForAnalysis();
    return {
      orders: data.orders,
      reservations: data.reservations,
      inventory: data.inventory,
      customers: data.customers,
      menu: data.menu,
      revenue: data.revenue,
    };
  } catch {
    return empty;
  }
}
