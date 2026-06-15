"use client";

import { useState } from "react";
import { startCheckout } from "@/lib/billing-client";

type UpgradeButtonProps = {
  label?: string;
  className?: string;
};

export default function UpgradeButton({
  label = "Upgrade to Pro — $29/month",
  className = "rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:bg-gray-400",
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);

    try {
      await startCheckout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout");
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleUpgrade} disabled={loading} className={className}>
        {loading ? "Redirecting..." : label}
      </button>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
