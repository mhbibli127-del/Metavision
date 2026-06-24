import { connectDb } from "@/lib/mongodb";
import { CustomerModel, docs } from "@/lib/models";
import { requireRestaurant } from "@/lib/db/session";

export type CustomerSegment = "champions" | "loyal" | "at_risk" | "new" | "dormant";

export type SegmentedCustomer = {
  id: string;
  name: string;
  phone: string;
  visits: number;
  totalSpent: number;
  segment: CustomerSegment;
  rfmScore: number;
  churnRisk: "low" | "medium" | "high";
};

function scoreRecency(lastVisit?: Date | string | null): number {
  if (!lastVisit) return 1;
  const days = (Date.now() - new Date(lastVisit).getTime()) / 86_400_000;
  if (days <= 14) return 5;
  if (days <= 30) return 4;
  if (days <= 60) return 3;
  if (days <= 90) return 2;
  return 1;
}

function scoreFrequency(visits: number): number {
  if (visits >= 20) return 5;
  if (visits >= 12) return 4;
  if (visits >= 6) return 3;
  if (visits >= 2) return 2;
  return 1;
}

function scoreMonetary(totalSpent: number): number {
  if (totalSpent >= 500) return 5;
  if (totalSpent >= 300) return 4;
  if (totalSpent >= 150) return 3;
  if (totalSpent >= 50) return 2;
  return 1;
}

function classifySegment(r: number, f: number, m: number): CustomerSegment {
  const avg = (r + f + m) / 3;
  if (r >= 4 && f >= 4 && m >= 4) return "champions";
  if (f >= 3 && m >= 3) return "loyal";
  if (r <= 2 && f >= 3) return "at_risk";
  if (f <= 2 && avg <= 2.5) return "new";
  return "dormant";
}

function churnRisk(r: number, f: number): "low" | "medium" | "high" {
  if (r <= 2 && f >= 3) return "high";
  if (r <= 3) return "medium";
  return "low";
}

export async function fetchCustomerSegments(): Promise<{
  customers: SegmentedCustomer[];
  summary: Record<CustomerSegment, number>;
}> {
  const restaurant = await requireRestaurant();
  await connectDb();

  const rows = docs(
    await CustomerModel.find({ restaurantId: restaurant.id }).sort({ totalSpent: -1 }).lean(),
  );

  const summary: Record<CustomerSegment, number> = {
    champions: 0,
    loyal: 0,
    at_risk: 0,
    new: 0,
    dormant: 0,
  };

  const customers = rows.map((c) => {
    const visits = Number(c.visits);
    const totalSpent = Number(c.totalSpent);
    const r = scoreRecency(c.lastVisit as Date | string | undefined);
    const f = scoreFrequency(visits);
    const m = scoreMonetary(totalSpent);
    const segment = classifySegment(r, f, m);
    summary[segment] += 1;
    return {
      id: c.id,
      name: String(c.name),
      phone: String(c.phone),
      visits,
      totalSpent,
      segment,
      rfmScore: r + f + m,
      churnRisk: churnRisk(r, f),
    };
  });

  return { customers, summary };
}
