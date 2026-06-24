"use client";

import { useState } from "react";
import { MOCK_PRICING_SUGGESTIONS } from "@/data/pricing-engine";
import { useI18n } from "@/lib/i18n-context";
import { useToast } from "@/lib/toast-context";
import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function PricingEngineView() {
  const { t } = useI18n();
  const { push } = useToast();
  const [items, setItems] = useState(MOCK_PRICING_SUGGESTIONS);

  function accept(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    push(t("success"), "success");
  }

  function reject(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    push(t("updated"), "success");
  }

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="pricingEngineTitle" subtitleKey="pricingEngineSubtitle" />
      <div className="cc-grid">
        {items.map((row) => (
          <article key={row.id} className="cc-tile cc-tile--hero">
            <span className="cc-tile-label">{row.item}</span>
            <strong className="cc-tile-value">
              {row.currentPrice.toFixed(2)} → {row.suggestedPrice.toFixed(2)} AZN
            </strong>
            <p className="dash-page-subtitle" style={{ marginTop: 8 }}>
              {row.reason} · {row.impact}
            </p>
            <p className="dash-page-subtitle">
              {row.changePercent > 0 ? "+" : ""}
              {row.changePercent}% · {Math.round(row.confidence * 100)}% {t("confidence")}
            </p>
            <div className="dash-staff-filters" style={{ marginTop: 12 }}>
              <button type="button" className="dash-add-btn" onClick={() => accept(row.id)}>
                {t("accept")}
              </button>
              <button type="button" className="dash-menu-btn-secondary" onClick={() => reject(row.id)}>
                {t("reject")}
              </button>
            </div>
          </article>
        ))}
      </div>
      {items.length === 0 ? <p className="dash-placeholder">{t("success")}</p> : null}
    </div>
  );
}
