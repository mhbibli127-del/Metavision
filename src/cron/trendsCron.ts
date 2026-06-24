import cron from "node-cron";
import { refreshAllTrends } from "@/services/trends/trendsService";

let started = false;

export function startTrendsCron(): void {
  if (started) return;
  if (process.env.TRENDS_CRON_ENABLED === "false") return;

  started = true;

  cron.schedule("*/10 * * * *", async () => {
    try {
      await refreshAllTrends();
    } catch {
      /* cron must not crash process */
    }
  });

  void refreshAllTrends().catch(() => {
    /* initial warm-up */
  });
}
