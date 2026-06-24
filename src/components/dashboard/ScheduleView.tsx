"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/toast-context";
import { useI18n } from "@/lib/i18n-context";

type Shift = {
  id: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
};

type LaborMetrics = {
  activeStaff: number;
  scheduledShifts: number;
  shiftHours: number;
  coverageRatio: number;
};

import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function ScheduleView() {
  const { push } = useToast();
  const { t } = useI18n();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [labor, setLabor] = useState<LaborMetrics | null>(null);
  const [staffId, setStaffId] = useState("");
  const [staff, setStaff] = useState<{ id: string; firstName: string; lastName: string }[]>([]);

  async function load() {
    const [s, st, lab] = await Promise.all([
      fetch("/api/shifts").then((r) => r.json()),
      fetch("/api/operations/staff").then((r) => r.json()),
      fetch("/api/labor").then((r) => r.json()),
    ]);
    if (Array.isArray(s.shifts)) setShifts(s.shifts);
    if (Array.isArray(st.staff)) setStaff(st.staff);
    if (lab.activeStaff != null) setLabor(lab);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function addShift() {
    if (!staffId) return;
    try {
      await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          date: new Date().toISOString().slice(0, 10),
          startTime: "09:00",
          endTime: "17:00",
        }),
      });
      await load();
      push(t("success"), "success");
    } catch {
      push(t("error"), "error");
    }
  }

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="scheduleTitle" subtitleKey="scheduleSubtitle" />
      {labor ? (
        <div className="cc-grid" style={{ marginBottom: 16 }}>
          <article className="cc-tile">
            <span className="cc-tile-label">{t("activeStaff")}</span>
            <strong className="cc-tile-value-sm">{labor.activeStaff}</strong>
          </article>
          <article className="cc-tile">
            <span className="cc-tile-label">{t("scheduledShifts")}</span>
            <strong className="cc-tile-value-sm">{labor.scheduledShifts}</strong>
          </article>
          <article className="cc-tile">
            <span className="cc-tile-label">{t("shiftHours")}</span>
            <strong className="cc-tile-value-sm">{labor.shiftHours}</strong>
          </article>
          <article className="cc-tile">
            <span className="cc-tile-label">{t("coverageRatio")}</span>
            <strong className="cc-tile-value-sm">{Math.round(labor.coverageRatio * 100)}%</strong>
          </article>
        </div>
      ) : null}
      <div className="dash-staff-filters">
        <select className="dash-staff-filter-select" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
          <option value="">İşçi seçin</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
          ))}
        </select>
        <button type="button" className="dash-add-btn" onClick={addShift}>+ Növbə</button>
      </div>
      <ul className="dash-staff-list" style={{ marginTop: 16 }}>
        {shifts.map((s) => (
          <li key={s.id} className="dash-staff-card">
            <strong>{s.staffName}</strong>
            <span>{new Date(s.date).toLocaleDateString()} · {s.startTime}–{s.endTime}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
