import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FREE_TIER_EXHAUSTED_MESSAGE,
  GENERATION_RATE_LIMIT,
  consumeGenerationQuota,
  consumeGenerationRateLimit,
  generationRateLimitMessage,
  rateLimitFromCount,
  refundGenerationQuota,
  reserveGeneration,
  type GenerationQuotaClient,
} from "./generation-quota.ts";

const UPGRADE_UI = /quota|upgrade|free generations/i;

type UserState = {
  id: string;
  isPro: boolean;
  generationQuota: number;
  exists?: boolean;
};

function memoryClient(initial: UserState) {
  const state: UserState = { exists: true, ...initial };
  const calls: Array<{ op: string; args: unknown }> = [];

  const client: GenerationQuotaClient = {
    async $queryRaw(strings, ...values) {
      calls.push({ op: "rate", args: { sql: strings.join(" "), values } });
      return [{ count: 1, retryAfterSeconds: 600 }];
    },
    user: {
      async updateMany(args) {
        calls.push({ op: "updateMany", args });
        if (state.exists === false) return { count: 0 };

        const matchesUser = args.where.id === state.id;
        const matchesPlan = args.where.isPro === state.isPro;
        const matchesQuota =
          args.where.generationQuota === undefined ||
          state.generationQuota > args.where.generationQuota.gt;

        if (!matchesUser || !matchesPlan || !matchesQuota) {
          return { count: 0 };
        }

        if ("decrement" in args.data.generationQuota) {
          state.generationQuota -= args.data.generationQuota.decrement;
        } else {
          state.generationQuota += args.data.generationQuota.increment;
        }
        return { count: 1 };
      },
      async findUnique(args) {
        calls.push({ op: "findUnique", args });
        if (state.exists === false || args.where.id !== state.id) return null;
        return { isPro: state.isPro, generationQuota: state.generationQuota };
      },
    },
  };

  return { state, calls, client };
}

describe("generation quota", () => {
  it("spends a free credit with one conditional update and does not read first", async () => {
    const { state, calls, client } = memoryClient({
      id: "user_1",
      isPro: false,
      generationQuota: 2,
    });

    const result = await consumeGenerationQuota(client, "user_1");

    assert.deepEqual(result, { allowed: true, charged: true });
    assert.equal(state.generationQuota, 1);
    assert.deepEqual(
      calls.map((call) => call.op),
      ["updateMany"]
    );
    assert.deepEqual(calls[0].args, {
      where: { id: "user_1", isPro: false, generationQuota: { gt: 0 } },
      data: { generationQuota: { decrement: 1 } },
    });
  });

  it("does not let two spends drive a single remaining credit negative", async () => {
    const { state, client } = memoryClient({
      id: "user_1",
      isPro: false,
      generationQuota: 1,
    });

    const first = await consumeGenerationQuota(client, "user_1");
    const second = await consumeGenerationQuota(client, "user_1");

    assert.deepEqual(first, { allowed: true, charged: true });
    assert.deepEqual(second, { allowed: false, reason: "exhausted" });
    assert.equal(state.generationQuota, 0);
  });

  it("allows a Pro user without decrementing quota", async () => {
    const { state, calls, client } = memoryClient({
      id: "pro_1",
      isPro: true,
      generationQuota: 3,
    });

    const result = await consumeGenerationQuota(client, "pro_1");

    assert.deepEqual(result, { allowed: true, charged: false });
    assert.equal(state.generationQuota, 3);
    assert.equal(state.isPro, true);
    const update = calls.find((call) => call.op === "updateMany");
    assert.ok(update);
    assert.deepEqual((update.args as { where: unknown }).where, {
      id: "pro_1",
      isPro: false,
      generationQuota: { gt: 0 },
    });
  });

  it("rejects an exhausted free user", async () => {
    const { state, client } = memoryClient({
      id: "user_1",
      isPro: false,
      generationQuota: 0,
    });

    const result = await consumeGenerationQuota(client, "user_1");

    assert.deepEqual(result, { allowed: false, reason: "exhausted" });
    assert.equal(state.generationQuota, 0);
  });

  it("retries once when the credit appears between the update and the reread", async () => {
    let updates = 0;
    const client: GenerationQuotaClient = {
      $queryRaw: async () => [],
      user: {
        async updateMany() {
          updates += 1;
          return { count: updates === 1 ? 0 : 1 };
        },
        async findUnique() {
          return { isPro: false, generationQuota: 1 };
        },
      },
    };

    const result = await consumeGenerationQuota(client, "user_1");
    assert.deepEqual(result, { allowed: true, charged: true });
    assert.equal(updates, 2);
  });

  it("refunds only non-Pro rows", async () => {
    const { state, calls, client } = memoryClient({
      id: "user_1",
      isPro: false,
      generationQuota: 1,
    });

    await refundGenerationQuota(client, "user_1");
    assert.equal(state.generationQuota, 2);
    assert.deepEqual(calls[0].args, {
      where: { id: "user_1", isPro: false },
      data: { generationQuota: { increment: 1 } },
    });

    state.isPro = true;
    state.generationQuota = 999999;
    await refundGenerationQuota(client, "user_1");
    assert.equal(state.generationQuota, 999999);
  });
});

