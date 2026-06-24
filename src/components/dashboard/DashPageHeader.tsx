"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n-context";

type DashPageHeaderProps = {
  titleKey: string;
  subtitleKey?: string;
  subtitle?: string;
  children?: ReactNode;
};

export default function DashPageHeader({ titleKey, subtitleKey, subtitle, children }: DashPageHeaderProps) {
  const { t } = useI18n();
  const subtitleText = subtitle ?? (subtitleKey ? t(subtitleKey) : undefined);

  return (
    <header className="dash-page-header">
      <div>
        <h1 className="dash-page-title">{t(titleKey)}</h1>
        {subtitleText ? <p className="dash-page-subtitle">{subtitleText}</p> : null}
      </div>
      {children}
    </header>
  );
}
