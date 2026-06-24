"use client";

import { FormEvent, useEffect, useState } from "react";
import { useToast } from "@/lib/toast-context";
import { useI18n } from "@/lib/i18n-context";

type WaitlistEntry = {
  id: string;
  name: string;
  phone: string;
  partySize: number;
  quotedWaitMin: number;
  status: "waiting" | "seated" | "left";
};

import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function WaitlistView() {
  const { push } = useToast();
  const { t } = useI18n();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [convertId, setConvertId] = useState<string | null>(null);
  const [convertDate, setConvertDate] = useState("");
  const [convertTime, setConvertTime] = useState("19:00");

  async function load() {
    const d = await fetch("/api/waitlist").then((r) => r.json());
    if (Array.isArray(d.waitlist)) setEntries(d.waitlist);
  }

  useEffect(() => {
    load().catch(() => {});
    const timer = setInterval(() => load().catch(() => {}), 15_000);
    return () => clearInterval(timer);
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, partySize: Number(partySize) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setName("");
      setPhone("");
      await load();
      push(t("success"), "success");
    } catch (err) {
      push(err instanceof Error ? err.message : t("error"), "error");
    }
  }

  async function setStatus(id: string, status: "seated" | "left") {
    await fetch("/api/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  async function handleConvert(e: FormEvent) {
    e.preventDefault();
    if (!convertId) return;
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "convert", id: convertId, date: convertDate, time: convertTime }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setConvertId(null);
      await load();
      push(t("success"), "success");
    } catch (err) {
      push(err instanceof Error ? err.message : t("error"), "error");
    }
  }

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="waitlist" subtitleKey="waitlistSubtitle" />
      <form className="dash-staff-filters" onSubmit={handleAdd}>
        <input className="dash-menu-search-input" placeholder={t("guestName")} value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="dash-menu-search-input" placeholder={t("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <input className="dash-menu-search-input" type="number" min={1} value={partySize} onChange={(e) => setPartySize(e.target.value)} />
        <button type="submit" className="dash-add-btn">+ {t("addToWaitlist")}</button>
      </form>
      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{t("guestName")}</th>
              <th>{t("phone")}</th>
              <th>{t("guests")}</th>
              <th>{t("waitMin")}</th>
              <th>{t("status")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.id}>
                <td>{i + 1}</td>
                <td>{e.name}</td>
                <td>{e.phone}</td>
                <td>{e.partySize}</td>
                <td>{e.quotedWaitMin} min</td>
                <td>{e.status}</td>
                <td>
                  {e.status === "waiting" ? (
                    <>
                      <button type="button" className="dash-menu-btn-secondary" onClick={() => setConvertId(e.id)}>
                        {t("convertToReservation")}
                      </button>
                      <button type="button" className="dash-menu-btn-secondary" onClick={() => setStatus(e.id, "seated")}>{t("seat")}</button>
                      <button type="button" className="dash-menu-btn-secondary" onClick={() => setStatus(e.id, "left")}>{t("left")}</button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {convertId ? (
        <div className="dash-modal-overlay" onClick={() => setConvertId(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="dash-modal-title">{t("convertToReservation")}</h2>
            <form className="dash-menu-form" onSubmit={handleConvert}>
              <label className="dash-menu-form-field">
                <span className="dash-menu-form-label">{t("reservations")}</span>
                <input type="date" required className="dash-menu-form-input" value={convertDate} onChange={(e) => setConvertDate(e.target.value)} />
              </label>
              <label className="dash-menu-form-field">
                <span className="dash-menu-form-label">{t("status")}</span>
                <input type="time" required className="dash-menu-form-input" value={convertTime} onChange={(e) => setConvertTime(e.target.value)} />
              </label>
              <div className="dash-menu-form-actions">
                <button type="button" className="dash-menu-btn-secondary" onClick={() => setConvertId(null)}>{t("cancel")}</button>
                <button type="submit" className="dash-menu-btn-primary">{t("confirm")}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
