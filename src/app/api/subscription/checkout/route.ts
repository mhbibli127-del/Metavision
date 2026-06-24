import { NextResponse } from "next/server";
import { getStripe, getPlanAmountCents } from "@/lib/stripe";
import { requireAccess } from "@/lib/api/access";
import { getDbUser } from "@/lib/db/session";
import { z } from "zod";

const schema = z.object({
  plan: z.enum(["standard", "gold", "enterprise"]),
  billingCycle: z.enum(["monthly", "yearly"]),
});

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured", useDirect: true }, { status: 503 });
    }

    const access = await requireAccess("restaurant:write");
    const user = await getDbUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { plan, billingCycle } = parsed.data;
    const amount = getPlanAmountCents(plan, billingCycle);
    if (amount <= 0) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount,
            recurring: { interval: billingCycle === "monthly" ? "month" : "year" },
            product_data: { name: `Metavision ${plan} (${billingCycle})` },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: access.userId,
        restaurantId: access.restaurantId,
        plan,
        billingCycle,
      },
      success_url: `${appUrl}/dashboard/subscription?success=1`,
      cancel_url: `${appUrl}/dashboard/subscription?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
