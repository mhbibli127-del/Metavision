"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { AdminClient } from "@/data/admin-clients";

export default function AdminRestaurantsView() {
  const [clients, setClients] = useState<AdminClient[]>([]);

  useEffect(() => {
    fetch("/api/admin?resource=clients")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.clients)) setClients(d.clients);
      });
  }, []);

  return (
    <>
      <h2 className="admin-page-title">Restaurants</h2>
      <p className="admin-muted">All tenant workspaces on the platform.</p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Plan</th>
              <th>Status</th>
              <th>MRR</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>{c.company}</td>
                <td>{c.plan}</td>
                <td>{c.status}</td>
                <td>{c.monthlyPayment} AZN</td>
                <td>
                  <Link href={`/admin/clients`} className="admin-nav-link">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
