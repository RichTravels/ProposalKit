import type Stripe from "stripe";

const PRO_STATUSES = new Set<Stripe.Subscription.Status>(["active", "trialing"]);
const INACTIVE_STATUSES = new Set<Stripe.Subscription.Status>([
  "canceled",
  "unpaid",
  "incomplete_expired",
]);

export type SubscriptionUserUpdate = {
  isPro: boolean;
  subscriptionStatus: string;
  generationQuota: number;
};

export function getSubscriptionUserUpdate(
  subscription: Stripe.Subscription
): SubscriptionUserUpdate {
  const status = subscription.status;

  if (PRO_STATUSES.has(status) || status === "past_due") {
    return {
      isPro: true,
      subscriptionStatus: status,
      generationQuota: 999999,
    };
  }

  if (INACTIVE_STATUSES.has(status)) {
    return {
      isPro: false,
      subscriptionStatus: status,
      generationQuota: 3,
    };
  }

  return {
    isPro: false,
    subscriptionStatus: status,
    generationQuota: 3,
  };
}

export function getStripeId(
  value: string | Stripe.Customer | Stripe.DeletedCustomer | Stripe.Subscription | null
): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if ("id" in value) return value.id;
  return null;
}
