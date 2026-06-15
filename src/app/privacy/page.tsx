import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function LegalNav() {
  return (
    <nav className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600">
            <span className="text-xl font-bold tracking-tight text-white">P</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">ProposalKit</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </nav>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <LegalNav />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Effective date: June 2025</p>

        <div className="mt-10 space-y-10 text-base leading-relaxed">
          <section>
            <p>
              ProposalKit is operated as a solo business providing AI-assisted document
              generation for independent consultants. This Privacy Policy explains what
              information we collect, how we use it, and your rights regarding your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">What information we collect</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong className="font-medium text-slate-200">Account information</strong>{" "}
                — When you sign up, we collect your name and email address through Clerk,
                our authentication provider.
              </li>
              <li>
                <strong className="font-medium text-slate-200">Document content</strong> — The
                client names, project summaries, and other inputs you provide, plus the
                AI-generated documents we create and store on your behalf.
              </li>
              <li>
                <strong className="font-medium text-slate-200">Payment information</strong> —
                If you subscribe to ProposalKit Pro, payment details are collected and
                processed by Stripe. We do not store your full credit card number on our
                servers.
              </li>
              <li>
                <strong className="font-medium text-slate-200">Usage data</strong> — Basic
                technical information such as browser type and pages visited, collected
                automatically to keep the service running reliably.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">How we use your information</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>To provide, operate, and maintain the ProposalKit service</li>
              <li>To process your subscription payments through Stripe</li>
              <li>To store and retrieve your generated documents</li>
              <li>To communicate with you about your account or the service</li>
              <li>To improve the product based on how the service is used</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">What we don&apos;t do</h2>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>We do not sell your personal data to anyone</li>
              <li>
                We do not share your data with third parties for marketing or advertising
                purposes
              </li>
              <li>
                We only share data with service providers required to operate ProposalKit:
                Clerk (authentication), Stripe (payments), Supabase (database hosting), and
                Anthropic (AI document generation). Each provider processes data only as
                needed to deliver the service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Data retention</h2>
            <p className="mt-4">
              Your generated documents and account data are stored for as long as your
              account is active. If you delete your account or request deletion, we will
              remove your personal data and stored documents within a reasonable timeframe,
              except where we are required to retain information by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Your rights</h2>
            <p className="mt-4">
              You may request access to, correction of, or deletion of your personal data
              at any time by emailing us at{" "}
              <a
                href="mailto:contact@proposalkit.com"
                className="text-indigo-400 transition hover:text-indigo-300"
              >
                contact@proposalkit.com
              </a>
              . We will respond to verified requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Contact</h2>
            <p className="mt-4">
              If you have questions about this Privacy Policy, contact us at{" "}
              <a
                href="mailto:contact@proposalkit.com"
                className="text-indigo-400 transition hover:text-indigo-300"
              >
                contact@proposalkit.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-slate-500">
            © 2025 ProposalKit. Built for independent consultants.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="text-slate-300">
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
