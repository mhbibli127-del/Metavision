import type { ReactNode } from "react";
import type { Reservation } from "@/data/reservations";
import { getReservationStats } from "@/data/reservations";

type ReservationsStatsProps = {
  reservations: Reservation[];
};

function StatIcon({ children, tone }: { children: ReactNode; tone: "blue" | "green" | "red" | "yellow" }) {
  return <span className={`dash-res-stat-icon dash-res-stat-icon--${tone}`}>{children}</span>;
}

export default function ReservationsStats({ reservations }: ReservationsStatsProps) {
  const stats = getReservationStats(reservations);

  return (
    <div className="dash-stats dash-res-stats">
      <article className="dash-stat-card dash-res-stat-card">
        <div className="dash-res-stat-top">
          <StatIcon tone="blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </StatIcon>
          <p className="dash-stat-label">Total reservations</p>
        </div>
        <p className="dash-stat-value dash-stat-value--blue">{stats.total}</p>
      </article>

      <article className="dash-stat-card dash-res-stat-card">
        <div className="dash-res-stat-top">
          <StatIcon tone="green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </StatIcon>
          <p className="dash-stat-label">Active</p>
        </div>
        <p className="dash-stat-value dash-stat-value--green">{stats.active}</p>
      </article>

      <article className="dash-stat-card dash-res-stat-card">
        <div className="dash-res-stat-top">
          <StatIcon tone="red">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </StatIcon>
          <p className="dash-stat-label">Cancelled</p>
        </div>
        <p className="dash-stat-value dash-stat-value--red">{stats.cancelled}</p>
      </article>

      <article className="dash-stat-card dash-res-stat-card">
        <div className="dash-res-stat-top">
          <StatIcon tone="yellow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </StatIcon>
          <p className="dash-stat-label">Total guests</p>
        </div>
        <p className="dash-stat-value dash-stat-value--yellow">{stats.totalGuests}</p>
      </article>
    </div>
  );
}