describe("reserveGeneration", () => {
  it("rejects an exhausted free user before rate limiting or decrementing", async () => {
    const { calls, client } = memoryClient({
      id: "user_1",
      isPro: false,
      generationQuota: 0,
    });

    const result = await reserveGeneration(client, "user_1");

    assert.deepEqual(result, {
      ok: false,
      status: 403,
      message: FREE_TIER_EXHAUSTED_MESSAGE,
    });
    assert.match(FREE_TIER_EXHAUSTED_MESSAGE, UPGRADE_UI);
    assert.deepEqual(
      calls.map((call) => call.op),
      ["findUnique"]
    );
  });

  it("does not spend a credit when the user is over the rate limit", async () => {
    const { state, calls, client } = memoryClient({
      id: "user_1",
      isPro: false,
      generationQuota: 3,
    });
    client.$queryRaw = async () => [{ count: 11, retryAfterSeconds: 90 }];

    const result = await reserveGeneration(client, "user_1");

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.status, 429);
    assert.equal(result.retryAfterSeconds, 90);
    assert.equal(state.generationQuota, 3);
    assert.equal(
      calls.some((call) => call.op === "updateMany"),
      false
    );
    assert.doesNotMatch(result.message, UPGRADE_UI);
  });

  it("spends one credit for a free user who is under the rate limit", async () => {
    const { state, calls, client } = memoryClient({
      id: "user_1",
      isPro: false,
      generationQuota: 3,
    });

    const result = await reserveGeneration(client, "user_1");

    assert.deepEqual(result, { ok: true, charged: true });
    assert.equal(state.generationQuota, 2);
    assert.deepEqual(
      calls.map((call) => call.op),
      ["findUnique", "rate", "updateMany"]
    );
  });

  it("charges a free account once across generate-then-save worth of reserves", async () => {
    const { state, client } = memoryClient({
      id: "user_1",
      isPro: false,
      generationQuota: 3,
    });

    const first = await reserveGeneration(client, "user_1");
    const second = await reserveGeneration(client, "user_1");
    const third = await reserveGeneration(client, "user_1");
    const fourth = await reserveGeneration(client, "user_1");

    assert.equal(first.ok && first.charged, true);
    assert.equal(second.ok && second.charged, true);
    assert.equal(third.ok && third.charged, true);
    assert.equal(fourth.ok, false);
    assert.equal(state.generationQuota, 0);
  });

  it("lets a Pro user through without changing quota", async () => {
    const { state, client } = memoryClient({
      id: "pro_1",
      isPro: true,
      generationQuota: 999999,
    });

    const result = await reserveGeneration(client, "pro_1");

    assert.deepEqual(result, { ok: true, charged: false });
    assert.equal(state.generationQuota, 999999);
  });
});

describe("generation rate limit", () => {
  it("allows the configured burst and rejects the next request", () => {
    assert.equal(GENERATION_RATE_LIMIT.maxRequests, 10);
    assert.equal(GENERATION_RATE_LIMIT.windowSeconds, 600);

    assert.deepEqual(rateLimitFromCount(10, 600, 10), { allowed: true });
    assert.deepEqual(rateLimitFromCount(11, 45.2, 10), {
      allowed: false,
      retryAfterSeconds: 46,
    });
  });

  it("uses one upsert parameterized with the user id and window", async () => {
    const captured: { sql: string; values: unknown[] }[] = [];
    const userId = "user_1'); DROP TABLE \"User\"; --";
    const client = {
      async $queryRaw(strings: TemplateStringsArray, ...values: unknown[]) {
        captured.push({ sql: strings.join(" "), values });
        return [{ count: 1, retryAfterSeconds: 600 }];
      },
    };

    const result = await consumeGenerationRateLimit(client, userId);

    assert.deepEqual(result, { allowed: true });
    assert.equal(captured.length, 1);
    assert.match(captured[0].sql, /INSERT INTO "GenerationRateLimit"/);
    assert.match(captured[0].sql, /ON CONFLICT \("userId"\) DO UPDATE/);
    assert.equal(captured[0].sql.includes("DROP TABLE"), false);
    assert.ok(captured[0].values.includes(userId));
    assert.ok(captured[0].values.includes(GENERATION_RATE_LIMIT.windowSeconds));
  });

  it("describes the wait without asking the user to upgrade", () => {
    assert.equal(
      generationRateLimitMessage(30),
      "You're generating documents too quickly. Please wait about 1 minute and try again."
    );
    assert.equal(
      generationRateLimitMessage(601),
      "You're generating documents too quickly. Please wait about 11 minutes and try again."
    );
    assert.doesNotMatch(generationRateLimitMessage(600), UPGRADE_UI);
  });
});
