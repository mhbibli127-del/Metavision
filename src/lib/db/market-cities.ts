import { tryConnectDb } from "@/lib/mongodb";
import { CompetitorRestaurantModel, CompetitorMenuItemModel, MarketTrendModel, docs } from "@/lib/models";
import { AZ_CITIES } from "@/lib/az-cities";
import { BAKU_DELIVERY_DEFAULTS } from "@/lib/db/delivery-constants";

export type CityMarketStat = {
  cityId: string;
  city: string;
  competitorCount: number;
  avgRating: number;
  avgPriceAzn: number;
  topCuisine: string;
  deliveryCommissionPct: number;
  trendMomentum: number;
};

export async function fetchCityMarketStats(): Promise<CityMarketStat[]> {
  if (!(await tryConnectDb())) {
    return fallbackCityStats();
  }

  const stats: CityMarketStat[] = [];

  for (const city of AZ_CITIES) {
    const cityName = city.name === "Bakı" ? "Baku" : city.name;
    const dbCity =
      city.name === "Bakı" ? "Baku" : city.name === "Gəncə" ? "Ganja" : city.name === "Sumqayıt" ? "Sumgayit" : cityName;

    const [competitors, trends] = await Promise.all([
      docs(await CompetitorRestaurantModel.find({ city: dbCity, isActive: true }).lean()),
      docs(await MarketTrendModel.find({ city: dbCity }).sort({ momentum: -1 }).limit(1).lean()),
    ]);

    const compIds = competitors.map((c) => String((c as Record<string, unknown>).id));
    const menuItems =
      compIds.length > 0
        ? docs(await CompetitorMenuItemModel.find({ competitorId: { $in: compIds } }).limit(40).lean())
        : [];
    const prices = menuItems.map((m) => Number((m as Record<string, unknown>).price)).filter((p) => p > 0);

    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const ratings = competitors.map((c) => Number((c as Record<string, unknown>).rating)).filter(Boolean);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const topTrend = trends[0] as Record<string, unknown> | undefined;
    const delivery = BAKU_DELIVERY_DEFAULTS[0];

    stats.push({
      cityId: city.id,
      city: city.name,
      competitorCount: competitors.length,
      avgRating: Math.round(avgRating * 10) / 10,
      avgPriceAzn: Math.round(avgPrice * 100) / 100,
      topCuisine: topTrend ? String(topTrend.cuisine) : "Azerbaijani",
      deliveryCommissionPct: delivery?.commissionPct ?? 28,
      trendMomentum: topTrend ? Number(topTrend.momentum) : 70,
    });
  }

  return stats.length ? stats : fallbackCityStats();
}

function fallbackCityStats(): CityMarketStat[] {
  return [
    { cityId: "baku", city: "Bakı", competitorCount: 8, avgRating: 4.3, avgPriceAzn: 22, topCuisine: "Azerbaijani", deliveryCommissionPct: 28, trendMomentum: 82 },
    { cityId: "ganja", city: "Gəncə", competitorCount: 4, avgRating: 4.1, avgPriceAzn: 14, topCuisine: "Kebab", deliveryCommissionPct: 25, trendMomentum: 68 },
    { cityId: "sumgait", city: "Sumqayıt", competitorCount: 3, avgRating: 4.0, avgPriceAzn: 12, topCuisine: "Fast casual", deliveryCommissionPct: 25, trendMomentum: 61 },
  ];
}
