"use client";

import { MOCK_AI_USAGE } from "@/data/admin-platform";

export default function AdminAiMonitoringView() {
  return (
    <>
      <h2 className="admin-page-title">AI Monitoring</h2>
      <p className="admin-muted">Token consumption, cost and error rates per restaurant.</p>
      <div className="admin-stats admin-stats--figma" style={{ marginBottom: 24 }}>
        <article className="admin-stat-card">
          <p className="admin-stat-label">Total tokens (30d)</p>
          <p className="admin-stat-value">258K</p>
        </article>
        <article className="admin-stat-card">
          <p className="admin-stat-label">Est. cost</p>
          <p className="admin-stat-value">$37.30</p>
        </article>
        <article className="admin-stat-card">
          <p className="admin-stat-label">Avg error rate</p>
          <p className="admin-stat-value">2.7%</p>
        </article>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Restaurant</th>
              <th>Tokens</th>
              <th>Requests</th>
              <th>Cost</th>
              <th>Errors</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_AI_USAGE.map((row) => (
              <tr key={row.restaurantId}>
                <td>{row.restaurantName}</td>
                <td>{row.tokens.toLocaleString()}</td>
                <td>{row.requests}</td>
                <td>${row.costUsd.toFixed(2)}</td>
                <td>{(row.errorRate * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
