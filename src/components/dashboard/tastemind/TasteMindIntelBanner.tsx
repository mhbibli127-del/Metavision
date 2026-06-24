"use client";

import Link from "next/link";
import { useTasteMindStore } from "@/lib/tastemindStore";

export default function TasteMindIntelBanner() {
  const ops = useTasteMindStore((s) => s.opsSnapshot);
  const isLive = useTasteMindStore((s) => s.isLive);
  const index = useTasteMindStore((s) => s.tasteDnaIndex);

  if (!ops) {
    return (
      <div className="tm-intel-banner">
        <p>TasteMind yüklənir…</p>
        <Link href="/dashboard/tastemind">Monitoru aç</Link>
      </div>
    );
  }

  return (
    <div className="tm-intel-banner">
      <p>
        {isLive && <span className="tm-live-dot tm-live-dot--active tm-live-dot--inline">CANLI</span>}
        Gəlir <strong>{ops.revenue.toFixed(2)} {ops.currency}</strong>
        {" · "}
        Gözləyən <strong>{ops.pendingOrders}</strong>
        {" · "}
        Stok xəbərdarlığı <strong>{ops.lowStockCount}</strong>
        {" · "}
        İndeks <strong>{index}</strong>
      </p>
      <Link href="/dashboard/tastemind">Canlı monitor</Link>
    </div>
  );
}
