"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { INTEGRATION_PROVIDERS } from "@/data/integrations";
import { useI18n } from "@/lib/i18n-context";
import { useToast } from "@/lib/toast-context";
import DashPageHeader from "@/components/dashboard/DashPageHeader";

type Connection = { provider: string; status: string; accountName?: string };

export default function IntegrationsView() {
  const { t } = useI18n();
  const { push } = useToast();
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<Connection[]>([]);

  async function reload() {
    const d = await fetch("/api/integrations").then((r) => r.json());
    if (Array.isArray(d.connections)) setConnections(d.connections);
  }

  useEffect(() => {
    reload().catch(() => {});
  }, []);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) push(`${connected} ${t("connected")}`, "success");
    if (error) push(t("error"), "error");
  }, [searchParams, push, t]);

  function connect(provider: string) {
    window.location.href = `/api/integrations/oauth/${provider}`;
  }

  function isConnected(id: string) {
    return connections.some((c) => c.provider === id && c.status === "connected");
  }

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="integrationsTitle" subtitleKey="integrationsSubtitle" />
      <div className="dash-customers-grid">
        {INTEGRATION_PROVIDERS.map((provider) => {
          const connected = isConnected(provider.id) || provider.status === "connected";
          const disabled = provider.status === "coming_soon";
          const conn = connections.find((c) => c.provider === provider.id);
          return (
            <article key={provider.id} className="dash-customer-card">
              <div className="dash-customer-card-header">
                <span className="dash-customer-avatar" style={{ fontSize: 24 }}>
                  {provider.logo}
                </span>
                <span className={`dash-customer-tier dash-customer-tier--${connected ? "blue" : "gray"}`}>
                  {disabled ? "Soon" : connected ? t("connected") : t("notConnected")}
                </span>
              </div>
              <h3 className="dash-customer-name">{provider.name}</h3>
              <p className="dash-customer-notes">{provider.description}</p>
              {conn?.accountName ? <p className="dash-customer-phone">{conn.accountName}</p> : null}
              <button
                type="button"
                className="dash-add-btn"
                disabled={disabled || connected}
                onClick={() => connect(provider.id)}
              >
                {connected ? t("connected") : t("connect")}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
