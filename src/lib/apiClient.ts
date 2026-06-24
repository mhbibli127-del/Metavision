export type ApiSource = "live" | "cache" | "fallback";

export type ApiClientResponse<T> = {
  success: boolean;
  data: T;
  error: string | null;
  source: ApiSource;
};

export type ApiFetchOptions = {
  apiName: string;
  url: string;
  init?: RequestInit;
  timeoutMs?: number;
  retries?: number;
};

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRIES = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("invalid JSON response");
  }
}

/**
 * Server-side fetch wrapper with timeout, retries, and structured responses.
 */
export async function apiFetch<T = unknown>(
  options: ApiFetchOptions,
): Promise<ApiClientResponse<T>> {
  const { apiName, url, init, timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES } = options;
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[${apiName}] request sent → ${url} (attempt ${attempt + 1}/${retries + 1})`);

      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      console.log(`[${apiName}] status:`, response.status);

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        const snippet = body.slice(0, 120);
        lastError = `HTTP ${response.status}${snippet ? `: ${snippet}` : ""}`;
        if (attempt < retries) {
          await sleep(300 * (attempt + 1));
          continue;
        }
        return { success: false, data: null as T, error: lastError, source: "fallback" };
      }

      const data = (await parseJsonSafe(response)) as T;
      return { success: true, data, error: null, source: "live" };
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.name === "AbortError"
            ? `timeout after ${timeoutMs}ms`
            : err.message
          : "network error";
      lastError = msg;
      console.log(`[${apiName}] error:`, msg);
      if (attempt < retries) {
        await sleep(300 * (attempt + 1));
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  return { success: false, data: null as T, error: lastError ?? "request failed", source: "fallback" };
}
