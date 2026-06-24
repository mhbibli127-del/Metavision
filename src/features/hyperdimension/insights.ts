import type {
  FeatureInsight,
  FeatureMetrics,
  FeatureRecommendation,
  FeatureUiPayload,
  NormalizedFeatures,
} from "./types";

function healthLabel(score: number): FeatureUiPayload["healthLabel"] {
  if (score >= 80) return "excellent";
  if (score >= 65) return "good";
  if (score >= 45) return "fair";
  return "at_risk";
}

export function generateInsights(
  metrics: FeatureMetrics,
  features: NormalizedFeatures,
): FeatureInsight[] {
  const insights: FeatureInsight[] = [];
  let id = 0;
  const nextId = () => `hd-insight-${++id}`;

  if (metrics.operationsHealthScore >= 75) {
    insights.push({
      id: nextId(),
      severity: "info",
      category: "operations",
      message: `Operations health is strong at ${Math.round(metrics.operationsHealthScore)}% — key metrics are within target range.`,
    });
  } else if (metrics.operationsHealthScore < 50) {
    insights.push({
      id: nextId(),
      severity: "critical",
      category: "operations",
      message: `Operations health dropped to ${Math.round(metrics.operationsHealthScore)}% — multiple areas need attention.`,
    });
  }

  if (metrics.revenueStability < 55) {
    insights.push({
      id: nextId(),
      severity: "warning",
      category: "revenue",
      message: "Order values show high volatility — review pricing consistency and promotion timing.",
    });
  }

  if (metrics.inventoryRiskScore > 50) {
    insights.push({
      id: nextId(),
      severity: metrics.lowStockCount > 2 ? "critical" : "warning",
      category: "inventory",
      message: `${metrics.lowStockCount} inventory item(s) at risk — restock planning recommended.`,
    });
  }

  if (metrics.orderFulfillmentRate < 70) {
    insights.push({
      id: nextId(),
      severity: "warning",
      category: "operations",
      message: `Order fulfillment rate is ${Math.round(metrics.orderFulfillmentRate)}% — kitchen throughput may be a bottleneck.`,
    });
  }

  if (metrics.customerRetentionIndex >= 70) {
    insights.push({
      id: nextId(),
      severity: "info",
      category: "customers",
      message: "Customer loyalty index is healthy — repeat visit rate supports stable revenue.",
    });
  } else if (features.customerVisits.length > 0 && metrics.customerRetentionIndex < 45) {
    insights.push({
      id: nextId(),
      severity: "warning",
      category: "customers",
      message: "Low repeat-visit rate detected — consider loyalty campaigns for returning guests.",
    });
  }

  if (metrics.reservationOccupancy > 75) {
    insights.push({
      id: nextId(),
      severity: "info",
      category: "reservations",
      message: "Table demand is elevated — peak-hour staffing and prep capacity should be reviewed.",
    });
  }

  if (metrics.anomalyCount > 0) {
    insights.push({
      id: nextId(),
      severity: "warning",
      category: "revenue",
      message: `${metrics.anomalyCount} unusual order pattern(s) detected — verify data quality or one-off events.`,
    });
  }

  if (metrics.demandVolatility > 65) {
    insights.push({
      id: nextId(),
      severity: "warning",
      category: "operations",
      message: "Demand volatility is high — dynamic staffing and inventory buffers may reduce service risk.",
    });
  }

  return insights;
}

export function generateRecommendations(
  metrics: FeatureMetrics,
  insights: FeatureInsight[],
): FeatureRecommendation[] {
  const recs: FeatureRecommendation[] = [];
  let id = 0;
  const nextId = () => `hd-rec-${++id}`;

  if (metrics.inventoryRiskScore > 40) {
    recs.push({
      id: nextId(),
      priority: metrics.lowStockCount > 2 ? "high" : "medium",
      action: "Schedule restock for low-inventory items",
      impact: "Reduces out-of-stock risk and order cancellations",
    });
  }

  if (metrics.orderFulfillmentRate < 75) {
    recs.push({
      id: nextId(),
      priority: "high",
      action: "Review kitchen prep workflow during peak hours",
      impact: "Improves completion rate and guest satisfaction",
    });
  }

  if (metrics.customerRetentionIndex < 55) {
    recs.push({
      id: nextId(),
      priority: "medium",
      action: "Launch a repeat-visit loyalty incentive",
      impact: "Increases visit frequency and average spend",
    });
  }

  if (metrics.demandVolatility > 60) {
    recs.push({
      id: nextId(),
      priority: "medium",
      action: "Enable demand-smoothing promotions on slow periods",
      impact: "Stabilizes revenue and staff utilization",
    });
  }

  if (insights.some((i) => i.severity === "critical")) {
    recs.push({
      id: nextId(),
      priority: "high",
      action: "Review dashboard alerts and assign owner for each critical item",
      impact: "Faster resolution of operational risks",
    });
  }

  if (!recs.length) {
    recs.push({
      id: nextId(),
      priority: "low",
      action: "Maintain current operations — monitor weekly trends",
      impact: "Preserves stable performance baseline",
    });
  }

  return recs;
}

export function buildUiPayload(
  metrics: FeatureMetrics,
  insights: FeatureInsight[],
): FeatureUiPayload {
  const healthScore = Math.round(metrics.operationsHealthScore);
  const alerts = insights
    .filter((i) => i.severity !== "info")
    .map((i) => ({
      level: i.severity,
      text: i.message,
    }));

  return {
    healthScore,
    healthLabel: healthLabel(healthScore),
    scoreCards: [
      { key: "revenueStability", label: "Revenue Stability", value: Math.round(metrics.revenueStability), unit: "%" },
      { key: "fulfillment", label: "Order Fulfillment", value: Math.round(metrics.orderFulfillmentRate), unit: "%" },
      { key: "inventoryRisk", label: "Inventory Risk", value: Math.round(metrics.inventoryRiskScore), unit: "%" },
      { key: "retention", label: "Customer Retention", value: Math.round(metrics.customerRetentionIndex), unit: "%" },
      { key: "occupancy", label: "Reservation Load", value: Math.round(metrics.reservationOccupancy), unit: "%" },
      { key: "volatility", label: "Demand Volatility", value: Math.round(metrics.demandVolatility), unit: "%" },
    ],
    alerts,
    updatedAt: new Date().toISOString(),
  };
}
