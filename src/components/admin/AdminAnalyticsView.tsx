"use client";

import {
  adminIncomeSummary,
  adminMonthlyIncome,
  adminPlanAllocation,
} from "@/data/admin-analytics";

function AdminLineChart() {
  const width = 560;
  const height = 220;
  const padding = { top: 20, right: 16, bottom: 32, left: 16 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const max = Math.max(...adminMonthlyIncome.map((p) => p.value));
  const min = Math.min(...adminMonthlyIncome.map((p) => p.value));
  const range = max - min || 1;

  const points = adminMonthlyIncome.map((point, index) => {
    const x = padding.left + (index / (adminMonthlyIncome.length - 1)) * chartW;
    const y = padding.top + chartH - ((point.value - min) / range) * chartH;
    return { x, y, ...point };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <svg className="admin-line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly income trend">
      {[0, 1, 2, 3].map((line) => {
        const y = padding.top + (line / 3) * chartH;
        return <line key={line} x1={padding.left} y1={y} x2={width - padding.right} y2={y} className="admin-line-grid" />;
      })}
      <path d={areaPath} className="admin-line-area" />
      <path d={linePath} className="admin-line-path" />
      {points.map((point) => (
        <g key={point.month}>
          <circle cx={point.x} cy={point.y} r="4" className="admin-line-dot" />
          <text x={point.x} y={height - 8} textAnchor="middle" className="admin-line-label">
            {point.month}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function AdminAnalyticsView() {
  const totalCustomers = adminIncomeSummary.goldCount + adminIncomeSummary.standardCount;
  const goldPercent = Math.round((adminIncomeSummary.goldCount / totalCustomers) * 100);

  return (
    <>
      <h2 className="admin-page-title">Analytics</h2>

      <div className="admin-stats admin-stats--analytics">
        <article className="admin-analytics-card admin-analytics-card--primary">
          <p className="admin-analytics-label">This Monthly Income</p>
          <p className="admin-analytics-value">
            {adminIncomeSummary.monthlyTotal.toLocaleString("en-US")} ₼
          </p>
          <span className="admin-analytics-sub admin-analytics-sub--green">
            ▲ Gold: {adminIncomeSummary.goldTotal.toLocaleString("en-US")} ₼
          </span>
        </article>
        <article className="admin-analytics-card admin-analytics-card--standard">
          <p className="admin-analytics-label">Standard Income</p>
          <p className="admin-analytics-value">{adminIncomeSummary.standardTotal.toLocaleString("en-US")} ₼</p>
          <span className="admin-analytics-sub">
            {adminIncomeSummary.standardCount} × {adminIncomeSummary.standardUnitPrice} AZN
          </span>
        </article>
        <article className="admin-analytics-card admin-analytics-card--gold">
          <p className="admin-analytics-label">Gold Income</p>
          <p className="admin-analytics-value">{adminIncomeSummary.goldTotal.toLocaleString("en-US")} ₼</p>
          <span className="admin-analytics-sub">
            {adminIncomeSummary.goldCount} × {adminIncomeSummary.goldUnitPrice} AZN
          </span>
        </article>
        <article className="admin-analytics-card admin-analytics-card--growth">
          <p className="admin-analytics-label">Standard Income (Small)</p>
          <p className="admin-analytics-value">{adminIncomeSummary.trialIncome.toLocaleString("en-US")} ₼</p>
          <span className="admin-analytics-sub admin-analytics-sub--green">
            ▲ Aylıq AZN
          </span>
        </article>
      </div>

      <div className="admin-analytics-grid">
        <section className="admin-card">
          <h3 className="admin-card-title">Monthly Income</h3>
          <AdminLineChart />
        </section>

        <section className="admin-card">
          <h3 className="admin-card-title">Customer Growth</h3>
          <div className="admin-growth-wrap">
            <div className="admin-donut-legend admin-donut-legend--inline">
              <span>
                <i className="admin-dot admin-dot--blue" /> Gold — {adminIncomeSummary.goldCount}
              </span>
              <span>
                <i className="admin-dot admin-dot--standard" /> Standard — {adminIncomeSummary.standardCount}
              </span>
            </div>
            <div className="admin-donut-center-wrap">
              <div
                className="admin-donut admin-donut--growth"
                style={{ background: `conic-gradient(#0f69ff 0 ${goldPercent}%, #22c55e ${goldPercent}% 100%)` }}
                aria-hidden="true"
              />
              <div className="admin-donut-center">
                <strong>{totalCustomers}</strong>
              </div>
            </div>
            <p className="admin-growth-footer">
              Total Number of Customers <strong>{totalCustomers}</strong>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
