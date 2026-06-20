"use client";

import Link from "next/link";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import { adminClients, formatAiQueries } from "@/data/admin-clients";
import {
  adminDashboardStats,
  adminPlanAllocation,
  adminWeeklyPolls,
} from "@/data/admin-analytics";

const goldPercent = Math.round(
  (adminPlanAllocation.gold / (adminPlanAllocation.gold + adminPlanAllocation.standard)) * 100,
);

export default function AdminDashboardView() {
  const recentClients = adminClients.slice(0, 5);

  return (
    <>
      <h2 className="admin-page-title">Dashboard</h2>

      <div className="admin-stats admin-stats--figma">
        <article className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon--blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="admin-stat-label">Active Clients</p>
          <p className="admin-stat-value">{adminDashboardStats.activeClients}</p>
          <span className="admin-stat-badge admin-stat-badge--green">
            ▲ {adminDashboardStats.activeClientsGrowth}% this month
          </span>
        </article>
        <article className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon--green">$</div>
          <p className="admin-stat-label">Monthly Revenue</p>
          <p className="admin-stat-value">{adminDashboardStats.monthlyRevenue.toLocaleString("en-US")}</p>
          <span className="admin-stat-badge admin-stat-badge--green">
            ▲ {adminDashboardStats.revenueGrowth}% AZN
          </span>
        </article>
        <article className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon--purple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 3v18h18M7 16l4-8 4 5 5-7" />
            </svg>
          </div>
          <p className="admin-stat-label">AI Queries</p>
          <p className="admin-stat-value">{adminDashboardStats.aiQueries}</p>
          <span className="admin-stat-badge admin-stat-badge--green">
            ▲ {adminDashboardStats.aiQueriesGrowth}% this week
          </span>
        </article>
        <article className="admin-stat-card">
          <div className="admin-stat-icon admin-stat-icon--orange">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          </div>
          <p className="admin-stat-label">Onboarding Rate</p>
          <p className="admin-stat-value">{adminDashboardStats.onboardingRate}%</p>
          <span className="admin-stat-badge admin-stat-badge--green">
            ▲ {adminDashboardStats.onboardingGrowth}% increase
          </span>
        </article>
      </div>

      <div className="admin-content-grid">
        <section className="admin-card admin-card--activity">
          <div className="admin-card-head">
            <h3 className="admin-card-title">Recent Client Activity</h3>
            <Link href="/admin/clients" className="admin-card-link">
              View all →
            </Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Company</th>
                  <th scope="col">Plan</th>
                  <th scope="col">AI Queries</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentClients.map((client) => (
                  <tr key={client.id}>
                    <td className="admin-table-strong">{client.company}</td>
                    <td>{client.plan}</td>
                    <td>{formatAiQueries(client.aiQueries)}</td>
                    <td>
                      <AdminStatusBadge status={client.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-card admin-card--side">
          <h3 className="admin-card-title">Plan Allocation</h3>
          <div className="admin-donut-wrap">
            <div
              className="admin-donut admin-donut--allocation"
              style={{ background: `conic-gradient(#0f69ff 0 ${goldPercent}%, #22c55e ${goldPercent}% 100%)` }}
              aria-hidden="true"
            />
            <div className="admin-donut-legend">
              <span>
                <i className="admin-dot admin-dot--blue" /> Gold · {adminPlanAllocation.gold}
              </span>
              <span>
                <i className="admin-dot admin-dot--standard" /> Standard · {adminPlanAllocation.standard}
              </span>
            </div>
          </div>
        </section>

        <section className="admin-card admin-card--side">
          <h3 className="admin-card-title">Weekly Polls</h3>
          <div className="admin-bars">
            {adminWeeklyPolls.map((item) => (
              <div key={item.day} className="admin-bar-col">
                <div className="admin-bar-track">
                  <div className="admin-bar-fill" style={{ height: `${item.value}%` }} />
                </div>
                <span className="admin-bar-label">{item.day}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
