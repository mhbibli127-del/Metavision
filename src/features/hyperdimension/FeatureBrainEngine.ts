import { loadHyperdimensionModules } from "@/engines/hyperdimension/loader";
import { collectDashboardData } from "./data-collector";
import { normalizeFeatures } from "./normalize";
import { computeMetrics, correlationMatrix } from "./metrics";
import { buildUiPayload, generateInsights, generateRecommendations } from "./insights";
import type {
  AnalyzeOptions,
  FeatureBrainOutput,
  MetavisionBusinessData,
} from "./types";

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; output: FeatureBrainOutput }>();

function cacheKey(data: MetavisionBusinessData): string {
  return JSON.stringify({
    o: data.orders?.length ?? 0,
    r: data.reservations?.length ?? 0,
    i: data.inventory?.length ?? 0,
    c: data.customers?.length ?? 0,
    rev: data.revenue?.total ?? 0,
  });
}

/**
 * Production intelligence layer for Metavision dashboard features.
 * Transforms business data into metrics, insights, and UI-ready payloads.
 */
export class FeatureBrainEngine {
  readonly module = "hyperdimension" as const;

  async analyze(
    input?: Partial<MetavisionBusinessData>,
    options: AnalyzeOptions = {},
  ): Promise<FeatureBrainOutput> {
    try {
      const data = input ? { ...(await collectDashboardData()), ...input } : await collectDashboardData();
      const key = cacheKey(data);

      if (!options.skipCache) {
        const hit = cache.get(key);
        if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
          return hit.output;
        }
      }

      const features = normalizeFeatures(data);
      const stats = await this.loadStats();

      const vipCount = (data.reservations ?? []).filter((r) => r.isVip).length;
      const resCount = data.reservations?.length ?? 0;
      const vipShare = resCount > 0 ? (vipCount / resCount) * 100 : 0;

      const metrics = computeMetrics(features, stats, {
        revenueTotal: data.revenue?.total,
        vipShare,
      });

      const insights = generateInsights(metrics, features);
      const recommendations = generateRecommendations(metrics, insights);
      const ui_payload = buildUiPayload(metrics, insights);

      if (options.enableLabMode) {
        const correlations = correlationMatrix(features, stats);
        ui_payload.scoreCards.push({
          key: "lab_correlation",
          label: "Order-Reservation Link",
          value: Math.round(Math.abs(correlations.orders_vs_reservations ?? 0) * 100),
          unit: "%",
        });
      }

      const output: FeatureBrainOutput = {
        status: "ok",
        module: "hyperdimension",
        metrics,
        insights,
        recommendations,
        ui_payload,
      };

      cache.set(key, { at: Date.now(), output });
      return output;
    } catch (err) {
      return {
        status: "error",
        module: "hyperdimension",
        metrics: this.emptyMetrics(),
        insights: [],
        recommendations: [],
        ui_payload: {
          healthScore: 0,
          healthLabel: "at_risk",
          scoreCards: [],
          alerts: [{ level: "critical", text: "Analysis unavailable" }],
          updatedAt: new Date().toISOString(),
        },
        error: err instanceof Error ? err.message : "Analysis failed",
      };
    }
  }

  computeMetrics(data?: Partial<MetavisionBusinessData>) {
    return this.analyze(data).then((r) => r.metrics);
  }

  generateInsights(data?: Partial<MetavisionBusinessData>) {
    return this.analyze(data).then((r) => r.insights);
  }

  returnUiPayload(data?: Partial<MetavisionBusinessData>) {
    return this.analyze(data).then((r) => r.ui_payload);
  }

  clearCache() {
    cache.clear();
  }

  private async loadStats() {
    const mods = await loadHyperdimensionModules();
    return {
      mean: mods.statistics.mean,
      variance: mods.statistics.variance,
      stdDev: mods.statistics.stdDev,
      correlation: mods.statistics.correlation,
    };
  }

  private emptyMetrics() {
    return {
      revenueStability: 0,
      orderFulfillmentRate: 0,
      inventoryRiskScore: 0,
      customerRetentionIndex: 0,
      reservationOccupancy: 0,
      demandVolatility: 0,
      operationsHealthScore: 0,
      anomalyCount: 0,
      avgOrderValue: 0,
      totalRevenue: 0,
      lowStockCount: 0,
      vipReservationShare: 0,
    };
  }
}

let instance: FeatureBrainEngine | null = null;

export function getFeatureBrainEngine(): FeatureBrainEngine {
  if (!instance) instance = new FeatureBrainEngine();
  return instance;
}

export const hyperdimensionFeatures = getFeatureBrainEngine();
