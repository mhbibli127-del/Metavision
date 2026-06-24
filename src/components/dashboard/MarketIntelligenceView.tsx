"use client";

import { useEffect, useState } from "react";
import OperationsHealthPanel from "@/components/dashboard/OperationsHealthPanel";
import { useTasteMindStore } from "@/lib/tastemindStore";

type Competitor = {
  id: string;
  name: string;
  rating: number | null;
  priceRange: string;
  district: string | null;
  advantages: string[];
  menu: { name: string; price: number; currency: string }[];
};

type Comparison = {
  yourAvgPrice: number;
  insights: string[];
  currency: string;
};

type MarketGap = { area: string; status: "ok" | "partial" | "missing"; note: string };

type DeliveryPlatform = {
  name: string;
  commissionPct: number;
  avgDeliveryMin: number;
  estMonthlyCommission?: number;
  insight?: string;
};

import { useI18n } from "@/lib/i18n-context";

export default function MarketIntelligenceView() {
  const { t } = useI18n();
  const insightStream = useTasteMindStore((s) => s.insightStream);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [gaps, setGaps] = useState<MarketGap[]>([]);
  const [delivery, setDelivery] = useState<DeliveryPlatform[]>([]);
  const [deliverySummary, setDeliverySummary] = useState<{
    avgCommissionPct: number;
    estCommissionCost: number;
  } | null>(null);
  const [cityStats, setCityStats] = useState<
    { city: string; avgPriceAzn: number; competitorCount: number; deliveryCommissionPct: number }[]
  >([]);
  const [currency, setCurrency] = useState("AZN");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/market/competitors?currency=${currency}&compare=true`).then((r) => r.json()),
      fetch("/api/market/gaps").then((r) => r.json()),
      fetch("/api/market/delivery").then((r) => r.json()),
    ])
      .then(([compData, gapsData, deliveryData]) => {
        setCompetitors(compData.competitors ?? []);
        setComparison(compData.comparison ?? null);
        setGaps(gapsData.gaps ?? []);
        setDelivery(deliveryData.platforms ?? []);
        setDeliverySummary(deliveryData.summary ?? null);
        setCityStats(gapsData.cityStats ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currency]);

  const insights = insightStream.filter(
    (i) => i.linkedModule === "intelligence" || i.linkedModule === "global-trends",
  );

  return (
    <div className="dash-page tm-page">
      <section className="tm-card">
        <p className="tm-overline">TasteMind AI</p>
        <h1 className="tm-title">{t("marketIntelTitle")}</h1>
        <p className="tm-subtitle">{t("marketIntelSubtitle")}</p>
        <div className="dash-reports-filter-group" style={{ marginTop: "1rem" }}>
          <label className="dash-reports-filter-label">Valyuta</label>
          <select
            className="dash-reports-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="AZN">AZN (₼)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </section>

      <OperationsHealthPanel title="Operations Health" compact />

      {cityStats.length > 0 && (
        <div className="tm-grid tm-grid-3">
          {cityStats.map((s) => (
            <article key={s.city} className="tm-card">
              <h3>{s.city}</h3>
              <p className="mv-stat-value" style={{ fontSize: 22 }}>
                {s.avgPriceAzn} AZN
              </p>
              <p className="tm-subtitle">
                {s.competitorCount} rəqib · delivery ~{s.deliveryCommissionPct}%
              </p>
            </article>
          ))}
        </div>
      )}

      {gaps.length > 0 && (
        <section className="tm-card">
          <h3>Bazar üzrə competitive checklist</h3>
          <p className="tm-subtitle">Rəqiblərdə olan vs Metavision-da aktiv modullar</p>
          <ul className="tm-list">
            {gaps.map((g) => (
              <li key={g.area}>
                <strong>{g.status === "ok" ? "✓" : g.status === "partial" ? "◐" : "○"} {g.area}</strong>
                {" — "}{g.note}
              </li>
            ))}
          </ul>
        </section>
      )}

      {delivery.length > 0 && deliverySummary && (
        <section className="tm-card">
          <h3>Delivery intelligence (Wolt / Bolt)</h3>
          <p className="tm-subtitle">
            Orta komissiya {deliverySummary.avgCommissionPct}% · Təxmini aylıq komissiya xərci:{" "}
            <strong>{deliverySummary.estCommissionCost} {currency}</strong>
          </p>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Komissiya</th>
                  <th>Çatdırılma</th>
                  <th>Təxmini komissiya</th>
                </tr>
              </thead>
              <tbody>
                {delivery.map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td>{p.commissionPct}%</td>
                    <td>{p.avgDeliveryMin ? `${p.avgDeliveryMin} dəq` : "—"}</td>
                    <td>{p.estMonthlyCommission ?? "—"} {currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {comparison && (
        <section className="tm-card">
          <h3>Sizin pozisiyanız</h3>
          <p>
            Orta menyu qiyməti: <strong>{comparison.yourAvgPrice} {comparison.currency}</strong>
            {" · "}
            {competitors.length} aktiv rəqib (Bakı)
          </p>
          {comparison.insights.length > 0 && (
            <ul className="tm-list">
              {comparison.insights.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className="tm-grid tm-grid-feed">
        <article className="tm-card tm-stream">
          <h3>Live Insight Stream</h3>
          <div className="tm-stream-list">
            {insights.map((insight) => (
              <div key={insight.id} className={`tm-stream-item tm-stream-${insight.severity}`}>
                <span>{insight.timestamp}</span>
                <p>{insight.text}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="tm-card">
          <h3>Bakı rəqibləri {loading ? "…" : `(${competitors.length})`}</h3>
          <div className="tm-stream-list">
            {competitors.map((c) => (
              <div key={c.id} className="tm-stream-item tm-stream-info">
                <strong>{c.name}</strong>
                <span>
                  {c.rating ? `★ ${c.rating}` : ""} · {c.priceRange} · {c.district}
                </span>
                <p>
                  {c.menu.slice(0, 3).map((m) => `${m.name} (${m.price} ${m.currency})`).join(" · ")}
                </p>
                {c.advantages[0] && <p style={{ fontSize: 12, opacity: 0.8 }}>+ {c.advantages[0]}</p>}
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
