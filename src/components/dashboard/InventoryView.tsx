"use client";

import { useEffect, useState } from "react";
import type { InventoryItem, InventoryStatus } from "@/data/inventory";
import { inventoryCategories, inventoryStatuses } from "@/data/inventory";
import { opsRequest } from "@/lib/client/operations-api";
import { useConfirm } from "@/lib/confirm-context";
import { useToast } from "@/lib/toast-context";
import { useI18n } from "@/lib/i18n-context";
import DashPageHeader from "@/components/dashboard/DashPageHeader";
import TablePagination from "@/components/ui/TablePagination";

export default function InventoryView() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [error, setError] = useState("");
  const confirm = useConfirm();
  const { push: toast } = useToast();
  const { t } = useI18n();

  async function reloadInventory() {
    const d = await opsRequest<{ inventory: InventoryItem[] }>("inventory");
    if (Array.isArray(d.inventory)) setInventory(d.inventory);
  }

  useEffect(() => {
    reloadInventory().catch(() => {});
  }, []);

  const filteredInventory = inventory.filter((item) => {
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesCategory && matchesStatus;
  });

  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!(await confirm(t("confirmDeleteInventory")))) return;
    try {
      setError("");
      await opsRequest(`inventory?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await reloadInventory();
      toast(t("deleted"), "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Silinmədi";
      setError(msg);
      toast(msg, "error");
    }
  };

  const handleRestock = async (id: string) => {
    try {
      setError("");
      await opsRequest("inventory", { method: "POST", action: "restock", body: JSON.stringify({ id }) });
      await reloadInventory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Restock alınmadı");
    }
  };

  const handleSaveItem = async (itemData: Partial<InventoryItem>) => {
    try {
      setError("");
      if (editingItem) {
        await opsRequest("inventory", { method: "PATCH", body: JSON.stringify({ id: editingItem.id, ...itemData }) });
      } else {
        await opsRequest("inventory", { method: "POST", body: JSON.stringify(itemData) });
      }
      await reloadInventory();
      setIsModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saxlanılmadı");
    }
  };

  const getStatusInfo = (status: InventoryStatus) => {
    return inventoryStatuses.find((s) => s.value === status) || { label: status, color: "gray" };
  };

  const lowStockCount = inventory.filter((i) => i.status === "low_stock").length;
  const outOfStockCount = inventory.filter((i) => i.status === "out_of_stock").length;
  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / pageSize));
  const pagedInventory = filteredInventory.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="inventoryTitle" subtitleKey="inventorySubtitle">
        <button type="button" className="dash-add-btn" onClick={handleAddItem}>
          + {t("addItem")}
        </button>
      </DashPageHeader>

      {error ? <p className="login-otp-error">{error}</p> : null}

      <div className="dash-inventory-alerts">
        {outOfStockCount > 0 && (
          <div className="dash-inventory-alert dash-inventory-alert--danger">
            ⚠️ {outOfStockCount} items out of stock
          </div>
        )}
        {lowStockCount > 0 && (
          <div className="dash-inventory-alert dash-inventory-alert--warning">
            📦 {lowStockCount} items running low
          </div>
        )}
      </div>

      <div className="dash-staff-filters">
        <div className="dash-staff-filter-group">
          <label className="dash-staff-filter-label">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="dash-staff-filter-select"
          >
            <option value="all">All Categories</option>
            {inventoryCategories.map((category) => (
              <option key={category} value={category}>
                {category}
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
            {inventoryStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="dash-inventory-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Category</th>
              <th scope="col">Quantity</th>
              <th scope="col">Min Level</th>
              <th scope="col">Cost/Unit</th>
              <th scope="col">Supplier</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedInventory.map((item) => (
              <tr key={item.id}>
                <td className="dash-table-strong">{item.name}</td>
                <td>{item.category}</td>
                <td>
                  <span className={`dash-inventory-quantity dash-inventory-quantity--${getStatusInfo(item.status).color}`}>
                    {item.quantity} {item.unit}
                  </span>
                </td>
                <td>{item.minQuantity} {item.unit}</td>
                <td>${item.costPerUnit.toFixed(2)}</td>
                <td>{item.supplier || "-"}</td>
                <td>
                  <span className={`dash-inventory-status dash-inventory-status--${getStatusInfo(item.status).color}`}>
                    {getStatusInfo(item.status).label}
                  </span>
                </td>
                <td>
                  <div className="dash-inventory-actions">
                    <button
                      type="button"
                      className="dash-inventory-action-btn"
                      onClick={() => handleRestock(item.id)}
                      title="Restock"
                    >
                      📦
                    </button>
                    <button
                      type="button"
                      className="dash-inventory-action-btn"
                      onClick={() => handleEditItem(item)}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="dash-inventory-action-btn dash-inventory-action-btn--danger"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredInventory.length === 0 && (
        <div className="dash-placeholder">
          No inventory items found matching the filters.
        </div>
      )}

      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {isModalOpen && (
        <InventoryModal
          item={editingItem}
          categories={inventoryCategories}
          statuses={inventoryStatuses}
          onSave={handleSaveItem}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function InventoryModal({
  item,
  categories,
  statuses,
  onSave,
  onClose,
}: {
  item: InventoryItem | null;
  categories: string[];
  statuses: { value: InventoryStatus; label: string; color: string }[];
  onSave: (data: Partial<InventoryItem>) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<Partial<InventoryItem>>(
    item || {
      name: "",
      category: "Other",
      quantity: 0,
      unit: "kg",
      minQuantity: 10,
      costPerUnit: 0,
      supplier: "",
      status: "in_stock" as InventoryStatus,
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
          <h2 className="dash-modal-title">{item ? "Edit Item" : "Add Item"}</h2>
          <button type="button" className="dash-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <form className="dash-menu-form" onSubmit={handleSubmit}>
          <div className="dash-menu-form-field">
            <label className="dash-menu-form-label">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="dash-menu-form-input"
            />
          </div>
          <div className="dash-menu-form-row">
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Category *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="dash-menu-form-select"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Status *</label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as InventoryStatus })}
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
              <label className="dash-menu-form-label">Quantity *</label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                className="dash-menu-form-input"
              />
            </div>
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Unit *</label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="dash-menu-form-input"
                placeholder="kg, L, pcs"
              />
            </div>
          </div>
          <div className="dash-menu-form-row">
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Min Quantity *</label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: parseFloat(e.target.value) })}
                className="dash-menu-form-input"
              />
            </div>
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Cost per Unit ($) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) })}
                className="dash-menu-form-input"
              />
            </div>
          </div>
          <div className="dash-menu-form-field">
            <label className="dash-menu-form-label">Supplier</label>
            <input
              type="text"
              value={formData.supplier || ""}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="dash-menu-form-input"
            />
          </div>
          <div className="dash-menu-form-actions">
            <button type="button" className="dash-menu-btn-secondary" onClick={onClose}>
              {t("cancel")}
            </button>
            <button type="submit" className="dash-menu-btn-primary">
              {item ? t("update") : t("add")} {t("inventory")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
