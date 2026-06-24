"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { MetaAdsDashboardPayload, MetaAdsRange } from "@/lib/meta-ads/types";
import { useConfirm } from "@/lib/confirm-context";
import { useToast } from "@/lib/toast-context";
import { useI18n } from "@/lib/i18n-context";

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.length === 3 ? currency : "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function MetaAdsView() {
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<MetaAdsDashboardPayload | null>(null);
  const [range, setRange] = useState<MetaAdsRange>("30d");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const confirm = useConfirm();
  const { push: toast } = useToast();
  const { t } = useI18n();

  const load = useCallback(
    async (opts?: { sync?: boolean }) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ range });
        if (opts?.sync) qs.set("sync", "true");
        const res = await fetch(`/api/meta-ads?${qs}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load");
        setData(json);
      } catch (e) {
        setBanner(e instanceof Error ? e.message : "Yükləmə xətası");
      } finally {
        setLoading(false);
      }
    },
    [range],
  );

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) setBanner("Meta Ads hesabı uğurla bağlandı.");
    if (error) setBanner(decodeURIComponent(error));
  }, [searchParams]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSync() {
    if (data?.connection?.status === "import") {
      setBanner("CSV rejimində yeniləmək üçün yeni export faylı yükləyin.");
      return;
    }
    setSyncing(true);
    setBanner(null);
    try {
      const res = await fetch("/api/meta-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ range }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Sync failed");
      setData(json);
      setBanner("Meta Ads panelindən məlumatlar yeniləndi.");
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "Sync xətası");
    } finally {
      setSyncing(false);
    }
  }

  async function handleCsvImport(file: File) {
    setImporting(true);
    setBanner(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("range", range);
      form.append("currency", "AZN");
      const res = await fetch("/api/meta-ads/import", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import failed");
      setData(json);
      setBanner(`${json.campaigns?.length ?? 0} kampaniya import edildi (SMS/API lazım deyil).`);
    } catch (e) {
      setBanner(e instanceof Error ? e.message : "Import xətası");
    } finally {
      setImporting(false);
    }
  }

  async function handleTokenConnect(e: React.FormEvent) {
    e.preventDefault();
    setImporting(true);
    setBanner(null);
    try {
      const res = await fetch("/api/meta-ads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          adAccountId,
          currency: "AZN",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Token failed");
      setData(json);
      setBanner("Token ilə bağlandı — məlumatlar çəkildi.");
      setAccessToken("");
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Token xətası");
    } finally {
      setImporting(false);
    }
  }

  async function handleDisconnect() {
    if (!(await confirm(t("confirmDeleteMetaAds")))) return;
    await fetch("/api/meta-ads", { method: "DELETE" });
    setData(null);
    await load();
    toast(t("deleted"), "success");
    setBanner("Məlumatlar silindi.");
  }

  const currency = data?.connection?.currency ?? "AZN";
  const isImport = data?.connection?.status === "import";

  return (
    <div className="dash-page tm-page">
      <section className="tm-card">
        <p className="tm-overline">Marketing Intelligence</p>
        <h1 className="tm-title">{t("metaAdsTitle")}</h1>
        <p className="tm-subtitle">{t("metaAdsSubtitle")}</p>

        {banner && (
          <p
            className={`dash-profile-message ${
              banner.includes("xət") || banner.includes("failed") || banner.includes("tapılmadı")
                ? "dash-profile-message--error"
                : "dash-profile-message--success"
            }`}
            style={{ marginTop: "1rem" }}
          >
            {banner}
          </p>
        )}
      </section>

      {!data?.connected && (
        <section className="tm-card">
          <h3>Alternativ 1 — CSV Export (tövsiyə olunur)</h3>
          <p className="tm-subtitle">SMS kod lazım deyil. Ads Manager-dan report export edin:</p>
          <ol className="tm-list">
            <li>
              <a href="https://adsmanager.facebook.com" target="_blank" rel="noreferrer">
                adsmanager.facebook.com
              </a>{" "}
              açın (artıq login olmusunuzsa)
            </li>
            <li>Reports → Campaigns → son 30 gün seçin</li>
            <li>Export → Export table data → CSV</li>
            <li>Aşağıdan faylı yükləyin</li>
          </ol>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt"
            className="dash-restaurant-file-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleCsvImport(f);
            }}
          />
          <div className="dash-meta-actions">
            <button
              type="button"
              className="dash-add-btn"
              disabled={importing}
              onClick={() => fileRef.current?.click()}
            >
              {importing ? "Import…" : "CSV faylı yüklə"}
            </button>
          </div>

          <hr style={{ margin: "1.5rem 0", border: "none", borderTop: "1px solid #e2e8f0" }} />

          <h3>Alternativ 2 — Graph API Explorer token</h3>
          <p className="tm-subtitle">
            Facebook-a brauzerdə login olmusunuzsa, telefon kodu olmadan token ala bilərsiniz:
          </p>
          <ol className="tm-list">
            <li>
              <a
                href="https://developers.facebook.com/tools/explorer/"
                target="_blank"
                rel="noreferrer"
              >
                developers.facebook.com/tools/explorer
              </a>
            </li>
            <li>Generate Access Token → icazələr: <code>ads_read</code>, <code>read_insights</code></li>
            <li>Ads Manager-dan <code>act_XXXXX</code> hesab ID-ni kopyalayın</li>
          </ol>

          <form onSubmit={handleTokenConnect} className="dash-meta-token-form">
            <label className="dash-restaurant-field">
              <span className="dash-restaurant-label">Access Token</span>
              <input
                className="dash-restaurant-input"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAxxxx…"
                autoComplete="off"
              />
            </label>
            <label className="dash-restaurant-field">
              <span className="dash-restaurant-label">Ad Account ID</span>
              <input
                className="dash-restaurant-input"
                value={adAccountId}
                onChange={(e) => setAdAccountId(e.target.value)}
                placeholder="act_123456789"
              />
            </label>
            <button type="submit" className="dash-add-btn" disabled={importing || !accessToken || !adAccountId}>
              Token ilə bağlan
            </button>
          </form>

          <hr style={{ margin: "1.5rem 0", border: "none", borderTop: "1px solid #e2e8f0" }} />

          <h3>Alternativ 3 — OAuth (telefon təsdiqi lazım ola bilər)</h3>
          <div className="dash-meta-actions">
            <a href="/api/meta-ads/auth" className="dash-profile-btn-secondary">
              Meta Ads-ə qoşul (OAuth)
            </a>
          </div>
        </section>
      )}

      {data?.connected && (
        <>
          {data.trendContext && (data.trendContext.hashtags.length > 0 || data.trendContext.headlines.length > 0) && (
            <section className="tm-card">
              <p className="tm-overline">Trend konteksti</p>
              <h3>Canlı hashtag & xəbər axını</h3>
              <p className="tm-subtitle">
                TikTok · Google · X · NewsAPI — {new Date(data.trendContext.updatedAt).toLocaleString("az-AZ")}
              </p>
              <div className="mv-social-trends-grid">
                <article className="mv-social-trend-block">
                  <header><strong>HASHTAGS</strong></header>
                  <ul>
                    {data.trendContext.hashtags.slice(0, 10).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </article>
                <article className="mv-social-trend-block">
                  <header><strong>XƏBƏRLƏR</strong></header>
                  <ul>
                    {data.trendContext.headlines.slice(0, 6).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>
          )}

          <section className="tm-card">
            <div className="dash-meta-actions">
              {isImport ? (
                <>
                  <button
                    type="button"
                    className="dash-add-btn"
                    disabled={importing}
                    onClick={() => fileRef.current?.click()}
                  >
                    Yeni CSV yüklə
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.tsv,.txt"
                    className="dash-restaurant-file-input"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleCsvImport(f);
                    }}
                  />
                </>
              ) : (
                <button type="button" className="dash-add-btn" onClick={handleSync} disabled={syncing}>
                  {syncing ? "Sinxronizasiya…" : "Paneldən yenilə"}
                </button>
              )}
              <button type="button" className="dash-profile-btn-secondary" onClick={handleDisconnect}>
                Sil / bağlantını kəs
              </button>
            </div>
            {data.connection && (
              <p className="tm-subtitle" style={{ marginTop: "0.75rem" }}>
                {isImport ? "Mənbə: CSV import" : "Mənbə: Meta API"} ·{" "}
                <strong>{data.connection.adAccountName ?? data.connection.adAccountId}</strong>
                {data.connection.lastSyncedAt && (
                  <> · {new Date(data.connection.lastSyncedAt).toLocaleString("az-AZ")}</>
                )}
              </p>
            )}
          </section>

          <div className="dash-stats">
            <article className="dash-stat-card">
              <p className="dash-stat-label">Spend</p>
              <p className="dash-stat-value dash-stat-value--blue">
                {formatMoney(data.summary.spend, currency)}
              </p>
            </article>
            <article className="dash-stat-card">
              <p className="dash-stat-label">Impressions</p>
              <p className="dash-stat-value">{data.summary.impressions.toLocaleString()}</p>
            </article>
            <article className="dash-stat-card">
              <p className="dash-stat-label">Clicks</p>
              <p className="dash-stat-value dash-stat-value--green">
                {data.summary.clicks.toLocaleString()}
              </p>
            </article>
            <article className="dash-stat-card">
              <p className="dash-stat-label">Reach</p>
              <p className="dash-stat-value">{data.summary.reach.toLocaleString()}</p>
            </article>
            <article className="dash-stat-card">
              <p className="dash-stat-label">CTR</p>
              <p className="dash-stat-value">{data.summary.ctr.toFixed(2)}%</p>
            </article>
            <article className="dash-stat-card">
              <p className="dash-stat-label">CPC</p>
              <p className="dash-stat-value">{formatMoney(data.summary.cpc, currency)}</p>
            </article>
            <article className="dash-stat-card">
              <p className="dash-stat-label">Conversions</p>
              <p className="dash-stat-value">{data.summary.conversions}</p>
            </article>
          </div>

          <section className="tm-card">
            <h3>Kampaniyalar</h3>
            {loading ? (
              <p className="tm-subtitle">Yüklənir…</p>
            ) : data.campaigns.length === 0 ? (
              <p className="tm-subtitle">Kampaniya məlumatı yoxdur.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Kampaniya</th>
                      <th>Spend</th>
                      <th>Impr.</th>
                      <th>Clicks</th>
                      <th>CTR</th>
                      <th>CPC</th>
                      <th>Conv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map((c) => (
                      <tr key={c.entityId}>
                        <td>{c.entityName}</td>
                        <td>{formatMoney(c.spend, currency)}</td>
                        <td>{c.impressions.toLocaleString()}</td>
                        <td>{c.clicks.toLocaleString()}</td>
                        <td>{c.ctr.toFixed(2)}%</td>
                        <td>{formatMoney(c.cpc, currency)}</td>
                        <td>{c.conversions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
