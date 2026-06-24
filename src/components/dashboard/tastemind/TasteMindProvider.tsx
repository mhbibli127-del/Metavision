"use client";

import { useCallback, useEffect } from "react";
import { useTasteMindStore } from "@/lib/tastemindStore";
import { useTasteMindSocket } from "@/lib/useTasteMindSocket";
import type { InsightEvent } from "@/data/tastemind";

const POLL_MS = 5_000;

export default function TasteMindProvider({ children }: { children: React.ReactNode }) {
  const hydrateFromApi = useTasteMindStore((s) => s.hydrateFromApi);
  const addInsightEvent = useTasteMindStore((s) => s.addInsightEvent);
  const setIsLive = useTasteMindStore((s) => s.setIsLive);

  const refreshIntel = useCallback(async () => {
    try {
      const [intelRes, brainRes] = await Promise.all([
        fetch("/api/intelligence/tastemind", { cache: "no-store" }),
        fetch("/api/intelligence/brain", { cache: "no-store" }),
      ]);

      if (intelRes.ok) {
        const data = await intelRes.json();
        hydrateFromApi(data);
      }

      if (brainRes.ok) {
        const brain = await brainRes.json();
        hydrateFromApi({
          tasteDnaScores: brain.tasteDna,
          predictionCards: brain.predictions,
        });
      }

      setIsLive(true);
    } catch {
      /* offline */
    }
  }, [hydrateFromApi, setIsLive]);

  useEffect(() => {
    void refreshIntel();
    const intelTimer = setInterval(() => void refreshIntel(), POLL_MS);
    return () => clearInterval(intelTimer);
  }, [refreshIntel]);

  const setGlobalTrends = useTasteMindStore((s) => s.setGlobalTrends);
  const setContextSignalsOnly = useTasteMindStore((s) => s.setContextSignals);

  useTasteMindSocket(undefined, {
    trends_update: (payload) => {
      const p = payload as { trends?: unknown[] };
      if (Array.isArray(p?.trends)) setGlobalTrends(p.trends as never);
      setIsLive(true);
    },
    signals_update: (payload) => {
      const p = payload as { signals?: unknown[] };
      if (Array.isArray(p?.signals)) setContextSignalsOnly(p.signals as never);
      setIsLive(true);
    },
    insight_event: (payload) => {
      const p = payload as { text?: string; severity?: string; linkedModule?: string };
      if (p?.text) {
        addInsightEvent({
          id: `ws-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          text: p.text,
          severity: p.severity === "alert" ? "alert" : "info",
          linkedModule: p.linkedModule ?? "live",
        } as InsightEvent);
      }
      setIsLive(true);
    },
    incident_detected: (payload) => {
      const p = payload as {
        incident?: string;
        effect?: string;
        effectPercent?: number;
        recommendation?: string;
      };
      if (p?.incident) {
        useTasteMindStore.getState().setIncidents([
          {
            incident: p.incident,
            effect: p.effect ?? "",
            effectPercent: p.effectPercent ?? 0,
            recommendation: p.recommendation ?? "",
            detectedAt: new Date().toISOString(),
          },
          ...useTasteMindStore.getState().incidents,
        ].slice(0, 20));
      }
      setIsLive(true);
    },
    market_alert: (payload) => {
      const p = payload as { type?: string; message?: string; confidence?: number };
      if (p?.message) {
        useTasteMindStore.getState().setMarketAlerts([
          {
            type: (p.type === "risk" ? "risk" : "opportunity") as "risk" | "opportunity",
            message: p.message,
            confidence: p.confidence ?? 80,
            timestamp: new Date(),
          },
          ...useTasteMindStore.getState().marketAlerts,
        ].slice(0, 30));
      }
      setIsLive(true);
    },
    connected: () => setIsLive(true),
  });

  return <>{children}</>;
}
