import "dotenv/config";
import { refreshAllTrends } from "../src/services/trends/trendsService";

refreshAllTrends()
  .then((data) => {
    console.log(JSON.stringify({ ok: true, updatedAt: data.updatedAt, hashtags: data.hashtags.length }, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
