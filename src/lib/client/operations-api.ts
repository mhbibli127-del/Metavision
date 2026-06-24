export async function opsRequest<T = unknown>(
  resource: string,
  init?: RequestInit & { action?: string },
): Promise<T> {
  const url = init?.action
    ? `/api/operations/${resource}?action=${encodeURIComponent(init.action)}`
    : `/api/operations/${resource}`;

  const { action: _a, ...fetchInit } = init ?? {};
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(fetchInit.headers ?? {}) },
    ...fetchInit,
  });

  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Əməliyyat alınmadı");
  }
  return data;
}
