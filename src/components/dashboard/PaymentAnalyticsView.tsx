"use client";

import { useEffect, useState } from "react";
import { useDisplayCurrency } from "@/lib/currency-context";

type PaymentData = {
  totalRevenue: number;
  totalOrders: number;
  displayCurrency: string;
  paymentMethods: { method: string; label: string; count: number; revenue: number; share: number }[];
  currencies: { currency: string; count: number; revenue: number; share: number }[];
};

import { useI18n } from "@/lib/i18n-context";
import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function PaymentAnalyticsView() {
  const { t } = useI18n();
  const { currency } = useDisplayCurrency();
  const [data, setData] = useState<PaymentData | null>(null);

  useEffect(() => {
    fetch(`/api/analytics/payments?currency=${currency}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [currency]);

  return (
    <div className="dash-page">
      <DashPageHeader
        titleKey="paymentsTitle"
        subtitle={`${t("paymentsSubtitle")} — ${currency}`}
      />

      <div className="mv-analytics-grid">
        <article className="mv-stat-card">
          <p className="mv-stat-label">Ümumi gəlir</p>
          <p className="mv-stat-value">{data?.totalRevenue?.toFixed(2) ?? "—"} {currency}</p>
          <p className="tm-subtitle">{data?.totalOrders ?? 0} sifariş</p>
        </article>
        <article className="mv-stat-card">
          <p className="mv-stat-label">Ən çox ödəniş</p>
          <p className="mv-stat-value">{data?.paymentMethods[0]?.label ?? "—"}</p>
          <p className="tm-subtitle">{data?.paymentMethods[0]?.share ?? 0}% pay</p>
        </article>
      </div>

      <div className="tm-grid tm-grid-2" style={{ marginTop: 20 }}>
        <article className="tm-card">
          <h3>Ödəniş növü</h3>
          <ul className="mv-pie-list">
            {(data?.paymentMethods ?? []).map((p) => (
              <li key={p.method} className="mv-pie-row">
                <span style={{ minWidth: 80 }}>{p.label}</span>
                <div className="mv-pie-bar">
                  <div className="mv-pie-fill" style={{ width: `${p.share}%` }} />
                </div>
                <span className="mv-pie-meta">{p.share}%</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="tm-card">
          <h3>Valyuta payı</h3>
          <ul className="mv-pie-list">
            {(data?.currencies ?? []).map((c) => (
              <li key={c.currency} className="mv-pie-row">
                <span style={{ minWidth: 48 }}>{c.currency}</span>
                <div className="mv-pie-bar">
                  <div className="mv-pie-fill" style={{ width: `${c.share}%`, opacity: 0.85 }} />
                </div>
                <span className="mv-pie-meta">{c.revenue.toFixed(0)}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
