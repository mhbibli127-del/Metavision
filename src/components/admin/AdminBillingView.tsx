"use client";

import { useEffect, useState } from "react";

type Analytics = {
  incomeSummary?: { monthlyTotal: number; goldCount: number; standardCount: number };
  planAllocation?: { gold: number; standard: number };
};

export default function AdminBillingView() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/admin?resource=analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.analytics) setAnalytics(d.analytics);
      });
  }, []);

  const summary = analytics?.incomeSummary;

  return (
    <>
      <h2 className="admin-page-title">Billing</h2>
      <p className="admin-muted">Subscriptions and platform revenue.</p>
      <div className="admin-stats admin-stats--figma">
        <article className="admin-stat-card">
          <p className="admin-stat-label">Monthly revenue</p>
          <p className="admin-stat-value">{summary?.monthlyTotal?.toLocaleString() ?? "—"} AZN</p>
        </article>
        <article className="admin-stat-card">
          <p className="admin-stat-label">Gold tenants</p>
          <p className="admin-stat-value">{summary?.goldCount ?? analytics?.planAllocation?.gold ?? 0}</p>
        </article>
        <article className="admin-stat-card">
          <p className="admin-stat-label">Standard tenants</p>
          <p className="admin-stat-value">{summary?.standardCount ?? analytics?.planAllocation?.standard ?? 0}</p>
        </article>
      </div>
    </>
  );
}
