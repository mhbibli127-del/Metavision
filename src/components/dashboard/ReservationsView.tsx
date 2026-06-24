"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Reservation, ReservationStatus } from "@/data/reservations";
import {
  formatDisplayDate,
  getDayFromIso,
} from "@/data/reservations";
import ReservationsStats from "@/components/dashboard/ReservationsStats";
import ReservationsTable from "@/components/dashboard/ReservationsTable";
import TablePagination from "@/components/ui/TablePagination";
import { useConfirm } from "@/lib/confirm-context";
import { useToast } from "@/lib/toast-context";
import { useTableFilter } from "@/lib/useTableFilter";

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

import { useI18n } from "@/lib/i18n-context";
import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function ReservationsView() {
  const { t } = useI18n();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const confirm = useConfirm();
  const { push: toast } = useToast();

  const filterFn = useCallback(
    (r: Reservation, query: string, filters: Record<string, string>) => {
      const q = query.toLowerCase();
      const matchQuery =
        !q ||
        r.guest.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.table.toLowerCase().includes(q);
      const sf = filters.status ?? "all";
      const matchStatus = sf === "all" || r.status === sf;
      return matchQuery && matchStatus;
    },
    [],
  );

  const { query, setQuery, setFilter, page, setPage, totalPages, paged } = useTableFilter(
    reservations,
    filterFn,
    10,
  );

  useEffect(() => {
    setFilter("status", statusFilter);
  }, [statusFilter, setFilter]);

  function loadReservations() {
    fetch("/api/reservations")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.reservations)) setReservations(d.reservations);
      })
      .catch(() => {});
  }

  useEffect(() => {
    loadReservations();
  }, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!form.date) {
      setForm((prev) => ({ ...prev, day: "" }));
      return;
    }
    setForm((prev) => ({ ...prev, day: getDayFromIso(form.date) }));
  }, [form.date]);

  async function handleCancel(id: string) {
    if (!(await confirm("Rezervasiyanı ləğv etmək istəyirsiniz?"))) return;
    try {
      const res = await fetch("/api/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "Cancelled" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ləğv olunmadı");
      setReservations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "Cancelled" as const } : item)),
      );
      toast("Rezervasiya ləğv edildi", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ləğv olunmadı", "error");
    }
  }

  async function handleDeposit(id: string, depositAmount: number, depositPaid: boolean) {
    try {
      const res = await fetch("/api/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, depositAmount, depositPaid }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setReservations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, depositAmount, depositPaid } : item)),
      );
      toast(t("updated"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : t("error"), "error");
    }
  }

  async function handleSms(id: string) {
    try {
      const res = await fetch("/api/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "reminder" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setReservations((prev) =>
        prev.map((item) => (item.id === id ? { ...item, smsReminderSent: true } : item)),
      );
      toast(t("success"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : t("error"), "error");
    }
  }

  function handleRefresh() {
    loadReservations();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guest: form.guest.trim(),
        phone: form.phone.trim(),
        partySize: Math.max(1, Number(form.guests) || 1),
        date: form.date,
        time: form.time,
        status: form.status,
        table: form.table.trim(),
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.reservation) {
          setReservations((prev) => [d.reservation, ...prev]);
        } else {
          loadReservations();
        }
      })
      .catch(() => loadReservations());

    setForm(emptyForm());
    setShowForm(false);
  }

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="reservationsTitle" subtitleKey="reservationsSubtitle">
        <div className="dash-page-header-actions">
          <button type="button" className="dash-add-btn" onClick={() => setShowForm(true)}>
            {t("addReservation")}
          </button>
          <button type="button" className="dash-refresh-btn" aria-label={t("refresh")} onClick={handleRefresh}>
            <RefreshIcon />
          </button>
        </div>
      </DashPageHeader>

      <ReservationsStats reservations={reservations} />
      <div className="dash-staff-filters" style={{ marginBottom: 12 }}>
        <input
          className="dash-menu-search-input"
          placeholder={t("search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="dash-staff-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">{t("allStatuses")}</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
      <ReservationsTable
        reservations={paged}
        onCancel={handleCancel}
        onDeposit={handleDeposit}
        onSms={handleSms}
      />
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

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
                {t("newReservation")}
              </h2>
              <button type="button" className="dash-modal-close" onClick={() => setShowForm(false)} aria-label={t("close")}>
                ×
              </button>
            </div>

            <form className="dash-res-form" onSubmit={handleSubmit}>
              <label className="dash-res-field dash-res-field--full">
                <span className="dash-res-label">{t("guestLabel")}</span>
                <input
                  className="dash-res-input"
                  value={form.guest}
                  onChange={(e) => setForm((prev) => ({ ...prev, guest: e.target.value }))}
                  placeholder={t("guestNamePlaceholder")}
                  required
                />
              </label>

              <label className="dash-res-field">
                <span className="dash-res-label">{t("dateLabel")}</span>
                <input
                  type="date"
                  className="dash-res-input"
                  value={form.date}
                  onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </label>

              <label className="dash-res-field">
                <span className="dash-res-label">{t("dayLabel")}</span>
                <input className="dash-res-input dash-res-input--readonly" value={form.day} readOnly placeholder={t("dayAuto")} />
              </label>

              <label className="dash-res-field">
                <span className="dash-res-label">{t("tableNumberLabel")}</span>
                <input
                  className="dash-res-input"
                  value={form.table}
                  onChange={(e) => setForm((prev) => ({ ...prev, table: e.target.value }))}
                  placeholder={t("tableNumberPlaceholder")}
                  required
                />
              </label>

              <label className="dash-res-field dash-res-field--checkbox">
                <input
                  type="checkbox"
                  checked={form.isVip}
                  onChange={(e) => setForm((prev) => ({ ...prev, isVip: e.target.checked }))}
                />
                <span className="dash-res-label">{t("vipTable")}</span>
              </label>

              <label className="dash-res-field">
                <span className="dash-res-label">{t("phoneLabel")}</span>
                <input
                  type="tel"
                  className="dash-res-input"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder={t("phonePlaceholder")}
                  required
                />
              </label>

              <label className="dash-res-field">
                <span className="dash-res-label">{t("guestCountLabel")}</span>
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
                <span className="dash-res-label">{t("timeLabel")}</span>
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
                  <option value="Confirmed">{t("statusConfirmed")}</option>
                  <option value="Cancelled">{t("statusCancelled")}</option>
                </select>
              </label>

              <div className="dash-res-form-actions">
                <button type="button" className="dash-res-btn-secondary" onClick={() => setShowForm(false)}>
                  {t("cancel")}
                </button>
                <button type="submit" className="dash-res-btn-primary">
                  {t("add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
