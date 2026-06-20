"use client";

import { useAdminSession } from "@/components/admin/AdminAuthGate";

export default function AdminTopbar() {
  const { admin } = useAdminSession();

  return (
    <header className="admin-topbar">
      <div>
        <h1 className="admin-welcome">
          Welcome back, <span>Metavision</span>
        </h1>
        {admin ? (
          <p className="admin-subtitle">
            {admin.firstName} {admin.lastName} · {admin.phone}
          </p>
        ) : null}
      </div>
      <div className="admin-topbar-actions">
        <label className="admin-search-wrap">
          <span className="admin-search-icon" aria-hidden="true">
            ⌕
          </span>
          <input type="search" className="admin-search-input" placeholder="Search..." aria-label="Search" />
        </label>
        <button type="button" className="admin-icon-btn" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <button type="button" className="admin-icon-btn" aria-label="Profile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
