#!/usr/bin/env node
/**
 * Metavision bootstrap — MongoDB seed + env sync
 */
import { config } from "dotenv";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
config({ path: resolve(root, ".env.local") });
config({ path: resolve(root, ".env") });

function patchEnvLocal() {
  const envPath = resolve(root, ".env.local");
  let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";

  const upsert = (key: string, value: string) => {
    const line = `${key}=${value.includes(" ") ? `"${value}"` : value}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    content = re.test(content) ? content.replace(re, line) : `${content.trimEnd()}\n${line}\n`;
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://amoxyyfsagmjkacqpegj.supabase.co";
  const projectRef = process.env.SUPABASE_PROJECT_REF || "amoxyyfsagmjkacqpegj";

  upsert("MONGODB_URI", process.env.MONGODB_URI || "");
  upsert("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  upsert("SUPABASE_PROJECT_REF", projectRef);

  writeFileSync(envPath, content);
  console.log("✓ .env.local yeniləndi");
}

function syncAiEnv() {
  const aiEnv = resolve(root, "ai-for-metavision/.env");
  const lines = [
    "# Auto-synced by bootstrap",
    "PORT=3001",
    "NODE_ENV=development",
    `OPENROUTER_API_KEY=${process.env.OPENROUTER_API_KEY || ""}`,
    `OPENROUTER_MODEL=${process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"}`,
    `LLM_PROVIDER=${process.env.LLM_PROVIDER || "openrouter"}`,
    `REDIS_URL=${process.env.REDIS_URL || ""}`,
    `STREAM_CHANNEL=${process.env.STREAM_CHANNEL || "tastemind:live"}`,
    `WS_ORIGIN=http://localhost:3000`,
    "",
  ];
  writeFileSync(aiEnv, lines.join("\n"));
  console.log("✓ ai-for-metavision/.env sync");
}

function run(cmd: string) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: root, env: process.env });
}

async function main() {
  console.log("=== Metavision Bootstrap (MongoDB) ===\n");

  if (!process.env.MONGODB_URI) {
    console.error("✗ MONGODB_URI tapılmadı — .env.local yoxlayın");
    process.exit(1);
  }

  patchEnvLocal();
  run("npm run db:seed");
  syncAiEnv();

  console.log("\n=== Hazırdır ===");
  console.log("  npm run dev          → Next.js (port 3000)");
  console.log("  npm run ai:dev       → AI backend (port 3001)");
  console.log("  Demo: 994501112223 / Metavision2026!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
