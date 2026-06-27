"use client";

export async function startCheckout(): Promise<void> {
  const response = await fetch("/api/stripe/checkout", { method: "POST" });
  const data = (await response.json()) as { url?: string; error?: string };

  if (!response.ok || !data.url) {
    throw new Error(data.error ?? "Unable to start checkout");
  }

  window.location.href = data.url;
}

export async function openBillingPortal(): Promise<void> {
  const response = await fetch("/api/stripe/portal", { method: "POST" });
  const data = (await response.json()) as { url?: string; error?: string };

  if (!response.ok || !data.url) {
    throw new Error(data.error ?? "Unable to open billing portal");
  }

  window.location.href = data.url;
}
