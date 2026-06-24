import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/api/access";
import { updateUserSubscription } from "@/lib/db/subscription";
import { fetchSubscription } from "@/lib/db/intelligence";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["trial", "standard", "gold", "enterprise"]),
  billingCycle: z.enum(["monthly", "yearly"]),
});

export async function GET() {
  try {
    const data = await fetchSubscription();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireAccess("restaurant:write");
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const result = await updateUserSubscription(parsed.data.plan, parsed.data.billingCycle, {
      userId: access.userId,
      restaurantId: access.restaurantId,
      organizationId: access.organizationId,
      branchId: access.branchId,
      ip: access.ip,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
