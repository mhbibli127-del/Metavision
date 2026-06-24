import * as Sentry from "@sentry/nextjs";
import { isSentryConfigured } from "@/lib/monitoring/sentry";

export function initSentryClient() {
  if (!isSentryConfigured()) return;
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  });
}
