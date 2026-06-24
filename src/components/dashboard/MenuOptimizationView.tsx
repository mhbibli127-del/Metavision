"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import DashPageHeader from "@/components/dashboard/DashPageHeader";

type Suggestion = {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  suggestedPrice: number;
  changePct: number;
  marginPct: number;
  demandScore: number;
  reason: string;
  confidence: number;
};

export default function MenuOptimizationView() {
  const { t } = useI18n();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/menu/optimize", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.suggestions ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="menuOptimizationTitle" subtitleKey="menuOptimizationSubtitle" />

      <article className="tm-card">
        {loading ? (
          <p className="tm-subtitle">{t("loading")}</p>
        ) : items.length === 0 ? (
          <p className="tm-subtitle">Hazırda tövsiyə yoxdur — sifariş və menyu data əlavə edin.</p>
        ) : (
          <table className="mv-menu-table">
            <thead>
              <tr>
                <th>Məhsul</th>
                <th>Cari</th>
                <th>Tövsiyə</th>
                <th>Marja</th>
                <th>Tələb</th>
                <th>Səbəb</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                    <br />
                    <small>{s.category}</small>
                  </td>
                  <td>{s.currentPrice} AZN</td>
                  <td>
                    <strong>{s.suggestedPrice} AZN</strong>{" "}
                    <span className={`mv-tag ${s.changePct >= 0 ? "mv-tag--up" : "mv-tag--down"}`}>
                      {s.changePct > 0 ? "+" : ""}
                      {s.changePct}%
                    </span>
                  </td>
                  <td>{s.marginPct}%</td>
                  <td>{s.demandScore}%</td>
                  <td>{s.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </article>
    </div>
  );
}
