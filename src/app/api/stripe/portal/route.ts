import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? user.email;

      const stripe = getStripe();
      const existingCustomers = await stripe.customers.list({ email, limit: 1 });
      const customer =
        existingCustomers.data[0] ??
        (await stripe.customers.create({
          email,
          metadata: { clerkId: userId },
        }));

      customerId = customer.id;

      await db.user.update({
        where: { clerkId: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppBaseUrl()}/dashboard`,
    });

    if (!portalSession.url) {
      return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
    }

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Portal session failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
