"use client";

import { useEffect, useState } from "react";
import type { RestaurantTable } from "@/data/tables";
import { opsRequest } from "@/lib/client/operations-api";
import { useI18n } from "@/lib/i18n-context";
import { useToast } from "@/lib/toast-context";

import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function FloorPlanView() {
  const { t } = useI18n();
  const { push } = useToast();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  async function load() {
    const d = await opsRequest<{ tables: RestaurantTable[] }>("tables");
    if (Array.isArray(d.tables)) setTables(d.tables);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function savePosition(id: string, posX: number, posY: number) {
    try {
      await fetch("/api/floor-plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, posX, posY }),
      });
      push(t("updated"), "success");
    } catch {
      push(t("error"), "error");
    }
  }

  function onDragStart(id: string) {
    setDragId(id);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!dragId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const posX = Math.round(e.clientX - rect.left - 40);
    const posY = Math.round(e.clientY - rect.top - 40);
    setTables((prev) => prev.map((tbl) => (tbl.id === dragId ? { ...tbl, posX, posY } : tbl)));
    void savePosition(dragId, posX, posY);
    setDragId(null);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1]!, id];
      return [...prev, id];
    });
  }

  async function mergeSelected() {
    if (selected.length !== 2) {
      push(t("selectTwoTables"), "error");
      return;
    }
    try {
      await fetch("/api/floor-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryId: selected[0], secondaryId: selected[1] }),
      });
      setSelected([]);
      await load();
      push(t("updated"), "success");
    } catch {
      push(t("error"), "error");
    }
  }

  async function splitSelected() {
    if (selected.length !== 1) {
      push(t("selectTable"), "error");
      return;
    }
    try {
      await fetch("/api/floor-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "split", tableId: selected[0] }),
      });
      setSelected([]);
      await load();
      push(t("updated"), "success");
    } catch {
      push(t("error"), "error");
    }
  }

  return (
    <div className="dash-page">
      <DashPageHeader titleKey="floorPlan" subtitleKey="floorPlanSubtitle">
        <button type="button" className="dash-add-btn" onClick={mergeSelected} disabled={selected.length !== 2}>
          {t("mergeTables")} ({selected.length}/2)
        </button>
        <button type="button" className="dash-menu-btn-secondary" onClick={splitSelected} disabled={selected.length !== 1}>
          {t("splitTable")}
        </button>
      </DashPageHeader>
      <div
        className="floor-plan-canvas"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {tables.map((table) => (
          <div
            key={table.id}
            draggable
            onDragStart={() => onDragStart(table.id)}
            onClick={() => toggleSelect(table.id)}
            className={`floor-plan-table floor-plan-table--${table.status.toLowerCase()}${selected.includes(table.id) ? " floor-plan-table--selected" : ""}`}
            style={{
              left: table.posX ?? 20,
              top: table.posY ?? 20,
              width: table.width ?? 80,
              height: table.height ?? 80,
            }}
          >
            <strong>#{table.number}</strong>
            <span>{table.seats}p</span>
            {table.turnTimeMin ? <small>{table.turnTimeMin}m {t("turnTime")}</small> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
