import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ClipboardList, FileText, Search } from "lucide-react";
import UpgradeButton from "@/components/UpgradeButton";

const documentTypes = [
  {
    title: "Project Proposal",
    description:
      "Win the work with a clear executive summary, approach, deliverables, and investment.",
    icon: FileText,
  },
  {
    title: "Statement of Work",
    description:
      "Define scope, milestones, acceptance criteria, and payment terms in contract-ready language.",
    icon: ClipboardList,
  },
  {
    title: "Post-Discovery Brief",
    description:
      "Capture findings, goals, risks, and next steps after a discovery call.",
    icon: Search,
  },
];

const steps = [
  {
    number: "1",
    title: "Fill in the basics",
    description:
      "Client name, project type, budget, timeline. Two minutes, maybe less.",
  },
  {
    number: "2",
    title: "AI writes the document",
    description:
      "Not a template with blanks. A real document structured the way consultants actually write them.",
  },
  {
    number: "3",
    title: "Send it. Win the work.",
    description:
      "Copy it, paste it, send it. Your client gets a proposal. You get your evening back.",
  },
];

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 bg-slate-950">
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

      {/* Hero */}
      <section className="bg-slate-950 pb-28 pt-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-1.5 text-xs font-medium text-slate-400">
            Built for solo consultants
          </div>
          <h1 className="mt-2 text-5xl font-bold leading-tight tracking-tight text-white lg:text-6xl">
            Client-ready documents
            <br className="hidden sm:block" /> in minutes, not days.
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-slate-300">
            You do the discovery. We write the paperwork. Proposals, SOWs, and
            post-discovery briefs — ready before the call ends.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-lg bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-500"
            >
              Start Free — 3 generations
            </Link>
            <a
              href="#how-it-works"
              className="rounded-lg border border-slate-600 px-8 py-4 text-base font-semibold text-slate-300 transition hover:border-slate-400 hover:text-white"
            >
              See how it works ↓
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Solo consultants use ProposalKit to send proposals the same day — not three
            days later.
          </p>
        </div>
      </section>

      {/* Document types */}
      <section id="features" className="border-y border-slate-800 bg-slate-900 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold text-white">
            Three documents. One workflow.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-400">
            From first conversation to signed engagement — ProposalKit covers the
            documents consultants write most often.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {documentTypes.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-slate-700 bg-slate-950 p-6 transition hover:border-indigo-500/50 hover:bg-slate-900"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-indigo-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-slate-950 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold text-white">
            Three inputs. One document. Done.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-400">
            No templates to fight. No formatting rabbit holes. Just fill in what you
            know and get a document worth sending.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-xl border border-slate-800 bg-slate-900 p-6"
              >
                <p className="text-4xl font-bold text-indigo-500">{step.number}</p>
                <h3 className="mt-4 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-slate-800 bg-slate-900 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-3xl font-bold text-white">
            One price. Unlimited proposals.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-400">
            Start free. Upgrade when it pays for itself — which is usually after the
            first proposal.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-950 p-8">
              <p className="text-sm font-medium uppercase tracking-wide text-slate-400">
                Free
              </p>
              <p className="mt-4 text-4xl font-bold text-white">$0</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li>3 document generations</li>
                <li>All 3 document types</li>
                <li>No credit card required</li>
              </ul>
              <Link
                href="/sign-up"
                className="mt-8 block w-full rounded-lg border border-slate-600 py-3 text-center text-sm font-semibold text-white transition hover:border-slate-400 hover:bg-slate-900"
              >
                Start Free
              </Link>
            </div>

            <div className="relative rounded-xl border-2 border-indigo-500 bg-slate-950 p-8 shadow-lg shadow-indigo-900/20 md:-translate-y-1">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                Most Popular
              </span>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-400">
                Pro
              </p>
              <p className="mt-4 text-4xl font-bold text-white">
                $29{" "}
                <span className="text-lg font-normal text-slate-400">/ month</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li>Unlimited generations</li>
                <li>All 3 document types</li>
                <li>Priority support</li>
              </ul>
              <div className="mt-8">
                <UpgradeButton
                  label="Upgrade to Pro"
                  className="w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:bg-slate-600"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-950 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-bold text-white">
            Your next proposal is already late.
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Start writing it now — free, no card required.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-block rounded-lg bg-indigo-600 px-8 py-4 text-base font-semibold text-white transition hover:bg-indigo-500"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-slate-500">
            © 2025 ProposalKit. Built for independent consultants.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="transition hover:text-slate-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-slate-300">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
