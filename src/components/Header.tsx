"use client";

import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import UpgradeButton from "@/components/UpgradeButton";

const clerkAppearance = {
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
};

type HeaderProps = {
  isPro?: boolean;
};

export default function Header({ isPro = false }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600">
            <span className="text-xl font-bold tracking-tight text-white">P</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">ProposalKit</span>
        </Link>

        <SignedIn>
          <nav className="hidden items-center gap-4 text-sm font-medium text-slate-400 sm:flex">
            <Link href="/dashboard" className="transition hover:text-white">
              Dashboard
            </Link>
            <Link href="/proposal/generate" className="transition hover:text-white">
              Proposal
            </Link>
            <Link href="/sow/generate" className="transition hover:text-white">
              SOW
            </Link>
            <Link href="/brief/generate" className="transition hover:text-white">
              Brief
            </Link>
          </nav>
        </SignedIn>
      </div>

      <div className="flex items-center gap-3">
        <SignedIn>
          {!isPro ? (
            <UpgradeButton
              label="Upgrade to Pro"
              className="hidden rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:bg-slate-600 sm:inline-block"
            />
          ) : null}
          <UserButton afterSignOutUrl="/" appearance={clerkAppearance} />
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="rounded-md bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-500">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </header>
  );
}
