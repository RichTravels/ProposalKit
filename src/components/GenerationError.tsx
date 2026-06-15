"use client";

import UpgradeButton from "@/components/UpgradeButton";

type GenerationErrorProps = {
  message: string;
};

function isQuotaError(message: string): boolean {
  return /quota|upgrade|free generations/i.test(message);
}

export function GenerationError({ message }: GenerationErrorProps) {
  if (isQuotaError(message)) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center shadow-sm">
        <h3 className="text-xl font-bold text-slate-900">
          You&apos;ve used your 3 free generations.
        </h3>
        <p className="mt-2 text-slate-600">
          Upgrade to ProposalKit Pro for unlimited document generation.
        </p>
        <div className="mt-6 flex justify-center">
          <UpgradeButton />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}
