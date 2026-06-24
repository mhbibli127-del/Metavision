import { NextResponse } from "next/server";
import { buildTasteMindPayload } from "@/lib/db/intelligence";
import { fetchMarketTrends } from "@/lib/db/market";

async function fallbackPayload() {
  const trends = await fetchMarketTrends("Baku");
  const globalTrends = trends.map((t) => ({
    region: t.region,
    city: t.city,
    cuisine: t.cuisine,
    momentum: t.momentum,
    demandChange: t.demandChange,
    confidence: t.confidence,
    observedAt: t.observedAt,
  }));

  return {
    tasteDnaScores: [
      { key: "local", label: "Yerli mətbəx tələbi", value: 82, trend: "up" as const },
      { key: "revenue", label: "Gəlir dinamikası", value: 50, trend: "stable" as const },
      { key: "occupancy", label: "Masa doluluğu", value: 0, trend: "stable" as const },
      { key: "stock", label: "Anbar riski", value: 0, trend: "stable" as const },
    ],
    predictionCards: [
      {
        id: "pred-db",
        message: "MongoDB bağlantısı yoxdur — npm run db:seed işlədin",
        confidence: 40,
        horizon: "—",
        direction: "down" as const,
        impact: "high" as const,
        linkedTrendCity: "Baku",
      },
    ],
    globalTrends,
    contextSignals: [],
    marketAlerts: [],
    liveFeed: [],
    opsSnapshot: {
      restaurantName: "Metavision Demo",
      city: "Baku",
      currency: "AZN",
      revenue: 0,
      todayDelta: 0,
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      todayOrderCount: 0,
      lowStockCount: 0,
      activeReservations: 0,
      tablesTotal: 0,
      tablesOccupied: 0,
      tablesReserved: 0,
      competitorCount: 0,
      topDishes: [],
      updatedAt: new Date().toISOString(),
    },
    incidents: [],
  };
}

export async function GET() {
  try {
    const data = await buildTasteMindPayload();
    return NextResponse.json(data);
  } catch {
    const data = await fallbackPayload();
    return NextResponse.json(data);
  }
}
