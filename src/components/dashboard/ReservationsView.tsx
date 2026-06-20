"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Reservation, ReservationStatus } from "@/data/reservations";
import {
  formatDisplayDate,
  getDayFromIso,
  staticReservations,
} from "@/data/reservations";
import ReservationsStats from "@/components/dashboard/ReservationsStats";
import ReservationsTable from "@/components/dashboard/ReservationsTable";

function RefreshIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

type FormState = {
  guest: string;
  phone: string;
  table: string;
  isVip: boolean;
  guests: string;
  date: string;
  day: string;
  time: string;
  status: ReservationStatus;
};

const emptyForm = (): FormState => ({
  guest: "",
  phone: "",
  table: "",
  isVip: false,
  guests: "2",
  date: "",
  day: "",
  time: "",
  status: "Confirmed",
});

export default function ReservationsView() {
  const [reservations, setReservations] = useState<Reservation[]>(staticReservations);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!form.date) {
      setForm((prev) => ({ ...prev, day: "" }));
      return;
    }
    setForm((prev) => ({ ...prev, day: getDayFromIso(form.date) }));
  }, [form.date]);

  function handleCancel(id: string) {
    setReservations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "Cancelled" } : item)),
    );
  }

  function handleRefresh() {
    setReservations(staticReservations);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: Reservation = {
      id: `res-${Date.now()}`,
      guest: form.guest.trim(),
      phone: form.phone.trim(),
      table: form.table.trim(),
      isVip: form.isVip,
      guests: Math.max(1, Number(form.guests) || 1),
      date: formatDisplayDate(form.date),
      day: form.day || getDayFromIso(form.date),
      time: form.time,
      status: form.status,
    };

    setReservations((prev) => [next, ...prev]);
    setForm(emptyForm());
    setShowForm(false);
  }

  return (
    <div className="dash-page">
      <header className="dash-page-header">
        <div>
          <h1 className="dash-page-title">Reservations</h1>
          <p className="dash-page-subtitle">Manage and track all restaurant orders</p>
        </div>
        <div className="dash-page-header-actions">
          <button type="button" className="dash-add-btn" onClick={() => setShowForm(true)}>
            Add Reservation
          </button>
          <button type="button" className="dash-refresh-btn" aria-label="Refresh reservations" onClick={handleRefresh}>
            <RefreshIcon />
          </button>
        </div>
      </header>

      <ReservationsStats reservations={reservations} />
      <ReservationsTable reservations={reservations} onCancel={handleCancel} />

      {showForm ? (
        <div className="dash-modal-overlay" role="presentation" onClick={() => setShowForm(false)}>
          <div
            className="dash-modal dash-res-modal"
            role="dialog"
            aria-labelledby="add-reservation-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dash-modal-header">
              <h2 id="add-reservation-title" className="dash-modal-title">
                New reservation
              </h2>
              <button type="button" className="dash-modal-close" onClick={() => setShowForm(false)} aria-label="Bağla">
                ×
              </button>
            </div>

            <form className="dash-res-form" onSubmit={handleSubmit}>
              <label className="dash-res-field dash-res-field--full">
                <span className="dash-res-label">Qonaq</span>
                <input
                  className="dash-res-input"
                  value={form.guest}
                  onChange={(e) => setForm((prev) => ({ ...prev, guest: e.target.value }))}
                  placeholder="Ad Soyad"
                  required
                />
              </label>

              <label className="dash-res-field">
                <span className="dash-res-label">Tarix</span>
                <input
                  type="date"
                  className="dash-res-input"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </label>

              <label className="dash-res-field">
                <span className="dash-res-label">Gün</span>
                <input className="dash-res-input dash-res-input--readonly" value={form.day} readOnly placeholder="Avtomatik" />
              </label>

              <label className="dash-res-field">
                <span className="dash-res-label">Masa nömrəsi</span>
                <input
                  className="dash-res-input"
                  value={form.table}
                  onChange={(e) => setForm((prev) => ({ ...prev, table: e.target.value }))}
                  placeholder="Məs: 12"
                  required
                />
              </label>

              <label className="dash-res-field dash-res-field--checkbox">
                <input
                  type="checkbox"
                  checked={form.isVip}
                  onChange={(e) => setForm((prev) => ({ ...prev, isVip: e.target.checked }))}
                />
                <span className="dash-res-label">VIP masa</span>
              </label>

              <label className="dash-res-field">
                <span className="dash-res-label">Nömrə</span>
                <input
                  type="tel"
                  className="dash-res-input"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="050 123 45 67"
                  required
                />
              </label>

              <label className="dash-res-field">
                <span className="dash-res-label">Qonaq sayı</span>
                <input
                  type="number"
                  min={1}
                  className="dash-res-input"
                  value={form.guests}
                  onChange={(e) => setForm((prev) => ({ ...prev, guests: e.target.value }))}
                  required
                />
              </label>

              <label className="dash-res-field">
                <span className="dash-res-label">Saat</span>
                <input
                  type="time"
                  className="dash-res-input"
                  value={form.time}
                  onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                  required
                />
              </label>

              <label className="dash-res-field">
                <span className="dash-res-label">Status</span>
                <select
                  className="dash-res-input dash-res-select"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value as ReservationStatus }))
                  }
                >
                  <option value="Confirmed">Qəbul olunub (Confirmed)</option>
                  <option value="Cancelled">Ləğv edilib (Cancelled)</option>
                </select>
              </label>

              <div className="dash-res-form-actions">
                <button type="button" className="dash-res-btn-secondary" onClick={() => setShowForm(false)}>
                  Ləğv et
                </button>
                <button type="submit" className="dash-res-btn-primary">
                  Əlavə et
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
