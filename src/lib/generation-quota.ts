/**
 * Free-tier quota and per-user generation rate limit.
 *
 * Quota is spent with one conditional UPDATE so overlapping requests cannot
 * both take the last credit. The rate limit is one INSERT ... ON CONFLICT on
 * a single row, which is safe on Vercel (no in-memory counter) and on the
 * transaction-mode pooler (no session lock, no multi-statement transaction).
 */

export const FREE_TIER_EXHAUSTED_MESSAGE =
  "You've used all 3 free generations. Upgrade to continue generating documents.";

/** Enough for a few drafts and retries; stops a script from running the model continuously. */
export const GENERATION_RATE_LIMIT = {
  maxRequests: 10,
  windowSeconds: 10 * 60,
} as const;

export type QuotaConsumption =
  | { allowed: true; charged: boolean }
  | { allowed: false; reason: "exhausted" | "missing" | "retry" };

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export type Reservation =
  | { ok: true; charged: boolean }
  | { ok: false; status: number; message: string; retryAfterSeconds?: number };

type QuotaWrite =
  | { decrement: number }
  | { increment: number };

export type GenerationQuotaClient = {
  $queryRaw: (
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<unknown>;
  user: {
    updateMany: (args: {
      where: {
        id: string;
        isPro: boolean;
        generationQuota?: { gt: number };
      };
      data: { generationQuota: QuotaWrite };
    }) => Promise<{ count: number }>;
    findUnique: (args: {
      where: { id: string };
      select: { isPro: true; generationQuota: true };
    }) => Promise<{ isPro: boolean; generationQuota: number } | null>;
  };
};

const quotaDecrement = {
  where: (userId: string) => ({
    id: userId,
    isPro: false as const,
    generationQuota: { gt: 0 },
  }),
  data: { generationQuota: { decrement: 1 } },
};

export function generationRateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  const unit = minutes === 1 ? "minute" : "minutes";
  return `You're generating documents too quickly. Please wait about ${minutes} ${unit} and try again.`;
}

export function rateLimitFromCount(
  count: number,
  retryAfterSeconds: number,
  maxRequests: number
): RateLimitResult {
  if (!Number.isFinite(count)) {
    throw new Error("Invalid rate limit count");
  }

  if (count <= maxRequests) {
    return { allowed: true };
  }

  const seconds = Number.isFinite(retryAfterSeconds)
    ? Math.max(1, Math.ceil(retryAfterSeconds))
    : GENERATION_RATE_LIMIT.windowSeconds;

  return { allowed: false, retryAfterSeconds: seconds };
}

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object") return Number(String(value));
  return Number.NaN;
}

function readRateLimitRow(result: unknown): { count: number; retryAfterSeconds: number } {
  const rows = Array.isArray(result) ? result : [];
  const row = rows[0];
  if (!row || typeof row !== "object") {
    throw new Error("Rate limit update did not return a row");
  }

  const record = row as Record<string, unknown>;
  const count = asNumber(record.count);
  const retryAfterSeconds = asNumber(
    record.retryAfterSeconds ?? record.retryafterseconds
  );

  if (!Number.isFinite(count) || !Number.isFinite(retryAfterSeconds)) {
    throw new Error("Rate limit update returned an invalid row");
  }

  return { count, retryAfterSeconds };
}

/**
 * Atomically takes one slot in the user's fixed window.
 * Rejected requests still increment the counter so the window stays closed.
 */
