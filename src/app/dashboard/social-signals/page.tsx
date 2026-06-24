import type { Metadata } from "next";
import SocialSignalsView from "@/components/dashboard/SocialSignalsView";

export const metadata: Metadata = {
  title: "Social Signals — Metavision",
  description: "Live trends from X, TikTok, Google and news via RapidAPI.",
};

export default function SocialSignalsPage() {
  return <SocialSignalsView />;
}
