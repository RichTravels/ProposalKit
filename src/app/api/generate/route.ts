import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { buildPrompt } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { getRequiredEnv } from "@/lib/env";
import {
  handleGeneratePost,
  handleGeneratePut,
  type GenerateInput,
  type ModelAttempt,
} from "@/lib/generation-handler";
import {
  refundGenerationQuota,
  reserveGeneration,
} from "@/lib/generation-quota";
import { quotaDb } from "@/lib/quota-db";
import { DOCUMENT_PATHS } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getAuthorizedUser() {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" as const };

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return { error: "User not found" as const };

  return { user: { id: user.id } };
}

async function* iterateModel(
  input: GenerateInput,
  attempt: ModelAttempt
): AsyncGenerator<string> {
  const apiKey = getRequiredEnv("ANTHROPIC_API_KEY");
  const anthropic = new Anthropic({ apiKey });
  const prompt = buildPrompt(input.type, {
    clientName: input.clientName,
    projectSummary: input.projectSummary,
    budget: input.budget,
    timeline: input.timeline,
    tone: input.tone,
  });

  attempt.contactedModel = true;
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

export async function POST(req: Request) {
  return handleGeneratePost(req, {
    getAuthorizedUser,
    prepare: () => {
      getRequiredEnv("ANTHROPIC_API_KEY");
    },
    reserveGeneration: (userId) => reserveGeneration(quotaDb(), userId),
    refundGeneration: (userId) => refundGenerationQuota(quotaDb(), userId),
    onQuotaChanged: () => {
      revalidatePath("/dashboard");
    },
    iterateModel,
  });
}

export async function PUT(req: Request) {
  return handleGeneratePut(req, {
    getAuthorizedUser,
    createDocument: async (input) => {
      await db.document.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          content: input.content,
          tone: input.tone,
        },
      });
    },
    onSaved: (type) => {
      revalidatePath(DOCUMENT_PATHS[type].library);
      revalidatePath("/dashboard");
    },
  });
}
