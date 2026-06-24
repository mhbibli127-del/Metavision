"use client";

import { FormEvent, useEffect, useState } from "react";
import type { RestaurantTable, TableStatus } from "@/data/tables";
import { getDefaultZoneForStatus } from "@/data/tables";
import TablesGrid from "@/components/dashboard/TablesGrid";
import { opsRequest } from "@/lib/client/operations-api";

function RefreshIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

type FormState = {
  number: string;
  seats: string;
  status: TableStatus;
};

const emptyForm = (): FormState => ({
  number: "",
  seats: "4",
  status: "Available",
});

import { useI18n } from "@/lib/i18n-context";
import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function TablesView() {
  const { t } = useI18n();
  const [tables, setTables] = useState<RestaurantTable[]>([]);

  const [formError, setFormError] = useState("");

  async function loadTables() {
    const d = await opsRequest<{ tables: RestaurantTable[] }>("tables");
    if (Array.isArray(d.tables)) setTables(d.tables);
  }

  useEffect(() => {
    loadTables().catch(() => {});
    const timer = setInterval(() => loadTables().catch(() => {}), 8000);
    return () => clearInterval(timer);
  }, []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  function handleRefresh() {
    loadTables().catch(() => {});
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const number = form.number.trim();
    const seats = Math.max(1, Number(form.seats) || 1);

    if (tables.some((table) => table.number === number)) {
      setFormError("Bu masa nömrəsi artıq mövcuddur.");
      return;
    }

    try {
      await opsRequest("tables", {
        method: "POST",
        body: JSON.stringify({ number, seats, status: form.status, zone: getDefaultZoneForStatus(form.status) }),
      });
      await loadTables();
      setForm(emptyForm());
      setShowForm(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Masa əlavə olunmadı");
    }
  }

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="tablesTitle" subtitleKey="tablesSubtitle">
        <div className="dash-page-header-actions">
          <button type="button" className="dash-add-btn" onClick={() => setShowForm(true)}>
            {t("addTable")}
          </button>
          <button type="button" className="dash-refresh-btn" aria-label={t("refresh")} onClick={handleRefresh}>
            <RefreshIcon />
          </button>
        </div>
      </DashPageHeader>

      <div className="dash-tables-panel">
        <TablesGrid tables={tables} />
      </div>

      {showForm ? (
        <div className="dash-modal-overlay" role="presentation" onClick={() => setShowForm(false)}>
          <div
            className="dash-modal dash-res-modal"
            role="dialog"
            aria-labelledby="add-table-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dash-modal-header">
              <h2 id="add-table-title" className="dash-modal-title">
                {t("addTable")}
              </h2>
              <button type="button" className="dash-modal-close" onClick={() => setShowForm(false)} aria-label={t("close")}>
                ×
              </button>
            </div>

            <form className="dash-res-form dash-tables-form" onSubmit={handleSubmit}>
              <label className="dash-res-field">
                <span className="dash-res-label">Masa nömrəsi</span>
                <input
                  className="dash-res-input"
                  value={form.number}
                  onChange={(e) => setForm((prev) => ({ ...prev, number: e.target.value }))}
                  placeholder="Məs: 17"
                  required
                />
              </label>

              <label className="dash-res-field">
                <span className="dash-res-label">Neçə nəfərlik</span>
                <input
                  type="number"
                  min={1}
                  className="dash-res-input"
                  value={form.seats}
                  onChange={(e) => setForm((prev) => ({ ...prev, seats: e.target.value }))}
                  placeholder="Məs: 4"
                  required
                />
              </label>

              <label className="dash-res-field dash-res-field--full">
                <span className="dash-res-label">Status</span>
                <select
                  className="dash-res-input dash-res-select"
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value as TableStatus }))
                  }
                >
                  <option value="Available">Available (Boş)</option>
                  <option value="Occupied">Occupied (Dolu)</option>
                  <option value="Reserved">Reserved (Rezerv)</option>
                </select>
              </label>

              {formError ? <p className="dash-tables-form-error">{formError}</p> : null}

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
