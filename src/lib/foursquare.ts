/**
 * Foursquare Places API — Bakı restoran xəritəsi
 * https://places-api.foursquare.com
 */

export type MapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  source: "foursquare" | "competitor" | "trend";
  category?: string;
  rating?: number;
  address?: string;
  momentum?: number;
  demandChange?: number;
};

type FoursquarePlace = {
  fsq_place_id?: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  location?: { formatted_address?: string; locality?: string };
  categories?: { name?: string }[];
  rating?: number;
};

const API_VERSION = "2025-06-17";

let cacheMap: Map<string, { at: number; pins: MapPin[] }> = new Map();
let lastStatus: { configured: boolean; working: boolean; error: string | null } = {
  configured: false,
  working: false,
  error: null,
};

function cacheTtlMs() {
  const sec = Number(process.env.AI_CACHE_TTL ?? 60);
  return Number.isFinite(sec) && sec > 0 ? sec * 1000 : 60_000;
}

function readApiKey() {
  return (process.env.FOURSQUARE_API_KEY ?? "").trim();
}

export function getFoursquareConfig() {
  const apiKey = readApiKey();
  return {
    apiKey,
    clientSecret: (process.env.FOURSQUARE_CLIENT_SECRET ?? "").trim(),
    configured: Boolean(apiKey),
    working: lastStatus.working,
    error: lastStatus.error,
  };
}

export function getFoursquareStatus() {
  const { configured, working, error } = getFoursquareConfig();
  return { configured, working, error };
}

async function requestPlaces(apiKey: string, city: string, limit: number) {
  const url = new URL("https://places-api.foursquare.com/places/search");
  // Foursquare allows only one location mode: near OR ll/radius (not both).
  url.searchParams.set("near", city);
  url.searchParams.set("query", "restaurant");
  url.searchParams.set("limit", String(Math.min(limit, 50)));
  url.searchParams.set("sort", "POPULARITY");

  const authModes = [`Bearer ${apiKey}`, apiKey];
  let lastBody = "";

  for (const authorization of authModes) {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: authorization,
        "X-Places-Api-Version": API_VERSION,
      },
      cache: "no-store",
    });
    if (res.ok) return res;
    lastBody = await res.text().catch(() => "");
    if (res.status !== 401) {
      console.error("Foursquare API error:", res.status, lastBody);
      let errorMsg = lastBody || `HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(lastBody) as { message?: string };
        if (parsed.message) errorMsg = parsed.message;
      } catch {
        /* raw text */
      }
      lastStatus = { configured: true, working: false, error: errorMsg };
      return null;
    }
  }

  console.error("Foursquare API error: 401", lastBody);
  lastStatus = {
    configured: true,
    working: false,
    error: "Service API Key etibarsızdır — Foursquare Console-dan yeni key yaradın",
  };
  return null;
}

export async function fetchFoursquareRestaurants(city = "Baku", limit = 25): Promise<MapPin[]> {
  const apiKey = readApiKey();
  if (!apiKey) {
    lastStatus = { configured: false, working: false, error: null };
    return [];
  }

  const cacheKey = city.toLowerCase();
  const cached = cacheMap.get(cacheKey);
  if (cached && Date.now() - cached.at < cacheTtlMs()) {
    return cached.pins;
  }

  const res = await requestPlaces(apiKey, city, limit);
  if (!res) return cached?.pins ?? [];

  const data = (await res.json()) as { results?: FoursquarePlace[] };
  const pins: MapPin[] = (data.results ?? [])
    .filter((p) => p.latitude != null && p.longitude != null && p.name)
    .map((p) => ({
      id: `fsq-${cacheKey}-${p.fsq_place_id ?? p.name}`,
      name: p.name!,
      lat: p.latitude!,
      lng: p.longitude!,
      source: "foursquare" as const,
      category: p.categories?.[0]?.name ?? "Restaurant",
      rating: p.rating,
      address: p.location?.formatted_address ?? p.location?.locality,
    }));

  lastStatus = { configured: true, working: pins.length > 0, error: pins.length ? null : "Heç bir nəticə tapılmadı" };
  cacheMap.set(cacheKey, { at: Date.now(), pins });
  return pins;
}

export async function fetchFoursquareAllAzerbaijan(limitPerCity = 35): Promise<MapPin[]> {
  const { AZ_CITIES } = await import("@/lib/az-cities");
  const batches = await Promise.all(
    AZ_CITIES.map((c) => fetchFoursquareRestaurants(c.near, limitPerCity).catch(() => [])),
  );
  return batches.flat();
}

export function clearFoursquareCache() {
  cacheMap = new Map();
  lastStatus = { configured: Boolean(readApiKey()), working: false, error: null };
}
