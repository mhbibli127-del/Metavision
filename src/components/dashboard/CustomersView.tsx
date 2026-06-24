"use client";

import { useEffect, useState } from "react";
import type { Customer } from "@/data/customers";
import { opsRequest } from "@/lib/client/operations-api";
import { useConfirm } from "@/lib/confirm-context";
import { useToast } from "@/lib/toast-context";
import { useI18n } from "@/lib/i18n-context";
import DashPageHeader from "@/components/dashboard/DashPageHeader";
import TablePagination from "@/components/ui/TablePagination";

type CustomerSegment = "champions" | "loyal" | "at_risk" | "new" | "dormant";

const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  champions: "Champions",
  loyal: "Loyal",
  at_risk: "At risk",
  new: "New",
  dormant: "Dormant",
};

export default function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [segments, setSegments] = useState<Record<string, { segment: CustomerSegment; churnRisk: string }>>({});
  const [segmentSummary, setSegmentSummary] = useState<Record<CustomerSegment, number> | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; segment: string; status: string }>>([]);
  const [campaignForm, setCampaignForm] = useState({ name: "", segment: "at_risk", message: "" });

  const [error, setError] = useState("");
  const confirm = useConfirm();
  const { push: toast } = useToast();
  const { t } = useI18n();

  async function reloadCustomers() {
    const d = await opsRequest<{ customers: Customer[] }>("customers");
    if (Array.isArray(d.customers)) setCustomers(d.customers);
  }

  useEffect(() => {
    reloadCustomers().catch(() => {});
    fetch("/api/customers/segments")
      .then((r) => r.json())
      .then((d) => {
        if (d.summary) setSegmentSummary(d.summary);
        if (Array.isArray(d.customers)) {
          const map: Record<string, { segment: CustomerSegment; churnRisk: string }> = {};
          for (const c of d.customers) {
            map[c.id] = { segment: c.segment, churnRisk: c.churnRisk };
          }
          setSegments(map);
        }
      })
      .catch(() => {});
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.campaigns)) setCampaigns(d.campaigns);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.phone.includes(query) ||
      (customer.email && customer.email.toLowerCase().includes(query))
    );
  });

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!(await confirm(t("confirmDeleteCustomer")))) return;
    try {
      setError("");
      await opsRequest(`customers?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await reloadCustomers();
      toast(t("deleted"), "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Silinmədi";
      setError(msg);
      toast(msg, "error");
    }
  };

  const handleSaveCustomer = async (customerData: Partial<Customer>) => {
    try {
      setError("");
      if (editingCustomer) {
        await opsRequest("customers", { method: "PATCH", body: JSON.stringify({ id: editingCustomer.id, ...customerData }) });
      } else {
        await opsRequest("customers", { method: "POST", body: JSON.stringify(customerData) });
      }
      await reloadCustomers();
      setIsModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saxlanılmadı");
    }
  };

  async function createCampaign() {
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignForm),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setCampaignForm({ name: "", segment: "at_risk", message: "" });
      const d = await fetch("/api/campaigns").then((r) => r.json());
      if (Array.isArray(d.campaigns)) setCampaigns(d.campaigns);
      toast(t("success"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : t("error"), "error");
    }
  }

  async function sendCampaign(id: string) {
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast(t("success"), "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : t("error"), "error");
    }
  }

  const getCustomerTier = (visits: number, totalSpent: number, id: string) => {
    const rfm = segments[id];
    if (rfm) {
      const color =
        rfm.segment === "champions" ? "gold" : rfm.segment === "at_risk" ? "red" : rfm.segment === "loyal" ? "blue" : "gray";
      return { label: SEGMENT_LABELS[rfm.segment], color, churnRisk: rfm.churnRisk };
    }
    if (visits >= 20 || totalSpent >= 500) return { label: "VIP", color: "gold", churnRisk: "low" };
    if (visits >= 10 || totalSpent >= 250) return { label: "Regular", color: "blue", churnRisk: "low" };
    return { label: "New", color: "gray", churnRisk: "medium" };
  };

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const pagedCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="customersTitle" subtitleKey="customersSubtitle">
        <button type="button" className="dash-add-btn" onClick={handleAddCustomer}>
          + {t("addCustomer")}
        </button>
      </DashPageHeader>

      {segmentSummary ? (
        <div className="cc-grid" style={{ marginBottom: 16 }}>
          {(Object.keys(SEGMENT_LABELS) as CustomerSegment[]).map((key) => (
            <article key={key} className="cc-tile">
              <span className="cc-tile-label">{SEGMENT_LABELS[key]}</span>
              <strong className="cc-tile-value">{segmentSummary[key]}</strong>
            </article>
          ))}
        </div>
      ) : null}

      <h3 className="dash-section-title">{t("campaigns")}</h3>
      <div className="dash-staff-filters" style={{ marginBottom: 16 }}>
        <input className="dash-menu-search-input" placeholder={t("campaignName")} value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} />
        <select className="dash-staff-filter-select" value={campaignForm.segment} onChange={(e) => setCampaignForm({ ...campaignForm, segment: e.target.value })}>
          {(Object.keys(SEGMENT_LABELS) as CustomerSegment[]).map((key) => (
            <option key={key} value={key}>{SEGMENT_LABELS[key]}</option>
          ))}
        </select>
        <input className="dash-menu-search-input" placeholder={t("campaignMessage")} value={campaignForm.message} onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })} />
        <button type="button" className="dash-add-btn" onClick={createCampaign}>+ {t("createCampaign")}</button>
      </div>
      <ul className="dash-staff-list" style={{ marginBottom: 16 }}>
        {campaigns.map((c) => (
          <li key={c.id} className="dash-staff-card">
            <strong>{c.name}</strong>
            <span>{c.segment} · {c.status}</span>
            {c.status === "DRAFT" ? (
              <button type="button" className="dash-menu-btn-secondary" onClick={() => sendCampaign(c.id)}>{t("sendCampaign")}</button>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="dash-customers-search">
        <input
          type="text"
          placeholder={t("search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="dash-menu-search-input"
        />
      </div>

      <div className="dash-customers-grid">
        {pagedCustomers.map((customer) => {
          const tier = getCustomerTier(customer.visits, customer.totalSpent, customer.id);
          return (
            <article key={customer.id} className="dash-customer-card">
              <div className="dash-customer-card-header">
                <div className="dash-customer-avatar">
                  {customer.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="dash-customer-actions">
                  <button
                    type="button"
                    className="dash-customer-action-btn"
                    onClick={() => handleEditCustomer(customer)}
                    aria-label="Edit customer"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="dash-customer-action-btn dash-customer-action-btn--danger"
                    onClick={() => handleDeleteCustomer(customer.id)}
                    aria-label="Delete customer"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <h3 className="dash-customer-name">{customer.name}</h3>
              <p className="dash-customer-phone">{customer.phone}</p>
              {customer.email && <p className="dash-customer-email">{customer.email}</p>}
              <div className="dash-customer-stats">
                <div className="dash-customer-stat">
                  <span className="dash-customer-stat-label">Visits</span>
                  <span className="dash-customer-stat-value">{customer.visits}</span>
                </div>
                <div className="dash-customer-stat">
                  <span className="dash-customer-stat-label">Total Spent</span>
                  <span className="dash-customer-stat-value">${customer.totalSpent.toFixed(2)}</span>
                </div>
              </div>
              <div className="dash-customer-meta">
                <span className={`dash-customer-tier dash-customer-tier--${tier.color}`}>
                  {tier.label}
                </span>
                {tier.churnRisk === "high" ? (
                  <span className="dash-customer-tier dash-customer-tier--red">Churn risk</span>
                ) : null}
                {customer.lastVisit && (
                  <span className="dash-customer-last-visit">
                    Last: {customer.lastVisit.toLocaleDateString("az-AZ")}
                  </span>
                )}
              </div>
              {customer.notes && (
                <p className="dash-customer-notes">{customer.notes}</p>
              )}
            </article>
          );
        })}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="dash-placeholder">
          {t("noCustomersFound")}
        </div>
      )}

      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {isModalOpen && (
        <CustomerModal
          customer={editingCustomer}
          onSave={handleSaveCustomer}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function CustomerModal({
  customer,
  onSave,
  onClose,
}: {
  customer: Customer | null;
  onSave: (data: Partial<Customer>) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<Partial<Customer>>(
    customer || {
      name: "",
      phone: "",
      email: "",
      notes: "",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dash-modal-header">
          <h2 className="dash-modal-title">{customer ? t("editCustomer") : t("addCustomerTitle")}</h2>
          <button type="button" className="dash-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <form className="dash-menu-form" onSubmit={handleSubmit}>
          <div className="dash-menu-form-field">
            <label className="dash-menu-form-label">{t("nameLabel")} *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="dash-menu-form-input"
            />
          </div>
          <div className="dash-menu-form-field">
            <label className="dash-menu-form-label">{t("phoneLabel")} *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="dash-menu-form-input"
            />
          </div>
          <div className="dash-menu-form-field">
            <label className="dash-menu-form-label">{t("emailLabel")}</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="dash-menu-form-input"
            />
          </div>
          <div className="dash-menu-form-field">
            <label className="dash-menu-form-label">{t("notesLabel")}</label>
            <textarea
              rows={3}
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="dash-menu-form-textarea"
              placeholder={t("notesPlaceholder")}
            />
          </div>
          <div className="dash-menu-form-actions">
            <button type="button" className="dash-menu-btn-secondary" onClick={onClose}>
              {t("cancel")}
            </button>
            <button type="submit" className="dash-menu-btn-primary">
              {customer ? t("update") : t("add")} {t("customers")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