export async function consumeGenerationRateLimit(
  client: Pick<GenerationQuotaClient, "$queryRaw">,
  userId: string,
  limit: { maxRequests: number; windowSeconds: number } = GENERATION_RATE_LIMIT
): Promise<RateLimitResult> {
  if (!Number.isInteger(limit.windowSeconds) || limit.windowSeconds <= 0) {
    throw new Error("Invalid rate limit window");
  }
  if (!Number.isInteger(limit.maxRequests) || limit.maxRequests <= 0) {
    throw new Error("Invalid rate limit");
  }

  const rows = await client.$queryRaw`
    INSERT INTO "GenerationRateLimit" ("userId", "windowStart", "count")
    VALUES (${userId}, LOCALTIMESTAMP(3), 1)
    ON CONFLICT ("userId") DO UPDATE SET
      "count" = CASE
        WHEN "GenerationRateLimit"."windowStart" <= LOCALTIMESTAMP(3) - make_interval(secs => CAST(${limit.windowSeconds} AS integer))
          THEN 1
        ELSE "GenerationRateLimit"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "GenerationRateLimit"."windowStart" <= LOCALTIMESTAMP(3) - make_interval(secs => CAST(${limit.windowSeconds} AS integer))
          THEN LOCALTIMESTAMP(3)
        ELSE "GenerationRateLimit"."windowStart"
      END
    RETURNING
      "count",
      CAST(
        GREATEST(
          0,
          CEIL(
            EXTRACT(EPOCH FROM (
              "windowStart" + make_interval(secs => CAST(${limit.windowSeconds} AS integer)) - LOCALTIMESTAMP(3)
            ))
          )
        ) AS integer
      ) AS "retryAfterSeconds"
  `;

  const row = readRateLimitRow(rows);
  return rateLimitFromCount(row.count, row.retryAfterSeconds, limit.maxRequests);
}

/**
 * Spends one free-tier credit, or allows a Pro user through without changing quota.
 * `updateMany` runs a single UPDATE ... WHERE isPro = false AND generationQuota > 0.
 */
export async function consumeGenerationQuota(
  client: GenerationQuotaClient,
  userId: string
): Promise<QuotaConsumption> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const charged = await client.user.updateMany({
      where: quotaDecrement.where(userId),
      data: quotaDecrement.data,
    });

    if (charged.count > 0) {
      return { allowed: true, charged: true };
    }

    const user = await client.user.findUnique({
      where: { id: userId },
      select: { isPro: true, generationQuota: true },
    });

    if (!user) return { allowed: false, reason: "missing" };
    if (user.isPro) return { allowed: true, charged: false };
    if (user.generationQuota <= 0) return { allowed: false, reason: "exhausted" };
  }

  return { allowed: false, reason: "retry" };
}

/** Puts back a credit that was reserved but never sent to the model. Pro rows do not match. */
export async function refundGenerationQuota(
  client: GenerationQuotaClient,
  userId: string
): Promise<void> {
  await client.user.updateMany({
    where: { id: userId, isPro: false },
    data: { generationQuota: { increment: 1 } },
  });
}

function reservationFromQuota(quota: QuotaConsumption): Reservation {
  if (quota.allowed === true) {
    return { ok: true, charged: quota.charged };
  }

  if (quota.reason === "missing") {
    return { ok: false, status: 404, message: "User not found" };
  }

  if (quota.reason === "retry") {
    return {
      ok: false,
      status: 503,
      message: "We couldn't start that generation. Please try again.",
    };
  }

  return { ok: false, status: 403, message: FREE_TIER_EXHAUSTED_MESSAGE };
}

/**
 * Authorizes one model generation.
 * Out-of-quota free users are rejected before the rate-limit write.
 * Over-limit users are rejected before a credit is spent.
 */
export async function reserveGeneration(
  client: GenerationQuotaClient,
  userId: string
): Promise<Reservation> {
  const snapshot = await client.user.findUnique({
    where: { id: userId },
    select: { isPro: true, generationQuota: true },
  });

  if (!snapshot) {
    return { ok: false, status: 404, message: "User not found" };
  }

  if (!snapshot.isPro && snapshot.generationQuota <= 0) {
    return { ok: false, status: 403, message: FREE_TIER_EXHAUSTED_MESSAGE };
  }

  const rate = await consumeGenerationRateLimit(client, userId);
  if (rate.allowed === false) {
    return {
      ok: false,
      status: 429,
      message: generationRateLimitMessage(rate.retryAfterSeconds),
      retryAfterSeconds: rate.retryAfterSeconds,
    };
  }

  return reservationFromQuota(await consumeGenerationQuota(client, userId));
}
