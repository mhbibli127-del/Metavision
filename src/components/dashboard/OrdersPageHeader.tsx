"use client";

import DashPageHeader from "@/components/dashboard/DashPageHeader";
import { useI18n } from "@/lib/i18n-context";

function RefreshIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

export default function OrdersPageHeader() {
  const { t } = useI18n();

  return (
    <DashPageHeader titleKey="ordersTitle" subtitleKey="ordersSubtitle">
      <button type="button" className="dash-refresh-btn" aria-label={t("refreshOrders")} onClick={() => window.location.reload()}>
        <RefreshIcon />
      </button>
    </DashPageHeader>
  );
}
