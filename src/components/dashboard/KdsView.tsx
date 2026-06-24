"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";

type KdsTicket = {
  orderNumber: string;
  status: string;
  tableId?: string;
  items: Array<{ name: string; quantity: number; notes?: string }>;
  elapsedMin: number;
};

import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function KdsView() {
  const { t } = useI18n();
  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [fullscreen, setFullscreen] = useState(false);

  async function load() {
    const d = await fetch("/api/kds").then((r) => r.json());
    if (Array.isArray(d.tickets)) setTickets(d.tickets);
  }

  useEffect(() => {
    load().catch(() => {});
    const timer = setInterval(() => load().catch(() => {}), 8_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("kds-fullscreen-active", fullscreen);
    return () => document.body.classList.remove("kds-fullscreen-active");
  }, [fullscreen]);

  async function bump(orderNumber: string, status: string) {
    await fetch("/api/kds", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, status }),
    });
    await load();
  }

  return (
    <div className={`dash-page kds-page${fullscreen ? " kds-page--fullscreen" : ""}`}>
      <DashPageHeader titleKey="kds" subtitleKey="kdsSubtitle">
        <button
          type="button"
          className="dash-refresh-btn"
          onClick={() => setFullscreen((v) => !v)}
          aria-label={fullscreen ? t("exitFullscreen") : t("fullscreen")}
        >
          {fullscreen ? t("exitFullscreen") : t("fullscreen")}
        </button>
      </DashPageHeader>
      <div className="kds-grid">
        {tickets.map((ticket) => (
          <article key={ticket.orderNumber} className={`kds-ticket kds-ticket--${ticket.status.toLowerCase()}`}>
            <header className="kds-ticket-header">
              <strong>#{ticket.orderNumber}</strong>
              <span>{ticket.elapsedMin} min</span>
            </header>
            {ticket.tableId ? <p className="kds-table">Table {ticket.tableId}</p> : null}
            <ul className="kds-items">
              {ticket.items.map((item, i) => (
                <li key={i}>
                  {item.quantity}× {item.name}
                  {item.notes ? <em> — {item.notes}</em> : null}
                </li>
              ))}
            </ul>
            <div className="kds-actions">
              {ticket.status === "PENDING" ? (
                <button type="button" className="dash-add-btn" onClick={() => bump(ticket.orderNumber, "PREPARING")}>
                  {t("startPrep")}
                </button>
              ) : null}
              {ticket.status === "PREPARING" || ticket.status === "READY" ? (
                <button type="button" className="dash-add-btn" onClick={() => bump(ticket.orderNumber, "COMPLETED")}>
                  {t("markDone")}
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {tickets.length === 0 ? <p className="dash-placeholder">{t("noActiveTickets")}</p> : null}
    </div>
  );
}
