"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { DocumentType } from "@prisma/client";
import { db } from "@/lib/db";
import { buildPrompt, createClaudeCompletion } from "@/lib/anthropic";
import { getRequiredEnv } from "@/lib/env";
import { reserveGeneration } from "@/lib/generation-quota";
import { quotaDb } from "@/lib/quota-db";
import { DOCUMENT_PATHS } from "@/lib/utils";
import type { GenerateDocumentState } from "./generateDocument.types";

function getStringField(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value === "string") return value.trim();
  return "";
}

function parseDocumentForm(formData: FormData) {
  return {
    clientName: getStringField(formData, "clientName"),
    projectSummary: getStringField(formData, "projectSummary"),
    budget: getStringField(formData, "budget"),
    timeline: getStringField(formData, "timeline"),
    tone: getStringField(formData, "tone") || "professional",
  };
}

export async function generateDocument(
  type: DocumentType,
  _prevState: GenerateDocumentState,
  formData: FormData
): Promise<GenerateDocumentState> {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const user = await db.user.findUnique({ where: { clerkId: userId } });
    if (!user) return { error: "User not found" };

    const input = parseDocumentForm(formData);
    if (!input.clientName) return { error: "Client name is required" };
    if (!input.projectSummary) return { error: "Project summary is required" };

    // Fail before spending a credit when this server is misconfigured.
    getRequiredEnv("ANTHROPIC_API_KEY");

    const reservation = await reserveGeneration(quotaDb(), user.id);
    if (reservation.ok === false) {
      return { error: reservation.message };
    }

    if (reservation.charged) {
      revalidatePath("/dashboard");
    }

    const content = await createClaudeCompletion(buildPrompt(type, input));

    await db.document.create({
      data: {
        userId: user.id,
        type,
        title: input.clientName,
        content,
        tone: input.tone,
      },
    });

    revalidatePath(DOCUMENT_PATHS[type].library);
    revalidatePath("/dashboard");

    return {
      content,
      title: input.clientName,
      tone: input.tone,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return { error: message };
  }
}
