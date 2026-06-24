"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";

type TrendBlock = {
  trends?: string[];
  dataSource?: "live" | "cache" | "fallback";
};

type TrendsPayload = {
  sources?: Record<string, TrendBlock>;
  updatedAt?: string;
  hashtags?: string[];
  headlines?: string[];
};

function sourceLabel(block: TrendBlock | undefined, t: (key: string) => string): string {
  const ds = block?.dataSource;
  if (ds === "live") return t("dataSourceLive");
  if (ds === "cache") return t("dataSourceCache");
  return t("dataSourceFallback");
}

export default function SocialTrendsPanel() {
  const { t } = useI18n();
  const [data, setData] = useState<TrendsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      fetch("/api/trends", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setData(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !data) {
    return (
      <section className="tm-card">
        <p className="tm-subtitle">{t("loading")}</p>
      </section>
    );
  }

  const sources = data?.sources ?? {};
  const foodSignals = [
    ...(data?.hashtags ?? []),
    ...(data?.headlines ?? []).filter((h) =>
      /food|restaurant|dining|menu|cuisine|bakı|baku|restoran/i.test(h),
    ),
  ].slice(0, 8);

  return (
    <section className="tm-card">
      <p className="tm-overline">{t("liveTrendStream")}</p>
      <h2 className="tm-title" style={{ fontSize: 20 }}>
        TikTok · Google · X · {t("news")}
      </h2>
      <p className="tm-subtitle">
        {data?.updatedAt && new Date(data.updatedAt).toLocaleTimeString("az-AZ")}
      </p>

      {foodSignals.length > 0 ? (
        <div className="mv-city-pills" style={{ marginBottom: 12 }}>
          {foodSignals.map((tag) => (
            <span key={tag} className="mv-city-pill is-active" style={{ cursor: "default" }}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mv-social-trends-grid">
        {(["tiktok", "google", "x", "news"] as const).map((key) => {
          const block = sources[key];
          const items = block?.trends ?? [];
          return (
            <article key={key} className="mv-social-trend-block">
              <header>
                <strong>{key.toUpperCase()}</strong>
                <span className="mv-stale-badge">{sourceLabel(block, t)}</span>
              </header>
              <ul>
                {items.slice(0, 8).map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {!items.length && <li className="tm-muted">{t("dataSourceFallback")}</li>}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
