"use client";

import { useCallback, useEffect, useState } from "react";
import { useDisplayCurrency } from "@/lib/currency-context";
import { LiveNumber } from "@/components/ui";
import { useI18n } from "@/lib/i18n-context";
import { useToast } from "@/lib/toast-context";

type Kpis = {
  revenue: number;
  revenueDelta: number;
  currency: string;
  ordersTotal: number;
  ordersPending: number;
  ordersCompleted: number;
  lowStock: number;
  occupiedTables: number;
  tablesTotal: number;
  activeStaff: number;
  staffTotal: number;
  customersTotal: number;
  vipCustomers: number;
  auditEvents: number;
};

type Alert = { level: string; message: string };

type AiAction = {
  id: string;
  type: string;
  title: string;
  message: string;
  impact?: string;
  confidence: number;
  status: string;
};

export default function CommandCenterView() {
  const { t } = useI18n();
  const { push } = useToast();
  const { currency } = useDisplayCurrency();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [actions, setActions] = useState<AiAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  const load = useCallback(() => {
    return fetch(`/api/command-center?currency=${currency}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.kpis) setKpis(d.kpis);
        if (Array.isArray(d.alerts)) setAlerts(d.alerts);
        if (Array.isArray(d.actions)) setActions(d.actions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currency]);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(), 8000);
    return () => clearInterval(timer);
  }, [load]);

  async function decide(actionId: string, decision: "accept" | "reject") {
    setResolving(actionId);
    try {
      const res = await fetch("/api/command-center", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, decision }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActions((prev) => prev.filter((a) => a.id !== actionId));
      push(decision === "accept" ? t("success") : t("updated"), "success");
    } catch (e) {
      push(e instanceof Error ? e.message : t("error"), "error");
    } finally {
      setResolving(null);
    }
  }

  if (loading && !kpis) {
    return (
      <div className="cc-page">
        <p className="cc-muted">{t("commandCenterLoading")}</p>
      </div>
    );
  }

  return (
    <div className="cc-page">
      <header className="cc-header">
        <div>
          <p className="cc-eyebrow">{t("commandCenterEyebrow")}</p>
          <h1 className="cc-title">{t("commandCenterTitle")}</h1>
          <p className="cc-sub">{t("commandCenterSubtitle")}</p>
        </div>
        <span className="cc-live">{t("live")}</span>
      </header>

      {actions.length > 0 ? (
        <section className="cc-actions" style={{ marginBottom: 24 }}>
          <h2 className="dash-section-title">{t("aiInsights")}</h2>
          <div className="cc-grid">
            {actions.map((action) => (
              <article key={action.id} className="cc-tile cc-tile--hero">
                <span className="cc-tile-label">{action.type}</span>
                <strong className="cc-tile-value-sm" style={{ fontSize: "1.1rem" }}>
                  {action.title}
                </strong>
                <p className="cc-sub" style={{ marginTop: 8 }}>
                  {action.message}
                </p>
                {action.impact ? (
                  <p className="cc-tile-meta">
                    {action.impact} · {Math.round(action.confidence * 100)}% {t("confidence")}
                  </p>
                ) : null}
                <div className="dash-staff-filters" style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="dash-add-btn"
                    disabled={resolving === action.id}
                    onClick={() => decide(action.id, "accept")}
                  >
                    {t("accept")}
                  </button>
                  <button
                    type="button"
                    className="dash-menu-btn-secondary"
                    disabled={resolving === action.id}
                    onClick={() => decide(action.id, "reject")}
                  >
                    {t("reject")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {alerts.length > 0 ? (
        <div className="cc-alerts">
          {alerts.map((a) => (
            <div key={a.message} className={`cc-alert cc-alert--${a.level}`}>
              {a.message}
            </div>
          ))}
        </div>
      ) : null}

      <div className="cc-grid">
        <article className="cc-tile cc-tile--hero">
          <span className="cc-tile-label">Gəlir (bugün)</span>
          <LiveNumber value={kpis?.revenue ?? 0} className="cc-tile-value" />
          <span className={`cc-delta${(kpis?.revenueDelta ?? 0) >= 0 ? " up" : " down"}`}>
            {(kpis?.revenueDelta ?? 0) >= 0 ? "▲" : "▼"} {Math.abs(kpis?.revenueDelta ?? 0)}%
          </span>
        </article>
        <article className="cc-tile">
          <span className="cc-tile-label">Sifarişlər</span>
          <strong className="cc-tile-value-sm">{kpis?.ordersTotal ?? 0}</strong>
          <span className="cc-tile-meta">{kpis?.ordersPending ?? 0} gözləyir</span>
        </article>
        <article className="cc-tile">
          <span className="cc-tile-label">Masalar</span>
          <strong className="cc-tile-value-sm">
            {kpis?.occupiedTables ?? 0}/{kpis?.tablesTotal ?? 0}
          </strong>
        </article>
        <article className="cc-tile">
          <span className="cc-tile-label">İşçilər</span>
          <strong className="cc-tile-value-sm">
            {kpis?.activeStaff ?? 0}/{kpis?.staffTotal ?? 0}
          </strong>
        </article>
        <article className="cc-tile">
          <span className="cc-tile-label">Müştərilər</span>
          <strong className="cc-tile-value-sm">{kpis?.customersTotal ?? 0}</strong>
          <span className="cc-tile-meta">{kpis?.vipCustomers ?? 0} VIP</span>
        </article>
        <article className="cc-tile">
          <span className="cc-tile-label">İnventar risk</span>
          <strong className="cc-tile-value-sm">{kpis?.lowStock ?? 0}</strong>
        </article>
        <article className="cc-tile">
          <span className="cc-tile-label">Audit</span>
          <strong className="cc-tile-value-sm">{kpis?.auditEvents ?? 0}</strong>
        </article>
        <article className="cc-tile">
          <span className="cc-tile-label">Tamamlanan</span>
          <strong className="cc-tile-value-sm">{kpis?.ordersCompleted ?? 0}</strong>
        </article>
      </div>
    </div>
  );
}
