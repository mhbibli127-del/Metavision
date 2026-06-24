"use client";

import { useEffect, useState } from "react";
import OperationsHealthPanel from "@/components/dashboard/OperationsHealthPanel";
import { analyzeHyperdimension } from "@/lib/hyperdimension";
import type { FeatureMetrics } from "@/features/hyperdimension";

import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function ReportsView() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [reportType, setReportType] = useState<"sales" | "orders" | "customers" | "inventory">("sales");
  const [metrics, setMetrics] = useState<FeatureMetrics | null>(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, revenue: 0, todayDelta: 0, currency: "AZN" });

  useEffect(() => {
    analyzeHyperdimension()
      .then((r) => {
        if (r.status === "ok") setMetrics(r.metrics);
      })
      .catch(() => {});
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.stats) setStats(d.stats);
      })
      .catch(() => {});
  }, []);

  const handleExportCSV = () => {
    if (!metrics) return;
    const rows = [
      ["metric", "value"],
      ["operationsHealthScore", metrics.operationsHealthScore],
      ["revenueStability", metrics.revenueStability],
      ["orderFulfillmentRate", metrics.orderFulfillmentRate],
      ["inventoryRiskScore", metrics.inventoryRiskScore],
      ["customerRetentionIndex", metrics.customerRetentionIndex],
      ["totalRevenue", metrics.totalRevenue],
      ["avgOrderValue", metrics.avgOrderValue],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metavision-report-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="reportsTitle" subtitleKey="reportsSubtitle" />

      <OperationsHealthPanel title="Operations Health Overview" />

      <div className="dash-reports-controls">
        <div className="dash-reports-filter-group">
          <label className="dash-reports-filter-label">Date Range</label>
          <div className="dash-reports-date-buttons">
            {(["7d", "30d", "90d", "1y"] as const).map((range) => (
              <button
                key={range}
                type="button"
                className={`dash-reports-date-btn${dateRange === range ? " is-active" : ""}`}
                onClick={() => setDateRange(range)}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "1 Year"}
              </button>
            ))}
          </div>
        </div>

        <div className="dash-reports-filter-group">
          <label className="dash-reports-filter-label">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as typeof reportType)}
            className="dash-reports-select"
          >
            <option value="sales">Sales Report</option>
            <option value="orders">Orders Report</option>
            <option value="customers">Customers Report</option>
            <option value="inventory">Inventory Report</option>
          </select>
        </div>
      </div>

      <div className="dash-reports-grid">
        <article className="dash-reports-card">
          <h3 className="dash-reports-card-title">Summary Statistics</h3>
          <div className="dash-reports-stats">
            <div className="dash-reports-stat">
              <span className="dash-reports-stat-label">Total Revenue</span>
              <span className="dash-reports-stat-value">
                ${(metrics?.totalRevenue ?? stats.revenue).toLocaleString()}
              </span>
              <span className="dash-reports-stat-change dash-reports-stat-change--positive">
                +{stats.todayDelta}% today
              </span>
            </div>
            <div className="dash-reports-stat">
              <span className="dash-reports-stat-label">Total Orders</span>
              <span className="dash-reports-stat-value">{stats.total}</span>
              <span className="dash-reports-stat-change dash-reports-stat-change--positive">
                {stats.completed} completed
              </span>
            </div>
            <div className="dash-reports-stat">
              <span className="dash-reports-stat-label">Average Order Value</span>
              <span className="dash-reports-stat-value">
                ${metrics?.avgOrderValue?.toFixed(2) ?? "—"}
              </span>
              <span className="dash-reports-stat-change">
                Stability {Math.round(metrics?.revenueStability ?? 0)}%
              </span>
            </div>
            <div className="dash-reports-stat">
              <span className="dash-reports-stat-label">Operations Health</span>
              <span className="dash-reports-stat-value">
                {metrics ? `${Math.round(metrics.operationsHealthScore)}%` : "—"}
              </span>
              <span className="dash-reports-stat-change dash-reports-stat-change--positive">
                Retention {Math.round(metrics?.customerRetentionIndex ?? 0)}%
              </span>
            </div>
          </div>
        </article>

        <article className="dash-reports-card">
          <h3 className="dash-reports-card-title">Risk Indicators</h3>
          <div className="dash-reports-list">
            <div className="dash-reports-list-item">
              <span className="dash-reports-list-name">Inventory Risk</span>
              <span className="dash-reports-list-value">{Math.round(metrics?.inventoryRiskScore ?? 0)}%</span>
            </div>
            <div className="dash-reports-list-item">
              <span className="dash-reports-list-name">Demand Volatility</span>
              <span className="dash-reports-list-value">{Math.round(metrics?.demandVolatility ?? 0)}%</span>
            </div>
            <div className="dash-reports-list-item">
              <span className="dash-reports-list-name">Fulfillment Rate</span>
              <span className="dash-reports-list-value">{Math.round(metrics?.orderFulfillmentRate ?? 0)}%</span>
            </div>
            <div className="dash-reports-list-item">
              <span className="dash-reports-list-name">Low Stock Items</span>
              <span className="dash-reports-list-value">{metrics?.lowStockCount ?? 0}</span>
            </div>
            <div className="dash-reports-list-item">
              <span className="dash-reports-list-name">Anomalies Detected</span>
              <span className="dash-reports-list-value">{metrics?.anomalyCount ?? 0}</span>
            </div>
          </div>
        </article>

        <article className="dash-reports-card dash-reports-card--full">
          <h3 className="dash-reports-card-title">Export Options</h3>
          <div className="dash-reports-export">
            <button
              type="button"
              className="dash-reports-export-btn dash-reports-export-btn--excel"
              onClick={handleExportCSV}
            >
              <span className="dash-reports-export-icon">📊</span>
              <span>Export Metrics CSV</span>
            </button>
            <button
              type="button"
              className="dash-btn dash-btn--primary"
              onClick={() => window.open("/api/reports/daily?format=html", "_blank")}
            >
              TasteMind PDF
            </button>
            <button
              type="button"
              className="dash-reports-export-btn dash-reports-export-btn--print"
              onClick={() => window.print()}
            >
              <span className="dash-reports-export-icon">🖨️</span>
              <span>Print Report</span>
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
