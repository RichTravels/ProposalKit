"use client";

import { useTransition } from "react";
import type { DocumentType } from "@prisma/client";
import { deleteDocument } from "@/app/actions/deleteDocument";

type Props = {
  documentId: string;
  type: DocumentType;
};

export default function DeleteDocumentButton({ documentId, type }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;

    startTransition(async () => {
      await deleteDocument(documentId, type);
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-red-400 transition hover:border-red-500 hover:text-red-300 disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
