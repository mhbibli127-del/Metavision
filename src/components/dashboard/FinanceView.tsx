"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/toast-context";
import { useI18n } from "@/lib/i18n-context";

type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
};

type PurchaseOrder = {
  id: string;
  vendorId: string;
  total: number;
  status: string;
};

import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function FinanceView() {
  const { push } = useToast();
  const { t } = useI18n();
  const [summary, setSummary] = useState({ totalPaid: 0, totalPending: 0, expenseCount: 0 });
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [form, setForm] = useState({ description: "", category: "Operations", amount: "0" });
  const [poForm, setPoForm] = useState({ vendorId: "", total: "0" });

  async function load() {
    const [fin, po] = await Promise.all([
      fetch("/api/finance").then((r) => r.json()),
      fetch("/api/purchase-orders").then((r) => r.json()),
    ]);
    setSummary({ totalPaid: fin.totalPaid ?? 0, totalPending: fin.totalPending ?? 0, expenseCount: fin.expenseCount ?? 0 });
    if (Array.isArray(fin.expenses)) setExpenses(fin.expenses);
    if (Array.isArray(po.orders)) setOrders(po.orders);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function addExpense() {
    try {
      await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "expense", ...form, amount: Number(form.amount) }),
      });
      await load();
      push(t("success"), "success");
    } catch {
      push(t("error"), "error");
    }
  }

  async function addPO() {
    try {
      await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: poForm.vendorId, items: [], total: Number(poForm.total) }),
      });
      await load();
      push(t("success"), "success");
    } catch {
      push(t("error"), "error");
    }
  }

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="financeTitle" subtitleKey="financeSubtitle" />
      <div className="cc-grid">
        <article className="cc-tile cc-tile--hero">
          <span className="cc-tile-label">Paid</span>
          <strong className="cc-tile-value">{summary.totalPaid.toFixed(2)} AZN</strong>
        </article>
        <article className="cc-tile">
          <span className="cc-tile-label">Pending</span>
          <strong className="cc-tile-value-sm">{summary.totalPending.toFixed(2)} AZN</strong>
        </article>
        <article className="cc-tile">
          <span className="cc-tile-label">Records</span>
          <strong className="cc-tile-value-sm">{summary.expenseCount}</strong>
        </article>
      </div>
      <div className="dash-staff-filters" style={{ marginTop: 16 }}>
        <input className="dash-menu-search-input" placeholder="Təsvir" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="dash-menu-search-input" placeholder="Məbləğ" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <button type="button" className="dash-add-btn" onClick={addExpense}>+ Xərc</button>
      </div>
      <ul className="dash-staff-list" style={{ marginTop: 16 }}>
        {expenses.map((e) => (
          <li key={e.id} className="dash-staff-card">
            <strong>{e.description}</strong>
            <span>{e.amount} {e.currency} · {e.status}</span>
          </li>
        ))}
      </ul>

      <h3 className="dash-section-title" style={{ marginTop: 24 }}>{t("purchaseOrders")}</h3>
      <div className="dash-staff-filters">
        <input className="dash-menu-search-input" placeholder={t("vendorId")} value={poForm.vendorId} onChange={(e) => setPoForm({ ...poForm, vendorId: e.target.value })} />
        <input className="dash-menu-search-input" placeholder={t("poTotal")} value={poForm.total} onChange={(e) => setPoForm({ ...poForm, total: e.target.value })} />
        <button type="button" className="dash-add-btn" onClick={addPO}>+ {t("createPO")}</button>
      </div>
      <ul className="dash-staff-list" style={{ marginTop: 16 }}>
        {orders.map((o) => (
          <li key={o.id} className="dash-staff-card">
            <strong>{o.vendorId}</strong>
            <span>{o.total} AZN · {o.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
