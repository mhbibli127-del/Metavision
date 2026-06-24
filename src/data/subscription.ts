export type SubscriptionPlan = "trial" | "standard" | "gold" | "enterprise";

export interface SubscriptionFeature {
  name: string;
  included: boolean;
  limit?: number;
}

export interface SubscriptionPricing {
  plan: SubscriptionPlan;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: SubscriptionFeature[];
  popular?: boolean;
}

export const subscriptionPricings: SubscriptionPricing[] = [
  {
    plan: "trial",
    name: "Trial",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { name: "Basic menu management", included: true },
      { name: "Order tracking", included: true },
      { name: "Reservation system", included: true },
      { name: "TasteMind AI insights", included: false },
      { name: "Advanced analytics", included: false },
      { name: "API access", included: false },
      { name: "Priority support", included: false },
    ],
  },
  {
    plan: "standard",
    name: "Standard",
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      { name: "Basic menu management", included: true },
      { name: "Order tracking", included: true },
      { name: "Reservation system", included: true },
      { name: "TasteMind AI insights", included: true },
      { name: "Advanced analytics", included: true, limit: 100 },
      { name: "API access", included: true, limit: 1000 },
      { name: "Priority support", included: false },
    ],
  },
  {
    plan: "gold",
    name: "Gold",
    monthlyPrice: 99,
    yearlyPrice: 990,
    popular: true,
    features: [
      { name: "Basic menu management", included: true },
      { name: "Order tracking", included: true },
      { name: "Reservation system", included: true },
      { name: "TasteMind AI insights", included: true },
      { name: "Advanced analytics", included: true, limit: 1000 },
      { name: "API access", included: true, limit: 10000 },
      { name: "Priority support", included: true },
    ],
  },
  {
    plan: "enterprise",
    name: "Enterprise",
    monthlyPrice: 249,
    yearlyPrice: 2490,
    features: [
      { name: "Basic menu management", included: true },
      { name: "Order tracking", included: true },
      { name: "Reservation system", included: true },
      { name: "TasteMind AI insights", included: true },
      { name: "Advanced analytics", included: true },
      { name: "API access", included: true },
      { name: "Priority support", included: true },
      { name: "Custom integrations", included: true },
      { name: "Dedicated account manager", included: true },
    ],
  },
];

export function getPlanByPlan(plan: SubscriptionPlan): SubscriptionPricing | undefined {
  return subscriptionPricings.find((p) => p.plan === plan);
}
