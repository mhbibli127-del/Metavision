"use client";

import Link from "next/link";
import { useShallow } from "zustand/react/shallow";
import { useTasteMindStore } from "@/lib/tastemindStore";
import { LiveNumber, Badge, SkeletonCard } from "@/components/ui";
import IncidentFeed from "./IncidentFeed";

import { useI18n } from "@/lib/i18n-context";

const EMPTY_TOP_DISHES: { name: string; qty: number; revenue: number }[] = [];

const categoryLabel: Record<string, string> = {
  order: "Sifariş",
  reservation: "Rezerv",
  inventory: "Anbar",
  market: "Bazar",
  table: "Masa",
  system: "Sistem",
};

function KpiCard({
  label,
  value,
  sub,
  tone,
  loading,
  numericValue,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "warn" | "neutral";
  loading?: boolean;
  numericValue?: number;
}) {
  return (
    <article className={`tm-ops-kpi tm-ops-kpi--${tone ?? "neutral"}`}>
      <p>{label}</p>
      {loading ? (
        <strong>…</strong>
      ) : numericValue !== undefined ? (
        <strong>
          <LiveNumber value={numericValue} format={() => value} />
        </strong>
      ) : (
        <strong>{value}</strong>
      )}
      {sub && <span>{sub}</span>}
    </article>
  );
}

