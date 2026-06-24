import axios from "axios";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });

const key = process.env.RAPIDAPI_KEY;
if (!key) {
  console.error("RAPIDAPI_KEY missing");
  process.exit(1);
}

const hosts = [
  process.env.RAPIDAPI_TIKTOK_HOST,
  "tiktok-scraper7.p.rapidapi.com",
  "tiktok-api23.p.rapidapi.com",
  "twitter154.p.rapidapi.com",
  "twitter-api45.p.rapidapi.com",
  "twitter135.p.rapidapi.com",
  "twitter-api-v2.p.rapidapi.com",
  "real-time-news-data.p.rapidapi.com",
  "google-news13.p.rapidapi.com",
].filter(Boolean);

const paths = ["/trending/hashtag", "/trends/", "/trends", "/search/search?query=food", "/top-headlines?country=az"];

async function probe(host, path) {
  try {
    const res = await axios.get(`https://${host}${path}`, {
      timeout: 10_000,
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": host },
      validateStatus: () => true,
    });
    const ok = res.status >= 200 && res.status < 300;
    const preview = JSON.stringify(res.data).slice(0, 120);
    console.log(`${ok ? "OK" : "FAIL"} ${res.status} ${host}${path} → ${preview}`);
    return ok;
  } catch (e) {
    console.log(`ERR ${host}${path} → ${e instanceof Error ? e.message : e}`);
    return false;
  }
}

async function main() {
  for (const host of hosts) {
    for (const path of paths) {
      await probe(host, path);
    }
  }
}

main();
