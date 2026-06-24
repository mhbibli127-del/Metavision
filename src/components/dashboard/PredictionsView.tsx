"use client";

import { useIntelligenceBrain } from "@/lib/useIntelligenceBrain";
import ManagerBriefPanel from "@/components/dashboard/ExecutiveBrainPanel";
import ManagerScenarioChat from "@/components/dashboard/ManagerScenarioChat";
import ScenarioCatalog from "@/components/dashboard/ScenarioCatalog";
import { PageHeader, SkeletonCard, LiveNumber } from "@/components/ui";

import { useI18n } from "@/lib/i18n-context";

const impactLabel = { low: "Aşağı", medium: "Orta", high: "Yüksək" };
const dirLabel = { up: "Müsbət", down: "Risk", stable: "Stabil" };

export default function PredictionsView() {
  const { t } = useI18n();
  const { brain, loading, lastUpdated, isLive } = useIntelligenceBrain();
  const predictions = brain?.predictions ?? [];
  const scenarios = brain?.scenarios ?? [];

  return (
    <div className="dash-page mv-intel-page mv-intel-page--predictions">
      <PageHeader
        eyebrow={t("predictionsEyebrow")}
        title={t("predictionsTitle")}
        subtitle={`${t("predictionsSubtitle")} · ${t("confidence")} ${brain?.confidence ?? "—"}%${lastUpdated ? ` · ${lastUpdated.toLocaleTimeString("az-AZ")}` : ""}`}
        live={isLive}
      />

      <ManagerBriefPanel brain={brain} lastUpdated={lastUpdated} />

      <section className="mv-predictions-section">
        <h2 className="mv-section-title">Proqnoz axını</h2>
        {loading && predictions.length === 0 ? (
          <div className="mv-predictions-stream">
            <SkeletonCard rows={4} height={20} />
            <SkeletonCard rows={4} height={20} />
            <SkeletonCard rows={4} height={20} />
          </div>
        ) : (
          <div className="mv-predictions-stream">
            {predictions.map((card) => (
              <article
                key={card.id}
                className={`mv-forecast-card mv-forecast-card--${card.direction}`}
              >
                <header className="mv-forecast-head">
                  <div>
                    <span className="mv-forecast-horizon">{card.horizon}</span>
                    <h3>{card.title}</h3>
                  </div>
                  <div className="mv-forecast-kpi">
                    <strong>{card.metricValue}</strong>
                    <small>{card.metric}</small>
                  </div>
                </header>
                <p className="mv-forecast-msg">{card.message}</p>
                <footer className="mv-forecast-foot">
                  <span className={`mv-forecast-dir mv-forecast-dir--${card.direction}`}>
                    {dirLabel[card.direction]}
                  </span>
                  <span className="mv-forecast-conf">
                    <LiveNumber value={card.confidence} format={(n) => `${n}%`} /> etibar
                  </span>
                  <span className={`mv-forecast-impact mv-forecast-impact--${card.impact}`}>
                    {impactLabel[card.impact]} təsir
                  </span>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mv-predictions-split">
        <ManagerScenarioChat live={isLive} />
        {scenarios.length > 0 && <ScenarioCatalog scenarios={scenarios} />}
      </div>
    </div>
  );
}
