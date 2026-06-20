import { getOrderStats } from "@/data/orders";

export default function OrdersStats() {
  const stats = getOrderStats();

  return (
    <div className="dash-stats">
      <article className="dash-stat-card">
        <p className="dash-stat-label">Total orders</p>
        <p className="dash-stat-value dash-stat-value--green">{stats.total}</p>
        <span className="dash-stat-badge dash-stat-badge--green">+{stats.todayDelta} Today</span>
      </article>

      <article className="dash-stat-card">
        <p className="dash-stat-label">Completed</p>
        <p className="dash-stat-value dash-stat-value--green">{stats.completed}</p>
        <span className="dash-stat-badge dash-stat-badge--green">Ready</span>
      </article>

      <article className="dash-stat-card">
        <p className="dash-stat-label">Pending</p>
        <p className="dash-stat-value dash-stat-value--yellow">{stats.pending}</p>
        <span className="dash-stat-badge dash-stat-badge--yellow">Active</span>
      </article>

      <article className="dash-stat-card">
        <p className="dash-stat-label">Revenue</p>
        <p className="dash-stat-value dash-stat-value--blue">
          {stats.revenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
        <span className="dash-stat-badge dash-stat-badge--blue">AZN</span>
      </article>
    </div>
  );
}
