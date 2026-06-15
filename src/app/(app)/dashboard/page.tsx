export const dynamic = "force-dynamic";

import Link from "next/link";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db, ensureUser } from "@/lib/db";
import { DOCUMENT_LABELS, DOCUMENT_PATHS } from "@/lib/utils";
import type { DocumentType } from "@prisma/client";

const DOC_TYPES: DocumentType[] = ["PROPOSAL", "SOW", "BRIEF"];

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-3xl font-bold">Welcome to ProposalKit</h1>
        <p className="mt-2 text-gray-500">Please sign in to start generating documents.</p>
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
        take: 5,
      },
    },
  });

  const quota = user?.isPro ? "Unlimited" : String(user?.generationQuota ?? 0);

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500">
          Generate client-ready documents in seconds.{" "}
          {!user?.isPro ? (
            <span className="font-medium text-slate-700">{quota} free generations remaining.</span>
          ) : (
            <span className="font-medium text-indigo-600">Pro plan active.</span>
          )}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {DOC_TYPES.map((type) => (
          <div
            key={type}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">{DOCUMENT_LABELS[type]}</h2>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={DOCUMENT_PATHS[type].generate}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Generate
              </Link>
              <Link
                href={DOCUMENT_PATHS[type].library}
                className="rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                View library
              </Link>
            </div>
          </div>
        ))}
      </section>

      {user?.documents.length ? (
        <section>
          <h2 className="text-xl font-semibold text-slate-900">Recent documents</h2>
          <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {user.documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{doc.title}</p>
                  <p className="text-sm text-slate-500">
                    {DOCUMENT_LABELS[doc.type]} ·{" "}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  href={DOCUMENT_PATHS[doc.type].library}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
