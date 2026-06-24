"use client";

import { useI18n } from "@/lib/i18n-context";

const LIVE_ENDPOINTS = [
  { method: "GET", path: "/api/stats", purpose: "Order & revenue statistics" },
  { method: "GET", path: "/api/orders", purpose: "Orders list + PATCH status" },
  { method: "GET", path: "/api/operations/{resource}", purpose: "Menu, staff, inventory, tables, customers CRUD" },
  { method: "GET", path: "/api/market/competitors?currency=AZN&compare=true", purpose: "Baku competitor menu intelligence" },
  { method: "GET", path: "/api/market/trends?city=Baku", purpose: "Regional cuisine demand trends" },
  { method: "GET", path: "/api/currency/rates", purpose: "Live FX rates (Frankfurter, cached in DB)" },
  { method: "GET", path: "/api/intelligence/tastemind", purpose: "TasteMind payload from orders + market DB" },
  { method: "GET", path: "/api/features/hyperdimension/analyze", purpose: "Operations health & recommendations engine" },
  { method: "GET", path: "/api/site?section=industries|partners|solutions", purpose: "CMS landing content (public)" },
  { method: "GET", path: "/api/meta-ads?range=30d", purpose: "Meta Ads insights (spend, campaigns, ROAS)" },
  { method: "POST", path: "/api/meta-ads", purpose: "Sync from Meta Ads Manager panel" },
  { method: "GET", path: "/api/meta-ads/auth", purpose: "OAuth connect to Meta Ads account" },
];

export default function ApiAccessView() {
  const { t } = useI18n();
  return (
    <div className="dash-page tm-page">
      <section className="tm-card">
        <p className="tm-overline">{t("apiAccessEyebrow")}</p>
        <h1 className="tm-title">{t("apiAccessTitle")}</h1>
        <p className="tm-subtitle">{t("apiAccessSubtitle")}</p>
        <div className="tm-api-table">
          {LIVE_ENDPOINTS.map((endpoint) => (
            <article key={endpoint.path} className="tm-api-row">
              <span>{endpoint.method}</span>
              <strong>{endpoint.path}</strong>
              <p>{endpoint.purpose}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
