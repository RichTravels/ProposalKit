import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FREE_TIER_EXHAUSTED_MESSAGE } from "./generation-quota.ts";
import {
  handleGeneratePost,
  handleGeneratePut,
  type GenerateInput,
  type GeneratePostDeps,
  type GeneratePutDeps,
  type ModelAttempt,
} from "./generation-handler.ts";

const validBody = {
  type: "PROPOSAL",
  clientName: "Acme",
  projectSummary: "Need a billing portal",
  budget: "$10k",
  timeline: "6 weeks",
  tone: "professional",
};

function postRequest(body: unknown, init?: { raw?: string }) {
  return new Request("http://localhost/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: init?.raw ?? JSON.stringify(body),
  });
}

function putRequest(body: unknown) {
  return new Request("http://localhost/api/generate", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function readBody(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out + decoder.decode();
}

function postDeps(overrides: Partial<GeneratePostDeps> = {}) {
  const deps = {
    reserves: [] as string[],
    refunds: [] as string[],
    quotaChanges: 0,
    modelCalls: 0,
    async getAuthorizedUser() {
      return { user: { id: "db_user" } };
    },
    async reserveGeneration(userId: string) {
      deps.reserves.push(userId);
      return { ok: true as const, charged: true };
    },
    async refundGeneration(userId: string) {
      deps.refunds.push(userId);
    },
    onQuotaChanged() {
      deps.quotaChanges += 1;
    },
    async *iterateModel(_input: GenerateInput, attempt: ModelAttempt) {
      deps.modelCalls += 1;
      attempt.contactedModel = true;
      yield "Hello ";
      yield "client";
    },
  };

  return Object.assign(deps, overrides);
}

describe("POST /api/generate quota", () => {
  it("spends the credit before streaming and does not refund a completed generation", async () => {
    const deps = postDeps();
    const response = await handleGeneratePost(postRequest(validBody), deps);

    assert.equal(response.status, 200);
    assert.deepEqual(deps.reserves, ["db_user"]);
    assert.equal(await readBody(response), "Hello client");
    assert.deepEqual(deps.refunds, []);
    assert.equal(deps.quotaChanges, 1);
    assert.equal(deps.modelCalls, 1);
  });

  it("does not call the model when the free tier is exhausted", async () => {
    const deps = postDeps({
      reserveGeneration: async (userId) => {
        deps.reserves.push(userId);
        return { ok: false, status: 403, message: FREE_TIER_EXHAUSTED_MESSAGE };
      },
    });

    const response = await handleGeneratePost(postRequest(validBody), deps);

    assert.equal(response.status, 403);
    assert.equal(await response.text(), FREE_TIER_EXHAUSTED_MESSAGE);
    assert.equal(deps.modelCalls, 0);
    assert.deepEqual(deps.refunds, []);
    assert.equal(deps.quotaChanges, 0);
  });

  it("does not spend a credit or call the model when rate limited", async () => {
    const deps = postDeps({
      reserveGeneration: async () => ({
        ok: false,
        status: 429,
        message:
          "You're generating documents too quickly. Please wait about 2 minutes and try again.",
        retryAfterSeconds: 120,
      }),
    });

    const response = await handleGeneratePost(postRequest(validBody), deps);

    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "120");
    assert.equal(deps.modelCalls, 0);
    assert.equal(deps.quotaChanges, 0);
  });

  it("does not reserve a credit for an invalid body or a missing API key", async () => {
    const invalid = postDeps();
    const invalidResponse = await handleGeneratePost(postRequest({}), invalid);
    assert.equal(invalidResponse.status, 400);
    assert.deepEqual(invalid.reserves, []);
    assert.equal(invalid.modelCalls, 0);

    const unconfigured = postDeps({
      prepare: () => {
        throw new Error("ANTHROPIC_API_KEY is not configured");
      },
    });
    const unconfiguredResponse = await handleGeneratePost(postRequest(validBody), unconfigured);
    assert.equal(unconfiguredResponse.status, 500);
    assert.equal(await unconfiguredResponse.text(), "ANTHROPIC_API_KEY is not configured");
    assert.deepEqual(unconfigured.reserves, []);
    assert.equal(unconfigured.modelCalls, 0);
  });

  it("restores a charged credit when the model is never contacted", async () => {
    const deps = postDeps({
      iterateModel: async function* () {
        deps.modelCalls += 1;
        throw new Error("ANTHROPIC_API_KEY is not configured");
      },
    });

    const response = await handleGeneratePost(postRequest(validBody), deps);
    await assert.rejects(() => readBody(response));

    assert.deepEqual(deps.refunds, ["db_user"]);
    assert.equal(deps.quotaChanges, 2);
  });

  it("keeps the credit when the model request was started", async () => {
    const deps = postDeps({
      iterateModel: async function* (_input, attempt) {
        deps.modelCalls += 1;
        attempt.contactedModel = true;
        throw new Error("overloaded");
      },
    });

    const response = await handleGeneratePost(postRequest(validBody), deps);
    await assert.rejects(() => readBody(response));

    assert.deepEqual(deps.refunds, []);
    assert.equal(deps.quotaChanges, 1);
  });

  it("does not refund a Pro generation that fails before the model is contacted", async () => {
    const deps = postDeps({
      reserveGeneration: async (userId) => {
        deps.reserves.push(userId);
        return { ok: true, charged: false };
      },
      iterateModel: async function* () {
        throw new Error("ANTHROPIC_API_KEY is not configured");
      },
    });

    const response = await handleGeneratePost(postRequest(validBody), deps);
    await assert.rejects(() => readBody(response));

    assert.deepEqual(deps.refunds, []);
    assert.equal(deps.quotaChanges, 0);
  });

  it("rejects anonymous callers before reserving a credit", async () => {
    const deps = postDeps({
      getAuthorizedUser: async () => ({ error: "Not authenticated" }),
    });

    const response = await handleGeneratePost(postRequest(validBody), deps);

    assert.equal(response.status, 401);
    assert.deepEqual(deps.reserves, []);
  });
});

describe("PUT /api/generate save", () => {
  it("saves without charging, including after the last free credit was spent", async () => {
    const reserves: string[] = [];
    const created: Array<{ userId: string; content: string }> = [];
    const savedTypes: string[] = [];

    const deps: GeneratePutDeps = {
      getAuthorizedUser: async () => ({ user: { id: "db_user" } }),
      createDocument: async (document) => {
        created.push({ userId: document.userId, content: document.content });
      },
      onSaved: (type) => {
        savedTypes.push(type);
      },
    };

    const response = await handleGeneratePut(
      putRequest({
        type: "SOW",
        clientName: "Acme",
        content: "Scope of work",
        tone: "formal",
      }),
      deps
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { title: "Acme", tone: "formal" });
    assert.deepEqual(created, [{ userId: "db_user", content: "Scope of work" }]);
    assert.deepEqual(savedTypes, ["SOW"]);
    assert.deepEqual(reserves, []);
  });

  it("charges once when a generation is saved afterward", async () => {
    const deps = postDeps();
    const postResponse = await handleGeneratePost(postRequest(validBody), deps);
    assert.equal(await readBody(postResponse), "Hello client");

    let saves = 0;
    const putDeps: GeneratePutDeps = {
      getAuthorizedUser: async () => ({ user: { id: "db_user" } }),
      createDocument: async () => {
        saves += 1;
      },
      onSaved: () => {},
    };

    const firstSave = await handleGeneratePut(
      putRequest({
        type: "PROPOSAL",
        clientName: "Acme",
        content: "Hello client",
        tone: "professional",
      }),
      putDeps
    );
    const secondSave = await handleGeneratePut(
      putRequest({
        type: "PROPOSAL",
        clientName: "Acme",
        content: "Hello client",
        tone: "professional",
      }),
      putDeps
    );

    assert.equal(firstSave.status, 200);
    assert.equal(secondSave.status, 200);
    assert.equal(saves, 2);
    assert.deepEqual(deps.reserves, ["db_user"]);
    assert.deepEqual(deps.refunds, []);
  });
});
