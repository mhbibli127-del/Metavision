export async function register() {
  if (process.env.ENABLE_BULLMQ_WORKER === "true") {
    const { startWorkers } = await import("@/lib/queue");
    await startWorkers();
  }

  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const { initSentryServer } = await import("../sentry.server.config");
    initSentryServer();
  }
}

export async function onRequestError(err: unknown, request: { path: string }) {
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(err, { extra: { path: request.path } });
    return;
  }
  if (process.env.NODE_ENV === "development") {
    console.error("[request error]", err);
  }
}
