import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600">
              <span className="text-xl font-bold tracking-tight text-white">P</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">ProposalKit</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      <section className="bg-slate-900 pb-28 pt-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-400">
            Built for solo consultants
          </div>
          <h1 className="mt-2 text-5xl font-bold leading-tight tracking-tight text-white lg:text-6xl">
            Client-ready documents<br className="hidden sm:block" /> in minutes, not days.
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-slate-300">
            Generate project proposals, statements of work, and post-discovery briefs
            from a few inputs — so you can spend less time writing and more time
            delivering.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-lg bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-500"
            >
              Start Free — 3 generations
            </Link>
            <a
              href="#features"
              className="rounded-lg border border-slate-600 px-8 py-4 text-base font-semibold text-slate-300 transition hover:border-slate-400 hover:text-white"
            >
              See how it works ↓
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="border-b border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Three documents. One workflow.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            From first conversation to signed engagement — ProposalKit covers the
            documents consultants write most often.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Project Proposal",
                description:
                  "Win the work with a clear executive summary, approach, deliverables, and investment.",
              },
              {
                title: "Statement of Work",
                description:
                  "Define scope, milestones, acceptance criteria, and payment terms in contract-ready language.",
              },
              {
                title: "Post-Discovery Brief",
                description:
                  "Capture findings, goals, risks, and next steps after a discovery call.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Simple stack. Low maintenance.</h2>
          <p className="mt-4 text-slate-600">
            Next.js, Clerk, Supabase, and Claude — the same proven architecture behind
            RecruitKit, tuned for independent consultants.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-block rounded-lg bg-indigo-600 px-8 py-4 text-base font-semibold text-white transition hover:bg-indigo-500"
          >
            Get started free
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600">
              <span className="text-sm font-bold text-white">P</span>
            </div>
            <span className="text-base font-bold text-slate-900">ProposalKit</span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} ProposalKit. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
