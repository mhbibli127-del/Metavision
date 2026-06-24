export type IntegrationProvider = {
  id: string;
  name: string;
  category: "pos" | "delivery" | "payments";
  description: string;
  status: "connected" | "available" | "coming_soon";
  logo: string;
};

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  {
    id: "square",
    name: "Square",
    category: "pos",
    description: "Sync orders, menu and payments from Square POS.",
    status: "available",
    logo: "⬛",
  },
  {
    id: "toast",
    name: "Toast",
    category: "pos",
    description: "Import sales data and menu performance from Toast.",
    status: "available",
    logo: "🍞",
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "payments",
    description: "Payment analytics and subscription billing.",
    status: "connected",
    logo: "💳",
  },
  {
    id: "wolt",
    name: "Wolt",
    category: "delivery",
    description: "Delivery demand signals and commission tracking.",
    status: "coming_soon",
    logo: "🛵",
  },
];
