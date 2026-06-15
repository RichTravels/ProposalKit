"use client";

import { useTransition } from "react";
import type { DocumentType } from "@prisma/client";
import { deleteDocument } from "@/app/actions/deleteDocument";
import DocumentView from "@/components/DocumentView";
import Link from "next/link";
import { DOCUMENT_LABELS, DOCUMENT_PATHS } from "@/lib/utils";

type DocumentItem = {
  id: string;
  title: string;
  content: string;
  tone: string;
  createdAt: string;
};

type Props = {
  type: DocumentType;
  documents: DocumentItem[];
};

export default function DocumentLibrary({ type, documents }: Props) {
  const [isPending, startTransition] = useTransition();

  if (!documents.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <p className="text-slate-600">No saved documents yet.</p>
        <Link
          href={DOCUMENT_PATHS[type].generate}
          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Generate your first {DOCUMENT_LABELS[type].toLowerCase()} →
        </Link>
      </div>
    );
  }

  function handleDelete(documentId: string) {
    startTransition(async () => {
      await deleteDocument(documentId, type);
    });
  }

  return (
    <div className="space-y-6">
      {isPending ? (
        <p className="text-sm text-slate-500">Updating library...</p>
      ) : null}

      {documents.map((doc) => (
        <div key={doc.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Saved {doc.createdAt}</p>
            <button
              type="button"
              onClick={() => handleDelete(doc.id)}
              disabled={isPending}
              className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
          <DocumentView title={doc.title} content={doc.content} tone={doc.tone} />
        </div>
      ))}
    </div>
  );
}
