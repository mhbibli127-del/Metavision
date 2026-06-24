/**
 * Hyperdimension Executive Brain — müdiriyyət ssenariləri, DNA və proqnozlar
 */
import type { MetavisionBusinessData } from "@/features/hyperdimension/types";

export type ScenarioResult = {
  id: number;
  inflationPct: number;
  priceAdjustPct: number;
  projectedRevenue: number;
  projectedMargin: number;
  score: number;
  label: string;
  strategy: string;
  summary: string;
};

export type ExecutiveBrainOutput = {
  confidence: number;
  onboardingRequired: boolean;
  inflation: {
    level: "low" | "moderate" | "high" | "critical";
    headline: string;
    detail: string;
    estimatedImpactPct: number;
  };
  revenue: {
    headline: string;
    opportunities: Array<{
      title: string;
      action: string;
      upliftPct: number;
      confidence: number;
      horizon: string;
    }>;
  };
  tasteDna: Array<{
    key: string;
    label: string;
    value: number;
    trend: "up" | "down" | "stable";
    hint: string;
  }>;
  predictions: Array<{
    id: string;
    title: string;
    message: string;
    confidence: number;
    horizon: string;
    direction: "up" | "down" | "stable";
    impact: "low" | "medium" | "high";
    metric: string;
    metricValue: string;
  }>;
  executiveSummary: string;
  scenarios: ScenarioResult[];
  analyzedAt: string;
};

const INFLATION_BANDS = [0, 0.04, 0.08, 0.12, 0.16];
const PRICE_BANDS = [-5, 0, 5, 10, 15, 20];
const STRATEGIES = [
  { key: "premium", label: "Premium", weight: 1.1 },
  { key: "volume", label: "Həcm", weight: 0.95 },
  { key: "balance", label: "Balans", weight: 1 },
  { key: "cost", label: "Xərc azaltma", weight: 0.88 },
] as const;

type BaseMetrics = {
  revenue: number;
  todayDelta: number;
  fulfillment: number;
  lowStock: number;
  avgOrder: number;
  retention: number;
  orderCount: number;
  menuCount: number;
  reservationCount: number;
  hasRestaurant: boolean;
};

function baseMetrics(data: MetavisionBusinessData, hasRestaurant: boolean): BaseMetrics {
  const revenue = data.revenue?.total ?? 0;
  const todayDelta = data.revenue?.todayDelta ?? 0;
  const orders = data.orders ?? [];
  const completed = orders.filter((o) => o.status === "Completed" || o.status === "COMPLETED").length;
  const fulfillment = orders.length ? (completed / orders.length) * 100 : hasRestaurant ? 70 : 55;
  const lowStock = (data.inventory ?? []).filter(
    (i) => i.status?.toLowerCase().includes("low") || i.status?.toLowerCase().includes("out"),
  ).length;
  const avgOrder =
    orders.length > 0 ? orders.reduce((s, o) => s + o.amount, 0) / orders.length : hasRestaurant ? 28 : 22;
  const visits = (data.customers ?? []).map((c) => c.visits);
  const retention = visits.length ? visits.filter((v) => v > 1).length / visits.length : hasRestaurant ? 0.5 : 0.35;
  const benchmarkRevenue = hasRestaurant ? revenue : 4200;

  return {
    revenue: hasRestaurant ? revenue : benchmarkRevenue,
    todayDelta: hasRestaurant ? todayDelta : 0,
    fulfillment,
    lowStock,
    avgOrder,
    retention,
    orderCount: orders.length,
    menuCount: data.menu?.length ?? 0,
    reservationCount: data.reservations?.length ?? 0,
    hasRestaurant,
  };
}

