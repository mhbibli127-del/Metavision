"use client";

import { LiveNumber } from "./LiveNumber";
import { Badge } from "./Badge";

type Tone = "default" | "success" | "warning" | "accent";

const toneClass: Record<Tone, string> = {
  default: "",
  success: "ds-stat-card__value--success",
  warning: "ds-stat-card__value--warning",
  accent: "ds-stat-card__value--accent",
};

const badgeVariant: Record<Tone, "neutral" | "success" | "warning" | "accent"> = {
  default: "neutral",
  success: "success",
  warning: "warning",
  accent: "accent",
};

export function StatCard({
  label,
  value,
  loading,
  format,
  badge,
  tone = "default",
}: {
  label: string;
  value: number;
  loading?: boolean;
  format?: (n: number) => string;
  badge?: string;
  tone?: Tone;
}) {
  return (
    <article className="ds-stat-card">
      <p className="ds-stat-card__label">{label}</p>
      <p className={`ds-stat-card__value ${toneClass[tone]}`.trim()}>
        <LiveNumber value={value} loading={loading} format={format} />
      </p>
      {badge && (
        <span className="ds-stat-card__meta">
          <Badge variant={badgeVariant[tone]}>{badge}</Badge>
        </span>
      )}
    </article>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="ds-stat-grid">{children}</div>;
}
