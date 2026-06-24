"use client";

import Link from "next/link";
import { useIntelligenceBrain } from "@/lib/useIntelligenceBrain";
import { PageHeader, Badge, LiveNumber } from "@/components/ui";

import { useI18n } from "@/lib/i18n-context";

const trendIcon = { up: "↑", down: "↓", stable: "→" };
const trendClass = { up: "mv-trend--up", down: "mv-trend--down", stable: "mv-trend--stable" };

export default function TasteDnaView() {
  const { t } = useI18n();
  const { brain, loading, lastUpdated, isLive } = useIntelligenceBrain();
  const scores = brain?.tasteDna ?? [];
  const index = scores.length
    ? Math.round(scores.reduce((s, c) => s + c.value, 0) / scores.length)
    : 0;

  return (
    <div className="dash-page mv-intel-page mv-intel-page--dna">
      <PageHeader
        eyebrow={t("tasteDnaEyebrow")}
        title={t("tasteDnaTitle")}
        subtitle={`${t("tasteDnaSubtitle")}${lastUpdated ? ` · ${t("updatedAt")} ${lastUpdated.toLocaleTimeString("az-AZ")}` : ""}`}
        live={isLive}
        actions={
          brain?.onboardingRequired ? (
            <Link href="/dashboard/restaurant" className="ds-btn ds-btn--primary">
              Restoran qeydiyyatı
            </Link>
          ) : undefined
        }
      />

      {brain?.onboardingRequired && (
        <div className="mv-onboard-banner">
          Hələ restoran qeydiyyatdan keçməyib. DNA indeksləri bazar bənçmarkı ilə göstərilir — real məlumat üçün{" "}
          <Link href="/dashboard/restaurant">restoran profilini</Link> tamamlayın.
        </div>
      )}

      <section className="mv-dna-layout">
        <article className="mv-dna-ring-card">
          <div className="mv-dna-score-ring" style={{ ["--score" as string]: `${index}` }}>
            <span>
              {loading && !scores.length ? "…" : <LiveNumber value={index} format={(n) => String(n)} />}
            </span>
            <small>DNA indeksi</small>
          </div>
          <p className="mv-dna-ring-caption">
            Zövq profili, sədaqət və menyu uyğunluğunun birləşmiş göstəricisi
          </p>
        </article>

        <div className="mv-dna-grid">
          {scores.map((item) => (
            <article key={item.key} className="mv-dna-card">
              <div className="mv-dna-card-top">
                <h3>{item.label}</h3>
                <span className={`mv-trend ${trendClass[item.trend]}`}>
                  {trendIcon[item.trend]}{" "}
                  <LiveNumber value={item.value} loading={loading} format={(n) => String(n)} />
                </span>
              </div>
              <div className="mv-dna-bar-track">
                <div className="mv-dna-bar-fill" style={{ width: `${item.value}%` }} />
              </div>
              <p className="mv-dna-hint">{item.hint}</p>
            </article>
          ))}
          {!scores.length && loading && <p className="mv-intel-loading">DNA indeksləri yüklənir…</p>}
        </div>
      </section>
    </div>
  );
}
