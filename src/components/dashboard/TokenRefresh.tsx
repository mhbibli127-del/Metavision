"use client";

import { useTokenRefresh } from "@/lib/useTokenRefresh";

export default function TokenRefresh() {
  useTokenRefresh();
  return null;
}