function simulateScenario(
  base: BaseMetrics,
  inflationPct: number,
  priceAdjustPct: number,
  strategy: (typeof STRATEGIES)[number],
): ScenarioResult {
  const demandElasticity = strategy.key === "volume" ? -0.65 : strategy.key === "premium" ? -0.45 : -0.85;
  const volumeChange = demandElasticity * priceAdjustPct * strategy.weight;
  const costInflation = inflationPct * 0.62;
  const projectedRevenue =
    base.revenue * (1 + priceAdjustPct / 100) * (1 + volumeChange / 100) * (1 + base.todayDelta / 200);
  const projectedMargin = Math.max(
    0,
    42 - costInflation * 100 + priceAdjustPct * 0.4 - base.lowStock * 2 + (strategy.key === "cost" ? 4 : 0),
  );
  const score =
    projectedRevenue * 0.4 +
    projectedMargin * 8 +
    base.fulfillment * 2 -
    inflationPct * 120 -
    Math.abs(priceAdjustPct) * 3;

  let label = "Balans";
  if (score > base.revenue * 0.45 + 60) label = "Gəlir fürsəti";
  else if (inflationPct > 0.1 && projectedMargin < 30) label = "İnflyasiya riski";
  else if (strategy.key === "cost") label = "Xərc optimallaşdırması";

  const summary = `${strategy.label}: inflasiya ${(inflationPct * 100).toFixed(0)}%, qiymət ${priceAdjustPct > 0 ? "+" : ""}${priceAdjustPct}% → təxmini ${Math.round(projectedRevenue)} AZN gəlir, ${projectedMargin.toFixed(1)}% marja`;

  return {
    id: 0,
    inflationPct: Math.round(inflationPct * 1000) / 10,
    priceAdjustPct,
    projectedRevenue: Math.round(projectedRevenue * 100) / 100,
    projectedMargin: Math.round(projectedMargin * 10) / 10,
    score: Math.round(score * 100) / 100,
    label,
    strategy: strategy.label,
    summary,
  };
}

function buildAllScenarios(base: BaseMetrics): ScenarioResult[] {
  const scenarios: ScenarioResult[] = [];
  let id = 1;
  for (const inflation of INFLATION_BANDS) {
    for (const price of PRICE_BANDS) {
      for (const strategy of STRATEGIES) {
        const s = simulateScenario(base, inflation, price, strategy);
        s.id = id++;
        scenarios.push(s);
      }
    }
  }
  return scenarios;
}

