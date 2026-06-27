import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRequiredEnv } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

function getAppBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://proposal-kit-rose.vercel.app";
}

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? user.email;

    const stripe = getStripe();
    let customerId = user.stripeCustomerId;

    if (customerId) {
      await stripe.customers.update(customerId, {
        metadata: { clerkId: userId },
      });
    } else {
      const existingCustomers = await stripe.customers.list({ email, limit: 1 });
      const customer =
        existingCustomers.data[0] ??
        (await stripe.customers.create({
          email,
          metadata: { clerkId: userId },
        }));

      customerId = customer.id;

      if (!customer.metadata.clerkId) {
        await stripe.customers.update(customerId, {
          metadata: { clerkId: userId },
        });
      }

      await db.user.update({
        where: { clerkId: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const priceId = getRequiredEnv("STRIPE_PRICE_ID");
    const baseUrl = getAppBaseUrl();

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?upgraded=true`,
      cancel_url: `${baseUrl}/dashboard`,
      metadata: { clerkId: userId },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
