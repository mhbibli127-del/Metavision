export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`ds-skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}

export function SkeletonStat() {
  return (
    <div className="ds-stat-card">
      <Skeleton className="ds-skeleton--text" style={{ width: "50%", marginBottom: 12 }} />
      <Skeleton className="ds-skeleton--stat" />
      <Skeleton className="ds-skeleton--text" style={{ width: "40%", marginTop: 12 }} />
    </div>
  );
}

export function SkeletonCard({ rows = 3, height = 16 }: { rows?: number; height?: number }) {
  return (
    <div className="ds-card ds-card--flat">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          className="ds-skeleton--text"
          style={{ width: i === 0 ? "45%" : `${70 + (i % 3) * 8}%`, marginBottom: 10, height: i === 0 ? 12 : height }}
        />
      ))}
    </div>
  );
}
