"use client";

import { useEffect } from "react";

/** Silently refresh JWT access token every 12 minutes */
export function useTokenRefresh() {
  useEffect(() => {
    const refresh = () => {
      fetch("/api/auth/refresh", { method: "POST" }).catch(() => {});
    };
    refresh();
    const timer = setInterval(refresh, 12 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);
}
