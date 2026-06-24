"use client";

import { useMemo, useState } from "react";
import type { ScenarioResult } from "@/engines/hyperdimension/brain/executive-brain";

const LABELS = ["Hamısı", "Gəlir fürsəti", "İnflyasiya riski", "Balans", "Xərc optimallaşdırması"];

export default function ScenarioCatalog({ scenarios }: { scenarios: ScenarioResult[] }) {
  const [filter, setFilter] = useState("Hamısı");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = scenarios;
    if (filter !== "Hamısı") list = list.filter((s) => s.label === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) =>
          s.summary.toLowerCase().includes(q) ||
          s.label.toLowerCase().includes(q) ||
          s.strategy.toLowerCase().includes(q) ||
          String(s.id).includes(q),
      );
    }
    return list;
  }, [scenarios, filter, query]);

  return (
    <section className="mv-scenario-catalog">
      <header className="mv-scenario-head">
        <div>
          <p className="mv-intel-overline">Ssenari kataloqu</p>
          <h2 className="mv-scenario-title">Bütün biznes ssenariləri</h2>
          <p className="mv-scenario-sub">{scenarios.length} ssenari · real vaxt yenilənir</p>
        </div>
        <input
          type="search"
          className="mv-scenario-search"
          placeholder="Axtar…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      <div className="mv-scenario-filters">
        {LABELS.map((l) => (
          <button
            key={l}
            type="button"
            className={`mv-scenario-chip${filter === l ? " is-active" : ""}`}
            onClick={() => setFilter(l)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mv-scenario-table-wrap">
        <table className="mv-scenario-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Növ</th>
              <th>Strategiya</th>
              <th>İnflyasiya</th>
              <th>Qiymət</th>
              <th>Gəlir</th>
              <th>Marja</th>
              <th>İzah</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className={`mv-scenario-row mv-scenario-row--${s.label.replace(/\s/g, "-")}`}>
                <td>{s.id}</td>
                <td>
                  <span className="mv-scenario-label">{s.label}</span>
                </td>
                <td>{s.strategy}</td>
                <td>{s.inflationPct}%</td>
                <td>
                  {s.priceAdjustPct > 0 ? "+" : ""}
                  {s.priceAdjustPct}%
                </td>
                <td>{s.projectedRevenue} AZN</td>
                <td>{s.projectedMargin}%</td>
                <td className="mv-scenario-summary">{s.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="mv-scenario-empty">Uyğun ssenari tapılmadı.</p>}
      </div>
    </section>
  );
}
