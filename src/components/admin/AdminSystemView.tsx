"use client";

import { useState } from "react";
import { MOCK_FEATURE_FLAGS } from "@/data/admin-platform";

export default function AdminSystemView() {
  const [flags, setFlags] = useState(MOCK_FEATURE_FLAGS);

  function toggle(key: string) {
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)));
  }

  return (
    <>
      <h2 className="admin-page-title">System</h2>
      <p className="admin-muted">Global feature flags and platform settings.</p>
      <ul className="admin-client-list">
        {flags.map((flag) => (
          <li key={flag.key} className="admin-client-card">
            <div>
              <strong>{flag.label}</strong>
              <p className="admin-muted">{flag.description}</p>
            </div>
            <button type="button" className="admin-nav-link" onClick={() => toggle(flag.key)}>
              {flag.enabled ? "On" : "Off"}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
