"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { MapPin } from "./GlobalTrendsMap";

import SocialTrendsPanel from "@/components/dashboard/SocialTrendsPanel";

const GlobalTrendsMap = dynamic(() => import("./GlobalTrendsMap"), {
  ssr: false,
  loading: () => <div className="tm-map-shell tm-map-shell--loading">Xəritə yüklənir…</div>,
});

type Trend = {
  region: string;
  city: string;
  cuisine: string;
  momentum: number;
  demandChange: number;
  confidence: number;
  avgDishPriceAzn: number | null;
};

type CityStat = {
  cityId: string;
  city: string;
  competitorCount: number;
  avgRating: number;
  avgPriceAzn: number;
  topCuisine: string;
  deliveryCommissionPct: number;
  trendMomentum: number;
};

type MapPayload = {
  center: { lat: number; lng: number; city: string; cityId?: string };
  pins: MapPin[];
  trends: Trend[];
  cityStats?: CityStat[];
  cities?: { id: string; name: string }[];
  foursquareConfigured: boolean;
  foursquareWorking?: boolean;
  foursquareError?: string | null;
  foursquareCount?: number;
  cacheTtl: number;
  updatedAt: string;
};

import { useI18n } from "@/lib/i18n-context";

export default function GlobalTrendsView() {
  const { t } = useI18n();
  const [cityId, setCityId] = useState("all");
  const [trends, setTrends] = useState<Trend[]>([]);
  const [mapData, setMapData] = useState<MapPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      setLoading(true);
      fetch(`/api/market/map?cityId=${cityId}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((mapRes) => {
          if (mapRes.trends) setTrends(mapRes.trends);
          if (mapRes.center) setMapData(mapRes as MapPayload);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [cityId]);

  const cities = mapData?.cities ?? [
    { id: "all", name: "Bütün Azərbaycan" },
    { id: "baku", name: "Bakı" },
    { id: "ganja", name: "Gəncə" },
    { id: "sumgait", name: "Sumqayıt" },
  ];

  return (
    <div className="dash-page tm-page">
      <section className="tm-card">
        <p className="tm-overline">{t("globalTrendsEyebrow")}</p>
        <h1 className="tm-title">{t("globalTrendsTitle")}</h1>
        <p className="tm-subtitle">
          {t("globalTrendsSubtitle")} · {mapData?.foursquareCount ?? 0} Foursquare pin
          {mapData?.updatedAt && (
            <> · {new Date(mapData.updatedAt).toLocaleTimeString("az-AZ")}</>
          )}
        </p>
        <div className="mv-city-pills">
          <button
            type="button"
            className={`mv-city-pill${cityId === "all" ? " is-active" : ""}`}
            onClick={() => setCityId("all")}
          >
            Bütün ölkə
          </button>
          {cities
            .filter((c) => c.id !== "all")
            .map((c) => (
              <button
                key={c.id}
                type="button"
                className={`mv-city-pill${cityId === c.id ? " is-active" : ""}`}
                onClick={() => setCityId(c.id)}
              >
                {c.name}
              </button>
            ))}
        </div>
      </section>

      <SocialTrendsPanel />

      <section className="tm-card tm-card--map">
        <GlobalTrendsMap
          center={mapData?.center ?? { lat: 40.4093, lng: 49.8671, city: "Baku" }}
          pins={mapData?.pins ?? []}
          loading={loading}
        />
        {!loading && !mapData?.foursquareConfigured && (
          <p className="tm-map-warn">FOURSQUARE_API_KEY .env.local-da təyin edilməyib.</p>
        )}
        {!loading && mapData?.foursquareConfigured && !mapData?.foursquareWorking && (
          <p className="tm-map-warn">{mapData.foursquareError ?? "Foursquare API xətası"}</p>
        )}
      </section>

      {mapData?.cityStats && mapData.cityStats.length > 0 && (
        <div className="tm-grid tm-grid-3">
          {mapData.cityStats.map((s) => (
            <article key={s.cityId} className="tm-card">
              <h3>{s.city}</h3>
              <p className="mv-stat-value" style={{ fontSize: 22 }}>
                {s.avgPriceAzn} AZN
              </p>
              <p className="tm-subtitle">
                Orta qiymət · {s.competitorCount} rəqib · ⭐ {s.avgRating}
              </p>
              <p className="tm-mini">
                {s.topCuisine} · Delivery ~{s.deliveryCommissionPct}% · Momentum {s.trendMomentum}%
              </p>
            </article>
          ))}
        </div>
      )}

      <div className="tm-grid tm-grid-3">
        {trends.map((t) => (
          <article key={`${t.city}-${t.cuisine}`} className="tm-card">
            <h3>{t.cuisine}</h3>
            <p className="mv-stat-value" style={{ fontSize: 24 }}>
              {t.momentum}%
            </p>
            <p className="tm-subtitle">
              {t.city} · tələb {t.demandChange > 0 ? "+" : ""}
              {t.demandChange}%
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
