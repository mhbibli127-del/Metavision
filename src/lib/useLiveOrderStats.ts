"use client";

import { useCallback, useEffect, useState } from "react";
import { useDisplayCurrency } from "@/lib/currency-context";
import { useRealtimeUpdates } from "@/lib/realtime-context";
import type { Currency } from "@/lib/prisma-types";

type OrderStats = {
  total: number;
  completed: number;
  pending: number;
  revenue: number;
  todayDelta: number;
  currency: Currency;
};

const POLL_MS = 5_000;

export function useLiveOrderStats() {
  const { currency } = useDisplayCurrency();
  const { lastEvent } = useRealtimeUpdates();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/stats?currency=${currency}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setStats(data.stats as OrderStats);
    } catch {
      /* offline */
    } finally {
      setLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    void fetchStats();
    const timer = setInterval(() => void fetchStats(), POLL_MS);
    return () => clearInterval(timer);
  }, [fetchStats]);

  useEffect(() => {
    if (lastEvent?.type === "order_update") {
      void fetchStats();
    }
  }, [lastEvent, fetchStats]);

  return { stats, loading, refresh: fetchStats };
}
