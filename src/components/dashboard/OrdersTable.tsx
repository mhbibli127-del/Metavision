"use client";

import { useCallback, useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/data/orders";
import { useToast } from "@/lib/toast-context";
import { useTableFilter } from "@/lib/useTableFilter";
import TablePagination from "@/components/ui/TablePagination";
import { useI18n } from "@/lib/i18n-context";

type OrdersTableProps = {
  orders: Order[];
};

const STATUSES: OrderStatus[] = ["Pending", "Preparing", "Completed", "Cancelled"];

function statusClass(status: OrderStatus): string {
  switch (status) {
    case "Completed":
      return "dash-status dash-status--completed";
    case "Pending":
      return "dash-status dash-status--pending";
    case "Preparing":
      return "dash-status dash-status--preparing";
    case "Cancelled":
      return "dash-status dash-status--cancelled";
  }
}

export default function OrdersTable({ orders: initial }: OrdersTableProps) {
  const [orders, setOrders] = useState(initial);
  const [saving, setSaving] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const { push: toast } = useToast();
  const { t } = useI18n();

  const filterFn = useCallback(
    (o: Order, query: string, filters: Record<string, string>) => {
      const q = query.toLowerCase();
      const matchQuery = !q || o.id.toLowerCase().includes(q) || o.item.toLowerCase().includes(q);
      const sf = filters.status ?? "all";
      const matchStatus = sf === "all" || o.status === sf;
      return matchQuery && matchStatus;
    },
    [],
  );

  const { query, setQuery, setFilter, page, setPage, totalPages, paged } = useTableFilter(
    orders,
    filterFn,
    10,
  );

  useEffect(() => {
    setFilter("status", statusFilter);
  }, [statusFilter, setFilter]);

  const updateStatus = async (orderNumber: string, status: OrderStatus) => {
    setSaving(orderNumber);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderNumber ? { ...o, status } : o)),
      );
      toast(`Order #${orderNumber} → ${status}`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="dash-table-wrap">
      <div className="dash-staff-filters" style={{ marginBottom: 12 }}>
        <input
          className="dash-menu-search-input"
          placeholder={t("search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="dash-staff-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">{t("allStatuses")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <table className="dash-table">
        <thead>
          <tr>
            <th scope="col">ORDER ID</th>
            <th scope="col">ITEM</th>
            <th scope="col">AMOUNT</th>
            <th scope="col">STATUS</th>
            <th scope="col">DATE</th>
          </tr>
        </thead>
        <tbody>
          {paged.map((order) => (
            <tr key={order.id}>
              <td>
                <span className="dash-order-id">#{order.id}</span>
              </td>
              <td>{order.item}</td>
              <td>{order.amount.toFixed(2)} AZN</td>
              <td>
                <select
                  className={statusClass(order.status)}
                  value={order.status}
                  disabled={saving === order.id}
                  onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                  aria-label={`Status for order ${order.id}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="dash-table-date">{order.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
