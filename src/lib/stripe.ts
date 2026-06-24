import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

const PLAN_AMOUNTS: Record<string, { monthly: number; yearly: number }> = {
  standard: { monthly: 49, yearly: 490 },
  gold: { monthly: 99, yearly: 990 },
  enterprise: { monthly: 199, yearly: 1990 },
};

export function getPlanAmountCents(plan: string, cycle: "monthly" | "yearly"): number {
  const p = PLAN_AMOUNTS[plan.toLowerCase()];
  if (!p) return 0;
  return (cycle === "monthly" ? p.monthly : p.yearly) * 100;
}