export default function TasteMindDashboardView() {
  const { t } = useI18n();
  const {
    tasteDnaScores,
    tasteDnaIndex,
    globalTrends,
    predictionCards,
    contextSignals,
    liveFeed,
    opsSnapshot,
    isLive,
    lastUpdated,
    actionPlan,
    topDishes,
  } = useTasteMindStore(
    useShallow((s) => ({
      tasteDnaScores: s.tasteDnaScores,
      tasteDnaIndex: s.tasteDnaIndex,
      globalTrends: s.globalTrends,
      predictionCards: s.predictionCards,
      contextSignals: s.contextSignals,
      liveFeed: s.liveFeed,
      opsSnapshot: s.opsSnapshot,
      isLive: s.isLive,
      lastUpdated: s.lastUpdated,
      actionPlan: s.actionPlan,
      topDishes: s.opsSnapshot?.topDishes ?? EMPTY_TOP_DISHES,
    })),
  );

  const loading = !opsSnapshot;
  const currency = opsSnapshot?.currency ?? "AZN";

  return (
    <div className="tm-shell tm-shell--ops">
      <div className="tm-main">
        <header className="tm-page-header tm-page-header--ops">
          <div>
            <p className="tm-overline">{t("tastemindDashboardEyebrow")}</p>
            <h1 className="tm-title">{opsSnapshot?.restaurantName ?? t("tastemindDashboardFallback")}</h1>
            <p className="tm-subtitle">
              {opsSnapshot?.city ?? "Bakı"} — {t("tastemindDashboardSubtitle")}
            </p>
          </div>
          <div className="tm-header-tags">
            {isLive ? <Badge variant="live">Canlı</Badge> : <Badge variant="neutral">Bağlanır…</Badge>}
            {lastUpdated && (
              <span className="tm-tag tm-tag--time">
                {lastUpdated.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            <span className="tm-tag">İndeks {tasteDnaIndex}</span>
          </div>
        </header>

        {loading ? (
          <div className="tm-ops-kpi-row">
            <SkeletonCard rows={2} height={40} />
            <SkeletonCard rows={2} height={40} />
            <SkeletonCard rows={2} height={40} />
            <SkeletonCard rows={2} height={40} />
          </div>
        ) : (
          <section className="tm-ops-kpi-row">
            <KpiCard
              label="Günlük gəlir"
              value={`${opsSnapshot!.revenue.toFixed(2)} ${currency}`}
              sub={`${opsSnapshot!.todayDelta >= 0 ? "+" : ""}${opsSnapshot!.todayDelta}% dünənə`}
              tone={opsSnapshot!.todayDelta >= 0 ? "good" : "warn"}
            />
            <KpiCard
              label="Gözləyən sifariş"
              value={String(opsSnapshot!.pendingOrders)}
              numericValue={opsSnapshot!.pendingOrders}
              sub={`Bu gün: ${opsSnapshot!.todayOrderCount} · Cəmi: ${opsSnapshot!.totalOrders}`}
              tone={opsSnapshot!.pendingOrders > 2 ? "warn" : "neutral"}
            />
            <KpiCard
              label="Masalar"
              value={`${opsSnapshot!.tablesOccupied + opsSnapshot!.tablesReserved}/${opsSnapshot!.tablesTotal}`}
              sub={`${opsSnapshot!.activeReservations} aktiv rezerv`}
            />
            <KpiCard
              label="Anbar xəbərdarlığı"
              value={String(opsSnapshot!.lowStockCount)}
              sub={`${opsSnapshot!.competitorCount} rəqib izlənir`}
              tone={opsSnapshot!.lowStockCount > 0 ? "warn" : "good"}
            />
          </section>
        )}

        <section className="tm-grid tm-grid-hero">
          <article className="tm-card tm-card--live">
            <div className="tm-card-head">
              <h2>Canlı hadisə axını</h2>
              <span className="tm-mini">{liveFeed.length} qeyd</span>
            </div>
            {liveFeed.length === 0 ? (
              <SkeletonCard rows={6} height={12} />
            ) : (
              <div className="tm-live-table-wrap">
                <table className="tm-live-table">
                  <thead>
                    <tr>
                      <th>Vaxt</th>
                      <th>Tip</th>
                      <th>Hadisə</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveFeed.map((row) => (
                      <tr key={row.id} className={`tm-live-row tm-live-row--${row.severity}`}>
                        <td className="tm-live-time">{row.time}</td>
                        <td>
                          <span className={`tm-live-cat tm-live-cat--${row.category}`}>
                            {categoryLabel[row.category] ?? row.category}
                          </span>
                        </td>
                        <td>
                          <strong>{row.title}</strong>
                          <span className="tm-live-detail">{row.detail}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="tm-card">
            <div className="tm-card-head">
              <h2>Ən çox satılan</h2>
              <Link href="/dashboard/menu">Menyu</Link>
            </div>
            {topDishes.length === 0 ? (
              <p className="tm-chat-lead">Hələ sifariş yoxdur.</p>
            ) : (
              <ul className="tm-top-dishes">
                {topDishes.map((d, i) => (
                  <li key={d.name}>
                    <span className="tm-top-rank">{i + 1}</span>
                    <div>
                      <strong>{d.name}</strong>
                      <p>
                        {d.qty} sifariş · {d.revenue.toFixed(2)} {currency}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="tm-grid tm-grid-feed">
          <article className="tm-card">
            <div className="tm-card-head">
              <h2>Bazar trendləri ({opsSnapshot?.city ?? "Bakı"})</h2>
              <Link href="/dashboard/global-trends">Hamısı</Link>
            </div>
            <div className="tm-trend-bars">
              {globalTrends.map((t) => (
                <div key={t.cuisine} className="tm-trend-bar-row">
                  <div className="tm-trend-bar-meta">
                    <strong>{t.cuisine}</strong>
                    <span>
                      {t.demandChange > 0 ? "+" : ""}
                      {t.demandChange}%
                    </span>
                  </div>
                  <div className="tm-trend-bar-track">
                    <div className="tm-trend-bar-fill" style={{ width: `${t.momentum}%` }} />
                  </div>
                  <p className="tm-trend-bar-sub">Momentum {t.momentum}% · etibar {t.confidence}%</p>
                </div>
              ))}
            </div>
          </article>

          <article className="tm-card">
            <div className="tm-card-head">
              <h2>Əməliyyat siqnalları</h2>
            </div>
            <div className="tm-signals">
              {contextSignals.map((signal) => (
                <div key={signal.key} className="tm-signal-row">
                  <p>{signal.label}</p>
                  <div>
                    <strong>{signal.value}</strong>
                    <span>{signal.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="tm-card">
          <div className="tm-card-head">
            <h2>Proqnozlar (real məlumat əsasında)</h2>
            <Link href="/dashboard/predictions">Detallı</Link>
          </div>
          <div className="tm-predictions">
            {predictionCards.map((card) => (
              <article key={card.id} className="tm-prediction-card">
                <p className="tm-prediction-message">{card.message}</p>
                <div className="tm-prediction-meta">
                  <span>{card.confidence}% etibar</span>
                  <span>{card.horizon}</span>
                  <span className={`tm-dir tm-dir-${card.direction}`}>
                    {card.direction === "up" ? "↑" : "↓"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <aside className="tm-right">
        <article className="tm-card">
          <div className="tm-card-head">
            <h3>Restoran indeksi</h3>
            <Link href="/dashboard/taste-dna">Detallı</Link>
          </div>
          <div className="tm-radial-wrap tm-radial-wrap--compact">
            <div className="tm-radial" style={{ ["--score" as string]: `${tasteDnaIndex}` }}>
              <span>{tasteDnaIndex}</span>
            </div>
            <div className="tm-radial-list">
              {tasteDnaScores.map((item) => (
                <div key={item.key} className="tm-radial-item">
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="tm-card">
          <h3>Tövsiyələr</h3>
          <ul className="tm-list">
            {actionPlan.length > 0 ? (
              actionPlan.slice(0, 5).map((item) => (
                <li key={item.label}>
                  <strong>{item.label}</strong> — {item.impact}
                </li>
              ))
            ) : (
              <li>Əməliyyat analizi yüklənir…</li>
            )}
          </ul>
        </article>

        <IncidentFeed />

        <article className="tm-card tm-card--links">
          <h3>Əlaqəli modullar</h3>
          <div className="tm-quick-links">
            <Link href="/dashboard/orders">Sifarişlər</Link>
            <Link href="/dashboard/inventory">Anbar</Link>
            <Link href="/dashboard/market-intelligence">Rəqiblər</Link>
            <Link href="/dashboard/social-signals">Social Signals</Link>
          </div>
        </article>
      </aside>
    </div>
  );
}
