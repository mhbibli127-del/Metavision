import { connectDb } from "@/lib/mongodb";
import { MarketTrendModel, CompetitorRestaurantModel, docs } from "@/lib/models";
import type { TrendPayload } from "@/services/trends/types";

const FALLBACK_HASHTAGS = [
  "#bakufood",
  "#azerifood",
  "#bakurestaurant",
  "#dolma",
  "#qutab",
  "#ləvəngi",
  "#streetfoodbaku",
  "#brunchbaku",
];

const FALLBACK_HEADLINES = [
  "Bakı restoranları axşam saatlarında daha yüksək tələb görür",
  "Delivery platformaları komissiya tariflərini yeniləyir",
  "Yerli mətbəx trendi: Azərbaycan mətbəxi və fusion menyu",
  "Turizm mövsümü — rezervasiya həcminə hazırlıq",
];

/** DB + curated fallback when external APIs fail — keeps MVP demo usable */
export async function fetchFallbackSocialSignals(): Promise<{
  x: TrendPayload;
  tiktok: TrendPayload;
  news: TrendPayload;
  foodSignals: string[];
}> {
  await connectDb();

  const [trends, competitors] = await Promise.all([
    MarketTrendModel.find().sort({ momentum: -1 }).limit(6).lean(),
    CompetitorRestaurantModel.find({ isActive: true }).limit(5).lean(),
  ]);

  const fromDb = docs(trends as Array<{ _id: string } & Record<string, unknown>>).map(
    (t) => `#${String(t.cuisine).toLowerCase().replace(/\s+/g, "")}`,
  );

  const compNames = docs(competitors as Array<{ _id: string } & Record<string, unknown>>).map(
    (c) => String(c.name),
  );

  const hashtags = [...new Set([...fromDb, ...FALLBACK_HASHTAGS])].slice(0, 20);
  const headlines = [
    ...FALLBACK_HEADLINES,
    ...compNames.map((n) => `${n} — rəqib monitorinqi aktiv`),
  ].slice(0, 12);

  const now = new Date().toISOString();
  const meta = { provider: "metavision_db_fallback" };

  return {
    x: { source: "x", trends: hashtags.slice(0, 12), updatedAt: now, meta },
    tiktok: { source: "tiktok", trends: hashtags.slice(0, 15), updatedAt: now, meta },
    news: { source: "news", trends: headlines, updatedAt: now, meta },
    foodSignals: [...hashtags.slice(0, 6), ...headlines.slice(0, 3)],
  };
}

export function mergeTrendPayload(live: TrendPayload | undefined, fallback: TrendPayload): TrendPayload {
  if (live && live.trends.length >= 2 && live.dataSource !== "fallback") return live;
  return {
    ...fallback,
    dataSource: "fallback",
    stale: live?.dataSource === "cache",
    meta: { ...fallback.meta, previousSource: live?.dataSource },
  };
}
