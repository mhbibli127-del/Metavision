"use client";

import { useEffect, useState } from "react";
import type { StaffMember, StaffRole, StaffStatus } from "@/data/staff";
import { staffRoles, staffStatuses } from "@/data/staff";
import { opsRequest } from "@/lib/client/operations-api";
import { useConfirm } from "@/lib/confirm-context";
import { useToast } from "@/lib/toast-context";
import { useI18n } from "@/lib/i18n-context";
import DashPageHeader from "@/components/dashboard/DashPageHeader";
import TablePagination from "@/components/ui/TablePagination";

export default function StaffView() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [error, setError] = useState("");
  const confirm = useConfirm();
  const { push: toast } = useToast();
  const { t } = useI18n();

  async function reloadStaff() {
    const d = await opsRequest<{ staff: StaffMember[] }>("staff");
    if (Array.isArray(d.staff)) {
      setStaff(d.staff.map((s) => ({ ...s, hireDate: new Date(s.hireDate) })));
    }
  }

  useEffect(() => {
    reloadStaff().catch(() => {});
  }, []);

  const filteredStaff = staff.filter((member) => {
    const matchesRole = filterRole === "all" || member.role === filterRole;
    const matchesStatus = filterStatus === "all" || member.status === filterStatus;
    return matchesRole && matchesStatus;
  });

  const handleAddStaff = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  const handleEditStaff = (member: StaffMember) => {
    setEditingStaff(member);
    setIsModalOpen(true);
  };

  const handleDeleteStaff = async (id: string) => {
    if (!(await confirm(t("confirmDeleteStaff")))) return;
    try {
      setError("");
      await opsRequest(`staff?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await reloadStaff();
      toast(t("deleted"), "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Silinmədi";
      setError(msg);
      toast(msg, "error");
    }
  };

  const handleSaveStaff = async (staffData: Partial<StaffMember>) => {
    try {
      setError("");
      if (editingStaff) {
        await opsRequest("staff", { method: "PATCH", body: JSON.stringify({ id: editingStaff.id, ...staffData }) });
      } else {
        await opsRequest("staff", { method: "POST", body: JSON.stringify(staffData) });
      }
      await reloadStaff();
      setIsModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saxlanılmadı");
    }
  };

  const getRoleLabel = (role: StaffRole) => {
    return staffRoles.find((r) => r.value === role)?.label || role;
  };

  const getStatusInfo = (status: StaffStatus) => {
    return staffStatuses.find((s) => s.value === status) || { label: status, color: "gray" };
  };

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const pagedStaff = filteredStaff.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="staffTitle" subtitleKey="staffSubtitle">
        <button type="button" className="dash-add-btn" onClick={handleAddStaff}>
          + {t("addStaff")}
        </button>
      </DashPageHeader>

      {error ? <p className="login-otp-error">{error}</p> : null}

      <div className="dash-staff-filters">
        <div className="dash-staff-filter-group">
          <label className="dash-staff-filter-label">Role</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="dash-staff-filter-select"
          >
            <option value="all">All Roles</option>
            {staffRoles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
        <div className="dash-staff-filter-group">
          <label className="dash-staff-filter-label">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="dash-staff-filter-select"
          >
            <option value="all">All Status</option>
            {staffStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="dash-staff-grid">
        {pagedStaff.map((member) => (
          <article key={member.id} className="dash-staff-card">
            <div className="dash-staff-card-header">
              <div className="dash-staff-avatar">
                {member.firstName[0]}{member.lastName[0]}
              </div>
              <div className="dash-staff-actions">
                <button
                  type="button"
                  className="dash-staff-action-btn"
                  onClick={() => handleEditStaff(member)}
                  aria-label="Edit staff"
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="dash-staff-action-btn dash-staff-action-btn--danger"
                  onClick={() => handleDeleteStaff(member.id)}
                  aria-label="Delete staff"
                >
                  ✕
                </button>
              </div>
            </div>
            <h3 className="dash-staff-name">
              {member.firstName} {member.lastName}
            </h3>
            <p className="dash-staff-role">{getRoleLabel(member.role)}</p>
            <div className="dash-staff-meta">
              <span className="dash-staff-phone">{member.phone}</span>
              <span
                className={`dash-staff-status dash-staff-status--${getStatusInfo(member.status).color}`}
              >
                {getStatusInfo(member.status).label}
              </span>
            </div>
            {member.salary && (
              <div className="dash-staff-salary">
                ${member.salary}/month
              </div>
            )}
            <div className="dash-staff-hire-date">
              Hired: {member.hireDate.toLocaleDateString("az-AZ")}
            </div>
          </article>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="dash-placeholder">
          No staff members found matching the filters.
        </div>
      )}

      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {isModalOpen && (
        <StaffModal
          staff={editingStaff}
          roles={staffRoles}
          statuses={staffStatuses}
          onSave={handleSaveStaff}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function StaffModal({
  staff,
  roles,
  statuses,
  onSave,
  onClose,
}: {
  staff: StaffMember | null;
  roles: { value: StaffRole; label: string }[];
  statuses: { value: StaffStatus; label: string; color: string }[];
  onSave: (data: Partial<StaffMember>) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<Partial<StaffMember>>(
    staff || {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      role: "waiter" as StaffRole,
      status: "active" as StaffStatus,
      hireDate: new Date(),
      salary: undefined,
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
          <h2 className="dash-modal-title">{staff ? "Edit Staff" : "Add Staff"}</h2>
          <button type="button" className="dash-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <form className="dash-menu-form" onSubmit={handleSubmit}>
          <div className="dash-menu-form-row">
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="dash-menu-form-input"
              />
            </div>
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="dash-menu-form-input"
              />
            </div>
          </div>
          <div className="dash-menu-form-row">
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="dash-menu-form-input"
              />
            </div>
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Email</label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="dash-menu-form-input"
              />
            </div>
          </div>
          <div className="dash-menu-form-row">
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Role *</label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })}
                className="dash-menu-form-select"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Status *</label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as StaffStatus })}
                className="dash-menu-form-select"
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="dash-menu-form-row">
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Hire Date *</label>
              <input
                type="date"
                required
                value={formData.hireDate ? formData.hireDate.toISOString().split("T")[0] : ""}
                onChange={(e) => setFormData({ ...formData, hireDate: new Date(e.target.value) })}
                className="dash-menu-form-input"
              />
            </div>
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Salary (AZN)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.salary || ""}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="dash-menu-form-input"
              />
            </div>
          </div>
          <div className="dash-menu-form-actions">
            <button type="button" className="dash-menu-btn-secondary" onClick={onClose}>
              {t("cancel")}
            </button>
            <button type="submit" className="dash-menu-btn-primary">
              {staff ? t("update") : t("add")} {t("staff")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
