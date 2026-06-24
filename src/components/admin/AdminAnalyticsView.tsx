"use client";

import { useEffect, useState } from "react";

type Analytics = {
  monthlyIncome: { month: string; value: number }[];
  incomeSummary: {
    monthlyTotal: number;
    growthPercent: number;
    goldCount: number;
    standardCount: number;
  };
  weeklyPolls: { day: string; value: number }[];
};

export default function AdminAnalyticsView() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/admin?resource=analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.analytics) setData(d.analytics);
      })
      .catch(() => {});
  }, []);

  if (!data) return <p className="admin-muted">Loading analytics…</p>;

  const { monthlyIncome, incomeSummary, weeklyPolls } = data;
  const maxIncome = Math.max(...monthlyIncome.map((m) => m.value), 1);

  return (
    <>
      <h2 className="admin-page-title">Analytics</h2>
      <div className="admin-stats admin-stats--figma">
        <article className="admin-stat-card">
          <p className="admin-stat-label">Monthly Total</p>
          <p className="admin-stat-value">{incomeSummary.monthlyTotal.toLocaleString()} AZN</p>
          <span className="admin-stat-badge admin-stat-badge--green">▲ {incomeSummary.growthPercent}%</span>
        </article>
        <article className="admin-stat-card">
          <p className="admin-stat-label">Gold Clients</p>
          <p className="admin-stat-value">{incomeSummary.goldCount}</p>
        </article>
        <article className="admin-stat-card">
          <p className="admin-stat-label">Standard Clients</p>
          <p className="admin-stat-value">{incomeSummary.standardCount}</p>
        </article>
      </div>

      <section className="admin-card admin-card--wide">
        <h3 className="admin-card-title">Monthly Income</h3>
        <div className="admin-bar-chart">
          {monthlyIncome.map((m) => (
            <div key={m.month} className="admin-bar-col">
              <div className="admin-bar" style={{ height: `${(m.value / maxIncome) * 100}%` }} />
              <span>{m.month}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-card">
        <h3 className="admin-card-title">Weekly Engagement</h3>
        <ul className="tm-list">
          {weeklyPolls.map((p) => (
            <li key={p.day}>{p.day}: {p.value}%</li>
          ))}
        </ul>
      </section>
    </>
  );
}
