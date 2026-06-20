"use client";

import { useMemo, useState } from "react";
import AdminStatusBadge from "@/components/admin/AdminStatusBadge";
import {
  adminClientCounts,
  adminClients,
  formatPayment,
  type AdminClientPlan,
} from "@/data/admin-clients";

type Filter = "all" | AdminClientPlan;

export default function AdminClientsView() {
  const [filter, setFilter] = useState<Filter>("all");

  const filteredClients = useMemo(() => {
    if (filter === "all") return adminClients;
    return adminClients.filter((client) => client.plan === filter);
  }, [filter]);

  return (
    <>
      <div className="admin-clients-head">
        <h2 className="admin-page-title">Clients</h2>
        <div className="admin-filter-tabs" role="tablist" aria-label="Filter clients">
          <button
            type="button"
            role="tab"
            aria-selected={filter === "all"}
            className={`admin-filter-tab${filter === "all" ? " is-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({adminClientCounts.total})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === "Gold"}
            className={`admin-filter-tab${filter === "Gold" ? " is-active" : ""}`}
            onClick={() => setFilter("Gold")}
          >
            Gold ({adminClientCounts.gold})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === "Standard"}
            className={`admin-filter-tab${filter === "Standard" ? " is-active" : ""}`}
            onClick={() => setFilter("Standard")}
          >
            Standard ({adminClientCounts.standard})
          </button>
        </div>
      </div>

      <section className="admin-card admin-card--flush">
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--clients">
            <thead>
              <tr>
                <th scope="col">Company</th>
                <th scope="col">Plan</th>
                <th scope="col">Start Date</th>
                <th scope="col">Monthly Payment</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td className="admin-table-strong">{client.company}</td>
                  <td>{client.plan}</td>
                  <td>{client.startDate}</td>
                  <td>
                    <span className="admin-payment">
                      {formatPayment(client.monthlyPayment)}
                      <span className="admin-payment-trend" aria-hidden="true">
                        ↗
                      </span>
                    </span>
                  </td>
                  <td>
                    <AdminStatusBadge status={client.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
