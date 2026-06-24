type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "accent" | "live";

export function Badge({
  children,
  variant = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  const live = variant === "live" ? " ds-badge--live" : "";
  const v = variant === "live" ? "success" : variant;
  return <span className={`ds-badge ds-badge--${v}${live} ${className}`.trim()}>{children}</span>;
}
