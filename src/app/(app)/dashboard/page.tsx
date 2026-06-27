export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth, clerkClient } from "@clerk/nextjs/server";
import DeleteDocumentButton from "@/components/DeleteDocumentButton";
import ManageBillingButton from "@/components/ManageBillingButton";
import UpgradedBanner from "@/components/UpgradedBanner";
import UpgradeButton from "@/components/UpgradeButton";
import { db, ensureUser } from "@/lib/db";
import {
  DOCUMENT_BADGE_LABELS,
  DOCUMENT_BADGE_STYLES,
  DOCUMENT_LABELS,
  DOCUMENT_PATHS,
  formatDocumentDate,
} from "@/lib/utils";
import type { DocumentType } from "@prisma/client";

const DOC_TYPES: DocumentType[] = ["PROPOSAL", "SOW", "BRIEF"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { upgraded?: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-3xl font-bold text-white">Welcome to ProposalKit</h1>
        <p className="mt-2 text-slate-400">Please sign in to start generating documents.</p>
      </div>
    );
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  await ensureUser(userId, clerkUser.emailAddresses[0].emailAddress);

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const documents = user?.documents ?? [];
  const isPro = user?.isPro ?? false;
  const quotaRemaining = user?.generationQuota ?? 0;
  const subscriptionStatus = user?.subscriptionStatus ?? "inactive";
  const showUpgradedBanner = searchParams.upgraded === "true";

  return (
    <div className="space-y-10">
      {showUpgradedBanner ? <UpgradedBanner /> : null}

      {isPro && subscriptionStatus === "past_due" ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-5 py-4">
          <p className="text-sm text-amber-100">
            Your latest payment failed. Update your billing details to keep Pro access.
          </p>
          <div className="mt-3">
            <ManageBillingButton
              label="Update payment method"
              className="rounded-md border border-amber-500/50 px-3 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-400 hover:text-white disabled:opacity-50"
            />
          </div>
        </div>
      ) : null}

      <section>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="mt-2 text-slate-400">
          {isPro ? (
            <span className="font-medium text-indigo-400">
              Unlimited generations — Pro Plan
            </span>
          ) : (
            <span className="font-medium text-slate-300">
              {quotaRemaining} generation{quotaRemaining === 1 ? "" : "s"} remaining
            </span>
          )}
        </p>
        {!isPro && quotaRemaining === 0 ? (
          <div className="mt-4">
            <UpgradeButton
              label="Upgrade to Pro"
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:bg-slate-600"
            />
          </div>
        ) : isPro ? (
          <div className="mt-4">
            <ManageBillingButton
              label="Manage subscription"
              className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
            />
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {DOC_TYPES.map((type) => (
          <div
            key={type}
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            <h2 className="text-lg font-semibold text-white">{DOCUMENT_LABELS[type]}</h2>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={DOCUMENT_PATHS[type].generate}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Generate
              </Link>
              <Link
                href={DOCUMENT_PATHS[type].library}
                className="rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                View library
              </Link>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white">Document history</h2>

        {documents.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-900 px-6 py-16 text-center">
            <p className="text-slate-400">
              No documents yet. Generate your first proposal to get started.
            </p>
            <Link
              href="/proposal/generate"
              className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Generate a Document
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">{doc.title}</p>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${DOCUMENT_BADGE_STYLES[doc.type]}`}
                    >
                      {DOCUMENT_BADGE_LABELS[doc.type]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {formatDocumentDate(new Date(doc.createdAt))}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/dashboard/${doc.id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-indigo-500 hover:text-white"
                  >
                    View
                  </Link>
                  <DeleteDocumentButton documentId={doc.id} type={doc.type} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
