import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import type { DocumentType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { buildPrompt } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { getRequiredEnv } from "@/lib/env";
import { DOCUMENT_PATHS } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_TYPES = new Set<DocumentType>(["PROPOSAL", "SOW", "BRIEF"]);

type GenerateInput = {
  type: DocumentType;
  clientName: string;
  projectSummary: string;
  budget?: string;
  timeline?: string;
  tone: string;
};

type SaveInput = {
  type: DocumentType;
  clientName: string;
  content: string;
  tone: string;
};

function parseGenerateInput(body: unknown): GenerateInput | null {
  if (!body || typeof body !== "object") return null;

  const { type, clientName, projectSummary, budget, timeline, tone } =
    body as Record<string, unknown>;

  if (typeof type !== "string" || !VALID_TYPES.has(type as DocumentType)) {
    return null;
  }

  if (typeof clientName !== "string" || !clientName.trim()) return null;
  if (typeof projectSummary !== "string" || !projectSummary.trim()) return null;

  return {
    type: type as DocumentType,
    clientName: clientName.trim(),
    projectSummary: projectSummary.trim(),
    budget: typeof budget === "string" ? budget.trim() : "",
    timeline: typeof timeline === "string" ? timeline.trim() : "",
    tone: typeof tone === "string" && tone.trim() ? tone.trim() : "professional",
  };
}

function parseSaveInput(body: unknown): SaveInput | null {
  if (!body || typeof body !== "object") return null;

  const { type, clientName, content, tone } = body as Record<string, unknown>;

  if (typeof type !== "string" || !VALID_TYPES.has(type as DocumentType)) {
    return null;
  }

  if (typeof clientName !== "string" || !clientName.trim()) return null;
  if (typeof content !== "string" || !content.trim()) return null;

  return {
    type: type as DocumentType,
    clientName: clientName.trim(),
    content,
    tone: typeof tone === "string" && tone.trim() ? tone.trim() : "professional",
  };
}

async function getAuthorizedUser() {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" as const };

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) return { error: "User not found" as const };

  return { user, userId };
}

export async function POST(req: Request) {
  try {
    const authResult = await getAuthorizedUser();
    if ("error" in authResult) {
      return new Response(authResult.error, { status: 401 });
    }

    const { user } = authResult;

    if (!user.isPro && user.generationQuota <= 0) {
      return new Response(
        "You've used all 3 free generations. Upgrade to continue generating documents.",
        { status: 403 }
      );
    }

    const input = parseGenerateInput(await req.json());
    if (!input) {
      return new Response("Invalid request body", { status: 400 });
    }

    const apiKey = getRequiredEnv("ANTHROPIC_API_KEY");
    const anthropic = new Anthropic({ apiKey });
    const prompt = buildPrompt(input.type, {
      clientName: input.clientName,
      projectSummary: input.projectSummary,
      budget: input.budget,
      timeline: input.timeline,
      tone: input.tone,
    });

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(new TextEncoder().encode(event.delta.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache, no-transform",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return new Response(message, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await getAuthorizedUser();
    if ("error" in authResult) {
      return Response.json({ error: authResult.error }, { status: 401 });
    }

    const { user, userId } = authResult;

    if (!user.isPro && user.generationQuota <= 0) {
      return Response.json(
        {
          error:
            "You've used all 3 free generations. Upgrade to continue generating documents.",
        },
        { status: 403 }
      );
    }

    const input = parseSaveInput(await req.json());
    if (!input) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    await db.document.create({
      data: {
        userId: user.id,
        type: input.type,
        title: input.clientName,
        content: input.content,
        tone: input.tone,
      },
    });

    if (!user.isPro) {
      await db.user.update({
        where: { clerkId: userId },
        data: { generationQuota: { decrement: 1 } },
      });
    }

    revalidatePath(DOCUMENT_PATHS[input.type].library);
    revalidatePath("/dashboard");

    return Response.json({
      title: input.clientName,
      tone: input.tone,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
