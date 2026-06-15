import type { DocumentType } from "@prisma/client";
import { auth, clerkClient } from "@clerk/nextjs/server";
import GenerateDocumentForm from "@/components/GenerateDocumentForm";
import DocumentLibrary from "@/components/DocumentLibrary";
import { db, ensureUser } from "@/lib/db";
import { DOCUMENT_LABELS } from "@/lib/utils";

type Props = {
  type: DocumentType;
};

export async function DocumentGeneratePage({ type }: Props) {
  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Please sign in to generate documents.</p>
      </div>
    );
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  await ensureUser(userId, clerkUser.emailAddresses[0].emailAddress);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {DOCUMENT_LABELS[type]}
        </h1>
        <p className="text-slate-500">
          Fill in the client context below and generate a polished first draft.
        </p>
      </section>

      <GenerateDocumentForm type={type} />
    </div>
  );
}

export async function DocumentLibraryPage({ type }: Props) {
  const { userId } = await auth();
  if (!userId) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Please sign in to view your library.</p>
      </div>
    );
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      documents: {
        where: { type },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const documents =
    user?.documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      tone: doc.tone,
      createdAt: new Date(doc.createdAt).toLocaleDateString(),
    })) ?? [];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {DOCUMENT_LABELS[type]} Library
        </h1>
        <p className="text-slate-500">Your saved {DOCUMENT_LABELS[type].toLowerCase()}s.</p>
      </section>

      <DocumentLibrary type={type} documents={documents} />
    </div>
  );
}
