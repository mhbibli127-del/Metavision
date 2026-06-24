"use client";

import { useEffect, useState } from "react";
import { runMultiScenarioSimulation } from "@/lib/tastemind";
import type { RestaurantSimulationInput } from "@/data/tastemind";
import type { MultiScenarioResult } from "@/lib/tastemind";

import { useI18n } from "@/lib/i18n-context";

export default function SimulatorView() {
  const { t } = useI18n();
  const [comparison, setComparison] = useState<MultiScenarioResult | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/operations/restaurant").then((r) => r.json()),
      fetch("/api/market/trends?city=Baku").then((r) => r.json()),
      fetch("/api/intelligence/tastemind").then((r) => r.json()),
    ])
      .then(([restaurantRes, trendsRes, intelRes]) => {
        const r = restaurantRes.restaurant;
        const topTrend = trendsRes.trends?.[0];
        const competitorCount = intelRes.opsSnapshot?.competitorCount ?? 6;
        const topDish = intelRes.opsSnapshot?.topDishes?.[0]?.name;

        const scenarioA: RestaurantSimulationInput = {
          concept: r?.cuisine?.[0] ? `${r.cuisine[0]} konsepti` : "Müasir Azərbaycan mətbəxi",
          location: r?.city ? `${r.city} mərkəzi` : "Bakı mərkəzi",
          priceRange: "mid",
          menuFocus: topDish ?? topTrend?.cuisine ?? "Yerli qril və mezə",
        };

        const scenarioB: RestaurantSimulationInput = {
          concept: topTrend ? `${topTrend.cuisine} fusion` : "Premium restoran",
          location: "Bakı ətrafı",
          priceRange: "premium",
          menuFocus: topTrend?.cuisine ?? "Avropa mətbəxi",
        };

        setComparison(runMultiScenarioSimulation(scenarioA, scenarioB, competitorCount));
      })
      .catch(() => {});
  }, []);

  if (!comparison) {
    return (
      <div className="dash-page tm-page">
        <section className="tm-card">
          <p className="tm-muted">{t("simulatorLoading")}</p>
        </section>
      </div>
    );
  }

  const { scenarioA, scenarioB: sB, winner, reason, delta } = comparison;

  return (
    <div className="dash-page tm-page">
      <section className="tm-card">
        <p className="tm-overline">{t("simulatorEyebrow")}</p>
        <h1 className="tm-title">{t("simulatorTitle")}</h1>
        <p className="tm-subtitle">{t("simulatorSubtitle")}</p>

        <div className="tm-sim-winner">
          <span>{winner === "A" ? "Scenario A" : "Scenario B"} wins</span>
          <p>{reason}</p>
          <div className="tm-sim-deltas">
            <span>Δ Success: {delta.successProbability > 0 ? "+" : ""}{delta.successProbability.toFixed(1)}%</span>
            <span>Δ Retention: {delta.retentionScore > 0 ? "+" : ""}{delta.retentionScore}</span>
            <span>Δ Rev/Seat: {delta.revenuePerSeat > 0 ? "+" : ""}${delta.revenuePerSeat}</span>
          </div>
        </div>

        <div className="tm-sim-compare">
          {[{ label: "A" as const, data: scenarioA }, { label: "B" as const, data: sB }].map(({ label, data }) => (
            <div key={label} className={`tm-sim-column${winner === label ? " tm-sim-column--winner" : ""}`}>
              <h3>Scenario {label}{winner === label ? " 🏆" : ""}</h3>
              <div className="tm-sim-inputs">
                <div><span>Concept</span><strong>{data.input.concept}</strong></div>
                <div><span>Location</span><strong>{data.input.location}</strong></div>
                <div><span>Price</span><strong>{data.input.priceRange}</strong></div>
              </div>
              <article className="tm-card">
                <h3>Success Probability</h3>
                <p className="tm-sim-kpi">{data.successProbability}%</p>
              </article>
              <article className="tm-card">
                <h3>Revenue Range / Month</h3>
                <p>{data.monthlyRevenueRange}</p>
              </article>
              <article className="tm-card">
                <h3>Retention Score</h3>
                <p className="tm-sim-kpi" style={{ fontSize: "22px" }}>{data.retentionScore}</p>
              </article>
              <article className="tm-card">
                <h3>Risk Factors</h3>
                <ul className="tm-list">{data.riskFactors.map((f) => <li key={f}>{f}</li>)}</ul>
              </article>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
