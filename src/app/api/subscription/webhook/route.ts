import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { connectDb } from "@/lib/mongodb";
import { SubscriptionModel } from "@/lib/models";
import { getPrisma } from "@/lib/prisma-client";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    const raw = await request.text();
    event = stripe.webhooks.constructEvent(raw, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      metadata?: { userId?: string; plan?: string; billingCycle?: string };
      customer?: string;
      subscription?: string;
    };
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan ?? "standard";
    const billingCycle = session.metadata?.billingCycle ?? "monthly";
    if (userId) {
      const now = new Date();
      const end = new Date(now);
      if (billingCycle === "monthly") end.setMonth(end.getMonth() + 1);
      else end.setFullYear(end.getFullYear() + 1);

      await connectDb();
      await SubscriptionModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            plan: plan.toUpperCase(),
            status: "ACTIVE",
            startDate: now,
            endDate: end,
            autoRenew: true,
            stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
            stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
          },
          $setOnInsert: { userId },
        },
        { upsert: true },
      );

      const prisma = await getPrisma();
      if (prisma) {
        try {
          await prisma.subscription.upsert({
            where: { userId },
            update: {
              plan: plan.toUpperCase(),
              status: "ACTIVE",
              startDate: now,
              endDate: end,
              autoRenew: true,
              stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
              stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
            },
            create: {
              userId,
              plan: plan.toUpperCase(),
              status: "ACTIVE",
              startDate: now,
              endDate: end,
              autoRenew: true,
              stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
              stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
            },
          });
        } catch {
          /* optional mirror */
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
