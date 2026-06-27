import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getRequiredEnv } from "@/lib/env";
import { getStripeId, getSubscriptionUserUpdate } from "@/lib/stripe-billing";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

async function findClerkIdFromCustomer(customerId: string): Promise<string | null> {
  const user = await db.user.findFirst({ where: { stripeCustomerId: customerId } });
  if (user) return user.clerkId;

  const customer = await getStripe().customers.retrieve(customerId);
  if ("deleted" in customer && customer.deleted) return null;
  return (customer as Stripe.Customer).metadata?.clerkId ?? null;
}

async function updateUserFromSubscription(
  clerkId: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = getStripeId(subscription.customer);
  const update = getSubscriptionUserUpdate(subscription);

  await db.user.update({
    where: { clerkId },
    data: {
      ...update,
      stripeSubscriptionId: subscription.id,
      ...(customerId ? { stripeCustomerId: customerId } : {}),
    },
  });
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

  const alreadyProcessed = await db.stripeWebhookEvent.findUnique({
    where: { eventId: event.id },
  });

  if (alreadyProcessed) {
    return new Response("OK", { status: 200 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId;
        const customerId = getStripeId(session.customer);
        const subscriptionId = getStripeId(session.subscription);

        if (clerkId) {
          await db.user.update({
            where: { clerkId },
            data: {
              isPro: true,
              subscriptionStatus: "active",
              generationQuota: 999999,
              ...(customerId ? { stripeCustomerId: customerId } : {}),
              ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
            },
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const clerkId =
          subscription.metadata?.clerkId ??
          (await findClerkIdFromCustomer(getStripeId(subscription.customer) ?? ""));

        if (clerkId) {
          await updateUserFromSubscription(clerkId, subscription);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = getStripeId(subscription.customer);
        const clerkId =
          subscription.metadata?.clerkId ??
          (customerId ? await findClerkIdFromCustomer(customerId) : null);

        if (clerkId) {
          await db.user.update({
            where: { clerkId },
            data: {
              isPro: false,
              subscriptionStatus: "inactive",
              generationQuota: 3,
              stripeSubscriptionId: null,
            },
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = getStripeId(invoice.customer);

        if (!customerId) break;

        const clerkId = await findClerkIdFromCustomer(customerId);
        if (clerkId) {
          await db.user.update({
            where: { clerkId },
            data: { subscriptionStatus: "past_due" },
          });
        }
        break;
      }
    }

    await db.stripeWebhookEvent.create({ data: { eventId: event.id } });

    return new Response("OK", { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
