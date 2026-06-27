"use client";

import { useEffect, useRef, useState } from "react";
import { startCheckout } from "@/lib/billing-client";

export default function UpgradeCheckout() {
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    startCheckout().catch((err) => {
      setError(err instanceof Error ? err.message : "Unable to start checkout");
    });
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-red-800 bg-red-950/50 p-6 text-center">
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="py-20 text-center">
      <p className="text-lg text-slate-300">Redirecting to secure checkout...</p>
    </div>
  );
}
