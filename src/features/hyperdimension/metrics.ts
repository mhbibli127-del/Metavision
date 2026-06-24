import type { NormalizedFeatures, FeatureMetrics } from "./types";

type StatsFns = {
  mean: (values: number[]) => number;
  variance: (values: number[]) => number;
  stdDev: (values: number[]) => number;
  correlation: (x: number[], y: number[]) => number;
};

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

function stabilityFromVariance(values: number[], stats: StatsFns): number {
  if (values.length < 2) return values.length === 1 ? 85 : 50;
  const m = stats.mean(values);
  if (m < 1e-9) return 50;
  const cv = stats.stdDev(values) / m;
  return clamp(100 - cv * 120);
}

function fulfillmentRate(statuses: string[]): number {
  if (!statuses.length) return 50;
  const completed = statuses.filter((s) => s.toLowerCase() === "completed").length;
  return clamp((completed / statuses.length) * 100);
}

function inventoryRisk(levels: number[], flags: number[]): number {
  if (!levels.length) return 0;
  const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
  const flagAvg = flags.reduce((a, b) => a + b, 0) / flags.length;
  return clamp(flagAvg * 70 + (avgLevel < 1 ? (1 - avgLevel) * 30 : 0));
}

function retentionIndex(visits: number[]): number {
  if (!visits.length) return 50;
  const repeaters = visits.filter((v) => v >= 3).length;
  const loyal = visits.filter((v) => v >= 8).length;
  return clamp((repeaters / visits.length) * 60 + (loyal / visits.length) * 40);
}

function occupancyScore(guests: number[]): number {
  if (!guests.length) return 40;
  const total = guests.reduce((a, b) => a + b, 0);
  const avg = total / guests.length;
  return clamp(Math.min(100, (avg / 12) * 100));
}

export function computeMetrics(
  features: NormalizedFeatures,
  stats: StatsFns,
  extras?: { revenueTotal?: number; vipShare?: number },
): FeatureMetrics {
  const revenueStability = stabilityFromVariance(features.orderAmounts, stats);
  const orderFulfillmentRate = fulfillmentRate(features.orderStatuses);
  const inventoryRiskScore = inventoryRisk(features.inventoryLevels, features.inventoryRiskFlags);
  const customerRetentionIndex = retentionIndex(features.customerVisits);
  const reservationOccupancy = occupancyScore(features.reservationGuests);

  const demandSignals = [
    ...features.orderAmounts,
    ...features.reservationGuests.map((g) => g * 5),
  ];
  const demandVolatility = demandSignals.length >= 2
    ? clamp(stats.stdDev(demandSignals) * 8)
    : 30;

  const lowStockCount = features.inventoryRiskFlags.filter((f) => f >= 0.6).length;
  const totalRevenue =
    extras?.revenueTotal ??
  features.orderAmounts.reduce((a, b) => a + b, 0);
  const avgOrderValue =
    features.orderAmounts.length > 0
      ? totalRevenue / features.orderAmounts.length
      : 0;

  const vipReservationShare = extras?.vipShare ?? 0;

  const operationsHealthScore = clamp(
    revenueStability * 0.2 +
      orderFulfillmentRate * 0.2 +
      (100 - inventoryRiskScore) * 0.2 +
      customerRetentionIndex * 0.15 +
      reservationOccupancy * 0.15 +
      (100 - demandVolatility) * 0.1,
  );

  const pseudoResults = features.orderAmounts.map((amount, i) => ({
    amount,
    guests: features.reservationGuests[i] ?? 0,
  }));
  const anomalyCount =
    pseudoResults.length >= 3
      ? pseudoResults.filter((r) => {
          const amounts = pseudoResults.map((x) => x.amount);
          const m = stats.mean(amounts);
          const sd = stats.stdDev(amounts);
          return sd > 0 && Math.abs(r.amount - m) / sd > 2;
        }).length
      : 0;

  return {
    revenueStability,
    orderFulfillmentRate,
    inventoryRiskScore,
    customerRetentionIndex,
    reservationOccupancy,
    demandVolatility,
    operationsHealthScore,
    anomalyCount,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    lowStockCount,
    vipReservationShare,
  };
}

export function correlationMatrix(features: NormalizedFeatures, stats: StatsFns) {
  const pairs: Record<string, number> = {};
  if (features.customerVisits.length === features.customerSpend.length && features.customerVisits.length >= 2) {
    pairs.visits_vs_spend = stats.correlation(features.customerVisits, features.customerSpend);
  }
  if (features.orderAmounts.length >= 2 && features.reservationGuests.length >= 2) {
    const n = Math.min(features.orderAmounts.length, features.reservationGuests.length);
    pairs.orders_vs_reservations = stats.correlation(
      features.orderAmounts.slice(0, n),
      features.reservationGuests.slice(0, n),
    );
  }
  return pairs;
}
