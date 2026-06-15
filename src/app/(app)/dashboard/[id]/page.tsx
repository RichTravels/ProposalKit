export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import DocumentView from "@/components/DocumentView";
import { db } from "@/lib/db";
import {
  DOCUMENT_BADGE_LABELS,
  DOCUMENT_BADGE_STYLES,
  formatDocumentDate,
} from "@/lib/utils";

type Props = {
  params: { id: string };
};

export default async function DashboardDocumentPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) notFound();

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (!user) notFound();

  const document = await db.document.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!document) notFound();

  return (
    <div className="space-y-6 rounded-xl bg-slate-950 p-6 sm:p-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to documents
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${DOCUMENT_BADGE_STYLES[document.type]}`}
        >
          {DOCUMENT_BADGE_LABELS[document.type]}
        </span>
        <span className="text-sm text-slate-500">
          {formatDocumentDate(new Date(document.createdAt))}
        </span>
      </div>

      <DocumentView
        title={document.title}
        content={document.content}
        tone={document.tone}
        theme="dark"
      />
    </div>
  );
}
