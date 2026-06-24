import { getSiteSection } from "@/lib/db/site";
import { getUserRestaurant } from "@/lib/db/session";
import { fetchOrderStats } from "@/lib/db/dashboard";
import { asCurrency } from "@/lib/prisma-types";
import { BAKU_DELIVERY_DEFAULTS, type DeliveryPlatform } from "@/lib/db/delivery-constants";
import { fetchCityMarketStats } from "@/lib/db/market-cities";

export type { DeliveryPlatform };

export async function fetchDeliveryPlatforms(city = "Baku") {
  const all = await getSiteSection<DeliveryPlatform>("delivery_platforms");
  const list = all.length ? all : BAKU_DELIVERY_DEFAULTS;
  return list.filter((p) => p.city === city || !p.city);
}

export async function fetchDeliveryInsights() {
  const restaurant = await getUserRestaurant();
  if (!restaurant) {
    return {
      city: "Baku",
      currency: "AZN",
      platforms: BAKU_DELIVERY_DEFAULTS.map((p) => ({
        ...p,
        estMonthlyCommission: 0,
        insight: `${p.name} — DB bağlantısı yoxdur`,
      })),
      summary: {
        avgCommissionPct: 0,
        estDeliveryRevenue: 0,
        estCommissionCost: 0,
        dineInRevenue: 0,
      },
    };
  }
  const platforms = await fetchDeliveryPlatforms(restaurant.city);
  const stats = await fetchOrderStats(asCurrency(restaurant.currency));

  const avgCommission =
    platforms.length > 0
      ? platforms.reduce((s, p) => s + p.commissionPct, 0) / platforms.length
      : 0;

  const monthlyRevenue = stats.revenue * 4;
  const deliveryShare = 0.35;
  const deliveryRevenue = monthlyRevenue * deliveryShare;
  const commissionCost = deliveryRevenue * (avgCommission / 100);

  const insights = platforms.map((p) => ({
    ...p,
    estMonthlyCommission: Math.round(deliveryRevenue * (p.commissionPct / 100)),
    insight:
      p.commissionPct >= 30
        ? `${p.name} yüksək komissiya — menyu qiymətini +${Math.round(p.commissionPct * 0.15)}% artırmağı düşünün`
        : `${p.name} rəqabətli komissiya — delivery həcmi artırıla bilər`,
  }));

  return {
    city: restaurant.city,
    currency: restaurant.currency,
    platforms: insights,
    summary: {
      avgCommissionPct: Math.round(avgCommission * 10) / 10,
      estDeliveryRevenue: Math.round(deliveryRevenue),
      estCommissionCost: Math.round(commissionCost),
      dineInRevenue: Math.round(monthlyRevenue - deliveryRevenue),
    },
  };
}

export async function fetchMarketGaps() {
  const restaurant = await getUserRestaurant();
  const city = restaurant?.city ?? "Baku";
  const currency = restaurant?.currency ?? "AZN";
  const [competitors, trends, meta, delivery, cityStats] = await Promise.all([
    import("@/lib/db/market").then((m) => m.fetchBakuCompetitors(currency as "AZN")),
    import("@/lib/db/market").then((m) => m.fetchMarketTrends(city)),
    import("@/lib/models").then(async (m) => {
      const { tryConnectDb } = await import("@/lib/mongodb");
      if (!(await tryConnectDb()) || !restaurant) return null;
      return m.MetaAdsConnectionModel.findOne({ restaurantId: restaurant.id }).lean();
    }),
    fetchDeliveryInsights(),
    fetchCityMarketStats(),
  ]);

  const gaps: { area: string; status: "ok" | "partial" | "missing"; note: string }[] = [
    {
      area: "Rəqib menyu & qiymət",
      status: competitors.length >= 5 ? "ok" : "partial",
      note: `${competitors.length} Bakı rəqibi monitorinqdə`,
    },
    {
      area: "Market trend / demand",
      status: trends.length >= 4 ? "ok" : "partial",
      note: `${trends.length} cuisine trend aktiv`,
    },
    {
      area: "Meta Ads analytics",
      status: meta ? "ok" : "partial",
      note: meta ? "Bağlı / import edilib" : "CSV və ya token ilə qoşun",
    },
    {
      area: "Delivery (Wolt/Bolt)",
      status: delivery.platforms.length >= 2 ? "ok" : "missing",
      note: `Orta komissiya ${delivery.summary.avgCommissionPct}%`,
    },
    {
      area: "Multi-valyuta (AZN/USD/EUR)",
      status: "ok",
      note: `Aktiv: ${currency}`,
    },
    {
      area: "AI proqnoz & Taste DNA",
      status: process.env.AI_BACKEND_URL ? "ok" : "partial",
      note: process.env.AI_BACKEND_URL ? "AI backend konfiqurasiya edilib" : "DB əsaslı proqnoz aktiv",
    },
  ];

  return { gaps, delivery: delivery.summary, cityStats };
}
