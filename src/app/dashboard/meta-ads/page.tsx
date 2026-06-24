import { redirect } from "next/navigation";

/** Meta Ads deaktiv — sosial siqnallara yönləndir */
export default function MetaAdsRedirectPage() {
  redirect("/dashboard/social-signals");
}
