"use client";

import { useRealtimeUpdates } from "@/lib/realtime-context";
import { useI18n } from "@/lib/i18n-context";

export default function RealtimeIndicator() {
  const { connectionStatus } = useRealtimeUpdates();
  const { t } = useI18n();

  const label =
    connectionStatus === "live"
      ? t("live").replace("● ", "")
      : connectionStatus === "connecting"
        ? t("connecting")
        : connectionStatus === "disabled"
          ? t("realtimeDisabled")
          : t("offline");

  const dotClass =
    connectionStatus === "live"
      ? "is-connected"
      : connectionStatus === "connecting"
        ? "is-connecting"
        : "is-disconnected";

  const title =
    connectionStatus === "disabled"
      ? "WebSocket: NEXT_PUBLIC_ENABLE_WS=true və Railway URL Vercel-də təyin edin"
      : connectionStatus === "offline"
        ? "Railway NestJS WS/CORS yoxlayın (WS_ORIGIN)"
        : undefined;

  return (
    <div className="dash-realtime-indicator" title={title}>
      <div className={`dash-realtime-dot ${dotClass}`} />
      <span className="dash-realtime-text">{label}</span>
    </div>
  );
}
