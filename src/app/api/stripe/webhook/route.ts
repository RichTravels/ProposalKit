import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getRequiredEnv } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

async function findClerkIdFromCustomer(customerId: string): Promise<string | null> {
  const customer = await getStripe().customers.retrieve(customerId);
  if ("deleted" in customer && customer.deleted) return null;
  return (customer as Stripe.Customer).metadata?.clerkId ?? null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      getRequiredEnv("STRIPE_WEBHOOK_SECRET")
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId;

        if (clerkId) {
          await db.user.update({
            where: { clerkId },
            data: {
              isPro: true,
              subscriptionStatus: "active",
              generationQuota: 999999,
            },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;

        if (!customerId) break;

        const clerkId = await findClerkIdFromCustomer(customerId);
        if (clerkId) {
          await db.user.update({
            where: { clerkId },
            data: {
              isPro: false,
              subscriptionStatus: "inactive",
              generationQuota: 3,
            },
          });
        }
        break;
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
