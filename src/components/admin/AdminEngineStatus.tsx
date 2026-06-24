"use client";

import { useEffect, useState } from "react";

type EngineStatus = {
  status?: string;
  registry?: string[];
};

type FeatureStatus = {
  status?: string;
  capabilities?: string[];
};

/** Admin-only: internal engine health for the dev/ops team — no visual lab UI */
export default function AdminEngineStatus() {
  const [engine, setEngine] = useState<EngineStatus | null>(null);
  const [features, setFeatures] = useState<FeatureStatus | null>(null);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/engines/hyperdimension").then((r) => r.json()),
      fetch("/api/features/hyperdimension").then((r) => r.json()),
      fetch("/api/features/hyperdimension/analyze", { method: "POST", body: "{}" }).then((r) => r.json()),
    ])
      .then(([eng, feat, analyze]) => {
        setEngine(eng);
        setFeatures(feat);
        if (analyze?.ui_payload?.healthScore != null) {
          setHealthScore(analyze.ui_payload.healthScore);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="admin-card">
        <h3 className="admin-card-title">System Diagnostics</h3>
        <p className="admin-muted">Checking internal engines…</p>
      </section>
    );
  }

  return (
    <section className="admin-card admin-engine-status">
      <div className="admin-card-head">
        <h3 className="admin-card-title">System Diagnostics</h3>
        <span className="admin-muted">Team / ops only — API health</span>
      </div>

      <div className="admin-engine-grid">
        <article className="admin-engine-tile">
          <span className="admin-engine-badge admin-engine-badge--live">
            {features?.status === "ok" ? "LIVE" : "—"}
          </span>
          <h4>Feature Engine</h4>
          <p>Dashboard metrics, insights, anomaly checks on business data.</p>
          <ul>
            {(features?.capabilities ?? []).slice(0, 3).map((c) => (
              <li key={c}>{c.replace(/_/g, " ")}</li>
            ))}
          </ul>
          {healthScore != null && (
            <p className="admin-engine-metric">
              Sample health probe: <strong>{healthScore}%</strong>
            </p>
          )}
        </article>

        <article className="admin-engine-tile">
          <span className="admin-engine-badge admin-engine-badge--lab">
            {engine?.status === "active" ? "API" : "—"}
          </span>
          <h4>Computation Engine</h4>
          <p>Batch analysis, validation, statistics — for team self-check via API.</p>
          <p className="admin-engine-metric">
            Modules: <strong>{engine?.registry?.length ?? 0}</strong>
          </p>
          <div className="admin-engine-links">
            <a href="/api/engines/hyperdimension" target="_blank" rel="noreferrer">
              Engine API
            </a>
            <a href="/api/features/hyperdimension" target="_blank" rel="noreferrer">
              Feature API
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
