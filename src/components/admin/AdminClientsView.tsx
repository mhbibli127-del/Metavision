"use client";

import { useEffect, useState } from "react";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import type { AdminClient, AdminClientPlan } from "@/data/admin-clients";

export default function AdminClientsView() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [filter, setFilter] = useState<"all" | AdminClientPlan>("all");

  useEffect(() => {
    fetch("/api/admin?resource=clients")
      .then((r) => r.json())
      .then((d) => {
        if (d.clients) setClients(d.clients);
      })
      .catch(() => {});
  }, []);

  const filtered =
    filter === "all" ? clients : clients.filter((c) => c.plan === filter);

  return (
    <>
      <h2 className="admin-page-title">Clients</h2>
      <div className="admin-clients-head">
        <div className="admin-filter-tabs">
          {(["all", "Gold", "Standard"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`admin-filter-tab${filter === tab ? " is-active" : ""}`}
              onClick={() => setFilter(tab === "all" ? "all" : tab)}
            >
              {tab === "all" ? "All" : tab}
            </button>
          ))}
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Plan</th>
              <th>Start</th>
              <th>Monthly</th>
              <th>AI Queries</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => (
              <tr key={client.id}>
                <td>{client.company}</td>
                <td>{client.plan}</td>
                <td>{client.startDate}</td>
                <td>{client.monthlyPayment} AZN</td>
                <td>{client.aiQueries.toLocaleString()}</td>
                <td><AdminStatusBadge status={client.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
