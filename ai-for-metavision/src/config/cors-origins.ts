import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const VERCEL_PREVIEW = /^https:\/\/[\w-]+\.vercel\.app$/i;
const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function parseOriginList(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

function vercelPreviewsAllowed(): boolean {
  return process.env.WS_ALLOW_VERCEL_PREVIEWS !== 'false';
}

function localhostAllowed(): boolean {
  if (process.env.WS_ALLOW_LOCALHOST === 'false') return false;
  if (process.env.WS_ALLOW_LOCALHOST === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

/** Whether an incoming browser Origin header may access Socket.IO / HTTP API. */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;

  const allowed = parseOriginList(process.env.WS_ORIGIN);
  if (allowed.includes(origin)) return true;

  if (vercelPreviewsAllowed() && VERCEL_PREVIEW.test(origin)) return true;
  if (localhostAllowed() && LOCALHOST.test(origin)) return true;

  return false;
}

export function createCorsOriginChecker(): CorsOptions['origin'] {
  const allowed = parseOriginList(process.env.WS_ORIGIN);

  if (!allowed.length && vercelPreviewsAllowed() && localhostAllowed()) {
    return true;
  }

  return (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin ?? 'unknown'}`));
  };
}

export function getHttpCorsOptions(): CorsOptions {
  return {
    origin: createCorsOriginChecker(),
    credentials: true,
  };
}

export function getSocketCorsConfig(): CorsOptions {
  return getHttpCorsOptions();
}
