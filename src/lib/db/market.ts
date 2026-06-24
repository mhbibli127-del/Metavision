import { asCurrency, type Currency } from "@/lib/prisma-types";
import { tryConnectDb } from "@/lib/mongodb";
import {
  CompetitorRestaurantModel,
  CompetitorMenuItemModel,
  MarketTrendModel,
  RestaurantModel,
  MenuItemModel,
  docs,
  doc,
} from "@/lib/models";
import { convertCurrency } from "@/lib/currency";
import { parseJsonArray } from "@/lib/db/json-fields";

const FALLBACK_TRENDS = [
  { region: "Absheron", city: "Baku", cuisine: "Azerbaijani", momentum: 82, demandChange: 12, confidence: 88, avgDishPriceAzn: 18.5 },
  { region: "Absheron", city: "Baku", cuisine: "Steakhouse", momentum: 74, demandChange: 8, confidence: 85, avgDishPriceAzn: 45 },
  { region: "Absheron", city: "Baku", cuisine: "Fusion", momentum: 68, demandChange: 15, confidence: 79, avgDishPriceAzn: 28 },
  { region: "Absheron", city: "Baku", cuisine: "Fast casual", momentum: 61, demandChange: -3, confidence: 72, avgDishPriceAzn: 12 },
  { region: "Absheron", city: "Baku", cuisine: "Seafood", momentum: 70, demandChange: 6, confidence: 81, avgDishPriceAzn: 35 },
  { region: "CIS", city: "Baku", cuisine: "Spicy Noodles", momentum: 85, demandChange: 16, confidence: 89, avgDishPriceAzn: 14 },
];

export async function fetchBakuCompetitors(targetCurrency: Currency = "AZN") {
  if (!(await tryConnectDb())) return [];
  const competitors = docs(
    await CompetitorRestaurantModel.find({ city: "Baku", isActive: true })
      .sort({ rating: -1 })
      .lean(),
  );

  const result = [];
  for (const c of competitors) {
    const row = c as Record<string, unknown>;
    const menuItems = docs(
      await CompetitorMenuItemModel.find({ competitorId: String(row.id) }).sort({ price: 1 }).limit(8).lean(),
    );
    const menu = [];
    for (const item of menuItems) {
      const m = item as Record<string, unknown>;
      let price = Number(m.price);
      const itemCurrency = asCurrency(String(m.currency));
      if (itemCurrency !== targetCurrency) {
        price = (await convertCurrency(price, itemCurrency, targetCurrency)).amount;
      }
      menu.push({
        id: String(m.id),
        name: String(m.name),
        category: String(m.category),
        description: m.description != null ? String(m.description) : null,
        price,
        currency: targetCurrency,
        tags: parseJsonArray(m.tags),
        isPopular: Boolean(m.isPopular),
      });
    }

    result.push({
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      address: String(row.address),
      district: String(row.district),
      cuisine: parseJsonArray(row.cuisine),
      rating: Number(row.rating),
      reviewCount: Number(row.reviewCount),
      priceRange: String(row.priceRange).toLowerCase(),
      currency: targetCurrency,
      website: row.website != null ? String(row.website) : null,
      advantages: parseJsonArray(row.advantages),
      weaknesses: parseJsonArray(row.weaknesses),
      menu,
      menuCount: menu.length,
    });
  }
  return result;
}

export async function fetchMarketTrends(city = "Baku") {
  if (!(await tryConnectDb())) {
    return FALLBACK_TRENDS.map((t) => ({
      ...t,
      observedAt: new Date().toISOString(),
    }));
  }
  const trends = docs(
    await MarketTrendModel.find({ city }).sort({ momentum: -1 }).limit(20).lean(),
  );

  return trends.map((t) => ({
    region: String(t.region),
    city: String(t.city),
    cuisine: String(t.cuisine),
    momentum: Number(t.momentum),
    demandChange: Number(t.demandChange),
    confidence: Number(t.confidence),
    avgDishPriceAzn: t.avgDishPriceAzn ? Number(t.avgDishPriceAzn) : null,
    observedAt: new Date(String(t.observedAt)).toISOString(),
  }));
}

export async function compareWithCompetitors(restaurantId: string, targetCurrency: Currency) {
  if (!(await tryConnectDb())) return null;
  const restaurant = doc(await RestaurantModel.findById(restaurantId).lean());
  if (!restaurant) return null;
  const r = restaurant as Record<string, unknown>;

  const menuItems = docs(
    await MenuItemModel.find({ restaurantId: String(r.id), available: true }).lean(),
  );

  const competitors = await fetchBakuCompetitors(targetCurrency);
  const myPrices = menuItems.map((m) => Number((m as Record<string, unknown>).price));
  const myAvg = myPrices.length ? myPrices.reduce((a, b) => a + b, 0) / myPrices.length : 0;

  const insights: string[] = [];
  for (const comp of competitors.slice(0, 5)) {
    const compAvg =
      comp.menu.length > 0 ? comp.menu.reduce((s, m) => s + m.price, 0) / comp.menu.length : 0;
    if (compAvg > 0 && myAvg > 0) {
      const diff = ((myAvg - compAvg) / compAvg) * 100;
      if (Math.abs(diff) > 8) {
        insights.push(
          diff > 0
            ? `${String(r.name)} orta qiyməti ${comp.name}-dən ${diff.toFixed(0)}% yüksəkdir (${targetCurrency}).`
            : `${String(r.name)} ${comp.name}-ə nisbətən ${Math.abs(diff).toFixed(0)}% ucuz pozisiyada (${targetCurrency}).`,
        );
      }
    }
  }

  return {
    restaurant: String(r.name),
    currency: targetCurrency,
    yourAvgPrice: Math.round(myAvg * 100) / 100,
    competitorCount: competitors.length,
    competitors: competitors.map((c) => ({
      name: c.name,
      rating: c.rating,
      priceRange: c.priceRange,
      avgPrice:
        c.menu.length > 0
          ? Math.round((c.menu.reduce((s, m) => s + m.price, 0) / c.menu.length) * 100) / 100
          : 0,
      advantages: c.advantages,
      menuSample: c.menu.slice(0, 3),
    })),
    insights,
  };
}
