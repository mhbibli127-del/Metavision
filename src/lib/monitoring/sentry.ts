/**
 * Optional Sentry wiring — run `npm install @sentry/nextjs` and set SENTRY_DSN.
 * Then replace instrumentation onRequestError with Sentry.captureRequestError.
 */
export function isSentryConfigured(): boolean {
  return Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
}
