"use client";

import { useRealtimeUpdates } from "@/lib/useRealtimeUpdates";

export default function RealtimeIndicator() {
  const { isConnected } = useRealtimeUpdates();

  return (
    <div className="dash-realtime-indicator">
      <div className={`dash-realtime-dot ${isConnected ? "is-connected" : "is-disconnected"}`} />
      <span className="dash-realtime-text">
        {isConnected ? "Live" : "Offline"}
      </span>
    </div>
  );
}
