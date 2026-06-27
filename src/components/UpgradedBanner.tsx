"use client";

import { useRouter } from "next/navigation";

export default function UpgradedBanner() {
  const router = useRouter();

  function dismiss() {
    router.replace("/dashboard");
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-indigo-500/40 bg-indigo-950/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-indigo-100">
        Welcome to ProposalKit Pro — you now have unlimited document generations.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 text-sm font-medium text-indigo-300 transition hover:text-white"
      >
        Dismiss
      </button>
    </div>
  );
}
