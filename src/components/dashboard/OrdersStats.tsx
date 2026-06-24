"use client";

import { StatCard, StatGrid } from "@/components/ui";
import { useLiveOrderStats } from "@/lib/useLiveOrderStats";

export default function OrdersStats() {
  const { stats, loading } = useLiveOrderStats();

  const currencyLabel = stats?.currency ?? "AZN";
  const total = stats?.total ?? 0;
  const completed = stats?.completed ?? 0;
  const pending = stats?.pending ?? 0;
  const revenue = stats?.revenue ?? 0;
  const todayDelta = stats?.todayDelta ?? 0;

  return (
    <StatGrid>
      <StatCard
        label="Total orders"
        value={total}
        loading={loading}
        badge={`+${todayDelta} Today`}
        tone="success"
      />
      <StatCard label="Completed" value={completed} loading={loading} badge="Ready" tone="success" />
      <StatCard label="Pending" value={pending} loading={loading} badge="Active" tone="warning" />
      <StatCard
        label="Revenue"
        value={revenue}
        loading={loading}
        format={(n) => n.toLocaleString("en-US", { maximumFractionDigits: 0 })}
        badge={currencyLabel}
        tone="accent"
      />
    </StatGrid>
  );
}
