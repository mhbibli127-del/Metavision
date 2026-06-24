"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/lib/toast-context";
import { useConfirm } from "@/lib/confirm-context";

type Branch = {
  id: string;
  name: string;
  city: string;
  address: string;
  restaurantId: string;
  isPrimary: boolean;
  isCurrent: boolean;
};

import { useI18n } from "@/lib/i18n-context";
import DashPageHeader from "@/components/dashboard/DashPageHeader";

export default function BranchesView() {
  const { t } = useI18n();
  const { push } = useToast();
  const confirm = useConfirm();
  const [org, setOrg] = useState<{ name: string; plan: string } | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState("");
  const [city, setCity] = useState("Baku");

  async function load() {
    const d = await fetch("/api/organization").then((r) => r.json());
    if (d.organization) setOrg(d.organization);
    if (Array.isArray(d.branches)) setBranches(d.branches);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function addBranch() {
    try {
      await fetch("/api/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city }),
      });
      setName("");
      await load();
      push("Filial əlavə olundu", "success");
    } catch {
      push("Filial əlavə olunmadı", "error");
    }
  }

  async function copyMenuToBranch(target: Branch) {
    const primary = branches.find((b) => b.isPrimary);
    if (!primary || primary.restaurantId === target.restaurantId) return;
    if (!(await confirm(`"${primary.name}" menyusunu "${target.name}" filialına kopyalamaq?`))) return;
    try {
      const res = await fetch("/api/organization/menu-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceRestaurantId: primary.restaurantId,
          targetRestaurantId: target.restaurantId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kopyalanmadı");
      push(`${data.copied ?? 0} menyu elementi kopyalandı`, "success");
    } catch (e) {
      push(e instanceof Error ? e.message : "Menyu kopyalanmadı", "error");
    }
  }

  return (
    <div className="dash-page">
      <DashPageHeader
        titleKey="branchesTitle"
        subtitle={org ? `${org.name} · ${org.plan}` : t("branchesSubtitle")}
      />
      <div className="cc-grid">
        {branches.map((b) => (
          <article key={b.id} className={`cc-tile${b.isCurrent ? " cc-tile--hero" : ""}`}>
            <span className="cc-tile-label">{b.isPrimary ? "Primary" : "Branch"}</span>
            <strong className="cc-tile-value-sm">{b.name}</strong>
            <span className="cc-tile-meta">{b.city} · {b.address}</span>
            {!b.isPrimary && branches.some((x) => x.isPrimary) ? (
              <button type="button" className="dash-menu-btn-secondary" style={{ marginTop: 8 }} onClick={() => copyMenuToBranch(b)}>
                Menyu şablonunu kopyala
              </button>
            ) : null}
          </article>
        ))}
      </div>
      <div className="dash-staff-filters" style={{ marginTop: 20 }}>
        <input className="dash-menu-search-input" placeholder="Filial adı" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="dash-menu-search-input" placeholder="Şəhər" value={city} onChange={(e) => setCity(e.target.value)} />
        <button type="button" className="dash-add-btn" onClick={addBranch}>+ Filial</button>
      </div>
    </div>
  );
}
