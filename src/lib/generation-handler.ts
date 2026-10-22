export type DocumentKind = "PROPOSAL" | "SOW" | "BRIEF";

export type GenerateInput = {
  type: DocumentKind;
  clientName: string;
  projectSummary: string;
  budget: string;
  timeline: string;
  tone: string;
};

export type SaveInput = {
  type: DocumentKind;
  clientName: string;
  content: string;
  tone: string;
};

export type AuthorizedUserResult = { user: { id: string } } | { error: string };

export type ReservationResult =
  | { ok: true; charged: boolean }
  | { ok: false; status: number; message: string; retryAfterSeconds?: number };

export type ModelAttempt = {
  contactedModel: boolean;
  restored: boolean;
};

const VALID_TYPES = new Set<DocumentKind>(["PROPOSAL", "SOW", "BRIEF"]);

export function parseGenerateInput(body: unknown): GenerateInput | null {
  if (!body || typeof body !== "object") return null;

  const { type, clientName, projectSummary, budget, timeline, tone } = body as Record<
    string,
    unknown
  >;

  if (typeof type !== "string" || !VALID_TYPES.has(type as DocumentKind)) {
    return null;
  }

  if (typeof clientName !== "string" || !clientName.trim()) return null;
  if (typeof projectSummary !== "string" || !projectSummary.trim()) return null;

  return {
    type: type as DocumentKind,
    clientName: clientName.trim(),
    projectSummary: projectSummary.trim(),
    budget: typeof budget === "string" ? budget.trim() : "",
    timeline: typeof timeline === "string" ? timeline.trim() : "",
    tone: typeof tone === "string" && tone.trim() ? tone.trim() : "professional",
  };
}

export function parseSaveInput(body: unknown): SaveInput | null {
  if (!body || typeof body !== "object") return null;

  const { type, clientName, content, tone } = body as Record<string, unknown>;

  if (typeof type !== "string" || !VALID_TYPES.has(type as DocumentKind)) {
    return null;
  }

  if (typeof clientName !== "string" || !clientName.trim()) return null;
  if (typeof content !== "string" || !content.trim()) return null;

  return {
    type: type as DocumentKind,
    clientName: clientName.trim(),
    content,
    tone: typeof tone === "string" && tone.trim() ? tone.trim() : "professional",
  };
}

export type GeneratePostDeps = {
  getAuthorizedUser: () => Promise<AuthorizedUserResult>;
  prepare?: () => Promise<void> | void;
  reserveGeneration: (userId: string) => Promise<ReservationResult>;
  refundGeneration: (userId: string) => Promise<void>;
  onQuotaChanged: () => void;
  iterateModel: (input: GenerateInput, attempt: ModelAttempt) => AsyncIterable<string>;
};

export type SavedDocument = {
  userId: string;
  type: DocumentKind;
  title: string;
  content: string;
  tone: string;
};

export type GeneratePutDeps = {
  getAuthorizedUser: () => Promise<AuthorizedUserResult>;
  createDocument: (document: SavedDocument) => Promise<void>;
  onSaved: (type: DocumentKind) => void;
};

async function readJson(req: Request): Promise<unknown | undefined> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

async function restoreIfUnbilled(
  deps: GeneratePostDeps,
  userId: string,
  charged: boolean,
  attempt: ModelAttempt
) {
  if (!charged || attempt.contactedModel || attempt.restored) return;
  attempt.restored = true;

  try {
    await deps.refundGeneration(userId);
    deps.onQuotaChanged();
  } catch (refundError) {
    console.error("Failed to restore generation quota", refundError);
  }
}

export async function handleGeneratePost(
  req: Request,
  deps: GeneratePostDeps
): Promise<Response> {
  let charged = false;
  let userId: string | null = null;
  const attempt: ModelAttempt = { contactedModel: false, restored: false };

  try {
    const authResult = await deps.getAuthorizedUser();
    if ("error" in authResult) {
      return new Response(authResult.error, { status: 401 });
    }

    userId = authResult.user.id;

    const body = await readJson(req);
    if (body === undefined) {
      return new Response("Invalid request body", { status: 400 });
    }

    const input = parseGenerateInput(body);
    if (!input) {
      return new Response("Invalid request body", { status: 400 });
    }

    if (deps.prepare) {
      await deps.prepare();
    }

    const reservation = await deps.reserveGeneration(userId);
    if (reservation.ok === false) {
      const headers = new Headers();
      if (reservation.retryAfterSeconds) {
        headers.set("Retry-After", String(reservation.retryAfterSeconds));
      }
      return new Response(reservation.message, {
        status: reservation.status,
        headers,
      });
    }

    charged = reservation.charged;
    if (charged) deps.onQuotaChanged();

    const iterable = deps.iterateModel(input, attempt);
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const text of iterable) {
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (error) {
          await restoreIfUnbilled(deps, authResult.user.id, charged, attempt);
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
    if (userId) {
      await restoreIfUnbilled(deps, userId, charged, attempt);
    }
    const message = error instanceof Error ? error.message : "Generation failed";
    return new Response(message, { status: 500 });
  }
}

export async function handleGeneratePut(
  req: Request,
  deps: GeneratePutDeps
): Promise<Response> {
  try {
    const authResult = await deps.getAuthorizedUser();
    if ("error" in authResult) {
      return Response.json({ error: authResult.error }, { status: 401 });
    }

    const body = await readJson(req);
    if (body === undefined) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const input = parseSaveInput(body);
    if (!input) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    // The credit was spent when generation started. Saving must not spend another
    // one, and must still succeed after the last free credit was spent.
    await deps.createDocument({
      userId: authResult.user.id,
      type: input.type,
      title: input.clientName,
      content: input.content,
      tone: input.tone,
    });

    deps.onSaved(input.type);

    return Response.json({
      title: input.clientName,
      tone: input.tone,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