export function runExecutiveBrain(
  data: MetavisionBusinessData,
  city = "Bakı",
  hasRestaurant = true,
): ExecutiveBrainOutput {
  const base = baseMetrics(data, hasRestaurant);
  const scenarios = buildAllScenarios(base);
  const sorted = [...scenarios].sort((a, b) => b.score - a.score);
  const topOpportunity = sorted[0]!;
  const worstInflation = [...scenarios]
    .filter((s) => s.label === "İnflyasiya riski")
    .sort((a, b) => a.score - b.score)[0];
  const avgInflation = scenarios.reduce((s, x) => s + x.inflationPct, 0) / scenarios.length;

  const inflationLevel: ExecutiveBrainOutput["inflation"]["level"] =
    avgInflation > 14 || base.lowStock > 3
      ? "critical"
      : avgInflation > 10 || base.todayDelta < -5
        ? "high"
        : avgInflation > 6
          ? "moderate"
          : "low";

  const opportunities = sorted
    .filter((s) => s.label === "Gəlir fürsəti")
    .slice(0, 5)
    .map((s, idx) => ({
      title: s.summary.split("→")[0] ?? s.label,
      action:
        s.priceAdjustPct > 0
          ? "Menyu qiymətini seçilmiş kateqoriyalarda artırın, tələb yüksək məhsullarda test edin"
          : "Promo paketlər və happy-hour ilə həcmi artırın",
      upliftPct: Math.round(((s.projectedRevenue - base.revenue) / Math.max(1, base.revenue)) * 100),
      confidence: Math.min(95, 68 + idx * 5 + Math.round(base.fulfillment / 5)),
      horizon: idx === 0 ? "7 gün" : "30 gün",
    }));

  if (!opportunities.length) {
    opportunities.push({
      title: "Stabilizasiya rejimi",
      action: "Əməliyyat səmərəliliyini saxlayın — kiçik qiymət A/B testləri",
      upliftPct: Math.max(0, base.todayDelta),
      confidence: 72,
      horizon: "14 gün",
    });
  }

  const tasteDna = [
    {
      key: "local",
      label: "Yerli zövq uyğunluğu",
      value: Math.min(99, Math.max(12, 45 + (base.hasRestaurant ? 20 : 10) + Math.round(base.retention * 30))),
      trend: (base.retention > 0.45 ? "up" : "stable") as "up" | "stable",
      hint: `${city} bazarına uyğun dad profili`,
    },
    {
      key: "richness",
      label: "Dad zənginliyi indeksi",
      value: Math.min(99, Math.max(10, 30 + base.menuCount * 4 + (base.hasRestaurant ? 15 : 5))),
      trend: (base.menuCount >= 8 ? "up" : "stable") as "up" | "stable",
      hint: base.menuCount ? `${base.menuCount} menyu mövqeyi` : "Menyu əlavə edildikcə güclənir",
    },
    {
      key: "loyalty",
      label: "Müştəri sədaqəti",
      value: Math.min(99, Math.round(base.retention * 100)),
      trend: (base.retention >= 0.5 ? "up" : base.retention < 0.35 ? "down" : "stable") as
        | "up"
        | "down"
        | "stable",
      hint: base.orderCount ? `${base.orderCount} sifariş əsasında` : "İlk sifarişlərdən sonra formalaşır",
    },
    {
      key: "peak",
      label: "Pik saat profili",
      value: Math.min(99, Math.max(20, 40 + Math.round(base.fulfillment / 2))),
      trend: (base.fulfillment > 70 ? "up" : "stable") as "up" | "stable",
      hint: "Axşam və həftə sonu ağırlığı",
    },
    {
      key: "season",
      label: "Mövsüm uyğunluğu",
      value: Math.min(99, 55 + (new Date().getMonth() >= 4 && new Date().getMonth() <= 8 ? 15 : 5)),
      trend: "stable" as const,
      hint: "Cari mövsümə uyğun menyu balansı",
    },
    {
      key: "variety",
      label: "Menyu müxtəlifliyi",
      value: Math.min(99, Math.max(8, base.menuCount * 8 + (base.hasRestaurant ? 10 : 0))),
      trend: (base.menuCount >= 5 ? "up" : "down") as "up" | "down",
      hint: "Kateqoriya və qiymət aralığı diversifikasiyası",
    },
  ];

  const rev7 = Math.round(base.revenue * (1 + opportunities[0]!.upliftPct / 300));
  const rev30 = Math.round(base.revenue * (1 + opportunities[0]!.upliftPct / 100));

  const predictions = [
    {
      id: "pred-revenue-7",
      title: "7 günlük gəlir",
      message: hasRestaurant
        ? `Növbəti həftə təxmini ${rev7} AZN — cari trend ${base.todayDelta >= 0 ? "müsbət" : "mənfi"}`
        : "Restoran qeydiyyatı tamamlanana qədər bazar bənçmarkı göstərilir",
      confidence: hasRestaurant ? Math.min(92, 75 + Math.round(base.fulfillment / 8)) : 58,
      horizon: "7 gün",
      direction: (base.todayDelta >= 0 ? "up" : "down") as "up" | "down",
      impact: "high" as const,
      metric: "Proqnoz gəlir",
      metricValue: `${rev7} AZN`,
    },
    {
      id: "pred-revenue-30",
      title: "30 günlük gəlir",
      message: `Aylıq ssenari: ${rev30} AZN — ən uyğun qiymət strategiyası +${opportunities[0]!.upliftPct}% potensial`,
      confidence: opportunities[0]!.confidence,
      horizon: "30 gün",
      direction: "up" as const,
      impact: "high" as const,
      metric: "Aylıq proqnoz",
      metricValue: `${rev30} AZN`,
    },
    {
      id: "pred-inflation",
      title: "İnflyasiya təsiri",
      message:
        inflationLevel === "critical" || inflationLevel === "high"
          ? `${city}: orta ${avgInflation.toFixed(1)}% təzyiq — xərcləri ${worstInflation ? worstInflation.inflationPct.toFixed(1) : "12"}% həddində izləyin`
          : `İnflyasiya nəzarətdə (${avgInflation.toFixed(1)}%) — marja genişləndirmə mümkündür`,
      confidence: inflationLevel === "low" ? 85 : 78,
      horizon: "30 gün",
      direction: (inflationLevel === "low" ? "up" : "down") as "up" | "down",
      impact: (inflationLevel === "critical" ? "high" : "medium") as "high" | "medium",
      metric: "Təzyiq",
      metricValue: `${Math.round(avgInflation)}%`,
    },
    {
      id: "pred-demand",
      title: "Tələb dalğası",
      message: `Rezervasiya və sifariş həcmi: ${base.reservationCount} rezerv · ${base.orderCount} aktiv sifariş · fulfillment ${Math.round(base.fulfillment)}%`,
      confidence: 82,
      horizon: "canlı",
      direction: (base.fulfillment >= 65 ? "up" : "down") as "up" | "down",
      impact: "medium" as const,
      metric: "Fulfillment",
      metricValue: `${Math.round(base.fulfillment)}%`,
    },
    {
      id: "pred-basket",
      title: "Orta səbət",
      message: `Orta sifariş ${base.avgOrder.toFixed(1)} AZN — ${base.avgOrder > 25 ? "upsell fürsəti yüksək" : "kombo paketlərlə artırıla bilər"}`,
      confidence: 76,
      horizon: "14 gün",
      direction: (base.avgOrder >= 22 ? "up" : "stable") as "up" | "stable",
      impact: "low" as const,
      metric: "Orta səbət",
      metricValue: `${base.avgOrder.toFixed(1)} AZN`,
    },
  ];

  const dnaIndex = Math.round(tasteDna.reduce((s, c) => s + c.value, 0) / tasteDna.length);

  const executiveSummary = hasRestaurant
    ? [
        `Beyin ${scenarios.length} biznes ssenarisini qiymətləndirdi.`,
        inflationLevel === "low"
          ? "İnflyasiya təzyiqi aşağıdır — gəlir artımı üçün qiymət optimallaşdırması tövsiyə olunur."
          : inflationLevel === "moderate"
            ? "Orta inflasiya mühiti — xərc və qiymət balansını həftəlik izləyin."
            : "Yüksək inflasiya riski — təchizat və menyu marjasını dərhal nəzərdən keçirin.",
        `Ən güclü fürsət: ${topOpportunity.summary}`,
        `Taste DNA indeksi: ${dnaIndex}/100.`,
      ].join(" ")
    : [
        "Restoran hələ qeydiyyatdan keçməyib — bazar və şəhər məlumatları əsasında ssenarilər hazırlanıb.",
        "Restoran profilini tamamlayın; real sifariş və menyu məlumatı daxil olanda DNA və proqnozlar dəqiqləşəcək.",
        `Ən uyğun başlanğıc ssenari: ${topOpportunity.summary}`,
      ].join(" ");

  return {
    confidence: Math.min(96, hasRestaurant ? 70 + Math.round(base.fulfillment / 5) : 55),
    onboardingRequired: !hasRestaurant,
    inflation: {
      level: inflationLevel,
      headline:
        inflationLevel === "critical"
          ? "Kritik inflasiya təzyiqi"
          : inflationLevel === "high"
            ? "Yüksək inflasiya riski"
            : inflationLevel === "moderate"
              ? "Orta inflasiya mühiti"
              : "İnflyasiya nəzarətdə",
      detail: `Ssenarilər üzrə orta təzyiq ${avgInflation.toFixed(1)}%. Xərc artımı marjaya təsir edə bilər.`,
      estimatedImpactPct: Math.round(avgInflation),
    },
    revenue: {
      headline: `+${opportunities[0]!.upliftPct}% potensial gəlir (tövsiyə olunan ssenari)`,
      opportunities,
    },
    tasteDna,
    predictions,
    executiveSummary,
    scenarios,
    analyzedAt: new Date().toISOString(),
  };
}
