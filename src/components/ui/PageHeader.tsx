import type { ReactNode } from "react";
import { Badge } from "./Badge";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  live,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  live?: boolean;
}) {
  return (
    <header className="ds-page-header">
      <div>
        {eyebrow && <p className="ds-page-header__eyebrow">{eyebrow}</p>}
        <h1 className="ds-page-header__title">{title}</h1>
        {subtitle && <p className="ds-page-header__subtitle">{subtitle}</p>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {live && <Badge variant="live">Canlı</Badge>}
        {actions}
      </div>
    </header>
  );
}
