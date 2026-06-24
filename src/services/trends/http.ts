import axios, { type AxiosRequestConfig } from "axios";

const DEFAULT_TIMEOUT = 12_000;

export function rapidApiConfig(host: string, path: string): AxiosRequestConfig {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) throw new Error("RAPIDAPI_KEY not configured");
  return {
    method: "GET",
    url: `https://${host}${path}`,
    timeout: DEFAULT_TIMEOUT,
    headers: {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": host,
      Accept: "application/json",
    },
  };
}

export async function rapidGet<T>(host: string, path: string, params?: Record<string, string>): Promise<T> {
  const cfg = rapidApiConfig(host, path);
  const res = await axios({ ...cfg, params });
  return res.data as T;
}

export const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
];

export function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]!;
}

export function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
