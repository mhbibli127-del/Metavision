"use client";

import type { ExecutiveBrainOutput } from "@/engines/hyperdimension/brain/executive-brain";

const levelColor: Record<string, string> = {
  low: "mv-brain-badge--ok",
  moderate: "mv-brain-badge--warn",
  high: "mv-brain-badge--risk",
  critical: "mv-brain-badge--critical",
};

export default function ManagerBriefPanel({
  brain,
  lastUpdated,
}: {
  brain: ExecutiveBrainOutput | null;
  lastUpdated: Date | null;
}) {
  if (!brain) return null;

  return (
    <section className="mv-brain-panel">
      <header className="mv-brain-header">
        <div>
          <p className="mv-intel-overline">Müdiriyyət brifinqi</p>
          <h2 className="mv-brain-title">İnflyasiya və gəlir ssenariləri</h2>
        </div>
        <div className="mv-brain-meta">
          <span className={`mv-brain-badge ${levelColor[brain.inflation.level]}`}>
            {brain.inflation.headline}
          </span>
          {lastUpdated && (
            <span className="mv-brain-time">Canlı · {lastUpdated.toLocaleTimeString("az-AZ")}</span>
          )}
        </div>
      </header>

      {brain.onboardingRequired && (
        <div className="mv-onboard-banner">
          Restoran qeydiyyatı tamamlanmayıb — ssenarilər bazar məlumatları əsasında göstərilir.{" "}
          <a href="/dashboard/restaurant">Profili tamamlayın →</a>
        </div>
      )}

      <p className="mv-brain-summary">{brain.executiveSummary}</p>

      <div className="mv-brain-grid">
        <article className="mv-brain-card mv-brain-card--risk">
          <h3>İnflyasiya</h3>
          <p className="mv-brain-kpi">{brain.inflation.estimatedImpactPct}%</p>
          <p className="mv-brain-detail">{brain.inflation.detail}</p>
        </article>
        <article className="mv-brain-card mv-brain-card--gain">
          <h3>Gəlir fürsəti</h3>
          <p className="mv-brain-kpi">{brain.revenue.headline}</p>
          <ul className="mv-brain-list">
            {brain.revenue.opportunities.slice(0, 3).map((o) => (
              <li key={o.title}>
                <strong>{o.title}</strong> — {o.action}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
