import { connectDb } from "@/lib/mongodb";
import { SubscriptionModel } from "@/lib/models";
import { getDbUser } from "@/lib/db/session";
import { writeAuditLog } from "@/lib/enterprise/audit";
import type { SubscriptionPlan } from "@/data/subscription";

export async function updateUserSubscription(
  plan: SubscriptionPlan,
  billingCycle: "monthly" | "yearly",
  audit: { userId: string; restaurantId: string; organizationId?: string; branchId?: string; ip?: string },
) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  await connectDb();
  const now = new Date();
  const end = new Date(now);
  if (billingCycle === "monthly") {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }

  await SubscriptionModel.findOneAndUpdate(
    { userId: user.id },
    {
      $set: {
        plan: plan.toUpperCase(),
        status: "ACTIVE",
        startDate: now,
        endDate: end,
        autoRenew: true,
      },
      $setOnInsert: { userId: user.id },
    },
    { upsert: true },
  );

  await writeAuditLog({
    ...audit,
    action: "UPDATE",
    entity: "subscription",
    entityId: plan,
    summary: `Plan → ${plan} (${billingCycle})`,
  });

  return { plan, billingCycle, status: "active" };
}
