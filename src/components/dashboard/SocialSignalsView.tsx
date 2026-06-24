"use client";

import { useCallback, useEffect, useState } from "react";
import type { UnifiedTrendsResponse } from "@/services/trends/types";
import { useI18n } from "@/lib/i18n-context";
import DashPageHeader from "@/components/dashboard/DashPageHeader";

type ConfigPayload = {
  sources: Record<string, { configured: boolean; label: string; detail?: string }>;
  metaAds?: boolean;
};

type TrendBlock = {
  trends?: string[];
  dataSource?: "live" | "cache" | "fallback";
  stale?: boolean;
  meta?: Record<string, unknown>;
};

type TrendsPayload = UnifiedTrendsResponse & {
  success?: boolean;
  foodSignals?: string[];
  fallbackUsed?: boolean;
  config?: ConfigPayload;
};

function sourceLabel(block: TrendBlock | undefined, t: (key: string) => string): string {
  const ds = block?.dataSource;
  if (ds === "live") return t("dataSourceLive");
  if (ds === "cache") return t("dataSourceCache");
  return t("dataSourceFallback");
}

export default function SocialSignalsView() {
  const { t } = useI18n();
  const [data, setData] = useState<TrendsPayload | null>(null);
  const [xOnly, setXOnly] = useState<TrendBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const config = data?.config;

  const load = useCallback((refresh = false) => {
    const qs = refresh ? "?refresh=true" : "";
    return Promise.all([
      fetch(`/api/trends${qs}`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/x-trends${qs}`, { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([trends, xRes]) => {
        setData(trends as TrendsPayload);
        setXOnly({
          trends: xRes.trends ?? xRes.data ?? [],
          dataSource: xRes.source ?? "fallback",
          meta: xRes.meta,
        });
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(), 60_000);
    return () => clearInterval(timer);
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load(true);
  }

  const sources = data?.sources ?? {};
  const xBlock = xOnly?.trends?.length ? { ...sources.x, ...xOnly } : sources.x;

  const foodSignals = [
    ...(data?.hashtags ?? []),
    ...(data?.headlines ?? []).filter((h) =>
      /food|restaurant|dining|menu|cuisine|bakı|baku|restoran/i.test(h),
    ),
  ].slice(0, 20);

  return (
    <div className="dash-page tm-page">
      <DashPageHeader titleKey="socialSignalsTitle" subtitleKey="socialSignalsSubtitle">
        <button type="button" className="dash-refresh-btn" disabled={refreshing} onClick={handleRefresh}>
          {refreshing ? t("loading") : t("refresh")}
        </button>
      </DashPageHeader>

      {config ? (
        <section className="tm-card" style={{ marginBottom: 16 }}>
          <p className="tm-overline">{t("dataSources")}</p>
          <div className="cc-grid">
            {Object.entries(config.sources)
              .filter(([key]) => key !== "metaAds" || config.metaAds)
            .map(([key, src]) => (
              <article key={key} className={`cc-tile${src.configured ? "" : " cc-tile--muted"}`}>
                <span className="cc-tile-label">{src.label}</span>
                <strong className="cc-tile-value-sm">{src.configured ? "●" : "○"}</strong>
                <span className="cc-tile-meta">{src.detail}</span>
              </article>
            ))}
        </div>
      </section>
      ) : null}

      {foodSignals.length > 0 ? (
        <section className="tm-card" style={{ marginBottom: 16 }}>
          <p className="tm-overline">{t("restaurantSignals")}</p>
          <div className="mv-city-pills">
            {foodSignals.map((tag) => (
              <span key={tag} className="mv-city-pill is-active" style={{ cursor: "default" }}>
                {tag}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {loading && !data ? (
        <p className="tm-subtitle">{t("loading")}</p>
      ) : (
        <section className="tm-card">
          <p className="tm-overline">{t("liveTrendStream")}</p>
          <h2 className="tm-title" style={{ fontSize: 20 }}>
            TikTok · Google · X · {t("news")}
          </h2>
          <p className="tm-subtitle">
            {data?.updatedAt && new Date(data.updatedAt).toLocaleTimeString("az-AZ")}
          </p>

          <div className="mv-social-trends-grid">
            {(["tiktok", "google", "x", "news"] as const).map((key) => {
              const block = key === "x" ? xBlock : sources[key];
              const items = block?.trends ?? [];
              return (
                <article key={key} className="mv-social-trend-block">
                  <header>
                    <strong>{key.toUpperCase()}</strong>
                    <span className="mv-stale-badge">{sourceLabel(block, t)}</span>
                  </header>
                  <ul>
                    {items.slice(0, 10).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                    {!items.length && <li className="tm-muted">{t("dataSourceFallback")}</li>}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
