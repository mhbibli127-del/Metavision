"use client";

import { useEffect, useState } from "react";
import { analyzeHyperdimension } from "@/lib/hyperdimension";
import type { FeatureBrainOutput, FeatureUiPayload } from "@/features/hyperdimension";

type Props = {
  title?: string;
  compact?: boolean;
};

const LABEL_COLORS: Record<FeatureUiPayload["healthLabel"], string> = {
  excellent: "hd-health--excellent",
  good: "hd-health--good",
  fair: "hd-health--fair",
  at_risk: "hd-health--risk",
};

export default function OperationsHealthPanel({ title = "Operations Health", compact = false }: Props) {
  const [data, setData] = useState<FeatureBrainOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    analyzeHyperdimension()
      .then((output) => {
        if (!active) return;
        if (output.status === "ok") setData(output);
        else setError(output.error ?? "Analysis unavailable");
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <article className="hd-health-panel hd-health-panel--loading">
        <p className="hd-health-eyebrow">Intelligence Engine</p>
        <h3>{title}</h3>
        <p className="hd-health-muted">Analyzing operations data…</p>
      </article>
    );
  }

  if (error || !data) {
    return (
      <article className="hd-health-panel hd-health-panel--error">
        <p className="hd-health-eyebrow">Intelligence Engine</p>
        <h3>{title}</h3>
        <p className="hd-health-muted">{error ?? "No data"}</p>
      </article>
    );
  }

  const { ui_payload: ui, metrics, insights, recommendations } = data;
  const labelClass = LABEL_COLORS[ui.healthLabel];

  return (
    <article className={`hd-health-panel${compact ? " hd-health-panel--compact" : ""}`}>
      <div className="hd-health-head">
        <div>
          <p className="hd-health-eyebrow">Metavision Intelligence</p>
          <h3>{title}</h3>
        </div>
        <div className={`hd-health-score ${labelClass}`}>
          <span className="hd-health-score-value">{ui.healthScore}</span>
          <span className="hd-health-score-label">{ui.healthLabel.replace("_", " ")}</span>
        </div>
      </div>

      <div className="hd-health-grid">
        {ui.scoreCards.map((card) => (
          <div key={card.key} className="hd-health-card">
            <span className="hd-health-card-label">{card.label}</span>
            <span className="hd-health-card-value">
              {card.value}
              <small>{card.unit}</small>
            </span>
          </div>
        ))}
      </div>

      {!compact && (
        <>
          <div className="hd-health-meta">
            <span>Revenue: ${metrics.totalRevenue.toLocaleString()}</span>
            <span>Avg order: ${metrics.avgOrderValue}</span>
            <span>Low stock: {metrics.lowStockCount}</span>
            <span>Updated: {new Date(ui.updatedAt).toLocaleTimeString()}</span>
          </div>

          {ui.alerts.length > 0 && (
            <div className="hd-health-alerts">
              {ui.alerts.slice(0, 3).map((alert, i) => (
                <div key={i} className={`hd-health-alert hd-health-alert--${alert.level}`}>
                  {alert.text}
                </div>
              ))}
            </div>
          )}

          {insights.length > 0 && (
            <div className="hd-health-insights">
              <h4>Key Insights</h4>
              <ul>
                {insights.slice(0, 4).map((insight) => (
                  <li key={insight.id} className={`hd-health-insight--${insight.severity}`}>
                    {insight.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="hd-health-recs">
              <h4>Recommended Actions</h4>
              <ul>
                {recommendations.slice(0, 3).map((rec) => (
                  <li key={rec.id}>
                    <strong>{rec.action}</strong>
                    <span>{rec.impact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </article>
  );
}
