import { AZ_CITIES, getCityById } from "@/lib/az-cities";
import { fetchFoursquareRestaurants, fetchFoursquareAllAzerbaijan, getFoursquareStatus, type MapPin } from "@/lib/foursquare";
import { fetchMarketTrends, fetchBakuCompetitors } from "@/lib/db/market";
import { fetchCityMarketStats } from "@/lib/db/market-cities";
import { getUserRestaurant } from "@/lib/db/session";

export async function buildAzMapPayload(cityId = "baku") {
  const allAz = cityId === "all";
  const city = allAz ? AZ_CITIES[0] : getCityById(cityId);

  const foursquarePins: MapPin[] = allAz
    ? await fetchFoursquareAllAzerbaijan(35).catch(() => [])
    : await fetchFoursquareRestaurants(city.near, 50).catch(() => []);

  const trendCity = allAz ? "Baku" : city.name === "Bakı" ? "Baku" : city.name;

  const [trends, competitors, cityStats, fsqStatus] = await Promise.all([
    fetchMarketTrends(trendCity).catch(() => []),
    fetchBakuCompetitors("AZN").catch(() => []),
    fetchCityMarketStats().catch(() => []),
    Promise.resolve(getFoursquareStatus()),
  ]);

  let restaurantName: string | null = null;
  try {
    restaurantName = (await getUserRestaurant())?.name ?? null;
  } catch {
    /* optional */
  }

  const competitorPins = competitors
    .filter((c) => c.district || c.address)
    .slice(0, 15)
    .map((c, i) => ({
      id: `comp-${c.id}`,
      name: c.name,
      lat: city.lat + (i % 4) * 0.008 - 0.012,
      lng: city.lng + Math.floor(i / 4) * 0.01 - 0.005,
      source: "competitor" as const,
      category: c.cuisine?.[0] ?? "Restaurant",
      rating: c.rating,
      address: c.address,
    }));

  const trendPins = trends.slice(0, 6).map((t, i) => ({
    id: `trend-${t.cuisine}`,
    name: `${t.cuisine} trend`,
    lat: city.lat - 0.03 + i * 0.012,
    lng: city.lng - 0.02 + (i % 3) * 0.018,
    source: "trend" as const,
    category: t.cuisine,
    momentum: t.momentum,
    demandChange: t.demandChange,
  }));

  return {
    center: {
      lat: allAz ? 40.4093 : city.lat,
      lng: allAz ? 49.8671 : city.lng,
      city: allAz ? "Azərbaycan" : city.name,
      cityId: allAz ? "all" : city.id,
    },
    pins: [...foursquarePins, ...competitorPins, ...trendPins],
    trends,
    cityStats,
    cities: AZ_CITIES.map((c) => ({ id: c.id, name: c.name })),
    foursquareConfigured: fsqStatus.configured,
    foursquareWorking: fsqStatus.working,
    foursquareError: fsqStatus.error,
    foursquareCount: foursquarePins.length,
    restaurant: restaurantName,
    cacheTtl: Number(process.env.AI_CACHE_TTL ?? 60),
    updatedAt: new Date().toISOString(),
  };
}
