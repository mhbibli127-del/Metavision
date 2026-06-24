const appId = process.env.META_APP_ID ?? "";
const appSecret = process.env.META_APP_SECRET ?? "";
const token = process.env.META_ACCESS_TOKEN ?? "";
const adAccount = process.env.META_AD_ACCOUNT_ID ?? "";
const redirect =
  process.env.META_REDIRECT_URI ??
  `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/meta-ads/callback`;

console.log("Meta Ads konfiqurasiya:\n");
console.log("  OAuth:", appId && appSecret ? "OK" : "YOX");
console.log("  System token:", token && adAccount ? "OK" : "YOX");
console.log("  Redirect:", redirect);
console.log("\nHazır:", (appId && appSecret) || (token && adAccount) ? "BƏLİ" : "XEYR");
