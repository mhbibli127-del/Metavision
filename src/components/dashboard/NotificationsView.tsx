"use client";

import { useEffect, useState } from "react";

type NotificationItem = {
  id: string;
  type: "order" | "reservation" | "payment" | "system" | "promotion" | "alert";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

import { useI18n } from "@/lib/i18n-context";
import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function NotificationsView() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | NotificationItem["type"]>("all");
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.notifications)) setNotifications(d.notifications);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "unread") return !notif.read;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleMarkAsRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function handleMarkAllAsRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function handleDelete(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    const icons = { order: "📦", reservation: "📅", payment: "💳", system: "⚙️", promotion: "🎉", alert: "⚠️" };
    return icons[type] || "📌";
  };

  const getNotificationColor = (type: NotificationItem["type"]) => {
    const colors = { order: "blue", reservation: "green", payment: "purple", system: "gray", promotion: "pink", alert: "red" };
    return colors[type] || "gray";
  };

  return (
    <div className="dash-page">
      <DashPageHeader
        titleKey="notificationsTitle"
        subtitle={
          loading
            ? t("loading")
            : unreadCount > 0
              ? `${unreadCount} ${t("notificationsSubtitleUnread")}`
              : t("notificationsSubtitleAllRead")
        }
      >
        {unreadCount > 0 && (
          <button type="button" className="dash-add-btn" onClick={handleMarkAllAsRead}>
            {t("notificationsMarkAllRead")}
          </button>
        )}
      </DashPageHeader>

      <div className="dash-notifications-filters">
        {(["all", "unread", "order", "reservation", "alert"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`dash-filter-btn${filter === f ? " is-active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? `Hamısı (${notifications.length})` : f === "unread" ? `Oxunmamış (${unreadCount})` : f}
          </button>
        ))}
      </div>

      <div className="dash-notifications-list">
        {filteredNotifications.map((notification) => (
          <article
            key={notification.id}
            className={`dash-notification-card${!notification.read ? " dash-notification-card--unread" : ""}`}
          >
            <div className={`dash-notification-icon dash-notification-icon--${getNotificationColor(notification.type)}`}>
              {getNotificationIcon(notification.type)}
            </div>
            <div className="dash-notification-content">
              <h3 className="dash-notification-title">{notification.title}</h3>
              <p className="dash-notification-message">{notification.message}</p>
              <span className="dash-notification-time">
                {formatTime(new Date(notification.createdAt))}
              </span>
            </div>
            <div className="dash-notification-actions">
              {!notification.read && (
                <button type="button" className="dash-notification-action" onClick={() => handleMarkAsRead(notification.id)} title="Oxu">
                  ✓
                </button>
              )}
              <button type="button" className="dash-notification-action dash-notification-action--danger" onClick={() => handleDelete(notification.id)} title="Sil">
                ✕
              </button>
            </div>
          </article>
        ))}
      </div>

      {!loading && filteredNotifications.length === 0 && (
        <div className="dash-placeholder">Bildiriş yoxdur.</div>
      )}
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (minutes < 1) return "İndi";
  if (minutes < 60) return `${minutes} dəq əvvəl`;
  if (hours < 24) return `${hours} saat əvvəl`;
  if (days < 7) return `${days} gün əvvəl`;
  return date.toLocaleDateString("az-AZ");
}
