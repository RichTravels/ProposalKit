"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { DocumentType } from "@prisma/client";
import { db } from "@/lib/db";
import { DOCUMENT_PATHS } from "@/lib/utils";

export async function deleteDocument(documentId: string, type: DocumentType) {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return { error: "User not found" };

  const doc = await db.document.findFirst({
    where: { id: documentId, userId: user.id, type },
  });

  if (!doc) return { error: "Document not found" };

  await db.document.delete({ where: { id: documentId } });
  revalidatePath(DOCUMENT_PATHS[type].library);

  return { success: true };
}
