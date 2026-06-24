import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const { getSocialSignalsConfig } = await import("../src/lib/social-signals/config.ts");
  const { fetchXTrends } = await import("../src/services/trends/xService.ts");
  const { scrapeTikTokTrends } = await import("../src/services/trends/tiktokService.ts");
  const { fetchNewsTrends } = await import("../src/services/trends/newsService.ts");

  console.log("Config:", JSON.stringify(getSocialSignalsConfig(), null, 2));

  const tests = [
    ["X", fetchXTrends],
    ["TikTok", scrapeTikTokTrends],
    ["News", fetchNewsTrends],
  ];

  for (const [name, fn] of tests) {
    try {
      const r = await fn();
      console.log(`\nOK ${name}:`, r.trends.slice(0, 5), r.meta);
    } catch (e) {
      console.error(`\nFAIL ${name}:`, e instanceof Error ? e.message : e);
    }
  }
}

main();
