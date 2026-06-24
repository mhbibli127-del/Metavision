"use client";

import { useEffect, useState } from "react";
import type { MenuItem, MenuCategory } from "@/data/menu";
import { menuCategories } from "@/data/menu";
import { opsRequest } from "@/lib/client/operations-api";
import { useConfirm } from "@/lib/confirm-context";
import { useToast } from "@/lib/toast-context";
import { useI18n } from "@/lib/i18n-context";
import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function MenuView() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [error, setError] = useState("");
  const confirm = useConfirm();
  const { push: toast } = useToast();
  const { t } = useI18n();

  async function reloadMenu() {
    const d = await opsRequest<{ menu: MenuItem[] }>("menu");
    if (Array.isArray(d.menu)) {
      setMenuItems(
        d.menu.map((m) => ({
          ...m,
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt),
        })),
      );
    }
  }

  useEffect(() => {
    reloadMenu().catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!(await confirm(t("confirmDeleteMenu")))) return;
    try {
      setError("");
      await opsRequest(`menu?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await reloadMenu();
      toast(t("deleted"), "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Silinmədi";
      setError(msg);
      toast(msg, "error");
    }
  };

  const handleToggleAvailability = async (id: string) => {
    const item = menuItems.find((i) => i.id === id);
    if (!item) return;
    try {
      setError("");
      await opsRequest("menu", { method: "PATCH", body: JSON.stringify({ id, available: !item.available }) });
      await reloadMenu();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yenilənmədi");
    }
  };

  const handleToggleFeatured = async (id: string) => {
    const item = menuItems.find((i) => i.id === id);
    if (!item) return;
    try {
      setError("");
      await opsRequest("menu", { method: "PATCH", body: JSON.stringify({ id, featured: !item.featured }) });
      await reloadMenu();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yenilənmədi");
    }
  };

  const handleSaveItem = async (itemData: Partial<MenuItem>) => {
    try {
      setError("");
      if (editingItem) {
        await opsRequest("menu", { method: "PATCH", body: JSON.stringify({ id: editingItem.id, ...itemData }) });
      } else {
        await opsRequest("menu", { method: "POST", body: JSON.stringify(itemData) });
      }
      await reloadMenu();
      setIsModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saxlanılmadı");
    }
  };

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="menuTitle" subtitleKey="menuSubtitle">
        <button type="button" className="dash-add-btn" onClick={handleAddItem}>
          + {t("addItem")}
        </button>
      </DashPageHeader>

        {error ? <p className="login-otp-error">{error}</p> : null}

        <div className="dash-menu-controls">
        <div className="dash-menu-search">
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="dash-menu-search-input"
          />
        </div>
        <div className="dash-menu-categories">
          <button
            type="button"
            className={`dash-menu-category-btn${selectedCategory === "all" ? " is-active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            All ({menuItems.length})
          </button>
          {menuCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`dash-menu-category-btn${selectedCategory === category.id ? " is-active" : ""}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name} ({menuItems.filter((i) => i.category === category.id).length})
            </button>
          ))}
        </div>
      </div>

      <div className="dash-menu-grid">
        {filteredItems.map((item) => (
          <article key={item.id} className="dash-menu-card">
            <div className="dash-menu-card-header">
              <div className="dash-menu-badges">
                {item.featured && <span className="dash-menu-badge dash-menu-badge--featured">Featured</span>}
                {!item.available && <span className="dash-menu-badge dash-menu-badge--unavailable">Unavailable</span>}
              </div>
              <div className="dash-menu-actions">
                <button
                  type="button"
                  className="dash-menu-action-btn"
                  onClick={() => handleEditItem(item)}
                  aria-label="Edit item"
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="dash-menu-action-btn dash-menu-action-btn--danger"
                  onClick={() => handleDeleteItem(item.id)}
                  aria-label="Delete item"
                >
                  ✕
                </button>
              </div>
            </div>
            <h3 className="dash-menu-item-name">{item.name}</h3>
            <p className="dash-menu-item-description">{item.description}</p>
            <div className="dash-menu-item-meta">
              <span className="dash-menu-price">${item.price.toFixed(2)}</span>
              <span className="dash-menu-time">{item.preparationTime} min</span>
            </div>
            <div className="dash-menu-tags">
              {item.tags.map((tag) => (
                <span key={tag} className="dash-menu-tag">{tag}</span>
              ))}
            </div>
            <div className="dash-menu-toggles">
              <label className="dash-menu-toggle">
                <input
                  type="checkbox"
                  checked={item.available}
                  onChange={() => handleToggleAvailability(item.id)}
                />
                <span>Available</span>
              </label>
              <label className="dash-menu-toggle">
                <input
                  type="checkbox"
                  checked={item.featured}
                  onChange={() => handleToggleFeatured(item.id)}
                />
                <span>Featured</span>
              </label>
            </div>
          </article>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="dash-placeholder">
          No menu items found. Add your first item to get started.
        </div>
      )}

      {isModalOpen && (
        <MenuModal
          item={editingItem}
          categories={menuCategories}
          onSave={handleSaveItem}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function MenuModal({
  item,
  categories,
  onSave,
  onClose,
}: {
  item: MenuItem | null;
  categories: MenuCategory[];
  onSave: (data: Partial<MenuItem>) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<Partial<MenuItem>>(
    item || {
      name: "",
      category: "mains",
      description: "",
      price: 0,
      available: true,
      featured: false,
      preparationTime: 15,
      tags: [],
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
          <h2 className="dash-modal-title">{item ? "Edit Menu Item" : "Add Menu Item"}</h2>
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
          <div className="dash-menu-form-field">
            <label className="dash-menu-form-label">Category *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="dash-menu-form-select"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="dash-menu-form-field">
            <label className="dash-menu-form-label">Description *</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="dash-menu-form-textarea"
            />
          </div>
          <div className="dash-menu-form-row">
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Price ($) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="dash-menu-form-input"
              />
            </div>
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Prep Time (min) *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.preparationTime}
                onChange={(e) => setFormData({ ...formData, preparationTime: parseInt(e.target.value) })}
                className="dash-menu-form-input"
              />
            </div>
          </div>
          <div className="dash-menu-form-row">
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Calories</label>
              <input
                type="number"
                min="0"
                value={formData.calories || ""}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value ? parseInt(e.target.value) : undefined })}
                className="dash-menu-form-input"
              />
            </div>
            <div className="dash-menu-form-field">
              <label className="dash-menu-form-label">Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags?.join(", ") || ""}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                className="dash-menu-form-input"
                placeholder="spicy, vegetarian, etc."
              />
            </div>
          </div>
          <div className="dash-menu-form-row">
            <label className="dash-menu-form-checkbox">
              <input
                type="checkbox"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
              />
              <span>Available</span>
            </label>
            <label className="dash-menu-form-checkbox">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              />
              <span>Featured</span>
            </label>
          </div>
          <div className="dash-menu-form-actions">
            <button type="button" className="dash-menu-btn-secondary" onClick={onClose}>
              {t("cancel")}
            </button>
            <button type="submit" className="dash-menu-btn-primary">
              {item ? t("update") : t("add")} {t("menu")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
