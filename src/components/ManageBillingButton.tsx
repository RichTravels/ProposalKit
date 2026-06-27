"use client";

import { useState } from "react";
import { openBillingPortal } from "@/lib/billing-client";

type ManageBillingButtonProps = {
  label?: string;
  className?: string;
};

export default function ManageBillingButton({
  label = "Manage billing",
  className = "hidden rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white disabled:opacity-50 sm:inline-block",
}: ManageBillingButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      await openBillingPortal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open billing portal");
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={loading} className={className}>
        {loading ? "Opening..." : label}
      </button>
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
