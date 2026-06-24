"use client";

import { useTasteMindStore } from "@/lib/tastemindStore";

export default function IncidentFeed() {
  const incidents = useTasteMindStore((s) => s.incidents);
  const marketAlerts = useTasteMindStore((s) => s.marketAlerts);

  if (!incidents.length && !marketAlerts.length) {
    return (
      <article className="tm-card">
        <h3>İnsident monitor</h3>
        <p className="tm-chat-lead">Aktiv insident yoxdur — sistem normal rejimdədir.</p>
      </article>
    );
  }

  return (
    <article className="tm-card">
      <h3>İnsident monitor</h3>

      {incidents.map((incident) => (
        <div key={`${incident.incident}-${incident.detectedAt}`} className="tm-incident-card">
          <div className="tm-incident-badge">⚠ İnsident</div>
          <p className="tm-incident-title">{incident.incident}</p>
          <p className="tm-incident-effect">
            Təsir:{" "}
            <span className={incident.effectPercent < 0 ? "tm-neg" : "tm-pos"}>{incident.effect}</span>
          </p>
          <p className="tm-incident-rec">→ {incident.recommendation}</p>
        </div>
      ))}

      {marketAlerts.slice(0, 4).map((alert) => (
        <div key={alert.message} className={`tm-incident-card tm-incident-${alert.type}`}>
          <div className="tm-incident-badge">
            {alert.type === "opportunity" ? "📈 İmkan" : "⚠ Risk"}
          </div>
          <p className="tm-incident-title">{alert.message}</p>
          <p className="tm-incident-conf">Etibar: {Math.round(alert.confidence)}%</p>
        </div>
      ))}
    </article>
  );
}
