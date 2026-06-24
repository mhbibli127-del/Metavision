"use client";

import { useEffect, useState } from "react";
import type { ExecutiveBrainOutput } from "@/engines/hyperdimension/brain/executive-brain";
import { useTasteMindStore } from "@/lib/tastemindStore";

const POLL_MS = 5_000;

export function useIntelligenceBrain() {
  const [brain, setBrain] = useState<ExecutiveBrainOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLiveLocal] = useState(false);
  const hydrateFromApi = useTasteMindStore((s) => s.hydrateFromApi);
  const setIsLive = useTasteMindStore((s) => s.setIsLive);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/intelligence/brain", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as ExecutiveBrainOutput;
        setBrain(data);
        setLastUpdated(new Date());
        setIsLiveLocal(true);

        hydrateFromApi({
          tasteDnaScores: data.tasteDna.map((d) => ({
            key: d.key,
            label: d.label,
            value: d.value,
            trend: d.trend,
          })),
          predictionCards: data.predictions.map((p) => ({
            id: p.id,
            message: p.message,
            confidence: p.confidence,
            horizon: p.horizon,
            direction: p.direction === "stable" ? "up" : p.direction,
            impact: p.impact,
            linkedTrendCity: "",
          })),
        });
        setIsLive(true);
      } catch {
        setIsLiveLocal(false);
      } finally {
        setLoading(false);
      }
    };

    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [hydrateFromApi, setIsLive]);

  return { brain, loading, lastUpdated, isLive };
}
