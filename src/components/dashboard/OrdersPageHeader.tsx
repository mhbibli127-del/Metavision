"use client";

function RefreshIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

export default function OrdersPageHeader() {
  return (
    <header className="dash-page-header">
      <div>
        <h1 className="dash-page-title">Orders</h1>
        <p className="dash-page-subtitle">Manage and track all restaurant orders</p>
      </div>
      <button type="button" className="dash-refresh-btn" aria-label="Refresh orders">
        <RefreshIcon />
      </button>
    </header>
  );
}
