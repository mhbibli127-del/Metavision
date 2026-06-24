"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { formatAiQueries } from "@/data/admin-clients";
import type { AdminClient } from "@/data/admin-clients";

type Analytics = {
  dashboardStats: {
    activeClients: number;
    activeClientsGrowth: number;
    monthlyRevenue: number;
    revenueGrowth: number;
    aiQueries: string;
    aiQueriesGrowth: number;
    onboardingRate: number;
    onboardingGrowth: number;
  };
  planAllocation: { gold: number; standard: number };
};

export default function AdminDashboardView() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin?resource=clients").then((r) => r.json()),
      fetch("/api/admin?resource=analytics").then((r) => r.json()),
    ]).then(([c, a]) => {
      if (c.clients) setClients(c.clients);
      if (a.analytics) setAnalytics(a.analytics);
    });
  }, []);

  const stats = analytics?.dashboardStats;
  const goldPercent = analytics
    ? Math.round(
        (analytics.planAllocation.gold /
          (analytics.planAllocation.gold + analytics.planAllocation.standard || 1)) *
          100,
      )
    : 0;

  const recentClients = clients.slice(0, 5);

  if (!stats) {
    return <p className="admin-muted">Loading platform data…</p>;
  }

  return (
    <>
      <h2 className="admin-page-title">Dashboard</h2>

      <div className="admin-stats admin-stats--figma">
        <article className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon--blue">👥</div>
          <p className="admin-stat-label">Active Clients</p>
          <p className="admin-stat-value">{stats.activeClients}</p>
          <span className="admin-stat-badge admin-stat-badge--green">▲ {stats.activeClientsGrowth}% this month</span>
        </article>
        <article className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon--green">$</div>
          <p className="admin-stat-label">Monthly Revenue</p>
          <p className="admin-stat-value">{stats.monthlyRevenue.toLocaleString("en-US")}</p>
          <span className="admin-stat-badge admin-stat-badge--green">▲ {stats.revenueGrowth}% AZN</span>
        </article>
        <article className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon--purple">AI</div>
          <p className="admin-stat-label">AI Queries</p>
          <p className="admin-stat-value">{stats.aiQueries}</p>
          <span className="admin-stat-badge admin-stat-badge--green">▲ {stats.aiQueriesGrowth}% this week</span>
        </article>
        <article className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon--orange">✓</div>
          <p className="admin-stat-label">Onboarding Rate</p>
          <p className="admin-stat-value">{stats.onboardingRate}%</p>
          <span className="admin-stat-badge admin-stat-badge--green">▲ {stats.onboardingGrowth}% increase</span>
        </article>
      </div>

      <div className="admin-content-grid">
        <section className="admin-card admin-card--activity">
          <div className="admin-card-head">
            <h3 className="admin-card-title">Recent Client Activity</h3>
            <Link href="/admin/clients" className="admin-card-link">View all →</Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Plan</th>
                  <th>AI Queries</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentClients.map((client) => (
                  <tr key={client.id}>
                    <td>{client.company}</td>
                    <td>{client.plan}</td>
                    <td>{formatAiQueries(client.aiQueries)}</td>
                    <td><AdminStatusBadge status={client.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-card">
          <h3 className="admin-card-title">Plan Distribution</h3>
          <p className="admin-muted">Gold plan share: {goldPercent}%</p>
        </section>
      </div>
    </>
  );
}
