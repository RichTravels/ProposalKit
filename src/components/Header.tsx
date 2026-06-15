import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

const clerkAppearance = {
  layout: {
    unsafe_disableDevelopmentModeWarnings: true,
  },
};

export default function Header() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600">
            <span className="text-xl font-bold tracking-tight text-white">P</span>
          </div>
          <span className="text-xl font-bold tracking-tight">ProposalKit</span>
        </Link>

        <SignedIn>
          <nav className="hidden items-center gap-4 text-sm font-medium text-slate-600 sm:flex">
            <Link href="/dashboard" className="transition hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/proposal/generate" className="transition hover:text-slate-900">
              Proposal
            </Link>
            <Link href="/sow/generate" className="transition hover:text-slate-900">
              SOW
            </Link>
            <Link href="/brief/generate" className="transition hover:text-slate-900">
              Brief
            </Link>
          </nav>
        </SignedIn>
      </div>

      <div>
        <SignedOut>
          <SignInButton mode="modal">
            <button className="rounded-md bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <UserButton afterSignOutUrl="/" appearance={clerkAppearance} />
        </SignedIn>
      </div>
    </header>
  );
}
