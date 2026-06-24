"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  item: string;
  amount: number;
  currency: string;
  status: string;
};

export default function WaiterPanelPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  function load() {
    fetch("/api/orders", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.orders)) setOrders(d.orders);
      })
      .catch(() => {});
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="waiter-shell">
      <header className="waiter-header">
        <div>
          <p className="tm-overline">Metavision</p>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Ofisiant paneli</h1>
        </div>
        <Link href="/dashboard/orders" className="dash-btn dash-btn--ghost">
          Tam panel
        </Link>
      </header>

      {orders.length === 0 ? (
        <p className="tm-subtitle">Gözləyən sifariş yoxdur</p>
      ) : (
        orders.map((o) => (
          <article
            key={o.id}
            className={`waiter-order-card waiter-order-card--${o.status.toLowerCase()}`}
          >
            <strong>{o.id}</strong>
            <p>{o.item}</p>
            <p>
              {o.amount.toFixed(2)} {o.currency} · {o.status}
            </p>
          </article>
        ))
      )}

      <button type="button" className="waiter-fab" onClick={load} aria-label="Yenilə">
        ↻
      </button>
    </div>
  );
}
