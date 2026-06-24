const RAILWAY_AI_DEFAULT = "https://courageous-forgiveness-production.up.railway.app";

function pickBackendUrl(): string {
  const fromEnv = process.env.AI_BACKEND_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") {
    return RAILWAY_AI_DEFAULT;
  }

  return "http://localhost:3001";
}

const AI_BACKEND_URL = pickBackendUrl();
const AI_API_KEY = process.env.AI_API_KEY || "";

export function getAiBackendUrl(): string {
  return AI_BACKEND_URL;
}
