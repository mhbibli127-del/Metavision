import * as Sentry from "@sentry/nextjs";
import { isSentryConfigured } from "@/lib/monitoring/sentry";

export function initSentryServer() {
  if (!isSentryConfigured()) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  });
}
